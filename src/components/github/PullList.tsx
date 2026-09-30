import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { listPullRequests } from "@/lib/github.functions";
import { listAnalyses, runAnalysis, startAnalysis } from "@/lib/analysis.functions";
import { timeAgo, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/status/EmptyState";
import { RiskBadge, StatusPill } from "@/components/status/StatusBadges";
import { Button } from "@/components/ui/button";

const FILTERS = ["all", "open", "closed", "merged", "analyzed", "needs review", "high", "medium", "low"] as const;

export function PullList({ repoFullName }: { repoFullName: string }) {
  const navigate = useNavigate();
  const pulls = useQuery({
    queryKey: ["pulls", repoFullName],
    queryFn: () => listPullRequests({ data: { repoFullName, state: "all" } }),
  });
  const analyses = useQuery({
    queryKey: ["analyses", repoFullName],
    queryFn: () => listAnalyses({ data: { repoFullName } }),
  });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [busy, setBusy] = useState<number | null>(null);

  const latest = useMemo(() => {
    const m = new Map<number, NonNullable<typeof analyses.data>["analyses"][number]>();
    for (const a of analyses.data?.analyses ?? []) if (!m.has(a.pr_number)) m.set(a.pr_number, a);
    return m;
  }, [analyses.data]);

  const rows = (pulls.data?.pullRequests ?? []).filter((p) => {
    const a = latest.get(p.number);
    switch (filter) {
      case "all": return true;
      case "open": case "closed": case "merged": return p.state === filter;
      case "analyzed": return a?.status === "completed";
      case "needs review": return p.state === "open" && !a;
      default: return a?.risk_level === filter || (filter === "high" && a?.risk_level === "critical");
    }
  });

  async function analyze(prNumber: number) {
    setBusy(prNumber);
    try {
      const { analysisId, alreadyRunning } = await startAnalysis({ data: { repoFullName, prNumber } });
      if (!alreadyRunning) void runAnalysis({ data: { analysisId } }).catch(() => {});
      navigate({ to: "/analysis/$id", params: { id: analysisId } });
    } catch (e) {
      toast.error(errMsg(e));
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter pull requests">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>
      {pulls.isLoading ? (
        <LoadingState label="Loading pull requests from GitHub…" />
      ) : pulls.error ? (
        <ErrorState message={errMsg(pulls.error)} />
      ) : rows.length === 0 ? (
        <EmptyState title="No pull requests found" description="Nothing matches this filter in this repository." />
      ) : (
        <div className="surface-card divide-y divide-border">
          {rows.map((p) => {
            const a = latest.get(p.number);
            return (
              <div key={p.number} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">#{p.number} {p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.author ?? "unknown"} · {p.headBranch} → {p.baseBranch} · updated {timeAgo(p.updatedAt)}
                  </div>
                </div>
                <StatusPill status={p.state} />
                {a && <StatusPill status={a.status} />}
                <RiskBadge level={a?.risk_level} score={a?.risk_score} />
                {a && (
                  <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/analysis/$id", params: { id: a.id } })}>
                    View
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => analyze(p.number)}>
                  {busy === p.number ? "Starting…" : a ? "Re-analyze" : "Analyze"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
