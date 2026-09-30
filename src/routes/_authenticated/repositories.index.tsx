import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GitFork, Lock, Star } from "lucide-react";
import { getGitHubConnection, listRepositories } from "@/lib/github.functions";
import { listAnalyses } from "@/lib/analysis.functions";
import { PageHeader, timeAgo, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/status/EmptyState";
import { RiskBadge } from "@/components/status/StatusBadges";
import { ConnectGitHubCard } from "@/components/github/ConnectGitHubCard";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/repositories/")({
  head: () => ({ meta: [{ title: "Repositories — Buggers" }] }),
  component: Repositories,
});

const PAGE = 12;

function Repositories() {
  const conn = useQuery({ queryKey: ["github-connection"], queryFn: () => getGitHubConnection() });
  const repos = useQuery({
    queryKey: ["repositories"],
    queryFn: () => listRepositories(),
    enabled: Boolean(conn.data?.connected),
  });
  const analyses = useQuery({ queryKey: ["analyses"], queryFn: () => listAnalyses({ data: {} }) });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"pushed" | "name" | "stars">("pushed");
  const [page, setPage] = useState(0);

  const latestByRepo = useMemo(() => {
    const m = new Map<string, { risk_level: string | null; risk_score: number | null; created_at: string }>();
    for (const a of analyses.data?.analyses ?? []) if (!m.has(a.repo_full_name)) m.set(a.repo_full_name, a);
    return m;
  }, [analyses.data]);

  const filtered = useMemo(() => {
    const list = (repos.data?.repositories ?? []).filter(
      (r) => r.fullName.toLowerCase().includes(q.toLowerCase()) || (r.language ?? "").toLowerCase().includes(q.toLowerCase()),
    );
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "stars") list.sort((a, b) => b.stars - a.stars);
    return list;
  }, [repos.data, q, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  if (conn.isLoading) return <LoadingState />;
  if (!conn.data?.connected)
    return (
      <div>
        <PageHeader title="Repositories" />
        <ConnectGitHubCard reconnect={conn.data?.reconnectRequired} />
      </div>
    );

  return (
    <div>
      <PageHeader title="Repositories" description={`Signed in to GitHub as ${conn.data.login}`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search by name or language…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="max-w-sm"
          aria-label="Search repositories"
        />
        <select
          className="rounded-md border border-input bg-background px-3 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          aria-label="Sort repositories"
        >
          <option value="pushed">Recently active</option>
          <option value="name">Name</option>
          <option value="stars">Stars</option>
        </select>
      </div>
      {repos.isLoading ? (
        <LoadingState label="Loading repositories from GitHub…" />
      ) : repos.error ? (
        <ErrorState message={errMsg(repos.error)} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No repositories available" description="No GitHub repositories match your search." />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(page * PAGE, page * PAGE + PAGE).map((r) => {
              const last = latestByRepo.get(r.fullName);
              return (
                <Link
                  key={r.id}
                  to="/repositories/$owner/$repo"
                  params={{ owner: r.owner, repo: r.name }}
                  className="surface-card flex flex-col gap-2 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{r.fullName}</span>
                    {r.private && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                    {r.description ?? "No description"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {r.language && <span>{r.language}</span>}
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" />{r.stars}</span>
                    <span className="flex items-center gap-1"><GitFork className="h-3 w-3" />{r.forks}</span>
                    <span>Active {timeAgo(r.pushedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{last ? `Analyzed ${timeAgo(last.created_at)}` : "Never analyzed"}</span>
                    <RiskBadge level={last?.risk_level} />
                  </div>
                </Link>
              );
            })}
          </div>
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <button className="underline disabled:opacity-40" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page + 1} of {pages}</span>
              <button className="underline disabled:opacity-40" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
