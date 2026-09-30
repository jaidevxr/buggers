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
  type FileHistoryStat,
  type RiskResult,
} from "@/lib/risk-engine";
import { runAiReview, validateAiFindings } from "@/server/aiReview.server";

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

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function setStage(analysisId: string, stage: string, status = "processing") {
  const db = await admin();
  await db
    .from("analyses")
    .update({ stage, status, updated_at: new Date().toISOString() })
    .eq("id", analysisId);
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
      const authors = new Set(commits.map((c) => c.author?.login ?? c.commit.author?.name ?? "unknown"));

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
            ageDays = (Date.now() - new Date(firstCommit.commit.author.date).getTime()) / 86_400_000;
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

export async function processAnalysis(userId: string, analysisId: string) {
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

  try {
    await setStage(analysisId, "fetching_pr");
    const pr = await githubJson<GitHubPull>(userId, `/repos/${repoFullName}/pulls/${prNumber}`);

    await setStage(analysisId, "fetching_commits");
    const commits = await githubJson<GitHubCommit[]>(
      userId,
      `/repos/${repoFullName}/pulls/${prNumber}/commits?per_page=100`,
    );

    await setStage(analysisId, "fetching_files");
    const files = await githubJson<GitHubPullFile[]>(
      userId,
      `/repos/${repoFullName}/pulls/${prNumber}/files?per_page=100`,
    );

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

    await setStage(analysisId, "historical_analysis");
    const ranked = [...files].sort((a, b) => b.changes - a.changes);
    const history = await collectFileHistory(
      userId,
      repoFullName,
      ranked.map((f) => f.filename),
    );

    await setStage(analysisId, "ai_review");
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

    await setStage(analysisId, "validating_findings");
    const reviewFiles = ranked.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    }));
    const validated = review.ok ? validateAiFindings(review.findings, reviewFiles) : { valid: [], rejected: 0 };

    await setStage(analysisId, "risk_calculation");
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
        severity: f.severity as "critical" | "high" | "medium" | "low",
        confidence: f.confidence,
      })),
      aiAvailable: review.ok,
    });

    // Replace any findings from a previous run of this analysis.
    await db.from("findings").delete().eq("analysis_id", analysisId);
    if (validated.valid.length) {
      const rows = validated.valid.map((f) => {
        const file = files.find((x) => x.filename === f.file);
        return {
          analysis_id: analysisId,
          user_id: userId,
          repo_full_name: repoFullName,
          pr_number: prNumber,
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
      const { error: insertError } = await db.from("findings").insert(rows);
      if (insertError) throw insertError;
    }

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
        } as unknown as never,
        model_version: risk.modelVersion,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

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
    const message = e instanceof Error ? e.message : String(e);
    await failAnalysis(analysisId, message);
    throw e;
  }
}
