/**
 * Git History & Commit Security Analysis Module
 *
 * Implements Phase 4 of Buggers Full Repository Analysis:
 * - Traverses commit history along default or selected branch
 * - Analyzes commit diffs for introduced secrets and regression vulnerabilities
 * - Correlates whether a historical issue remains present in current HEAD or is historical-only
 * - Records introducing commit SHA, author, and message without leaking secret values
 */

import { githubJson, type GitHubCommit } from "@/server/github.server";
import { SECRET_RULES, maskSecret } from "@/server/secretScanner.server";
import { SAST_RULES } from "@/server/sastScanner.server";
import type { UnifiedRepositoryFinding, ScannedFileContent } from "@/server/repoScanner.server";
import { logStructured } from "@/server/logger.server";

export interface CommitScanSummary {
  totalCommitsInspected: number;
  authorsIdentified: string[];
  historicalFindings: UnifiedRepositoryFinding[];
  earliestCommitDate?: string | undefined;
  latestCommitDate?: string | undefined;
}

export async function scanRepositoryGitHistory(
  userId: string,
  repoFullName: string,
  branch: string,
  currentFiles: ScannedFileContent[],
  maxCommits = 30,
): Promise<CommitScanSummary> {
  const summary: CommitScanSummary = {
    totalCommitsInspected: 0,
    authorsIdentified: [],
    historicalFindings: [],
  };

  let commits: GitHubCommit[] = [];
  try {
    commits = await githubJson<GitHubCommit[]>(
      userId,
      `/repos/${repoFullName}/commits?sha=${encodeURIComponent(branch)}&per_page=${maxCommits}`,
    );
  } catch (err) {
    logStructured("warn", `Could not retrieve commit history for ${repoFullName}@${branch}`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return summary;
  }

  if (!commits || !commits.length) return summary;

  summary.totalCommitsInspected = commits.length;
  summary.latestCommitDate = commits[0]?.commit.author?.date;
  summary.earliestCommitDate = commits[commits.length - 1]?.commit.author?.date;

  const authorsSet = new Set<string>();
  for (const c of commits) {
    const author = c.author?.login ?? c.commit.author?.name;
    if (author) authorsSet.add(author);
  }
  summary.authorsIdentified = Array.from(authorsSet);

  // Map current files for presence verification
  const currentFileMap = new Map<string, string>();
  for (const f of currentFiles) {
    currentFileMap.set(f.path, f.content);
  }

  const seenSignatures = new Set<string>();

  // Inspect each commit's individual patch details (bounded to latest 15 to manage rate limits)
  const commitsToInspect = commits.slice(0, 15);

  for (const commit of commitsToInspect) {
    try {
      const detail = await githubJson<{
        sha: string;
        commit: { message: string; author: { name: string; date: string } | null };
        files?: Array<{ filename: string; patch?: string; status: string }>;
      }>(userId, `/repos/${repoFullName}/commits/${commit.sha}`);

      if (!detail?.files) continue;

      for (const file of detail.files) {
        if (!file.patch) continue;
        const currentContent = currentFileMap.get(file.filename);
        const lines = file.patch.split("\n");
        let lineNo = 1;

        for (const rawLine of lines) {
          const hunkMatch = rawLine.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
          if (hunkMatch) {
            lineNo = parseInt(hunkMatch[1]!, 10);
            continue;
          }

          if (rawLine.startsWith("+") && !rawLine.startsWith("+++")) {
            const addedCode = rawLine.slice(1);

            // Check for secrets introduced in this commit
            for (const rule of SECRET_RULES) {
              rule.pattern.lastIndex = 0;
              const match = rule.pattern.exec(addedCode);
              if (match && match[0]) {
                const rawVal = match[0];
                if (/xxxx|your[-_]?key|dummy|example|placeholder/i.test(rawVal)) continue;

                // Check if secret is STILL present in current HEAD
                const stillPresentInHead = currentContent ? currentContent.includes(rawVal) : false;
                const sig = `hist-sec-${file.filename}-${rule.id}`;

                if (!seenSignatures.has(sig)) {
                  seenSignatures.add(sig);
                  summary.historicalFindings.push({
                    id: `${sig}-${commit.sha.slice(0, 7)}`,
                    file_path: file.filename,
                    line_number: stillPresentInHead ? lineNo : null,
                    title: `Git History: Secret Introduced in Commit ${commit.sha.slice(0, 7)}`,
                    description: `${rule.description} Introduced by commit "${detail.commit.message.split("\n")[0]}".`,
                    why_it_matters: stillPresentInHead
                      ? "This secret was introduced in past Git history and remains actively exposed in the current codebase HEAD!"
                      : "This secret was introduced in historical commits. Even if removed from HEAD, Git history preserves the plaintext value unless rewritten/purged.",
                    evidence: addedCode.replace(rawVal, maskSecret(rawVal)).trim(),
                    suggested_fix: rule.recommendation,
                    severity: "critical",
                    category: "security",
                    confidence: 0.96,
                    source: "history",
                    rule_id: rule.id,
                    is_historical: !stillPresentInHead,
                    introduced_commit: commit.sha,
                  });
                }
              }
            }

            // Check for high-severity SAST introduced in this commit
            for (const rule of SAST_RULES) {
              if (rule.severity !== "critical") continue;

              rule.pattern.lastIndex = 0;
              const match = rule.pattern.exec(addedCode);
              if (match && match[0]) {
                const stillPresentInHead = currentContent ? currentContent.includes(match[0].slice(0, 30)) : false;
                const sig = `hist-sast-${file.filename}-${rule.id}`;

                if (!seenSignatures.has(sig)) {
                  seenSignatures.add(sig);
                  summary.historicalFindings.push({
                    id: `${sig}-${commit.sha.slice(0, 7)}`,
                    file_path: file.filename,
                    line_number: stillPresentInHead ? lineNo : null,
                    title: `Git History: ${rule.name} Introduced in ${commit.sha.slice(0, 7)}`,
                    description: `${rule.description} Introduced in commit "${detail.commit.message.split("\n")[0]}".`,
                    why_it_matters: stillPresentInHead
                      ? "This critical vulnerability was introduced in a past commit and persists in current HEAD."
                      : "This vulnerability was introduced historically and has since been modified or removed.",
                    evidence: addedCode.trim(),
                    suggested_fix: rule.suggestedFixTemplate(match[0]),
                    severity: rule.severity,
                    category: "security",
                    confidence: 0.88,
                    source: "history",
                    rule_id: rule.id,
                    is_historical: !stillPresentInHead,
                    introduced_commit: commit.sha,
                  });
                }
              }
            }

            lineNo++;
          } else if (!rawLine.startsWith("-")) {
            lineNo++;
          }
        }
      }
    } catch (err) {
      logStructured("warn", `Error analyzing commit ${commit.sha}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return summary;
}
