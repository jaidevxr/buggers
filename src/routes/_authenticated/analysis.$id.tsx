import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  GitCommit,
  Loader2,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";
import {
  getAnalysis,
  postReportToGitHubPR,
  runAnalysis,
  startAnalysis,
  startRepositoryAnalysis,
} from "@/lib/analysis.functions";
import { applyBatchFindingFixesToGitHub } from "@/lib/findings.functions";
import { evaluateQualityGate, getSavedSecurityPolicy } from "@/lib/security-policy";
import { getPullRequestDetail } from "@/lib/github.functions";
import { PageHeader, timeAgo, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/status/EmptyState";
import { AnalysisDetailSkeleton } from "@/components/LoadingSkeletons";
import {
  ConfidenceMeter,
  RiskBadge,
  SeverityBadge,
  StatusPill,
} from "@/components/status/StatusBadges";
import { Button } from "@/components/ui/button";
import { DiffViewer } from "@/components/diff/DiffViewer";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({ meta: [{ title: "Analysis – Buggers" }] }),
  component: AnalysisPage,
});

const STAGES = [
  ["queued", "Queued"],
  ["fetching_pr", "Fetching PR"],
  ["fetching_commits", "Fetching commits"],
  ["fetching_files", "Fetching changed files"],
  ["historical_analysis", "Historical analysis"],
  ["ai_review", "AI code review"],
  ["validating_findings", "Findings validation"],
  ["risk_calculation", "Risk calculation"],
  ["completed", "Analysis complete"],
] as const;

type Signal = {
  key?: string;
  id?: string;
  label?: string;
  name?: string;
  status?: string;
  value?: unknown;
  detail?: string;
  explanation?: string;
};

function AnalysisPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [rerunning, setRerunning] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentUrl, setCommentUrl] = useState<string | null>(null);
  const [batchFixing, setBatchFixing] = useState(false);

  const q = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => getAnalysis({ data: { analysisId: id } }),
    refetchInterval: (query) => {
      const s = query.state.data?.analysis?.status;
      return s === "completed" || s === "failed" ? false : 2000;
    },
  });
  const a = q.data?.analysis;
  const pr = useQuery({
    queryKey: ["pr", a?.repo_full_name, a?.pr_number],
    queryFn: () =>
      getPullRequestDetail({ data: { repoFullName: a!.repo_full_name, prNumber: a!.pr_number } }),
    enabled: Boolean(a && a.pr_number > 0),
  });

  if (q.isLoading) return <AnalysisDetailSkeleton />;
  if (q.error) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  if (!a)
    return (
      <EmptyState
        title="Analysis not found"
        action={
          <Link to="/dashboard" className="text-sm underline">
            Back to overview
          </Link>
        }
      />
    );

  const findings = q.data!.findings;
  const stageIdx = STAGES.findIndex(([k]) => k === a.stage);
  const signals = (Array.isArray(a.signals) ? a.signals : []) as Signal[];
  const historyObj = (a.history && typeof a.history === "object" ? a.history : {}) as {
    coverage?: {
      filesAnalyzed: number;
      totalFiles: number;
      patchesTruncated: number;
      filesSkipped: number;
    };
  };
  const coverage = historyObj.coverage;

  const fixableFindings = findings.filter((f) => f.status === "open" && Boolean(f.suggested_fix));
  const qualityGate =
    a.status === "completed"
      ? evaluateQualityGate(getSavedSecurityPolicy(), {
          riskScore: a.risk_score ?? 0,
          findings,
        })
      : null;

  async function handleBatchFix() {
    if (!a) return;
    setBatchFixing(true);
    try {
      const res = await applyBatchFindingFixesToGitHub({ data: { analysisId: a.id } });
      if (res.appliedCount > 0 && res.failedCount === 0) {
        toast.success(
          `Successfully committed ${res.appliedCount} security fixes to branch ${res.branch}! New analysis queued on commit.`,
        );
      } else if (res.appliedCount > 0 && res.failedCount > 0) {
        toast.warning(
          `Applied ${res.appliedCount} fix(es) to branch ${res.branch}. ${res.failedCount} finding(s) require manual review.`,
        );
      } else if (res.appliedCount === 0) {
        if (res.totalEligible === 0) {
          toast.info(res.message ?? "All findings have already been remediated.");
        } else {
          toast.error(
            `Could not apply fixes automatically (${res.failedCount} finding(s) failed). Please review the findings manually.`,
          );
        }
      }

      await qc.invalidateQueries({ queryKey: ["analysis", a.id] });
      await qc.invalidateQueries({ queryKey: ["findings"] });
      await qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      await qc.invalidateQueries({ queryKey: ["analyses"] });
      await qc.invalidateQueries({ queryKey: ["tickets"] });
      await q.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBatchFixing(false);
    }
  }


  async function rerun() {
    setRerunning(true);
    try {
      const r =
        a!.pr_number > 0
          ? await startAnalysis({
              data: { repoFullName: a!.repo_full_name, prNumber: a!.pr_number },
            })
          : await startRepositoryAnalysis({
              data: { repoFullName: a!.repo_full_name, branch: a!.head_branch ?? undefined },
            });
      if (!r.alreadyRunning)
        void runAnalysis({ data: { analysisId: r.analysisId } }).catch(() => {});
      await q.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setRerunning(false);
    }
  }

  async function postToGitHub() {
    if (!a) return;
    setPostingComment(true);
    try {
      const res = await postReportToGitHubPR({ data: { analysisId: a.id } });
      setCommentUrl(res.commentUrl);
      toast.success("Security review report and status check posted to GitHub PR!");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setPostingComment(false);
    }
  }

  function exportReport() {
    if (!a) return;
    const reportMd = `# 🛡️ Security Audit Report: ${a.repo_full_name} #${a.pr_number}

**Pull Request:** #${a.pr_number} ${a.pr_title ?? ""}
**Repository:** ${a.repo_full_name}
**Branches:** ${a.head_branch} -> ${a.base_branch}
**Author:** ${a.pr_author ?? "unknown"}
**Commit SHA:** ${a.head_sha ?? "N/A"}
**Generated At:** ${new Date().toISOString()}

---
## Executive Summary
- **Overall Risk Score:** ${a.risk_score ?? "N/A"}/100 (${a.risk_level?.toUpperCase() ?? "N/A"})
- **Confidence Rating:** ${Math.round(Number(a.risk_confidence ?? 1) * 100)}%
- **Review Model:** ${a.model_version ?? "risk-engine-1.1.0"}
- **Coverage:** Analyzed ${coverage?.filesAnalyzed ?? a.changed_files ?? 0} of ${coverage?.totalFiles ?? a.changed_files ?? 0} files (+${a.additions ?? 0} / -${a.deletions ?? 0})

---
## Risk Engine Signals
${signals.map((s) => `- **${s.name || s.label || s.id}:** \`${String(s.value)}\` (${s.status}) — ${s.detail || s.explanation || ""}`).join("\n")}

---
## Security Findings (${findings.length})
${findings.length === 0 ? "No security defects detected. Pull request is clean." : findings.map((f, i) => `### Finding ${i + 1}: [${f.severity.toUpperCase()}] ${f.title}
- **File:** \`${f.file_path}${f.line_number ? `:${f.line_number}` : ""}\`
- **Category:** \`${f.category}\` (Confidence: ${Math.round((f.confidence ?? 0.8) * 100)}%)
- **Status:** \`${f.status}\`

#### Problem
${f.description}

#### Impact
${f.why_it_matters ?? "N/A"}

${f.evidence ? `#### Vulnerable Code Snippet\n\`\`\`\n${f.evidence}\n\`\`\`` : ""}

${f.suggested_fix ? `#### Remediation Fix\n\`\`\`\n${f.suggested_fix}\n\`\`\`` : ""}
`).join("\n---\n")}
`;
    const blob = new Blob([reportMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `buggers-audit-${a.repo_full_name.replace("/", "-")}-pr${a.pr_number}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Security audit report downloaded!");
  }

  const latestSha = pr.data?.pullRequest?.headSha;
  const isOutdated =
    Boolean(latestSha && a.head_sha && latestSha !== a.head_sha) &&
    (a.status === "completed" || a.status === "failed");

  return (
    <div className="page-view content-fade-in">
      <PageHeader
        backTo={a.pr_number > 0 ? "/pull-requests" : `/repositories/${a.repo_full_name}`}
        backLabel={a.pr_number > 0 ? "Pull requests" : "Repository"}
        title={a.pr_number > 0 ? `#${a.pr_number} ${a.pr_title ?? ""}` : (a.pr_title ?? "Full Codebase Analysis")}
        description={
          a.pr_number > 0
            ? `${a.repo_full_name} · ${a.head_branch} → ${a.base_branch} · by ${a.pr_author ?? "unknown"} · ${timeAgo(a.created_at)}`
            : `${a.repo_full_name} · Branch: ${a.head_branch || "main"} · Whole Repository Scan · by ${a.pr_author ?? "Repository"} · ${timeAgo(a.created_at)}`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={a.status} />
            {a.status === "completed" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportReport}
                  className="gap-1.5 text-xs"
                  title="Export audit report as Markdown"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export report
                </Button>
                {a.pr_number > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={postToGitHub}
                    disabled={postingComment}
                    className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                  >
                    {postingComment ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5" />
                    )}
                    {commentUrl ? "Review posted ✓" : "Post to GitHub PR"}
                  </Button>
                )}
              </>
            )}
            {(a.status === "completed" || a.status === "failed") && (
              <Button size="sm" variant="outline" onClick={rerun} disabled={rerunning} className="text-xs">
                Re-run analysis
              </Button>
            )}
          </div>
        }
      />

      {commentUrl && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-risk-low/30 bg-risk-low/10 p-3.5 text-xs text-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-risk-low" />
            <span>Security analysis review and commit status check successfully posted to GitHub PR!</span>
          </div>
          <a
            href={commentUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-semibold text-primary underline"
          >
            View comment on GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {isOutdated && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
          <div className="flex items-center gap-3">
            <GitCommit className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-500">
                New commit detected on GitHub ({latestSha?.slice(0, 7)})
              </p>
              <p className="text-xs text-muted-foreground">
                This analysis was performed on commit <code className="rounded bg-muted px-1">{a.head_sha?.slice(0, 7)}</code>.
                The branch has since updated. Re-analyze to review latest changes.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={rerun}
            disabled={rerunning}
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
          >
            {rerunning ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <GitCommit className="mr-1.5 h-3.5 w-3.5" />
            )}
            Analyze latest commit
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card p-5">
          <h2 className="mb-3 font-semibold">Pipeline</h2>
          <ol className="space-y-2 text-sm">
            {STAGES.map(([key, label], i) => {
              const failed = a.status === "failed" && i === Math.max(stageIdx, 0);
              const done = a.status === "completed" || i < stageIdx;
              const active = !done && !failed && i === stageIdx;
              return (
                <li key={key} className="flex items-center gap-2">
                  {failed ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : done ? (
                    <CheckCircle2 className="h-4 w-4 text-risk-low" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={active ? "font-semibold" : done ? "" : "text-muted-foreground"}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
          {a.status === "failed" && (
            <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {a.error_message ?? "Analysis failed. Try running the analysis again."}
            </p>
          )}
        </section>

        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Risk</h2>
          {a.status !== "completed" ? (
            <p className="text-sm text-muted-foreground">
              Risk will appear once the analysis actually completes.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <span className="text-4xl font-bold">{a.risk_score ?? "—"}</span>
                <RiskBadge level={a.risk_level} />
                {a.risk_confidence != null && <ConfidenceMeter value={Number(a.risk_confidence)} />}
                <span className="text-xs text-muted-foreground">Model {a.model_version}</span>
              </div>

              {qualityGate && (
                <div
                  className={`mb-4 rounded-xl border p-3.5 text-xs ${
                    qualityGate.passed
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {qualityGate.passed ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span>CI Quality Gate Passed</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        <span>CI Quality Gate Blocked</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground">{qualityGate.reason}</p>
                </div>
              )}

              {coverage && (
                <div className="mb-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                  <span>
                    <strong className="text-foreground">Coverage:</strong> analyzed{" "}
                    {coverage.filesAnalyzed} of {coverage.totalFiles} changed file(s)
                  </span>
                  {coverage.patchesTruncated > 0 && (
                    <span>· {coverage.patchesTruncated} patch(es) truncated</span>
                  )}
                  {coverage.filesSkipped > 0 && (
                    <span>· {coverage.filesSkipped} file(s) skipped</span>
                  )}
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {signals.map((s, i) => (
                  <div
                    key={s.key ?? s.id ?? i}
                    className="rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{s.label ?? s.name ?? s.key}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.status === "insufficient_data"
                          ? "Insufficient data"
                          : typeof s.value === "number"
                            ? s.value.toFixed(2)
                            : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.detail ?? s.explanation ?? ""}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {fixableFindings.length > 0 && (
        <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-400">
                Automated Security Remediation Available
              </h3>
              <p className="text-xs text-muted-foreground">
                {fixableFindings.length} open finding{fixableFindings.length > 1 ? "s have" : " has"} validated code suggestions ready to commit directly to branch <code className="rounded bg-muted px-1 font-mono text-foreground">{a.head_branch}</code>.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleBatchFix}
            disabled={batchFixing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
          >
            {batchFixing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Applying Fixes to PR Branch...
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Fix All Findings on GitHub ({fixableFindings.length})
              </>
            )}
          </Button>
        </div>
      )}

      <h2 className={`mb-3 font-semibold ${fixableFindings.length === 0 ? "mt-8" : ""}`}>Findings ({findings.length})</h2>

      {findings.length === 0 ? (
        <EmptyState
          title={a.status === "completed" ? "No validated findings" : "Analysis pending"}
          description={
            a.status === "completed"
              ? "The AI review produced no findings that passed validation against the real diff."
              : undefined
          }
        />
      ) : (
        <div className="surface-card divide-y divide-border">
          {findings.map((f) => (
            <Link
              key={f.id}
              to="/findings/$id"
              params={{ id: f.id }}
              className="block px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-3">
                <SeverityBadge severity={f.severity} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {f.file_path}
                    {f.line_number ? `:${f.line_number}` : ""} · {f.category}
                  </div>
                </div>
                <ConfidenceMeter value={Number(f.confidence)} />
                <StatusPill status={f.status} />
              </div>
              {f.description && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 pl-[calc(theme(spacing.3)+theme(spacing.16))]">
                  {f.description}
                </p>
              )}
              {f.suggested_fix && (
                <div className="mt-2 flex items-center gap-2 pl-[calc(theme(spacing.3)+theme(spacing.16))]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-risk-low/10 px-2 py-0.5 text-[10px] font-medium text-risk-low">
                    ✓ Fix available
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 font-semibold">Changed files</h2>
      {pr.isLoading ? (
        <LoadingState label="Loading diff from GitHub…" />
      ) : pr.error ? (
        <ErrorState message={errMsg(pr.error)} />
      ) : pr.data ? (
        <DiffViewer files={pr.data.files} findings={findings} />
      ) : null}
    </div>
  );
}
