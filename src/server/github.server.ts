import {
  GITHUB_CONNECTOR_ID,
  getConnectionKeyForUser,
  markReconnectRequired,
  deleteConnectionForUser,
} from "@/server/appUserConnections.server";
import { logStructured } from "@/server/logger.server";

export const GITHUB_API_BASE_URL = "https://api.github.com";

/**
 * Scopes: `repo` is required because Buggers analyzes pull requests and commits in both
 * private and organization repositories. A narrower scope like `public_repo` or `read:user`
 * would fail when analyzing private repositories or organization pull requests.
 */
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

/**
 * Exchanges a temporary GitHub authorization code for an OAuth access token directly with GitHub.
 */
export async function exchangeGitHubOAuthCode(code: string): Promise<string> {
  const clientId = process.env["GITHUB_CLIENT_ID"];
  const clientSecret = process.env["GITHUB_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth is not configured. Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.");
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Buggers-App",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub token exchange failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (data.error || !data.access_token) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error || "no access token returned"}`);
  }

  return data.access_token;
}

/**
 * Revokes an OAuth token grant directly at GitHub.
 * If revocation fails (e.g. 404 or network issue), logs a warning but allows cleanup to continue.
 */
export async function revokeGitHubToken(token: string): Promise<void> {
  const clientId = process.env["GITHUB_CLIENT_ID"];
  const clientSecret = process.env["GITHUB_CLIENT_SECRET"];
  if (!clientId || !clientSecret) return;

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  try {
    const res = await fetch(`https://api.github.com/applications/${encodeURIComponent(clientId)}/grant`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Buggers-App",
      },
      body: JSON.stringify({ access_token: token }),
    });

    if (!res.ok && res.status !== 404) {
      logStructured("warn", `GitHub token revocation returned status ${res.status}`);
    }
  } catch (err) {
    logStructured("warn", "Failed to reach GitHub for token revocation", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Raw authenticated GitHub API request using the user's decrypted OAuth token.
 */
export async function githubRequest(
  userId: string,
  path: string,
  init?: RequestInit & { accept?: string },
): Promise<Response> {
  const token = await getConnectionKeyForUser(userId, GITHUB_CONNECTOR_ID);
  if (!token) throw new GitHubNotConnectedError();

  const url = path.startsWith("http") ? path : `${GITHUB_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: init?.accept ?? "application/vnd.github.v3+json",
    "User-Agent": "Buggers-App",
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const makeCall = () =>
    fetch(url, {
      ...init,
      headers,
    });

  let res = await makeCall();

  // 401 Unauthorized = token was revoked by user or expired
  if (res.status === 401) {
    await markReconnectRequired(userId, GITHUB_CONNECTOR_ID);
    throw new GitHubReconnectRequiredError();
  }

  // Rate limit handling (403 with x-ratelimit-remaining: 0, or 429)
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

    logStructured("warn", `GitHub rate limit hit. Pausing for ${delayMs}ms before retry...`, {
      status: res.status,
      delayMs,
    });

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    res = await makeCall();

    if (res.status === 429 || (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0")) {
      throw new GitHubRateLimitError();
    }
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
