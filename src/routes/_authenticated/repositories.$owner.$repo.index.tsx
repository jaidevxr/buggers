import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, ShieldCheck, Loader2, FolderTree } from "lucide-react";
import { getRepositoryOverview } from "@/lib/github.functions";
import { startRepositoryAnalysis, runAnalysis } from "@/lib/analysis.functions";
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
  const q = useQuery({ queryKey: ["repo", full], queryFn: () => getRepositoryOverview({ data: { repoFullName: full } }) });

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
            <h2 className="mb-3 font-semibold">Recent commits</h2>
            <div className="surface-card divide-y divide-border">
              {d.recentCommits.length === 0 && <p className="p-4 text-sm text-muted-foreground">No commits found.</p>}
              {d.recentCommits.map((c) => (
                <div key={c.sha} className="px-4 py-2.5 text-sm">
                  <div className="truncate">{c.message}</div>
                  <div className="text-xs text-muted-foreground"><code>{c.sha.slice(0, 7)}</code> · {c.author} · {timeAgo(c.date)}</div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Contributors</h2>
            <div className="surface-card flex flex-wrap gap-2 p-4">
              {d.contributors.length === 0 && <p className="text-sm text-muted-foreground">Insufficient data.</p>}
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
