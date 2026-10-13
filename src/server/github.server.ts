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

import fs from "fs";
import path from "path";

export function reloadEnv() {
  if (process.env["VITEST"]) return;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const rawLine of content.split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eqIdx = line.indexOf("=");
        if (eqIdx > 0) {
          const key = line.slice(0, eqIdx).trim();
          let val = line.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {}
}

/**
 * Exchanges a temporary GitHub authorization code for an OAuth access token directly with GitHub.
 */
export async function exchangeGitHubOAuthCode(code: string): Promise<string> {
  reloadEnv();
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

export async function githubJson<T>(
  userId: string,
  path: string,
  init?: RequestInit & { accept?: string },
): Promise<T> {
  const res = await githubRequest(userId, path, init);
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

export async function getGitHubFileContent(
  userId: string,
  repoFullName: string,
  filePath: string,
  ref: string,
): Promise<{ sha: string; content: string }> {
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const res = await githubRequest(
    userId,
    `/repos/${repoFullName}/contents/${cleanPath}?ref=${encodeURIComponent(ref)}`,
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch file from GitHub (${res.status}): ${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as { sha: string; content?: string; encoding?: string };
  if (!data.content) {
    throw new Error("File content is empty or not available.");
  }
  const decoded = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
  return { sha: data.sha, content: decoded };
}

export async function commitFileToGitHub(args: {
  userId: string;
  repoFullName: string;
  branch: string;
  filePath: string;
  content: string;
  commitMessage: string;
  fileSha: string;
}): Promise<{ ok: boolean; commitUrl?: string; sha?: string }> {
  const cleanPath = args.filePath.startsWith("/") ? args.filePath.slice(1) : args.filePath;
  const res = await githubRequest(
    args.userId,
    `/repos/${args.repoFullName}/contents/${cleanPath}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: args.commitMessage,
        content: Buffer.from(args.content).toString("base64"),
        sha: args.fileSha,
        branch: args.branch,
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to commit fix to GitHub (${res.status}): ${errText.slice(0, 200)}`);
  }

  const result = (await res.json()) as { commit: { html_url: string; sha: string } };
  return { ok: true, commitUrl: result.commit?.html_url, sha: result.commit?.sha };
}

export type RepoProjectContext = {
  manifests: Array<{ path: string; summary: string }>;
  frameworks: string[];
  keyDependencies: string[];
  treeSummary: string;
};

export async function collectProjectContext(
  userId: string,
  repoFullName: string,
  ref: string,
): Promise<RepoProjectContext> {
  const result: RepoProjectContext = {
    manifests: [],
    frameworks: [],
    keyDependencies: [],
    treeSummary: "",
  };

  try {
    const treeData = await githubJson<{
      tree: Array<{ path: string; mode: string; type: string; sha: string; size?: number }>;
      truncated?: boolean;
    }>(userId, `/repos/${repoFullName}/git/trees/${encodeURIComponent(ref)}?recursive=1`).catch(() => null);

    const entries = treeData?.tree || [];
    const filePaths = entries
      .filter((e) => e.type === "blob")
      .map((e) => e.path)
      .filter(
        (p) =>
          !p.startsWith(".") &&
          !p.includes("node_modules/") &&
          !p.includes("vendor/") &&
          !p.includes("dist/") &&
          !p.includes(".next/"),
      );

    const manifestCandidates = [
      "package.json",
      "requirements.txt",
      "pyproject.toml",
      "go.mod",
      "Cargo.toml",
      "pom.xml",
      "build.gradle",
      "composer.json",
    ];

    const detectedManifests = filePaths
      .filter((p) => manifestCandidates.some((m) => p === m || p.endsWith("/" + m)))
      .slice(0, 3);

    for (const manifestPath of detectedManifests) {
      try {
        const file = await getGitHubFileContent(userId, repoFullName, manifestPath, ref);
        if (manifestPath.endsWith("package.json")) {
          const pkg = JSON.parse(file.content) as Record<string, unknown>;
          const deps = {
            ...((pkg["dependencies"] as Record<string, string>) || {}),
            ...((pkg["devDependencies"] as Record<string, string>) || {}),
          };
          const depList = Object.keys(deps);
          result.keyDependencies.push(...depList.slice(0, 30));

          if (deps["express"]) result.frameworks.push("Express.js");
          if (deps["react"]) result.frameworks.push("React");
          if (deps["next"]) result.frameworks.push("Next.js");
          if (deps["vue"]) result.frameworks.push("Vue");
          if (deps["@angular/core"]) result.frameworks.push("Angular");
          if (deps["fastify"]) result.frameworks.push("Fastify");
          if (deps["@nestjs/core"]) result.frameworks.push("NestJS");
          if (deps["prisma"] || deps["@prisma/client"]) result.frameworks.push("Prisma ORM");
          if (deps["drizzle-orm"]) result.frameworks.push("Drizzle ORM");
          if (deps["typeorm"]) result.frameworks.push("TypeORM");
          if (deps["pg"]) result.frameworks.push("PostgreSQL (pg)");
          if (deps["mysql"] || deps["mysql2"]) result.frameworks.push("MySQL");
          if (deps["mongoose"] || deps["mongodb"]) result.frameworks.push("MongoDB");
          if (deps["knex"]) result.frameworks.push("Knex.js");

          result.manifests.push({
            path: manifestPath,
            summary: `Package: ${pkg["name"] || "app"}, Dependencies: ${depList.slice(0, 25).join(", ")}`,
          });
        } else if (manifestPath.endsWith("requirements.txt")) {
          const lines = file.content
            .split("\n")
            .map((l) => l.trim().split("=")[0]!.split("<")[0]!.split(">")[0]!.trim())
            .filter((l) => l && !l.startsWith("#"));
          result.keyDependencies.push(...lines.slice(0, 25));
          if (lines.includes("django")) result.frameworks.push("Django");
          if (lines.includes("flask")) result.frameworks.push("Flask");
          if (lines.includes("fastapi")) result.frameworks.push("FastAPI");
          result.manifests.push({
            path: manifestPath,
            summary: `Python dependencies: ${lines.slice(0, 20).join(", ")}`,
          });
        } else if (manifestPath.endsWith("go.mod")) {
          const lines = file.content
            .split("\n")
            .filter((l) => l.trim().startsWith("require") || (l.includes("/") && !l.startsWith("module")))
            .slice(0, 20);
          result.manifests.push({
            path: manifestPath,
            summary: `Go modules: ${lines.map((l) => l.trim()).join("; ")}`,
          });
        }
      } catch {
        // Non-fatal manifest parse error
      }
    }

    const codeFiles = filePaths.filter((p) =>
      /\.(js|ts|jsx|tsx|py|go|java|rb|php|sql|rs|cs|c|cpp|h)$/i.test(p),
    );

    const sampleTree = codeFiles.slice(0, 40);
    result.treeSummary =
      sampleTree.length > 0
        ? `Repository has ${filePaths.length} tracked files (${codeFiles.length} source code files).\nKey source structure:\n` +
          sampleTree.map((p) => `  - ${p}`).join("\n") +
          (codeFiles.length > 40 ? `\n  ... and ${codeFiles.length - 40} more files` : "")
        : `Repository has ${filePaths.length} tracked files.`;
  } catch {
    result.treeSummary = "Repository structure could not be retrieved.";
  }

  return result;
}

export async function postGitHubPullRequestComment(
  userId: string,
  repoFullName: string,
  prNumber: number,
  body: string,
): Promise<{ ok: boolean; commentUrl: string }> {
  const res = await githubRequest(userId, `/repos/${repoFullName}/issues/${prNumber}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to post comment to GitHub (${res.status}): ${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as { html_url: string };
  return { ok: true, commentUrl: data.html_url };
}

export async function createGitHubIssue(
  userId: string,
  repoFullName: string,
  title: string,
  body: string,
  labels: string[] = ["security", "buggers"],
): Promise<{ ok: boolean; issueUrl: string; issueNumber: number }> {
  const res = await githubRequest(userId, `/repos/${repoFullName}/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create GitHub issue (${res.status}): ${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as { html_url: string; number: number };
  return { ok: true, issueUrl: data.html_url, issueNumber: data.number };
}

export async function createGitHubCommitStatus(
  userId: string,
  repoFullName: string,
  sha: string,
  state: "pending" | "success" | "failure" | "error",
  description: string,
  targetUrl?: string,
): Promise<{ ok: boolean }> {
  try {
    const res = await githubRequest(userId, `/repos/${repoFullName}/statuses/${sha}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state,
        description: description.slice(0, 140),
        context: "Buggers / Security Review",
        target_url: targetUrl,
      }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

