import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { getDashboardSummary } from "@/lib/analysis.functions";
import { getGitHubConnection } from "@/lib/github.functions";
import { PageHeader, StatCard, timeAgo, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/status/EmptyState";
import { RiskBadge, StatusPill } from "@/components/status/StatusBadges";
import { ConnectGitHubButton } from "@/components/github/ConnectGitHubCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Overview — Buggers" }] }),
  component: Dashboard,
});

function Dashboard() {
  const conn = useQuery({ queryKey: ["github-connection"], queryFn: () => getGitHubConnection() });
  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: () => getDashboardSummary() });
  const connected = Boolean(conn.data?.connected);
  const hasAnalyses = (summary.data?.counts.analyses ?? 0) > 0;

  return (
    <div>
      <PageHeader title="Welcome to Buggers 👋" description="Your code review and bug triage overview." />

      {(!connected || !hasAnalyses) && (
        <div className="surface-card mb-6 p-5">
          <h2 className="mb-3 font-semibold">Get started</h2>
          <ol className="space-y-2 text-sm">
            <Step done={connected} label="Connect GitHub">
              {!connected && !conn.isLoading && <ConnectGitHubButton />}
            </Step>
            <Step done={hasAnalyses} label="Pick a repository and pull request">
              {connected && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/repositories">Browse repositories</Link>
                </Button>
              )}
            </Step>
            <Step done={hasAnalyses} label="Run your first analysis" />
          </ol>
        </div>
      )}

      {summary.isLoading ? (
        <LoadingState />
      ) : summary.error ? (
        <ErrorState message={errMsg(summary.error)} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Analyses" value={summary.data!.counts.analyses} />
            <StatCard label="Repos analyzed" value={summary.data!.counts.repositoriesAnalyzed} />
            <StatCard label="High risk PRs" value={summary.data!.counts.highRisk} />
            <StatCard label="Open findings" value={summary.data!.counts.openFindings} />
            <StatCard label="Open tickets" value={summary.data!.counts.openTickets} />
          </div>
          <h2 className="mb-3 font-semibold">Recent analyses</h2>
          {summary.data!.analyses.length === 0 ? (
            <EmptyState
              title="No pull requests have been analyzed yet"
              description="Open a pull request from one of your repositories and run an analysis."
            />
          ) : (
            <div className="surface-card divide-y divide-border">
              {summary.data!.analyses.map((a) => (
                <Link
                  key={a.id}
                  to="/analysis/$id"
                  params={{ id: a.id }}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      #{a.pr_number} {a.pr_title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.repo_full_name} · {timeAgo(a.created_at)}
                    </div>
                  </div>
                  <StatusPill status={a.status} />
                  <RiskBadge level={a.risk_level} score={a.risk_score} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Step({ done, label, children }: { done: boolean; label: string; children?: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3">
      {done ? <CheckCircle2 className="h-5 w-5 text-risk-low" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
      <span className={done ? "text-muted-foreground line-through" : "font-medium"}>{label}</span>
      {children}
    </li>
  );
}
