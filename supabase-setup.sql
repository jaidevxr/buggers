-- =====================================================================
-- Buggers Complete Database Setup for Supabase
-- Copy and run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/baynfpsedciwlqwdlcqp/sql/new
-- =====================================================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  github_login text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "own profile select" ON public.profiles;
  DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
  DROP POLICY IF EXISTS "own profile update" ON public.profiles;
END $$;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Per-user connector keys (server only)
CREATE TABLE IF NOT EXISTS public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  reconnect_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

-- 3. User settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY,
  notify_high_risk boolean NOT NULL DEFAULT true,
  notify_analysis_complete boolean NOT NULL DEFAULT true,
  min_confidence numeric NOT NULL DEFAULT 0.5,
  include_low_severity boolean NOT NULL DEFAULT true,
  max_diff_files integer NOT NULL DEFAULT 40,
  store_code_snippets boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "own settings select" ON public.user_settings;
  DROP POLICY IF EXISTS "own settings insert" ON public.user_settings;
  DROP POLICY IF EXISTS "own settings update" ON public.user_settings;
END $$;
CREATE POLICY "own settings select" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own settings insert" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings update" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 4. Analyses
CREATE TABLE IF NOT EXISTS public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_full_name text NOT NULL,
  pr_number integer NOT NULL,
  head_sha text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  stage text NOT NULL DEFAULT 'queued',
  error_message text,
  pr_title text,
  pr_author text,
  pr_state text,
  base_branch text,
  head_branch text,
  changed_files integer,
  additions integer,
  deletions integer,
  risk_score numeric,
  risk_level text,
  risk_confidence numeric,
  signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  history jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version text,
  worker_id text,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  execution_duration_ms integer,
  ai_prompt_tokens integer,
  ai_completion_tokens integer,
  ai_estimated_cost_usd numeric,
  stage_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, repo_full_name, pr_number, head_sha)
);
CREATE INDEX IF NOT EXISTS analyses_user_created_idx ON public.analyses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analyses_repo_idx ON public.analyses (user_id, repo_full_name);
CREATE INDEX IF NOT EXISTS analyses_queue_idx ON public.analyses (status, lease_expires_at, created_at) WHERE status IN ('queued', 'processing');
GRANT SELECT ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "own analyses select" ON public.analyses;
END $$;
CREATE POLICY "own analyses select" ON public.analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. Findings
CREATE TABLE IF NOT EXISTS public.findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  repo_full_name text NOT NULL,
  pr_number integer NOT NULL,
  file_path text NOT NULL,
  line_number integer,
  title text NOT NULL,
  description text NOT NULL,
  why_it_matters text,
  evidence text,
  suggested_fix text,
  code_snippet text,
  severity text NOT NULL,
  category text NOT NULL,
  confidence numeric NOT NULL,
  source text NOT NULL DEFAULT 'ai',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS findings_user_idx ON public.findings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS findings_analysis_idx ON public.findings (analysis_id);
GRANT SELECT, UPDATE ON public.findings TO authenticated;
GRANT ALL ON public.findings TO service_role;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "own findings select" ON public.findings;
  DROP POLICY IF EXISTS "own findings update" ON public.findings;
END $$;
CREATE POLICY "own findings select" ON public.findings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own findings update" ON public.findings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 6. Tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  finding_id uuid NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  title text NOT NULL,
  repo_full_name text NOT NULL,
  pr_number integer NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  assignee text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (finding_id)
);
CREATE INDEX IF NOT EXISTS tickets_user_idx ON public.tickets (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "own tickets select" ON public.tickets;
  DROP POLICY IF EXISTS "own tickets insert" ON public.tickets;
  DROP POLICY IF EXISTS "own tickets update" ON public.tickets;
  DROP POLICY IF EXISTS "own tickets delete" ON public.tickets;
END $$;
CREATE POLICY "own tickets select" ON public.tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tickets insert" ON public.tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tickets update" ON public.tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tickets delete" ON public.tickets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "own notifications select" ON public.notifications;
  DROP POLICY IF EXISTS "own notifications update" ON public.notifications;
END $$;
CREATE POLICY "own notifications select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 8. Functions: replace_analysis_findings
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
  DELETE FROM public.findings WHERE analysis_id = p_analysis_id;

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

-- 9. Functions: acquire_queued_analysis
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

-- 10. Functions: reap_dead_analyses
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
