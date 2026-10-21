import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getGitHubConnection, listRepositories } from "@/lib/github.functions";
import { startRepositoryAnalysis, runAnalysis, listAnalyses } from "@/lib/analysis.functions";
import { PageHeader, errMsg } from "@/components/layout/PageHeader";
import { PullRequestsSkeleton } from "@/components/LoadingSkeletons";
import { EmptyState, ErrorState } from "@/components/status/EmptyState";
import { ConnectGitHubCard } from "@/components/github/ConnectGitHubCard";
import { Button } from "@/components/ui/button";
import {
  Code2,
  FolderGit2,
  GitBranch,
  Play,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Terminal,
  RefreshCw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/codespaces")({
  head: () => ({ meta: [{ title: "Codespaces & Codebases – Buggers" }] }),
  component: CodespacesPage,
});

function CodespacesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const conn = useQuery({ queryKey: ["github-connection"], queryFn: () => getGitHubConnection() });
  const repos = useQuery({
    queryKey: ["repositories"],
    queryFn: () => listRepositories(),
    enabled: Boolean(conn.data?.connected),
  });

  const [mode, setMode] = useState<"individual" | "all">("individual");
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scanningRepo, setScanningRepo] = useState<string | null>(null);
  const [batchScanning, setBatchScanning] = useState(false);

  // Default to first repo if available
  const activeRepo = selectedRepo || repos.data?.repositories[0]?.fullName || "";

  // Query analyses for the active repo or for all repos
  const analysesQuery = useQuery({
    queryKey: ["analyses", mode === "individual" ? activeRepo : "all"],
    queryFn: () =>
      mode === "individual" && activeRepo
        ? listAnalyses({ data: { repoFullName: activeRepo } })
        : listAnalyses(),
    enabled: Boolean(conn.data?.connected),
  });

  const analysesList = analysesQuery.data?.analyses ?? [];

  // Map of repoFullName -> latest analysis
  const latestAnalysisByRepo = useMemo(() => {
    const map = new Map<string, any>();
    for (const a of analysesList) {
      if (!map.has(a.repo_full_name)) {
        map.set(a.repo_full_name, a);
      }
    }
    return map;
  }, [analysesList]);

  const filteredRepos = useMemo(() => {
    if (!repos.data?.repositories) return [];
    if (!searchQuery.trim()) return repos.data.repositories;
    const q = searchQuery.toLowerCase().trim();
    return repos.data.repositories.filter(
      (r) => r.fullName.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)),
    );
  }, [repos.data?.repositories, searchQuery]);

  const selectedRepoData = useMemo(() => {
    return repos.data?.repositories.find((r) => r.fullName === activeRepo);
  }, [repos.data?.repositories, activeRepo]);

  const handleScanCodebase = async (repoFullName: string, defaultBranch?: string) => {
    setScanningRepo(repoFullName);
    try {
      const res = await startRepositoryAnalysis({
        data: {
          repoFullName,
          branch: defaultBranch || "main",
        },
      });
      if (!res.alreadyRunning) {
        void runAnalysis({ data: { analysisId: res.analysisId } }).catch(() => {});
      }
      toast.success(`Analysis initiated for ${repoFullName}`);
      navigate({ to: "/analysis/$id", params: { id: res.analysisId } });
    } catch (e) {
      toast.error(errMsg(e));
      setScanningRepo(null);
    }
  };

  const handleBatchScanAll = async () => {
    if (!repos.data?.repositories.length) return;
    setBatchScanning(true);
    let queued = 0;
    try {
      for (const r of repos.data.repositories) {
        try {
          const res = await startRepositoryAnalysis({
            data: {
              repoFullName: r.fullName,
              branch: r.defaultBranch || "main",
            },
          });
          if (!res.alreadyRunning) {
            void runAnalysis({ data: { analysisId: res.analysisId } }).catch(() => {});
          }
          queued++;
        } catch {
          // continue with remaining repos
        }
      }
      toast.success(`Queued full codebase analyses across ${queued} repositories!`);
      await analysesQuery.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBatchScanning(false);
    }
  };

  if (conn.isLoading) return <PullRequestsSkeleton />;
  if (!conn.data?.connected) {
    return (
      <div className="page-view">
        <PageHeader title="Codespaces & Codebases" />
        <ConnectGitHubCard reconnect={conn.data?.reconnectRequired} />
      </div>
    );
  }

  return (
    <div className="page-view space-y-6">
      <PageHeader
        title="Codespaces & Codebases"
        description="Inspect, explore, and analyze codebases individually or across all connected repositories."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setMode("individual")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  mode === "individual"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Individual Codespace
              </button>
              <button
                type="button"
                onClick={() => setMode("all")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  mode === "all"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All Codebases ({repos.data?.repositories.length ?? 0})
              </button>
            </div>

            {mode === "individual" && repos.data && repos.data.repositories.length > 0 && (
              <select
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
                value={activeRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                aria-label="Select Codespace Repository"
              >
                {repos.data.repositories.map((r) => (
                  <option key={r.id} value={r.fullName}>
                    {r.fullName}
                  </option>
                ))}
              </select>
            )}

            {mode === "all" && (
              <Button
                size="sm"
                variant="default"
                disabled={batchScanning || !repos.data?.repositories.length}
                onClick={handleBatchScanAll}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                {batchScanning ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Batch Scanning...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Scan All Codebases
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />

      {repos.isLoading ? (
        <PullRequestsSkeleton />
      ) : repos.error ? (
        <ErrorState message={errMsg(repos.error)} onRetry={() => repos.refetch()} />
      ) : !activeRepo && mode === "individual" ? (
        <EmptyState
          title="No repositories found"
          description="Your GitHub account has no accessible repositories."
        />
      ) : mode === "individual" ? (
        /* INDIVIDUAL CODESPACE VIEW */
        <div className="space-y-6">
          {/* Active Repo Details Banner */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">{activeRepo}</h3>
                  <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                    {selectedRepoData?.private ? "Private" : "Public"}
                  </span>
                  {selectedRepoData?.language && (
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {selectedRepoData.language}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedRepoData?.description || "No description provided."}
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <GitBranch className="h-3.5 w-3.5 text-primary" />
                    {selectedRepoData?.defaultBranch || "main"}
                  </span>
                  <span>•</span>
                  <span>{selectedRepoData?.stars ?? 0} stars</span>
                  <span>•</span>
                  <span>Updated {selectedRepoData?.pushedAt ? new Date(selectedRepoData.pushedAt).toLocaleDateString() : "recently"}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <Link
                    to="/repositories/$owner/$repo/explorer"
                    params={{
                      owner: activeRepo.split("/")[0] || "",
                      repo: activeRepo.split("/")[1] || "",
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Explore Files
                  </Link>
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  disabled={scanningRepo === activeRepo}
                  onClick={() => handleScanCodebase(activeRepo, selectedRepoData?.defaultBranch)}
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  {scanningRepo === activeRepo ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Scan Codebase
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  asChild
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <a
                    href={`https://github.com/codespaces/new?repo=${encodeURIComponent(activeRepo)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    GitHub Codespace
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Scans and Analysis History for this Codebase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Codebase & Commit Analyses ({analysesList.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => analysesQuery.refetch()}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>

            {analysesQuery.isLoading ? (
              <div className="rounded-lg border border-border p-8 text-center text-xs text-muted-foreground animate-pulse">
                Loading codebase analyses...
              </div>
            ) : !analysesList.length ? (
              <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
                <Code2 className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                <h5 className="text-sm font-medium text-foreground">No analyses recorded yet</h5>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Run a whole-repository scan or analyze recent commits to generate in-depth security and quality reports.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScanCodebase(activeRepo, selectedRepoData?.defaultBranch)}
                  className="mt-4 text-xs"
                >
                  Start First Scan
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="divide-y divide-border">
                  {analysesList.map((a: any) => {
                    const isCompleted = a.status === "completed";
                    const isProcessing = a.status === "processing" || a.status === "queued";
                    const isFailed = a.status === "failed";
                    const score = typeof a.risk_score === "number" ? Math.max(0, 100 - a.risk_score) : null;

                    return (
                      <div
                        key={a.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {a.pr_title || "Repository Scan"}
                            </span>
                            {a.head_sha && (
                              <span className="font-mono text-[11px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                                {a.head_sha.slice(0, 7)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Branch: <code className="font-mono">{a.base_branch || "main"}</code></span>
                            <span>•</span>
                            <span>{new Date(a.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {isCompleted && score !== null && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                score >= 80
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : score >= 60
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
                              )}
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Score {score}
                            </span>
                          )}
                          {isProcessing && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Analyzing
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3" />
                              Failed
                            </span>
                          )}

                          <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                            <Link to="/analysis/$id" params={{ id: a.id }}>
                              View Report
                            </Link>
                          </Button>
                          {a.head_sha && (
                            <Button size="sm" variant="ghost" asChild className="h-7 text-xs text-muted-foreground hover:text-foreground">
                              <Link
                                to="/repositories/$owner/$repo/explorer"
                                params={{
                                  owner: activeRepo.split("/")[0] || "",
                                  repo: activeRepo.split("/")[1] || "",
                                }}
                                search={{ ref: a.head_sha }}
                              >
                                Explorer
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ALL CODEBASES VIEW */
        <div className="space-y-6">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">Connected Repositories</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{repos.data?.repositories.length ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">Scanned Codebases</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{latestAnalysisByRepo.size}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">Unscanned Repositories</span>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {Math.max(0, (repos.data?.repositories.length ?? 0) - latestAnalysisByRepo.size)}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search codebases by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Grid of All Repositories */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRepos.map((r) => {
              const latest = latestAnalysisByRepo.get(r.fullName);
              const score = latest && typeof latest.risk_score === "number" ? Math.max(0, 100 - latest.risk_score) : null;
              const isScanning = scanningRepo === r.fullName;

              return (
                <div
                  key={r.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:border-border/80 hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to="/repositories/$owner/$repo"
                          params={{ owner: r.owner, repo: r.name }}
                          className="font-semibold text-sm text-foreground hover:underline truncate block"
                        >
                          {r.fullName}
                        </Link>
                        <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                          <GitBranch className="h-3 w-3 text-primary" />
                          {r.defaultBranch || "main"}
                        </span>
                      </div>
                      <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase shrink-0">
                        {r.private ? "Private" : "Public"}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {r.description || "No repository description."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div>
                      {score !== null ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            score >= 80
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : score >= 60
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
                          )}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Score {score}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Not scanned</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="ghost" asChild className="h-7 px-2 text-xs">
                        <Link to="/repositories/$owner/$repo/explorer" params={{ owner: r.owner, repo: r.name }}>
                          <Eye className="h-3 w-3 mr-1" />
                          Explore
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isScanning}
                        onClick={() => handleScanCodebase(r.fullName, r.defaultBranch)}
                        className="h-7 px-2 text-xs"
                      >
                        {isScanning ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current mr-1" />
                            Scan
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" asChild className="h-7 px-1.5 text-xs text-muted-foreground" title="Open in GitHub Codespaces">
                        <a
                          href={`https://github.com/codespaces/new?repo=${encodeURIComponent(r.fullName)}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          <Terminal className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cloud Codespaces & VS Code Extension Spotlight */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Developer Cloud Environments & VS Code</h4>
            <p className="text-xs text-muted-foreground">
              Run continuous AST security and quality scans in real-time as you code inside GitHub Codespaces or your local VS Code workspace.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" asChild className="text-xs shrink-0">
          <Link to="/docs">
            Read Integration Docs
          </Link>
        </Button>
      </div>
    </div>
  );
}
