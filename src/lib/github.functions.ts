import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  startGitHubConnectSchema,
  completeGitHubConnectSchema,
  saveGitHubTokenSchema,
  listPullRequestsSchema,
  pullRequestDetailSchema,
  repositoryOverviewSchema,
  getRepositoryTreeSchema,
  getFileContentSchema,
  searchRepositoryFilesSchema,
} from "@/lib/validation";

const CONNECTOR_ID = "github";

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
  .inputValidator(startGitHubConnectSchema)
  .handler(async ({ data, context }) => {
    const { createOAuthState } = await import("@/server/connectionKeyCrypto");
    const { GITHUB_SCOPES, reloadEnv } = await import("@/server/github.server");

    reloadEnv();
    const clientId = process.env["GITHUB_CLIENT_ID"];
    if (!clientId) {
      throw new Error("GitHub connection is not configured for this app (missing GITHUB_CLIENT_ID).");
    }

    const request = getRequest();
    const configuredCallback = process.env["GITHUB_OAUTH_CALLBACK_URL"];

    let resolvedOrigin: string | undefined = undefined;
    if (data?.origin) {
      try {
        resolvedOrigin = new URL(data.origin).origin;
      } catch {
        // invalid URL string, skip
      }
    }

    if (!resolvedOrigin && request) {
      const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
      if (forwardedHost) {
        resolvedOrigin = `${forwardedProto}://${forwardedHost}`;
      } else {
        try {
          resolvedOrigin = new URL(request.url).origin;
        } catch {
          // fallback
        }
      }
    }

    const baseOrigin = resolvedOrigin || "https://buggers.dev";
    const returnUrl = configuredCallback || new URL("/oauth/github/return", baseOrigin).toString();

    const state = createOAuthState(context.userId);

    const authorizationUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(returnUrl)}&scope=${encodeURIComponent(
      GITHUB_SCOPES.join(" "),
    )}&state=${encodeURIComponent(state)}`;

    return { authorizationUrl, returnUrl };
  });

export const completeGitHubConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(completeGitHubConnectSchema)
  .handler(async ({ data, context }) => {
    const { verifyOAuthState } = await import("@/server/connectionKeyCrypto");
    const { exchangeGitHubOAuthCode } = await import("@/server/github.server");
    const { saveConnectionKeyForUser } = await import("@/server/appUserConnections.server");

    const isValidState = verifyOAuthState(data.state, context.userId);
    if (!isValidState) {
      throw new Error("Invalid or expired OAuth state token. Please try connecting again.");
    }

    const accessToken = await exchangeGitHubOAuthCode(data.code);
    await saveConnectionKeyForUser(context.userId, CONNECTOR_ID, accessToken);
    return { ok: true };
  });

export const saveGitHubToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(saveGitHubTokenSchema)
  .handler(async ({ data, context }) => {
    const { saveConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${data.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Buggers-App",
      },
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Invalid GitHub token (${res.status}): Please check token validity and scopes.`);
    }
    await saveConnectionKeyForUser(context.userId, CONNECTOR_ID, data.token);
    return { ok: true };
  });

export const disconnectGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser, deleteConnectionForUser } = await import(
      "@/server/appUserConnections.server"
    );
    const { revokeGitHubToken } = await import("@/server/github.server");

    const token = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (token) {
      await revokeGitHubToken(token);
    }
    await deleteConnectionForUser(context.userId, CONNECTOR_ID);
    return { ok: true };
  });

export const getGitHubConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConnectionState> => {
    const { getConnectionRow, markReconnectRequired } = await import("@/server/appUserConnections.server");
    const row = await getConnectionRow(context.userId, CONNECTOR_ID);
    if (!row) return { connected: false };
    if (row.reconnect_required) return { connected: false, reconnectRequired: true };

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
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("Reconnect") || message.includes("401") || message.includes("Bad credentials")) {
        await markReconnectRequired(context.userId, CONNECTOR_ID);
        return { connected: false, reconnectRequired: true };
      }
      return { connected: false, error: toClientError(e) };
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
  .inputValidator(listPullRequestsSchema)
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
  .inputValidator(repositoryOverviewSchema)
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
  .inputValidator(pullRequestDetailSchema)
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

export type RepositoryTreeItem = {
  path: string;
  type: "blob" | "tree";
  size?: number | undefined;
  sha: string;
};

export type RepositoryTreeResult = {
  branch: string;
  commitSha: string;
  tree: RepositoryTreeItem[];
  truncated: boolean;
  totalFiles: number;
  totalDirectories: number;
};

export const getRepositoryTree = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(getRepositoryTreeSchema)
  .handler(async ({ data, context }): Promise<RepositoryTreeResult> => {
    const { githubJson } = await import("@/server/github.server");

    let branch = data.branch;
    if (!branch) {
      const repo = await githubJson<{ default_branch: string }>(
        context.userId,
        `/repos/${data.repoFullName}`,
      );
      branch = repo.default_branch || "main";
    }

    const commitData = await githubJson<{ sha: string }>(
      context.userId,
      `/repos/${data.repoFullName}/commits/${encodeURIComponent(branch)}`,
    );
    const commitSha = commitData.sha;

    const treeRes = await githubJson<{
      sha: string;
      truncated: boolean;
      tree: Array<{ path: string; mode: string; type: "blob" | "tree"; sha: string; size?: number }>;
    }>(
      context.userId,
      `/repos/${data.repoFullName}/git/trees/${commitSha}?recursive=${data.recursive ? "1" : "0"}`,
    );

    const items: RepositoryTreeItem[] = (treeRes.tree || []).map((item) => ({
      path: item.path,
      type: item.type,
      size: item.size,
      sha: item.sha,
    }));

    const totalFiles = items.filter((i) => i.type === "blob").length;
    const totalDirectories = items.filter((i) => i.type === "tree").length;

    return {
      branch,
      commitSha,
      tree: items,
      truncated: Boolean(treeRes.truncated),
      totalFiles,
      totalDirectories,
    };
  });

export type FileContentResult = {
  path: string;
  content: string;
  size: number;
  lines: number;
  language: string;
  sha: string;
  isBinary: boolean;
};

export const getFileContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(getFileContentSchema)
  .handler(async ({ data, context }): Promise<FileContentResult> => {
    const { githubJson } = await import("@/server/github.server");
    const { detectLanguage } = await import("@/server/repoScanner.server");

    const cleanPath = data.path.replace(/^\/+/, "");
    const ext = cleanPath.split(".").pop()?.toLowerCase() ?? "";
    const isBinaryExt = new Set([
      "png", "jpg", "jpeg", "gif", "webp", "ico", "svg", "pdf", "zip", "tar", "gz", "tgz",
      "7z", "rar", "exe", "dll", "so", "dylib", "wasm", "ttf", "woff", "woff2", "eot",
      "mp3", "mp4", "mov", "avi", "webm", "bin", "iso", "pyc", "class", "jar", "o", "obj",
    ]).has(ext);

    if (isBinaryExt) {
      return {
        path: cleanPath,
        content: "[Binary file preview not supported]",
        size: 0,
        lines: 0,
        language: detectLanguage(cleanPath),
        sha: "",
        isBinary: true,
      };
    }

    const refQuery = data.ref ? `?ref=${encodeURIComponent(data.ref)}` : "";
    const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
    
    try {
      const fileRes = await githubJson<{
        content?: string;
        encoding?: string;
        size: number;
        sha: string;
      }>(context.userId, `/repos/${data.repoFullName}/contents/${encodedPath}${refQuery}`);

      let decoded = "";
      if (fileRes.content && fileRes.encoding === "base64") {
        decoded = Buffer.from(fileRes.content, "base64").toString("utf-8");
      } else if (typeof fileRes.content === "string") {
        decoded = fileRes.content;
      }

      const lines = decoded ? decoded.split("\n").length : 0;
      return {
        path: cleanPath,
        content: decoded,
        size: fileRes.size ?? decoded.length,
        lines,
        language: detectLanguage(cleanPath),
        sha: fileRes.sha ?? "",
        isBinary: false,
      };
    } catch {
      // Fallback: fetch via git blob if contents API fails or file is >1MB
      return {
        path: cleanPath,
        content: "[Unable to load file contents directly from GitHub API]",
        size: 0,
        lines: 0,
        language: detectLanguage(cleanPath),
        sha: "",
        isBinary: false,
      };
    }
  });

export const searchRepositoryFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(searchRepositoryFilesSchema)
  .handler(async ({ data, context }) => {
    const { getRepositoryTree } = await import("@/lib/github.functions");
    const { detectLanguage } = await import("@/server/repoScanner.server");

    const treeResult = await getRepositoryTree({
      data: {
        repoFullName: data.repoFullName,
        branch: data.branch,
        recursive: true,
      },
    });

    const q = data.query.toLowerCase();
    const matchedFiles = treeResult.tree
      .filter((item) => item.type === "blob")
      .filter((item) => {
        const lang = detectLanguage(item.path);
        if (data.language && data.language !== "all" && lang !== data.language) {
          return false;
        }
        return item.path.toLowerCase().includes(q);
      })
      .slice(0, 50);

    return {
      results: matchedFiles.map((item) => ({
        path: item.path,
        size: item.size,
        language: detectLanguage(item.path),
        sha: item.sha,
      })),
      totalMatches: matchedFiles.length,
    };
  });
