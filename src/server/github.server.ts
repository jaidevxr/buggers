import {
  appUserReconnectRequired,
  callAsAppUser,
} from "@/integrations/lovable/appUserConnector";
import {
  GITHUB_CONNECTOR_ID,
  getConnectionKeyForUser,
  markReconnectRequired,
} from "@/server/appUserConnections.server";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const GITHUB_SCOPES = ["read:user", "repo"];

export class GitHubNotConnectedError extends Error {
  constructor() {
    super("GitHub is not connected.");
  }
}
export class GitHubReconnectRequiredError extends Error {
  constructor() {
    super("GitHub authorization expired. Reconnect your account.");
  }
}
export class GitHubRateLimitError extends Error {
  constructor() {
    super("GitHub API rate limit reached. Please try again later.");
  }
}
export class GitHubRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Raw authenticated GitHub request for the signed-in app user. */
export async function githubRequest(
  userId: string,
  path: string,
  init?: RequestInit & { accept?: string },
): Promise<Response> {
  const connectionAPIKey = await getConnectionKeyForUser(userId, GITHUB_CONNECTOR_ID);
  if (!connectionAPIKey) throw new GitHubNotConnectedError();

  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: GITHUB_CONNECTOR_ID,
    path,
    requiredScopes: GITHUB_SCOPES,
    init: {
      ...init,
      headers: {
        Accept: init?.accept ?? "application/vnd.github+json",
        ...(init?.headers ?? {}),
      },
    },
  });

  if (await appUserReconnectRequired(res)) {
    await markReconnectRequired(userId, GITHUB_CONNECTOR_ID);
    throw new GitHubReconnectRequiredError();
  }

  // Handle GitHub rate limits (403 or 429) by delaying rather than failing outright
  const remaining = res.headers.get("x-ratelimit-remaining");
  const isRateLimited = res.status === 429 || (res.status === 403 && remaining === "0");

  if (isRateLimited) {
    const resetTimeHeader = res.headers.get("x-ratelimit-reset");
    const retryAfterHeader = res.headers.get("retry-after");

    let delayMs = 5000;
    if (retryAfterHeader) {
      delayMs = Math.min(60_000, Math.max(1000, Number(retryAfterHeader) * 1000));
    } else if (resetTimeHeader) {
      const resetEpochSeconds = Number(resetTimeHeader);
      const nowEpochSeconds = Math.floor(Date.now() / 1000);
      const diffSeconds = resetEpochSeconds - nowEpochSeconds;
      if (diffSeconds > 0 && diffSeconds <= 60) {
        delayMs = diffSeconds * 1000;
      }
    }

    const { logStructured } = await import("@/server/logger.server");
    logStructured("warn", `GitHub rate limit hit. Pausing for ${delayMs}ms before retry...`, {
      status: res.status,
      delayMs,
    });

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Re-attempt once after the rate limit delay
    const retryRes = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: GITHUB_CONNECTOR_ID,
      path,
      requiredScopes: GITHUB_SCOPES,
      init: {
        ...init,
        headers: {
          Accept: init?.accept ?? "application/vnd.github+json",
          ...(init?.headers ?? {}),
        },
      },
    });

    if (retryRes.status === 429 || (retryRes.status === 403 && retryRes.headers.get("x-ratelimit-remaining") === "0")) {
      throw new GitHubRateLimitError();
    }
    return retryRes;
  }

  return res;
}

export async function githubJson<T>(userId: string, path: string): Promise<T> {
  const res = await githubRequest(userId, path);
  if (!res.ok) {
    const body = await res.text();
    throw new GitHubRequestError(res.status, `GitHub request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export async function githubJsonWithHeaders<T>(
  userId: string,
  path: string,
): Promise<{ data: T; headers: Headers }> {
  const res = await githubRequest(userId, path);
  if (!res.ok) {
    const body = await res.text();
    throw new GitHubRequestError(res.status, `GitHub request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return { data: (await res.json()) as T, headers: res.headers };
}

export async function githubText(userId: string, path: string, accept: string): Promise<string> {
  const res = await githubRequest(userId, path, { accept });
  if (!res.ok) {
    const body = await res.text();
    throw new GitHubRequestError(res.status, `GitHub request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return await res.text();
}

export type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
};

export type GitHubRepo = {
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
  updated_at: string;
  html_url: string;
  owner: { login: string; avatar_url: string };
};

export type GitHubPull = {
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
  additions?: number;
  deletions?: number;
  changed_files?: number;
  body?: string | null;
};

export type GitHubPullFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
};

export type GitHubCommit = {
  sha: string;
  commit: { message: string; author: { name: string; date: string } | null };
  author: { login: string; avatar_url: string } | null;
};
