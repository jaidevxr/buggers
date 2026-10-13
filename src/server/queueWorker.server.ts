/**
 * Queue Worker & Stale Job Reaper.
 *
 * Runs periodically (e.g. via Vercel Cron or GitHub Action heartbeat) to:
 * 1. Detect and recover or fail analyses stuck in 'processing' (dead workers / aborted lambdas).
 * 2. Pick up and process 'queued' analyses with distributed lease locking.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { logStructured } from "@/server/logger.server";
import { processAnalysis } from "@/server/analysis.server";

const STALE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes without a heartbeat
const LEASE_DURATION_MS = 6 * 60 * 1000; // 6 minutes lease duration

export interface WorkerReport {
  timestamp: string;
  reapedStaleCount: number;
  retriedCount: number;
  failedCount: number;
  processedCount: number;
  errors: string[];
}

/**
 * Reaps analyses stuck in 'processing' whose heartbeat hasn't updated in 5 minutes.
 */
export async function reapStaleAnalyses(): Promise<{
  reaped: number;
  retried: number;
  failed: number;
}> {
  const db = supabaseAdmin;
  if (!db) return { reaped: 0, retried: 0, failed: 0 };

  const cutoff = new Date(Date.now() - STALE_TIMEOUT_MS).toISOString();

  // Find all analyses stuck in processing with expired heartbeats
  const { data: staleRows, error } = await db
    .from("analyses")
    .select("id, attempt_count, max_attempts, repo_full_name, pr_number, heartbeat_at, updated_at")
    .eq("status", "processing")
    .or(`heartbeat_at.lt.${cutoff},and(heartbeat_at.is.null,updated_at.lt.${cutoff})`);

  if (error || !staleRows || staleRows.length === 0) {
    return { reaped: 0, retried: 0, failed: 0 };
  }

  let retried = 0;
  let failed = 0;

  for (const row of staleRows) {
    const attempts = (row.attempt_count ?? 0) + 1;
    const maxAttempts = row.max_attempts ?? 3;

    if (attempts < maxAttempts) {
      // Re-queue for retry
      await db
        .from("analyses")
        .update({
          status: "queued",
          stage: "queued",
          attempt_count: attempts,
          worker_id: null,
          lease_expires_at: null,
          error_message: `Previous execution timed out. Retrying (attempt ${attempts}/${maxAttempts}).`,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);

      logStructured("warn", "stale_analysis_requeued", {
        analysisId: row.id,
        repo: row.repo_full_name,
        pr: row.pr_number,
        attempt: attempts,
      });
      retried++;
    } else {
      // Maximum retries exceeded — mark failed
      await db
        .from("analyses")
        .update({
          status: "failed",
          stage: "failed",
          attempt_count: attempts,
          error_message: "Analysis exceeded maximum retry attempts after unexpected process termination.",
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        } as never)
        .eq("id", row.id);

      logStructured("error", "stale_analysis_failed_permanently", {
        analysisId: row.id,
        repo: row.repo_full_name,
        pr: row.pr_number,
        attempts,
      });
      failed++;
    }
  }

  return { reaped: staleRows.length, retried, failed };
}

/**
 * Claims and executes queued analyses with optimistic lease locking.
 */
export async function processQueuedJobs(limit = 3): Promise<number> {
  const db = supabaseAdmin;
  if (!db) return 0;

  const workerId = `worker-${process.pid || "node"}-${Date.now()}`;
  const leaseExpiresAt = new Date(Date.now() + LEASE_DURATION_MS).toISOString();

  // Find oldest queued jobs
  const { data: queued, error } = await db
    .from("analyses")
    .select("id, user_id")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !queued || queued.length === 0) {
    return 0;
  }

  let processed = 0;

  for (const job of queued) {
    // Atomically claim the job
    const { data: claimed } = await db
      .from("analyses")
      .update({
        status: "processing",
        worker_id: workerId,
        lease_expires_at: leaseExpiresAt,
        heartbeat_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", job.id)
      .eq("status", "queued")
      .select("id")
      .single();

    if (claimed) {
      logStructured("info", "worker_claimed_job", {
        analysisId: job.id,
        workerId,
      });

      // Execute asynchronously
      void processAnalysis(job.user_id, job.id).catch((err) => {
        logStructured("error", "worker_job_execution_failed", {
          analysisId: job.id,
          error: err instanceof Error ? err.message : String(err),
        });
      });

      processed++;
    }
  }

  return processed;
}

/**
 * HTTP handler for `/api/cron/worker`.
 */
export async function handleCronWorkerRequest(request: Request): Promise<Response> {
  const authError = await authenticateCronRequest(request);
  if (authError) return authError;

  const report: WorkerReport = {
    timestamp: new Date().toISOString(),
    reapedStaleCount: 0,
    retriedCount: 0,
    failedCount: 0,
    processedCount: 0,
    errors: [],
  };

  try {
    const { reaped, retried, failed } = await reapStaleAnalyses();
    report.reapedStaleCount = reaped;
    report.retriedCount = retried;
    report.failedCount = failed;

    const processed = await processQueuedJobs(3);
    report.processedCount = processed;

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    report.errors.push(msg);
    return new Response(JSON.stringify(report, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
