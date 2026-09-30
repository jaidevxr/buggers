import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CONNECTOR_ID = "github";
const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

export type ConnectionState = {
  connected: boolean;
  reconnectRequired?: boolean;
  login?: string;
  name?: string | null;
  avatarUrl?: string;
  profileUrl?: string;
  connectedAt?: string;
  error?: string;
};

function toClientError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (message.includes("rate limit")) return "GitHub API rate limit reached. Please try again later.";
  if (message.includes("not connected")) return "GitHub is not connected.";
  if (message.includes("Reconnect")) return "GitHub authorization expired. Reconnect your account.";
  return message;
}

export const startGitHubConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { authorizeAppUserOAuth } = await import("@/integrations/lovable/appUserConnector");
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const { GITHUB_SCOPES } = await import("@/server/github.server");

    const clientApiKey = process.env["GITHUB_APP_USER_CONNECTOR_CLIENT_API_KEY"];
    if (!clientApiKey) throw new Error("GitHub connection is not configured for this app.");

    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const url = new URL(request.url);
    const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL(
      "/oauth/github/return",
      sandboxHost ? `https://${sandboxHost}` : url.origin,
    ).toString();

    const existing = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientApiKey,
      returnUrl,
      connectionAPIKey: existing ?? undefined,
      credentialsConfiguration: { scopes: GITHUB_SCOPES },
    });
    return { authorizationUrl };
  });

export const completeGitHubConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data, context }) => {
    const { exchangeAppUserOAuthCode } = await import("@/integrations/lovable/appUserConnector");
    const { saveConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
      GATEWAY_BASE_URL,
      data.code,
    );
    if (connectorId !== CONNECTOR_ID) throw new Error("OAuth completion returned the wrong connector");
    await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);
    return { ok: true };
  });

export const disconnectGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
    const { getConnectionKeyForUser, deleteConnectionForUser } = await import(
      "@/server/appUserConnections.server"
    );
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (key) {
      try {
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey: key,
          connectorId: CONNECTOR_ID,
        });
      } catch (e) {
        console.error("GitHub disconnect failed at gateway:", e);
      }
    }
    await deleteConnectionForUser(context.userId, CONNECTOR_ID);
    return { ok: true };
  });

export const getGitHubConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConnectionState> => {
    const { getConnectionRow } = await import("@/server/appUserConnections.server");
    const row = await getConnectionRow(context.userId, CONNECTOR_ID);
    if (!row) return { connected: false };

    const { githubJson } = await import("@/server/github.server");
    try {
      const user = await githubJson<{
        login: string;
        name: string | null;
        avatar_url: string;
        html_url: string;
      }>(context.userId, "/user");
      return {
        connected: true,
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        profileUrl: user.html_url,
        connectedAt: row.updated_at,
      };
    } catch (e) {
      const message = toClientError(e);
      if (message.includes("Reconnect")) return { connected: false, reconnectRequired: true };
      return { connected: false, error: message };
    }
  });

export type RepoSummary = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  pushedAt: string;
  htmlUrl: string;
};

export const listRepositories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { githubJson } = await import("@/server/github.server");
    const repos = await githubJson<
      Array<{
        id: number;
        name: string;
        full_name: string;
        private: boolean;
        description: string | null;
        language: string | null;
        stargazers_count: number;
        forks_count: number;
        open_issues_count: number;
        default_branch: string;
        pushed_at: string;
        html_url: string;
        owner: { login: string };
      }>
    >(context.userId, "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member");

    const mapped: RepoSummary[] = repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      private: r.private,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      openIssues: r.open_issues_count,
      defaultBranch: r.default_branch,
      pushedAt: r.pushed_at,
      htmlUrl: r.html_url,
    }));
    return { repositories: mapped };
  });

export type PullSummary = {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  author: string | null;
  authorAvatar: string | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  headBranch: string;
  baseBranch: string;
  headSha: string;
};

export const listPullRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { repoFullName: string; state?: "open" | "closed" | "all" }) => input)
  .handler(async ({ data, context }) => {
    const { githubJson } = await import("@/server/github.server");
    const state = data.state ?? "all";
    const pulls = await githubJson<
      Array<{
        number: number;
        title: string;
        state: string;
        draft: boolean;
        merged_at: string | null;
        created_at: string;
        updated_at: string;
        html_url: string;
        user: { login: string; avatar_url: string } | null;
        head: { ref: string; sha: string };
        base: { ref: string };
      }>
    >(context.userId, `/repos/${data.repoFullName}/pulls?state=${state}&per_page=50&sort=updated&direction=desc`);

    const mapped: PullSummary[] = pulls.map((p) => ({
      number: p.number,
      title: p.title,
      state: p.merged_at ? "merged" : p.state,
      draft: p.draft,
      author: p.user?.login ?? null,
      authorAvatar: p.user?.avatar_url ?? null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      htmlUrl: p.html_url,
      headBranch: p.head.ref,
      baseBranch: p.base.ref,
      headSha: p.head.sha,
    }));
    return { pullRequests: mapped };
  });

export const getRepositoryOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { repoFullName: string }) => input)
  .handler(async ({ data, context }) => {
    const { githubJson } = await import("@/server/github.server");
    const [repo, pulls, commits, contributors] = await Promise.all([
      githubJson<{
        name: string;
        full_name: string;
        description: string | null;
        language: string | null;
        stargazers_count: number;
        forks_count: number;
        default_branch: string;
        pushed_at: string;
        html_url: string;
        private: boolean;
      }>(context.userId, `/repos/${data.repoFullName}`),
      githubJson<
        Array<{
          number: number;
          title: string;
          state: string;
          updated_at: string;
          user: { login: string } | null;
          head: { ref: string; sha: string };
          base: { ref: string };
        }>
      >(context.userId, `/repos/${data.repoFullName}/pulls?state=open&per_page=20&sort=updated&direction=desc`),
      githubJson<
        Array<{ sha: string; commit: { message: string; author: { name: string; date: string } | null } }>
      >(context.userId, `/repos/${data.repoFullName}/commits?per_page=10`),
      githubJson<Array<{ login: string; avatar_url: string; contributions: number }>>(
        context.userId,
        `/repos/${data.repoFullName}/contributors?per_page=10`,
      ).catch(() => []),
    ]);

    return {
      repo: {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        defaultBranch: repo.default_branch,
        pushedAt: repo.pushed_at,
        htmlUrl: repo.html_url,
        private: repo.private,
      },
      openPullRequests: pulls.map((p) => ({
        number: p.number,
        title: p.title,
        state: p.state,
        updatedAt: p.updated_at,
        author: p.user?.login ?? null,
        headBranch: p.head.ref,
        baseBranch: p.base.ref,
        headSha: p.head.sha,
      })),
      recentCommits: commits.map((c) => ({
        sha: c.sha,
        message: c.commit.message.split("\n")[0],
        author: c.commit.author?.name ?? null,
        date: c.commit.author?.date ?? null,
      })),
      contributors,
    };
  });

export const getPullRequestDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { repoFullName: string; prNumber: number }) => input)
  .handler(async ({ data, context }) => {
    const { githubJson } = await import("@/server/github.server");
    const [pr, files, commits] = await Promise.all([
      githubJson<{
        number: number;
        title: string;
        body: string | null;
        state: string;
        merged_at: string | null;
        created_at: string;
        updated_at: string;
        html_url: string;
        additions: number;
        deletions: number;
        changed_files: number;
        user: { login: string; avatar_url: string } | null;
        head: { ref: string; sha: string };
        base: { ref: string };
      }>(context.userId, `/repos/${data.repoFullName}/pulls/${data.prNumber}`),
      githubJson<
        Array<{
          filename: string;
          status: string;
          additions: number;
          deletions: number;
          changes: number;
          patch?: string;
        }>
      >(context.userId, `/repos/${data.repoFullName}/pulls/${data.prNumber}/files?per_page=100`),
      githubJson<
        Array<{ sha: string; commit: { message: string; author: { name: string; date: string } | null } }>
      >(context.userId, `/repos/${data.repoFullName}/pulls/${data.prNumber}/commits?per_page=100`),
    ]);

    return {
      pullRequest: {
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.merged_at ? "merged" : pr.state,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        htmlUrl: pr.html_url,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        author: pr.user?.login ?? null,
        authorAvatar: pr.user?.avatar_url ?? null,
        headBranch: pr.head.ref,
        headSha: pr.head.sha,
        baseBranch: pr.base.ref,
      },
      files,
      commits: commits.map((c) => ({
        sha: c.sha,
        message: c.commit.message.split("\n")[0],
        author: c.commit.author?.name ?? null,
        date: c.commit.author?.date ?? null,
      })),
    };
  });
