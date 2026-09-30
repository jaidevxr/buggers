-- Phase 2 Reliability: Durable queue leases, run heartbeats, telemetry, and transactional findings insertion

-- 1. Extend analyses table with lease, heartbeat, duration, cost, and stage results
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS worker_id text,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS execution_duration_ms integer,
  ADD COLUMN IF NOT EXISTS ai_prompt_tokens integer,
  ADD COLUMN IF NOT EXISTS ai_completion_tokens integer,
  ADD COLUMN IF NOT EXISTS ai_estimated_cost_usd numeric,
  ADD COLUMN IF NOT EXISTS stage_data jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS analyses_queue_idx
  ON public.analyses (status, lease_expires_at, created_at)
  WHERE status IN ('queued', 'processing');

-- 2. Transactional replace of findings for an analysis
CREATE OR REPLACE FUNCTION public.replace_analysis_findings(
  p_analysis_id uuid,
  p_user_id uuid,
  p_repo_full_name text,
  p_pr_number integer,
  p_findings jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count integer := 0;
  v_item jsonb;
BEGIN
  -- Delete existing findings atomically
  DELETE FROM public.findings WHERE analysis_id = p_analysis_id;

  -- Insert new findings atomically if array is not empty
  IF p_findings IS NOT NULL AND jsonb_array_length(p_findings) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_findings)
    LOOP
      INSERT INTO public.findings (
        analysis_id,
        user_id,
        repo_full_name,
        pr_number,
        file_path,
        line_number,
        title,
        description,
        why_it_matters,
        evidence,
        suggested_fix,
        code_snippet,
        severity,
        category,
        confidence,
        source,
        status
      ) VALUES (
        p_analysis_id,
        p_user_id,
        p_repo_full_name,
        p_pr_number,
        v_item->>'file_path',
        (v_item->>'line_number')::integer,
        LEFT(v_item->>'title', 200),
        v_item->>'description',
        v_item->>'why_it_matters',
        v_item->>'evidence',
        v_item->>'suggested_fix',
        v_item->>'code_snippet',
        v_item->>'severity',
        v_item->>'category',
        (v_item->>'confidence')::numeric,
        COALESCE(v_item->>'source', 'ai'),
        COALESCE(v_item->>'status', 'open')
      );
      v_inserted_count := v_inserted_count + 1;
    END LOOP;
  END IF;

  RETURN v_inserted_count;
END;
$$;

-- 3. Atomic lease acquisition with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.acquire_queued_analysis(
  p_worker_id text,
  p_lease_duration_seconds integer DEFAULT 300
)
RETURNS SETOF public.analyses
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_analysis_id uuid;
BEGIN
  SELECT id INTO v_analysis_id
  FROM public.analyses
  WHERE (
    status = 'queued'
    OR (status = 'processing' AND lease_expires_at < now())
  )
  AND attempt_count < max_attempts
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_analysis_id IS NOT NULL THEN
    RETURN QUERY
    UPDATE public.analyses
    SET
      status = 'processing',
      worker_id = p_worker_id,
      heartbeat_at = now(),
      lease_expires_at = now() + (p_lease_duration_seconds || ' seconds')::interval,
      attempt_count = attempt_count + 1,
      updated_at = now()
    WHERE id = v_analysis_id
    RETURNING *;
  END IF;
END;
$$;

-- 4. Reaper function to mark crashed/abandoned analyses as failed
CREATE OR REPLACE FUNCTION public.reap_dead_analyses(
  p_timeout_minutes integer DEFAULT 15
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH reaped AS (
    UPDATE public.analyses
    SET
      status = 'failed',
      stage = 'failed',
      error_message = 'Analysis timed out or worker crashed without renewal',
      updated_at = now()
    WHERE status = 'processing'
      AND (
        (lease_expires_at IS NOT NULL AND lease_expires_at < now() - (p_timeout_minutes || ' minutes')::interval)
        OR (heartbeat_at IS NOT NULL AND heartbeat_at < now() - (p_timeout_minutes || ' minutes')::interval)
        OR (heartbeat_at IS NULL AND updated_at < now() - (p_timeout_minutes || ' minutes')::interval)
      )
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM reaped;

  RETURN v_count;
END;
$$;
