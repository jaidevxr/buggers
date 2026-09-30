import {
  githubJson,
  githubJsonWithHeaders,
  type GitHubCommit,
  type GitHubPull,
  type GitHubPullFile,
} from "@/server/github.server";
import {
  computeRisk,
  DEFECT_PATTERN,
  type CoverageMetrics,
  type FileHistoryStat,
  type RiskResult,
} from "@/lib/risk-engine";
import { runAiReview, validateAiFindings, type AiTokenUsage } from "@/server/aiReview.server";
import { logStructured } from "@/server/logger.server";

export const ANALYSIS_STAGES = [
  "queued",
  "fetching_pr",
  "fetching_commits",
  "fetching_files",
  "historical_analysis",
  "risk_calculation",
  "ai_review",
  "validating_findings",
  "completed",
] as const;

const HISTORY_FILE_LIMIT = 10;
/** Churn window: count commits in the last 90 days, not a fixed sample. */
const CHURN_WINDOW_DAYS = 90;
/** Heartbeat interval: refresh the lease every 60 seconds during processing. */
const HEARTBEAT_INTERVAL_MS = 60_000;
/** Lease duration: 5 minutes. Must exceed HEARTBEAT_INTERVAL_MS. */
const LEASE_DURATION_SECONDS = 300;

// ─── Estimated cost per token (GPT-4o class model) ──────────────────
const COST_PER_PROMPT_TOKEN = 0.0000025;
const COST_PER_COMPLETION_TOKEN = 0.00001;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ─── Stage persistence helpers ──────────────────────────────────────

/**
 * Updates the analysis stage, refreshes the heartbeat, and optionally
 * persists stage output data so a retry can skip completed stages.
 */
async function setStage(
  analysisId: string,
  stage: string,
  stageData?: Record<string, unknown>,
  status = "processing",
) {
  const db = await admin();
  const update: Record<string, unknown> = {
    stage,
    status,
    heartbeat_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (stageData) {
    // Merge stageData into existing stage_data JSONB
    const { data: current } = await db
      .from("analyses")
      .select("stage_data")
      .eq("id", analysisId)
      .single();
    const existing = (current?.stage_data as Record<string, unknown>) ?? {};
    update["stage_data"] = { ...existing, ...stageData };
  }
  await db.from("analyses").update(update as never).eq("id", analysisId);
}

async function failAnalysis(analysisId: string, message: string) {
  const db = await admin();
  await db
    .from("analyses")
    .update({
      status: "failed",
      stage: "failed",
      error_message: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", analysisId);
}

/**
 * Parse the "last" page URL from a GitHub Link header.
 * Returns null if there is no last page (single page of results).
 */
function parseLinkHeaderLastUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="last"/);
  return match?.[1] ?? null;
}

export async function collectFileHistory(
  userId: string,
  repoFullName: string,
  filenames: string[],
): Promise<FileHistoryStat[]> {
  const stats: FileHistoryStat[] = [];
  const sinceDate = new Date(Date.now() - CHURN_WINDOW_DAYS * 86_400_000).toISOString();

  for (const filename of filenames.slice(0, HISTORY_FILE_LIMIT)) {
    try {
      // Churn: commits in the 90-day window (up to 100 per page; sufficient for churn signal)
      const commits = await githubJson<GitHubCommit[]>(
        userId,
        `/repos/${repoFullName}/commits?path=${encodeURIComponent(filename)}&since=${sinceDate}&per_page=100`,
      );

      if (!commits.length) {
        stats.push({
          filename,
          commitCount: 0,
          defectCommitCount: 0,
          authorCount: 0,
          ageDays: null,
          insufficient: true,
        });
        continue;
      }

      const defectCommitCount = commits.filter((c) => DEFECT_PATTERN.test(c.commit.message)).length;
      const authors = new Set(
        commits.map((c) => c.author?.login ?? c.commit.author?.name ?? "unknown"),
      );

      // True file inception age: fetch per_page=1, read Link header to find last page,
      // then fetch that page to get the very first commit on this path.
      let ageDays: number | null = null;
      try {
        const { headers } = await githubJsonWithHeaders<GitHubCommit[]>(
          userId,
          `/repos/${repoFullName}/commits?path=${encodeURIComponent(filename)}&per_page=1`,
        );
        const lastUrl = parseLinkHeaderLastUrl(headers.get("Link") ?? headers.get("link"));
        if (lastUrl) {
          // Link header contains full URLs (e.g. https://api.github.com/repos/...).
          // githubRequest expects a path, so extract /repos/... portion.
          let lastPath: string;
          try {
            const parsed = new URL(lastUrl);
            lastPath = parsed.pathname + parsed.search;
          } catch {
            lastPath = lastUrl; // fallback: assume it's already a path
          }
          const lastPageCommits = await githubJson<GitHubCommit[]>(userId, lastPath);
          const firstCommit = lastPageCommits[lastPageCommits.length - 1];
          if (firstCommit?.commit.author?.date) {
            ageDays =
              (Date.now() - new Date(firstCommit.commit.author.date).getTime()) / 86_400_000;
          }
        } else {
          // Single page = the first commit is the only commit (or latest single)
          const oldest = commits[commits.length - 1]?.commit.author?.date;
          ageDays = oldest ? (Date.now() - new Date(oldest).getTime()) / 86_400_000 : null;
        }
      } catch {
        // file_age becomes insufficient_data if the Link header trick fails
        const oldest = commits[commits.length - 1]?.commit.author?.date;
        ageDays = oldest ? (Date.now() - new Date(oldest).getTime()) / 86_400_000 : null;
      }

      stats.push({
        filename,
        commitCount: commits.length,
        defectCommitCount,
        authorCount: authors.size,
        ageDays,
        insufficient: false,
      });
    } catch {
      stats.push({
        filename,
        commitCount: 0,
        defectCommitCount: 0,
        authorCount: 0,
        ageDays: null,
        insufficient: true,
      });
    }
  }
  return stats;
}

// ─── Heartbeat loop ─────────────────────────────────────────────────

/**
 * Starts a periodic heartbeat that refreshes lease_expires_at on the analysis row.
 * Returns a stop function; call it when processing is done.
 */
function startHeartbeat(analysisId: string): () => void {
  const timer = setInterval(async () => {
    try {
      const db = await admin();
      await db
        .from("analyses")
        .update({
          heartbeat_at: new Date().toISOString(),
          lease_expires_at: new Date(Date.now() + LEASE_DURATION_SECONDS * 1000).toISOString(),
        })
        .eq("id", analysisId);
    } catch (err) {
      logStructured("warn", "heartbeat_refresh_failed", {
        analysisId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, HEARTBEAT_INTERVAL_MS);

  return () => clearInterval(timer);
}

// ─── Main processing ────────────────────────────────────────────────

export async function processAnalysis(userId: string, analysisId: string) {
  const startTime = Date.now();
  const db = await admin();
  const { data: analysis, error } = await db
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!analysis) throw new Error("Analysis not found.");
  if (analysis.status === "completed") return { status: "completed" as const };

  const repoFullName = analysis.repo_full_name;
  const prNumber = analysis.pr_number;
  const stopHeartbeat = startHeartbeat(analysisId);

  // Recover persisted stage data from a previous attempt (idempotency)
  const stageData = (analysis.stage_data as Record<string, unknown>) ?? {};

  logStructured("info", "analysis_started", {
    analysisId,
    stage: "init",
    attempt: analysis.attempt_count ?? 1,
  });

  try {
    // ── Stage: fetching_pr ────────────────────────────────────────
    let pr: GitHubPull;
    if (stageData["pr"] && typeof stageData["pr"] === "object") {
      pr = stageData["pr"] as GitHubPull;
      logStructured("debug", "stage_skipped_cached", { analysisId, stage: "fetching_pr" });
    } else {
      const stageStart = Date.now();
      await setStage(analysisId, "fetching_pr");
      pr = await githubJson<GitHubPull>(userId, `/repos/${repoFullName}/pulls/${prNumber}`);
      await setStage(analysisId, "fetching_pr", { pr });
      logStructured("info", "stage_completed", {
        analysisId,
        stage: "fetching_pr",
        durationMs: Date.now() - stageStart,
      });
    }

    // ── Stage: fetching_commits ───────────────────────────────────
    let commits: GitHubCommit[];
    if (stageData["commits"] && Array.isArray(stageData["commits"])) {
      commits = stageData["commits"] as GitHubCommit[];
      logStructured("debug", "stage_skipped_cached", { analysisId, stage: "fetching_commits" });
    } else {
      const stageStart = Date.now();
      await setStage(analysisId, "fetching_commits");
      commits = await githubJson<GitHubCommit[]>(
        userId,
        `/repos/${repoFullName}/pulls/${prNumber}/commits?per_page=100`,
      );
      await setStage(analysisId, "fetching_commits", { commits });
      logStructured("info", "stage_completed", {
        analysisId,
        stage: "fetching_commits",
        durationMs: Date.now() - stageStart,
      });
    }

    // ── Stage: fetching_files ─────────────────────────────────────
    let files: GitHubPullFile[];
    if (stageData["files"] && Array.isArray(stageData["files"])) {
      files = stageData["files"] as GitHubPullFile[];
      logStructured("debug", "stage_skipped_cached", { analysisId, stage: "fetching_files" });
    } else {
      const stageStart = Date.now();
      await setStage(analysisId, "fetching_files");
      files = await githubJson<GitHubPullFile[]>(
        userId,
        `/repos/${repoFullName}/pulls/${prNumber}/files?per_page=100`,
      );
      await setStage(analysisId, "fetching_files", { files });
      logStructured("info", "stage_completed", {
        analysisId,
        stage: "fetching_files",
        durationMs: Date.now() - stageStart,
      });
    }

    // Update PR metadata
    await db
      .from("analyses")
      .update({
        pr_title: pr.title,
        pr_author: pr.user?.login ?? null,
        pr_state: pr.merged_at ? "merged" : pr.state,
        base_branch: pr.base.ref,
        head_branch: pr.head.ref,
        head_sha: pr.head.sha,
        changed_files: pr.changed_files ?? files.length,
        additions: pr.additions ?? files.reduce((a, f) => a + f.additions, 0),
        deletions: pr.deletions ?? files.reduce((a, f) => a + f.deletions, 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    // ── Stage: historical_analysis ────────────────────────────────
    let history: FileHistoryStat[];
    if (stageData["history"] && Array.isArray(stageData["history"])) {
      history = stageData["history"] as FileHistoryStat[];
      logStructured("debug", "stage_skipped_cached", { analysisId, stage: "historical_analysis" });
    } else {
      const stageStart = Date.now();
      await setStage(analysisId, "historical_analysis");
      const ranked = [...files].sort((a, b) => b.changes - a.changes);
      history = await collectFileHistory(
        userId,
        repoFullName,
        ranked.map((f) => f.filename),
      );
      await setStage(analysisId, "historical_analysis", { history });
      logStructured("info", "stage_completed", {
        analysisId,
        stage: "historical_analysis",
        durationMs: Date.now() - stageStart,
      });
    }

    // ── Stage: ai_review ──────────────────────────────────────────
    const stageStart = Date.now();
    await setStage(analysisId, "ai_review");
    const ranked = [...files].sort((a, b) => b.changes - a.changes);
    const historyNotes = history
      .filter((h) => !h.insufficient)
      .map(
        (h) =>
          `${h.filename}: ${h.commitCount} recent commits, ${h.defectCommitCount} referencing fixes, ${h.authorCount} author(s).`,
      );
    const review = await runAiReview({
      repoFullName,
      prNumber,
      prTitle: pr.title,
      prBody: pr.body ?? null,
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      files: ranked.slice(0, 30).map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
      })),
      historyNotes,
    });

    const aiUsage: AiTokenUsage = review.usage ?? {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    logStructured("info", "stage_completed", {
      analysisId,
      stage: "ai_review",
      durationMs: Date.now() - stageStart,
      tokens: aiUsage,
    });

    // ── Stage: validating_findings ────────────────────────────────
    await setStage(analysisId, "validating_findings");
    const reviewFiles = ranked.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    }));
    const validated = review.ok
      ? validateAiFindings(review.findings, reviewFiles)
      : { valid: [], rejected: 0 };

    // ── Stage: risk_calculation ────────────────────────────────────
    await setStage(analysisId, "risk_calculation");
    const aiFilesSample = ranked.slice(0, 30);
    const coverage: CoverageMetrics = {
      filesAnalyzed: aiFilesSample.length,
      totalFiles: files.length,
      patchesTruncated: aiFilesSample.filter((f) => f.patch && f.patch.length >= 12000).length,
      filesSkipped: Math.max(0, files.length - aiFilesSample.length),
    };

    const risk: RiskResult = computeRisk({
      files: files.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
      })),
      additions: pr.additions ?? files.reduce((a, f) => a + f.additions, 0),
      deletions: pr.deletions ?? files.reduce((a, f) => a + f.deletions, 0),
      commitCount: commits.length,
      history,
      aiFindings: validated.valid.map((f) => ({
        severity: f.severity,
        confidence: f.confidence,
      })),
      aiAvailable: review.ok,
      coverage,
    });

    // ── Atomic findings replace via Postgres function ──────────────
    if (validated.valid.length) {
      const findingsPayload = validated.valid.map((f) => {
        const file = files.find((x) => x.filename === f.file);
        return {
          file_path: f.file,
          line_number: f.line,
          title: f.title.slice(0, 200),
          description: f.problem,
          why_it_matters: f.why_it_matters ?? null,
          evidence: f.evidence ?? null,
          suggested_fix: f.suggested_fix ?? null,
          code_snippet: file?.patch ? file.patch.slice(0, 4000) : null,
          severity: f.severity,
          category: f.category,
          confidence: f.confidence,
          source: "ai",
          status: "open",
        };
      });
      const { error: rpcError } = await db.rpc("replace_analysis_findings", {
        p_analysis_id: analysisId,
        p_user_id: userId,
        p_repo_full_name: repoFullName,
        p_pr_number: prNumber,
        p_findings: findingsPayload,
      });
      if (rpcError) throw rpcError;
    } else {
      // No findings: still delete any stale ones from a previous run
      await db.from("findings").delete().eq("analysis_id", analysisId);
    }

    // ── Cost estimation ───────────────────────────────────────────
    const estimatedCostUsd =
      aiUsage.promptTokens * COST_PER_PROMPT_TOKEN +
      aiUsage.completionTokens * COST_PER_COMPLETION_TOKEN;
    const executionDurationMs = Date.now() - startTime;

    // ── Final update ──────────────────────────────────────────────
    await db
      .from("analyses")
      .update({
        status: "completed",
        stage: "completed",
        error_message: review.ok ? null : `AI review unavailable: ${review.error.slice(0, 200)}`,
        risk_score: risk.score,
        risk_level: risk.level,
        risk_confidence: risk.confidence,
        signals: risk.signals as unknown as never,
        history: {
          files: history,
          reasons: risk.reasons,
          ai_rejected: validated.rejected,
          ai_available: review.ok,
          coverage,
        } as unknown as never,
        model_version: risk.modelVersion,
        execution_duration_ms: executionDurationMs,
        ai_prompt_tokens: aiUsage.promptTokens,
        ai_completion_tokens: aiUsage.completionTokens,
        ai_estimated_cost_usd: estimatedCostUsd,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    stopHeartbeat();

    logStructured("info", "analysis_completed", {
      analysisId,
      stage: "completed",
      durationMs: executionDurationMs,
      tokens: aiUsage,
      costUsd: estimatedCostUsd,
      riskScore: risk.score,
      riskLevel: risk.level,
      findingsCount: validated.valid.length,
      findingsRejected: validated.rejected,
    });

    if (risk.level === "high" || risk.level === "critical") {
      await db.from("notifications").insert({
        user_id: userId,
        title: `${risk.level === "critical" ? "Critical" : "High"} risk pull request`,
        body: `${repoFullName} #${prNumber} scored ${risk.score}/100.`,
        link: `/analysis/${analysisId}`,
      });
    }

    return { status: "completed" as const };
  } catch (e) {
    stopHeartbeat();
    const message = e instanceof Error ? e.message : String(e);
    logStructured("error", "analysis_failed", {
      analysisId,
      stage: "error",
      error: message,
      durationMs: Date.now() - startTime,
    });
    await failAnalysis(analysisId, message);
    throw e;
  }
}
