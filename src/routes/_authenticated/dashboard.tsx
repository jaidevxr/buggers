import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Circle,
  ExternalLink,
  FolderGit2,
  GitFork,
  GitPullRequest,
  KeyRound,
  Package,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getDashboardSummary } from "@/lib/analysis.functions";
import { getGitHubConnection, saveGitHubToken } from "@/lib/github.functions";
import { PageHeader, StatCard, timeAgo, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState } from "@/components/status/EmptyState";
import { DashboardSkeleton } from "@/components/LoadingSkeletons";
import { RiskBadge, StatusPill } from "@/components/status/StatusBadges";
import { ConnectGitHubButton } from "@/components/github/ConnectGitHubCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Overview – Buggers" }] }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const conn = useQuery({ queryKey: ["github-connection"], queryFn: () => getGitHubConnection() });
  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: () => getDashboardSummary() });
  const connected = Boolean(conn.data?.connected);
  const hasAnalyses = (summary.data?.counts.analyses ?? 0) > 0;

  useEffect(() => {
    if (conn.data && !conn.data.connected && !conn.isLoading) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (data.session?.provider_token) {
          try {
            await saveGitHubToken({ data: { token: data.session.provider_token } });
            await qc.invalidateQueries({ queryKey: ["github-connection"] });
          } catch {
            // Ignored if background token doesn't have necessary permissions
          }
        }
      });
    }
  }, [conn.data, conn.isLoading, qc]);

  const userGreeting = conn.data?.name || conn.data?.login;
  const title = userGreeting ? `Good day, ${userGreeting}!` : "Welcome to Buggers 👋";

  return (
    <div className="w-full page-view">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main Feed Column */}
        <div className="space-y-6 xl:col-span-2">
          <PageHeader
            title={title}
            description="Your security review, defect risk analysis, and automated bug triage overview."
            actions={
              connected ? (
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Link to="/repositories">
                      <FolderGit2 className="h-3.5 w-3.5" />
                      Browse repos
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="gap-1.5 text-xs">
                    <Link to="/pull-requests">
                      <GitPullRequest className="h-3.5 w-3.5" />
                      Pull requests
                    </Link>
                  </Button>
                </div>
              ) : undefined
            }
          />

          {(!connected || !hasAnalyses) && (
            <div className="surface-card p-5">
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

              {/* Sample Vulnerable Repository Fork Option */}
              <div className="mt-4 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3.5 rounded-lg border border-border/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <GitFork className="h-3.5 w-3.5 text-primary" />
                    <span>Don&apos;t have a repository with pull requests ready?</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fork our sample app (<code className="text-foreground font-mono text-[11px]">jaidevxr/buggers-test-vulnerable-app</code>) to test live SQL injection, timing attack, and credential leak detections.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="gap-1.5 shrink-0 text-xs">
                  <a
                    href="https://github.com/jaidevxr/buggers-test-vulnerable-app/fork"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitFork className="h-3.5 w-3.5" />
                    <span>Fork Sample App</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {summary.isLoading ? (
            <DashboardSkeleton />
          ) : summary.error ? (
            <ErrorState message={errMsg(summary.error)} onRetry={() => summary.refetch()} />
          ) : (
            <div className="content-fade-in space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Analyses" value={summary.data!.counts.analyses} />
                <StatCard label="Repos analyzed" value={summary.data!.counts.repositoriesAnalyzed} />
                <StatCard label="High risk PRs" value={summary.data!.counts.highRisk} />
                <StatCard label="Open findings" value={summary.data!.counts.openFindings} />
                <StatCard label="Open tickets" value={summary.data!.counts.openTickets} />
              </div>

              {/* Security Analytics & Posture */}
              {summary.data?.analytics && (
                <div className="surface-card p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <h2 className="font-semibold text-sm">Security Posture &amp; Threat Analytics</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Remediation Rate:</span>
                      <span className="font-semibold text-xs text-emerald-400">
                        {summary.data.analytics.remediationRate}%
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Grade Box */}
                    <div className="flex items-center gap-3.5 rounded-xl border border-border bg-muted/20 p-3.5">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-xl ${
                          summary.data.analytics.securityGrade === "A"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : summary.data.analytics.securityGrade === "B"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : summary.data.analytics.securityGrade === "C"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-destructive/20 text-destructive border border-destructive/30"
                        }`}
                      >
                        {summary.data.analytics.securityGrade}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {summary.data.analytics.securityGradeLabel}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {summary.data.analytics.securityGrade === "A"
                            ? "0 critical vulnerabilities active"
                            : `${summary.data.analytics.severityBreakdown.critical} critical issues detected`}
                        </div>
                      </div>
                    </div>

                    {/* Severity Distribution */}
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5 sm:col-span-2">
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Open Vulnerabilities by Severity</span>
                        <span>{summary.data.counts.openFindings} total</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="rounded-lg bg-destructive/10 p-2 border border-destructive/20">
                          <div className="text-xs font-bold text-destructive">
                            {summary.data.analytics.severityBreakdown.critical}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Critical</div>
                        </div>
                        <div className="rounded-lg bg-amber-500/10 p-2 border border-amber-500/20">
                          <div className="text-xs font-bold text-amber-500">
                            {summary.data.analytics.severityBreakdown.high}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">High</div>
                        </div>
                        <div className="rounded-lg bg-blue-500/10 p-2 border border-blue-500/20">
                          <div className="text-xs font-bold text-blue-400">
                            {summary.data.analytics.severityBreakdown.medium}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Medium</div>
                        </div>
                        <div className="rounded-lg bg-muted p-2 border border-border">
                          <div className="text-xs font-bold text-muted-foreground">
                            {summary.data.analytics.severityBreakdown.low}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Low</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Pills */}
                  {Object.keys(summary.data.analytics.categoryBreakdown).length > 0 && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                      <span className="text-[11px] text-muted-foreground font-medium">Categories:</span>
                      {Object.entries(summary.data.analytics.categoryBreakdown).map(([cat, count]) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-foreground font-medium"
                        >
                          {cat === "dependency" ? (
                            <Package className="h-3 w-3 text-amber-400" />
                          ) : cat === "security" ? (
                            <ShieldAlert className="h-3 w-3 text-destructive" />
                          ) : (
                            <Bug className="h-3 w-3 text-primary" />
                          )}
                          <span className="capitalize">{cat}</span>
                          <span className="text-muted-foreground font-normal">({count})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-base">Recent analyses</h2>
                  <Link to="/pull-requests" className="text-xs text-muted-foreground hover:text-foreground">
                    View all &rarr;
                  </Link>
                </div>
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
                        className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-all duration-150 ease-out active:scale-[0.998]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            #{a.pr_number} {a.pr_title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.repo_full_name} · {timeAgo(a.created_at)}
                          </div>
                        </div>
                        <RiskBadge
                          level={a.status === "completed" ? a.risk_level : null}
                          score={a.status === "completed" ? a.risk_score : null}
                          status={a.status !== "completed" ? a.status : null}
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* GitHub Account Card */}
          {connected && conn.data && (
            <div className="surface-card p-5">
              <div className="flex items-center gap-3">
                {conn.data.avatarUrl ? (
                  <img
                    src={conn.data.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full border border-border"
                  />
                ) : (
                  <span className="h-10 w-10 rounded-full bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-sm">
                    {conn.data.name || conn.data.login}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    @{conn.data.login}
                  </div>
                </div>
                {conn.data.profileUrl && (
                  <a
                    href={conn.data.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="View on GitHub"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>GitHub authorization</span>
                  <span className="font-medium text-risk-low flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-risk-low" /> Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Navigation Card */}
          <div className="surface-card p-5">
            <h3 className="mb-3 font-semibold text-sm">Quick navigation</h3>
            <div className="space-y-2">
              <Link
                to="/repositories"
                className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs font-medium hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-primary" />
                  <span>Your repositories</span>
                </div>
                <span className="text-muted-foreground">&rarr;</span>
              </Link>
              <Link
                to="/findings"
                className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs font-medium hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span>Security findings</span>
                </div>
                <span className="text-muted-foreground">&rarr;</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs font-medium hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-400" />
                  <span>Review & theme preferences</span>
                </div>
                <span className="text-muted-foreground">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Security Features Info Box */}
          <div className="surface-card p-5 text-sm">
            <h3 className="mb-2 font-semibold text-sm">Security intelligence</h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="border-l-2 border-primary pl-2.5">
                <p className="font-medium text-foreground">Whole-Repo Architectural Context</p>
                <p className="mt-0.5">Manifests and directory structures are collected so fixes never invent uninstalled libraries.</p>
              </div>
              <div className="border-l-2 border-risk-low pl-2.5">
                <p className="font-medium text-foreground">1-Click Direct GitHub Commits</p>
                <p className="mt-0.5">Accept suggested fixes to commit directly to the pull request branch on GitHub.</p>
              </div>
              <div className="border-l-2 border-amber-500 pl-2.5">
                <p className="font-medium text-foreground">Automatic Drift Tracking</p>
                <p className="mt-0.5">New commits pushed to GitHub branches are automatically detected with 1-click re-analysis.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
