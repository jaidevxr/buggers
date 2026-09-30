import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getGitHubConnection, listRepositories } from "@/lib/github.functions";
import { PageHeader, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/status/EmptyState";
import { ConnectGitHubCard } from "@/components/github/ConnectGitHubCard";
import { PullList } from "@/components/github/PullList";

export const Route = createFileRoute("/_authenticated/pull-requests")({
  head: () => ({ meta: [{ title: "Pull requests — Buggers" }] }),
  component: PullRequests,
});

function PullRequests() {
  const conn = useQuery({ queryKey: ["github-connection"], queryFn: () => getGitHubConnection() });
  const repos = useQuery({ queryKey: ["repositories"], queryFn: () => listRepositories(), enabled: Boolean(conn.data?.connected) });
  const [repo, setRepo] = useState("");
  const selected = repo || repos.data?.repositories[0]?.fullName || "";

  if (conn.isLoading) return <LoadingState />;
  if (!conn.data?.connected) return (<div><PageHeader title="Pull requests" /><ConnectGitHubCard reconnect={conn.data?.reconnectRequired} /></div>);

  return (
    <div>
      <PageHeader
        title="Pull requests"
        description="Select a repository, then analyze any pull request."
        actions={
          repos.data && repos.data.repositories.length > 0 ? (
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={selected}
              onChange={(e) => setRepo(e.target.value)}
              aria-label="Repository"
            >
              {repos.data.repositories.map((r) => <option key={r.id} value={r.fullName}>{r.fullName}</option>)}
            </select>
          ) : null
        }
      />
      {repos.isLoading ? <LoadingState /> : repos.error ? <ErrorState message={errMsg(repos.error)} /> : !selected ? (
        <EmptyState title="No repositories available" description="Your GitHub account has no accessible repositories." />
      ) : (
        <PullList key={selected} repoFullName={selected} />
      )}
    </div>
  );
}
