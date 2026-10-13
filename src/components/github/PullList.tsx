import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, GitCommit, Loader2, XCircle, Zap } from "lucide-react";
import { listPullRequests } from "@/lib/github.functions";
import { analyzeAllPullRequests, listAnalyses, runAnalysis, startAnalysis } from "@/lib/analysis.functions";
import { timeAgo, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/status/EmptyState";
import { RiskBadge, StatusPill } from "@/components/status/StatusBadges";
import { Button } from "@/components/ui/button";

const FILTERS = [
  "all",
  "open",
  "closed",
  "merged",
  "analyzed",
  "needs analysis",
  "high",
  "medium",
  "low",
] as const;

export function PullList({ repoFullName }: { repoFullName: string }) {
  const navigate = useNavigate();
  const pulls = useQuery({
    queryKey: ["pulls", repoFullName],
    queryFn: () => listPullRequests({ data: { repoFullName, state: "all" } }),
  });

  const [busy, setBusy] = useState<number | null>(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const analyses = useQuery({
    queryKey: ["analyses", repoFullName],
    queryFn: () => listAnalyses({ data: { repoFullName } }),
    refetchInterval: (query) => {
      const rows = query.state.data?.analyses ?? [];
      const hasActive = rows.some((a) => a.status === "queued" || a.status === "processing");
      return hasActive ? 3000 : false;
    },
  });

  // Calculate truthful PR status breakdown
  const prStates = useMemo(() => {
    const list = pulls.data?.pullRequests ?? [];
    const allAnalyses = analyses.data?.analyses ?? [];

    return list.map((p) => {
      // 1. Analysis matching this exact current commit
      const currentCommitAnalysis = allAnalyses.find(
        (a) => a.pr_number === p.number && a.head_sha === p.headSha,
      );
      // 2. Latest analysis regardless of commit
      const latestAnalysis = allAnalyses.find((a) => a.pr_number === p.number);

      const isCurrentAnalyzed = currentCommitAnalysis?.status === "completed";
      const isAnalyzing =
        currentCommitAnalysis?.status === "processing" ||
        currentCommitAnalysis?.status === "queued" ||
        (!currentCommitAnalysis &&
          (latestAnalysis?.status === "processing" || latestAnalysis?.status === "queued"));
      const isFailed = currentCommitAnalysis?.status === "failed";
      const hasNewCommits =
        !currentCommitAnalysis &&
        latestAnalysis?.status === "completed" &&
        latestAnalysis.head_sha !== p.headSha;
      const notAnalyzed = !isCurrentAnalyzed && !isAnalyzing && !isFailed && !hasNewCommits;

      return {
        pr: p,
        currentCommitAnalysis,
        latestAnalysis,
        isCurrentAnalyzed,
        isAnalyzing,
        isFailed,
        hasNewCommits,
        notAnalyzed,
      };
    });
  }, [pulls.data, analyses.data]);

  // Repository-wide metrics focused truthfully on open pull requests
  const summary = useMemo(() => {
    const openPrs = prStates.filter((s) => s.pr.state === "open");
    const total = prStates.length;
    const openTotal = openPrs.length;
    const analyzed = prStates.filter((s) => s.isCurrentAnalyzed).length;
    const openAnalyzed = openPrs.filter((s) => s.isCurrentAnalyzed).length;
    const openNewCommits = openPrs.filter((s) => s.hasNewCommits).length;
    const openAnalyzing = openPrs.filter((s) => s.isAnalyzing).length;
    const openFailed = openPrs.filter((s) => s.isFailed).length;
    const openNotAnalyzed = openPrs.filter((s) => s.notAnalyzed).length;
    return {
      total,
      openTotal,
      analyzed,
      openAnalyzed,
      newCommits: openNewCommits,
      analyzing: openAnalyzing,
      failed: openFailed,
      notAnalyzed: openNotAnalyzed,
    };
  }, [prStates]);

  const filtered = useMemo(() => {
    return prStates.filter(({ pr: p, currentCommitAnalysis: cur, isCurrentAnalyzed, hasNewCommits, notAnalyzed, isFailed }) => {
      switch (filter) {
        case "all":
          return true;
        case "open":
        case "closed":
        case "merged":
          return p.state === filter;
        case "analyzed":
          return isCurrentAnalyzed;
        case "needs analysis":
          return hasNewCommits || notAnalyzed || isFailed;
        default:
          return (
            cur?.risk_level === filter || (filter === "high" && cur?.risk_level === "critical")
          );
      }
    });
  }, [prStates, filter]);

  async function analyze(prNumber: number) {
    setBusy(prNumber);
    try {
      const { analysisId, alreadyRunning } = await startAnalysis({
        data: { repoFullName, prNumber },
      });
      if (!alreadyRunning) {
        void runAnalysis({ data: { analysisId } }).catch(() => {});
      }
      await analyses.refetch();
      navigate({ to: "/analysis/$id", params: { id: analysisId } });
    } catch (e) {
      toast.error(errMsg(e));
      setBusy(null);
    }
  }

  async function autoAnalyzeAll() {
    setAnalyzingAll(true);
    try {
      const res = await analyzeAllPullRequests({ data: { repoFullName } });
      if (res.queuedCount > 0) {
        toast.success(
          `Queued ${res.queuedCount} pull request(s) for analysis (${res.alreadyAnalyzedCount} already up-to-date).`,
        );
      } else if (res.totalOpenPrs === 0) {
        toast.info("No open pull requests found in this repository.");
      } else if (res.alreadyProcessingCount > 0) {
        toast.info(
          `${res.alreadyProcessingCount} pull request(s) are currently being analyzed (${res.alreadyAnalyzedCount} completed).`,
        );
      } else {
        toast.info(
          `All ${res.totalOpenPrs} open pull requests have completed analyses on their latest commit.`,
        );
      }
      await analyses.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setAnalyzingAll(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Truthful repository PR status summary banner */}
      {summary.openTotal > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs">
          <span className="font-semibold text-foreground">Open PR Security Audit:</span>
          <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-medium text-foreground">
            {summary.openAnalyzed} / {summary.openTotal} Analyzed
          </span>
          {summary.newCommits > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-medium text-amber-500 border border-amber-500/20">
              <GitCommit className="h-3 w-3" />
              {summary.newCommits} Outdated (New commits)
            </span>
          )}
          {summary.analyzing > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 font-medium text-blue-400 border border-blue-500/20">
              <Loader2 className="h-3 w-3 animate-spin" />
              {summary.analyzing} Processing
            </span>
          )}
          {summary.failed > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 font-medium text-destructive border border-destructive/20">
              <XCircle className="h-3 w-3" />
              {summary.failed} Failed
            </span>
          )}
          {summary.notAnalyzed > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-muted-foreground">
              {summary.notAnalyzed} Not Analyzed
            </span>
          )}
          {summary.total > summary.openTotal && (
            <span className="ml-auto text-[11px] text-muted-foreground">
              ({summary.analyzed} of {summary.total} total PRs audited)
            </span>
          )}
        </div>
      ) : summary.total > 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          No open pull requests. {summary.analyzed} of {summary.total} closed/merged PRs have historical analyses.
        </div>
      ) : null}

      {/* Filter tabs & auto-analyze action */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter pull requests">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={autoAnalyzeAll}
          disabled={analyzingAll || !pulls.data?.pullRequests?.length}
          className="gap-1.5 text-xs font-medium"
        >
          {analyzingAll ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          )}
          {analyzingAll ? "Queueing analyses..." : "Auto-analyze open PRs"}
        </Button>
      </div>

      {pulls.isLoading ? (
        <LoadingState label="Loading pull requests from GitHub…" />
      ) : pulls.error ? (
        <ErrorState message={errMsg(pulls.error)} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No pull requests found"
          description="Nothing matches this filter in this repository."
        />
      ) : (
        <div className="surface-card divide-y divide-border">
          {filtered.map(
            ({
              pr: p,
              currentCommitAnalysis: cur,
              latestAnalysis: lat,
              isCurrentAnalyzed,
              isAnalyzing,
              isFailed,
              hasNewCommits,
            }) => {
              const activeAnalysis = cur ?? lat;
              const isBusy = busy === p.number;

              return (
                <div key={p.number} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        #{p.number} {p.title}
                      </span>
                      {hasNewCommits && (
                        <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500 border border-amber-500/20">
                          New commit {p.headSha.slice(0, 7)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.author ?? "unknown"} · {p.headBranch} → {p.baseBranch} · commit{" "}
                      <code className="rounded bg-muted px-1 font-mono">{p.headSha.slice(0, 7)}</code> · updated{" "}
                      {timeAgo(p.updatedAt)}
                    </div>
                  </div>

                  <StatusPill status={p.state} />

                  {/* Status Indicator & Finding Counts */}
                  <div className="flex flex-col items-end gap-1">
                    {isAnalyzing ? (
                      <RiskBadge status="processing" />
                    ) : isFailed ? (
                      <RiskBadge status="failed" />
                    ) : hasNewCommits ? (
                      <RiskBadge isOutdated={true} />
                    ) : isCurrentAnalyzed ? (
                      <RiskBadge level={cur?.risk_level} score={cur?.risk_score} />
                    ) : (
                      <RiskBadge level={null} />
                    )}

                    {isCurrentAnalyzed && cur && (() => {
                      const aiFindings = (cur.stage_data as { aiFindings?: Array<{ severity: string }> })?.aiFindings;
                      if (!Array.isArray(aiFindings)) return null;
                      const count = aiFindings.length;
                      if (count === 0) {
                        return <span className="text-[11px] font-medium text-emerald-500">0 findings</span>;
                      }
                      const crit = aiFindings.filter((f) => f.severity === "critical").length;
                      const high = aiFindings.filter((f) => f.severity === "high").length;
                      const med = aiFindings.filter((f) => f.severity === "medium").length;
                      const low = aiFindings.filter((f) => f.severity === "low").length;
                      const breakdown = [
                        crit > 0 && `${crit} crit`,
                        high > 0 && `${high} high`,
                        med > 0 && `${med} med`,
                        low > 0 && `${low} low`,
                      ]
                        .filter(Boolean)
                        .join(", ");
                      return (
                        <span className="text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">{count}</span> {count === 1 ? "finding" : "findings"}{" "}
                          {breakdown && <span className="opacity-75">({breakdown})</span>}
                        </span>
                      );
                    })()}
                  </div>

                  {/* View Analysis Link */}
                  {activeAnalysis && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigate({ to: "/analysis/$id", params: { id: activeAnalysis.id } })
                      }
                      className="text-xs"
                    >
                      {hasNewCommits ? "View prior" : "View"}
                    </Button>
                  )}

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant={isFailed ? "destructive" : hasNewCommits ? "default" : "outline"}
                    disabled={isBusy || isAnalyzing}
                    onClick={() => analyze(p.number)}
                    className="gap-1.5 text-xs font-medium"
                  >
                    {isBusy || isAnalyzing ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Analyzing…
                      </>
                    ) : hasNewCommits ? (
                      <>
                        <GitCommit className="h-3 w-3" />
                        Analyze new commit
                      </>
                    ) : isFailed ? (
                      "Retry analysis"
                    ) : isCurrentAnalyzed ? (
                      "Re-analyze"
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
