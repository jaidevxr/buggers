import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ExternalLink, ShieldCheck, Loader2, FolderTree, Play, Sparkles } from "lucide-react";
import { getRepositoryOverview } from "@/lib/github.functions";
import { startRepositoryAnalysis, runAnalysis, listAnalyses } from "@/lib/analysis.functions";
import { PageHeader, StatCard, timeAgo, errMsg } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/LoadingSkeletons";
import { ErrorState } from "@/components/status/EmptyState";
import { PullList } from "@/components/github/PullList";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/repositories/$owner/$repo/")({
  head: ({ params }) => ({ meta: [{ title: `${params.owner}/${params.repo} – Buggers` }] }),
  component: RepoOverview,
});

function RepoOverview() {
  const { owner, repo } = Route.useParams();
  const full = `${owner}/${repo}`;
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [analyzingSha, setAnalyzingSha] = useState<string | null>(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);

  const q = useQuery({
    queryKey: ["repo", full],
    queryFn: () => getRepositoryOverview({ data: { repoFullName: full } }),
  });

  const analysesQuery = useQuery({
    queryKey: ["repoAnalyses", full],
    queryFn: () => listAnalyses({ data: { repoFullName: full } }),
  });

  const commitAnalysisMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const a of analysesQuery.data?.analyses || []) {
      if (a.head_sha) {
        map.set(a.head_sha, a);
      }
    }
    return map;
  }, [analysesQuery.data]);

  const handleScanCodebase = async () => {
    setScanning(true);
    try {
      const res = await startRepositoryAnalysis({
        data: { repoFullName: full, branch: q.data?.repo?.defaultBranch },
      });
      if (!res.alreadyRunning) {
        void runAnalysis({ data: { analysisId: res.analysisId } }).catch(() => {});
      }
      toast.success("Repository analysis initiated!");
      navigate({ to: "/analysis/$id", params: { id: res.analysisId } });
    } catch (e) {
      toast.error(errMsg(e));
      setScanning(false);
    }
  };

  const handleAnalyzeCommit = async (sha: string, message: string) => {
    setAnalyzingSha(sha);
    try {
      const res = await startRepositoryAnalysis({
        data: {
          repoFullName: full,
          commitSha: sha,
          commitMessage: message,
        },
      });
      if (!res.alreadyRunning) {
        void runAnalysis({ data: { analysisId: res.analysisId } }).catch(() => {});
      }
      toast.success(`Analysis started for commit ${sha.slice(0, 7)}`);
      navigate({ to: "/analysis/$id", params: { id: res.analysisId } });
    } catch (e) {
      toast.error(errMsg(e));
      setAnalyzingSha(null);
    }
  };

  const handleAnalyzeAllRecent = async () => {
    if (!q.data?.recentCommits.length) return;
    setAnalyzingAll(true);
    let queued = 0;
    try {
      for (const c of q.data.recentCommits) {
        const existing = commitAnalysisMap.get(c.sha);
        if (!existing || existing.status === "failed") {
          const res = await startRepositoryAnalysis({
            data: {
              repoFullName: full,
              commitSha: c.sha,
              commitMessage: c.message,
            },
          });
          if (!res.alreadyRunning) {
            void runAnalysis({ data: { analysisId: res.analysisId } }).catch(() => {});
          }
          queued++;
        }
      }
      toast.success(`Queued ${queued} commit analyses!`);
      await analysesQuery.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setAnalyzingAll(false);
    }
  };

  if (q.isLoading) return <PageSkeleton />;
  if (q.error)
    return (
      <ErrorState
        message={errMsg(q.error)}
        onRetry={() => q.refetch()}
        action={<Link to="/repositories" className="text-sm underline">Back to repositories</Link>}
      />
    );
  const d = q.data!;
  return (
    <div className="page-view content-fade-in">
      <PageHeader
        backTo="/repositories"
        backLabel="Repositories"
        title={d.repo.fullName}
        description={d.repo.description ?? "No description"}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleScanCodebase}
              disabled={scanning}
              className="gap-1.5 text-xs bg-primary transition-all duration-200 active:scale-95"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Scanning Codebase…</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Scan Entire Codebase</span>
                </>
              )}
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs transition-all duration-200 active:scale-95"
            >
              <Link to="/repositories/$owner/$repo/explorer" params={{ owner, repo }}>
                <FolderTree className="h-3.5 w-3.5 text-primary" />
                <span>Explore Code</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="transition-all duration-200 active:scale-95">
              <a href={d.repo.htmlUrl} target="_blank" rel="noreferrer">GitHub <ExternalLink className="ml-1 h-3 w-3" /></a>
            </Button>
          </div>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Language" value={d.repo.language ?? "—"} />
        <StatCard label="Stars" value={d.repo.stars} />
        <StatCard label="Default branch" value={<span className="text-base">{d.repo.defaultBranch}</span>} />
        <StatCard label="Last push" value={<span className="text-base">{timeAgo(d.repo.pushedAt)}</span>} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-semibold">Pull requests</h2>
          <PullList repoFullName={full} />
        </div>
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <span>Recent commits</span>
                <span className="text-xs text-muted-foreground font-normal">({d.recentCommits.length})</span>
              </h2>
              {d.recentCommits.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnalyzeAllRecent}
                  disabled={analyzingAll}
                  className="h-7 text-xs gap-1.5"
                >
                  {analyzingAll ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="h-3 w-3 text-primary" />
                  )}
                  <span>Auto-analyze recent</span>
                </Button>
              )}
            </div>
            <div className="surface-card divide-y divide-border rounded-lg border border-border overflow-hidden">
              {d.recentCommits.length === 0 && <p className="p-4 text-sm text-muted-foreground">No commits found.</p>}
              {d.recentCommits.map((c) => {
                const analysis = commitAnalysisMap.get(c.sha);
                const isAnalyzing = analyzingSha === c.sha || analysis?.status === "processing" || analysis?.status === "queued";
                return (
                  <div key={c.sha} className="p-3 text-sm hover:bg-muted/40 transition-colors group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {c.message}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground/80">
                            {c.sha.slice(0, 7)}
                          </code>
                          <span>·</span>
                          <span className="truncate max-w-[120px]">{c.author || "Unknown"}</span>
                          <span>·</span>
                          <span>{timeAgo(c.date)}</span>
                          {analysis && (
                            <>
                              <span>·</span>
                              <Link
                                to="/analysis/$id"
                                params={{ id: analysis.id }}
                                className="inline-flex items-center gap-1 font-medium hover:underline text-xs"
                              >
                                {analysis.status === "completed" ? (
                                  <span className={analysis.risk_level === "critical" || analysis.risk_level === "high" ? "text-destructive" : "text-emerald-500"}>
                                    ● {analysis.risk_score != null ? `Score ${analysis.risk_score}` : "Analyzed"}
                                  </span>
                                ) : analysis.status === "failed" ? (
                                  <span className="text-destructive">● Failed</span>
                                ) : (
                                  <span className="text-primary inline-flex items-center gap-1">
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Analyzing
                                  </span>
                                )}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                          title="Explore repository files at this commit"
                        >
                          <Link
                            to="/repositories/$owner/$repo/explorer"
                            params={{ owner, repo }}
                            search={{ ref: c.sha }}
                          >
                            <FolderTree className="h-3 w-3 text-primary" />
                            <span className="hidden sm:inline">Explore</span>
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant={analysis?.status === "completed" ? "ghost" : "default"}
                          disabled={isAnalyzing}
                          onClick={() => handleAnalyzeCommit(c.sha, c.message)}
                          className="h-7 px-2.5 text-xs gap-1"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Scanning...</span>
                            </>
                          ) : analysis?.status === "completed" ? (
                            <>
                              <Play className="h-3 w-3 text-muted-foreground" />
                              <span>Re-analyze</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              <span>Analyze</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Contributors</h2>
            <div className="surface-card flex flex-wrap gap-2 p-4">
              {d.contributors.length === 0 && <p className="p-4 text-sm text-muted-foreground">Insufficient data.</p>}
              {d.contributors.map((c) => (
                <span key={c.login} className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs">
                  <img src={c.avatar_url} alt="" className="h-4 w-4 rounded-full" />{c.login} · {c.contributions}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
