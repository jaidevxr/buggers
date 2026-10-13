/**
 * PR Review Comment Bot — Posts inline review comments directly on GitHub PR diffs.
 *
 * Instead of just setting a commit status, this module posts a proper GitHub Pull
 * Request Review with inline comments pinpointing exactly where each finding is.
 *
 * Uses the GitHub Pull Request Reviews API:
 * POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews
 */
import {
  githubRequest,
  githubJson,
  type GitHubPullFile,
} from "@/server/github.server";
import { logStructured } from "@/server/logger.server";

// ─── Types ─────────────────────────────────────────────────────────

export interface ReviewFinding {
  file_path: string;
  line_number: number | null;
  title: string;
  description: string;
  severity: string;
  category: string;
  confidence: number;
  suggested_fix?: string | null;
  evidence?: string | null;
}

interface GitHubReviewComment {
  path: string;
  /** The line of the diff that the comment applies to (in the new file). */
  line: number;
  /** Must be "RIGHT" to target the new version of the file. */
  side: "RIGHT";
  body: string;
}

interface GitHubReview {
  id: number;
  html_url: string;
  state: string;
}

// ─── Severity Emoji Map ────────────────────────────────────────────

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
  info: "ℹ️",
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Gets valid diff lines from PR files. Used to check if a finding's line number
 * actually exists in the diff (GitHub rejects comments on lines outside the diff).
 */
function getDiffLineNumbers(patch: string | undefined): Set<number> {
  const lines = new Set<number>();
  if (!patch) return lines;

  let currentLine = 0;
  for (const line of patch.split("\n")) {
    // Parse hunk header: @@ -old,count +new,count @@
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentLine = parseInt(hunkMatch[1]!, 10);
      continue;
    }

    if (line.startsWith("-")) {
      // Deleted line — not in new file
      continue;
    }

    if (line.startsWith("+") || line.startsWith(" ")) {
      lines.add(currentLine);
      currentLine++;
    }
  }

  return lines;
}

/**
 * Format a single finding as a markdown review comment body.
 */
function formatCommentBody(finding: ReviewFinding): string {
  const emoji = SEVERITY_EMOJI[finding.severity] ?? "⚠️";
  const label = SEVERITY_LABEL[finding.severity] ?? finding.severity;
  const confidence = Math.round(finding.confidence * 100);

  let body = `${emoji} **${label}: ${finding.title}**\n\n`;
  body += `${finding.description}\n\n`;

  if (finding.evidence) {
    body += `> **Evidence:** ${finding.evidence}\n\n`;
  }

  if (finding.suggested_fix) {
    body += `**Suggested Fix:**\n\`\`\`suggestion\n${finding.suggested_fix}\n\`\`\`\n\n`;
  }

  body += `---\n`;
  body += `*Buggers Security Review · ${finding.category} · ${confidence}% confidence*`;

  return body;
}

/**
 * Format the summary body for the overall review.
 */
function formatReviewSummary(
  findings: ReviewFinding[],
  riskScore: number,
  repoFullName: string,
  prNumber: number,
  inlineCount: number,
  skippedCount: number,
): string {
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;
  const lowCount = findings.filter((f) => f.severity === "low").length;

  let body = `## 🛡️ Buggers Security Review\n\n`;
  body += `| Metric | Value |\n|--------|-------|\n`;
  body += `| Risk Score | **${riskScore}/100** |\n`;
  body += `| Total Findings | **${findings.length}** |\n`;

  if (criticalCount > 0) body += `| ${SEVERITY_EMOJI["critical"]} Critical | ${criticalCount} |\n`;
  if (highCount > 0) body += `| ${SEVERITY_EMOJI["high"]} High | ${highCount} |\n`;
  if (mediumCount > 0) body += `| ${SEVERITY_EMOJI["medium"]} Medium | ${mediumCount} |\n`;
  if (lowCount > 0) body += `| ${SEVERITY_EMOJI["low"]} Low | ${lowCount} |\n`;

  body += `| Inline Comments | ${inlineCount} |\n`;

  if (skippedCount > 0) {
    body += `\n> **Note:** ${skippedCount} finding(s) could not be placed inline (line not in diff).\n`;

    // List skipped findings as a table
    const skipped = findings.filter((f) => {
      // This will be determined at call time, but we include all for completeness
      return false; // placeholder
    });
  }

  body += `\n---\n`;
  body += `*Powered by [Buggers](https://buggers.dev) · Automated AI Security Review*`;

  return body;
}

// ─── Main Function ─────────────────────────────────────────────────

/**
 * Posts a GitHub Pull Request Review with inline comments for each finding.
 *
 * @returns The number of inline comments posted, or -1 if the review failed.
 */
export async function postPrReviewComments(args: {
  userId: string;
  repoFullName: string;
  prNumber: number;
  headSha: string;
  riskScore: number;
  findings: ReviewFinding[];
  prFiles: GitHubPullFile[];
}): Promise<{ inlineCount: number; reviewUrl: string | null }> {
  const { userId, repoFullName, prNumber, headSha, riskScore, findings, prFiles } = args;

  if (findings.length === 0) {
    // Post a clean review with no comments
    try {
      const review = await githubJson<GitHubReview>(
        userId,
        `/repos/${repoFullName}/pulls/${prNumber}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commit_id: headSha,
            body: "## 🛡️ Buggers Security Review\n\n✅ **No security issues found.** Risk score: **" + riskScore + "/100**\n\n---\n*Powered by [Buggers](https://buggers.dev)*",
            event: "COMMENT",
          }),
        },
      );
      return { inlineCount: 0, reviewUrl: review.html_url };
    } catch (err) {
      logStructured("warn", "pr_review_clean_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return { inlineCount: 0, reviewUrl: null };
    }
  }

  // Build a map of file paths → valid diff line numbers
  const diffLineMap = new Map<string, Set<number>>();
  for (const file of prFiles) {
    diffLineMap.set(file.filename, getDiffLineNumbers(file.patch));
  }

  // Build inline comments
  const comments: GitHubReviewComment[] = [];
  const skippedFindings: ReviewFinding[] = [];

  for (const finding of findings) {
    const validLines = diffLineMap.get(finding.file_path);

    if (!validLines || !finding.line_number || !validLines.has(finding.line_number)) {
      // Line isn't in the diff — can't post inline, add to summary
      skippedFindings.push(finding);
      continue;
    }

    comments.push({
      path: finding.file_path,
      line: finding.line_number,
      side: "RIGHT",
      body: formatCommentBody(finding),
    });
  }

  // Build the summary body
  let summaryBody = formatReviewSummary(
    findings,
    riskScore,
    repoFullName,
    prNumber,
    comments.length,
    skippedFindings.length,
  );

  // Add skipped findings to the summary
  if (skippedFindings.length > 0) {
    summaryBody += `\n\n### Findings not in diff\n\n`;
    summaryBody += `| Severity | Finding | File | Line |\n|----------|---------|------|------|\n`;
    for (const f of skippedFindings) {
      const emoji = SEVERITY_EMOJI[f.severity] ?? "⚠️";
      summaryBody += `| ${emoji} ${SEVERITY_LABEL[f.severity] ?? f.severity} | ${f.title} | \`${f.file_path}\` | ${f.line_number ?? "—"} |\n`;
    }
  }

  // Determine review event: REQUEST_CHANGES for critical/high, COMMENT otherwise
  const hasCriticalOrHigh = findings.some(
    (f) => f.severity === "critical" || f.severity === "high",
  );
  const reviewEvent = hasCriticalOrHigh ? "REQUEST_CHANGES" : "COMMENT";

  try {
    const review = await githubJson<GitHubReview>(
      userId,
      `/repos/${repoFullName}/pulls/${prNumber}/reviews`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commit_id: headSha,
          body: summaryBody,
          event: reviewEvent,
          comments: comments.slice(0, 50), // GitHub limits to ~60 comments per review
        }),
      },
    );

    logStructured("info", "pr_review_posted", {
      repoFullName,
      prNumber,
      reviewId: review.id,
      inlineComments: comments.length,
      skippedFindings: skippedFindings.length,
      event: reviewEvent,
    });

    return { inlineCount: comments.length, reviewUrl: review.html_url };
  } catch (err) {
    logStructured("error", "pr_review_failed", {
      repoFullName,
      prNumber,
      error: err instanceof Error ? err.message : String(err),
      commentCount: comments.length,
    });

    // Fallback: post a simple issue comment with findings
    try {
      const { postGitHubPullRequestComment } = await import("@/server/github.server");
      await postGitHubPullRequestComment(userId, repoFullName, prNumber, summaryBody);
      logStructured("info", "pr_review_fallback_comment_posted", { repoFullName, prNumber });
    } catch {
      // Non-fatal
    }

    return { inlineCount: 0, reviewUrl: null };
  }
}
