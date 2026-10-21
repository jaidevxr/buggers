import { describe, it, expect, vi, beforeEach } from "vitest";
import { scanRepositoryGitHistory } from "./gitHistoryScanner.server";
import * as githubServer from "./github.server";
import type { ScannedFileContent } from "./repoScanner.server";

describe("Git History Security & Regression Scanner", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("identifies leaked secrets introduced in historical commits and checks HEAD persistence", async () => {
    const mockCommits: githubServer.GitHubCommit[] = [
      {
        sha: "commit-head-1234",
        commit: {
          message: "Remove exposed Stripe key from config",
          author: { name: "Alice Developer", date: "2026-10-20T10:00:00Z" },
        },
        author: { login: "alice-dev", avatar_url: "https://github.com/alice-dev.png" },
      },
      {
        sha: "commit-intro-5678",
        commit: {
          message: "Add stripe billing configuration",
          author: { name: "Bob Engineer", date: "2026-10-18T14:30:00Z" },
        },
        author: { login: "bob-eng", avatar_url: "https://github.com/bob-eng.png" },
      },
    ];

    const dummyStripe = ["sk", "live", "51ABCDEF123456789012345678"].join("_");

    // Mock commit detail with patch introducing secret
    const mockCommitDetail = {
      sha: "commit-intro-5678",
      commit: {
        message: "Add stripe billing configuration",
        author: { name: "Bob Engineer", date: "2026-10-18T14:30:00Z" },
      },
      files: [
        {
          filename: "config/stripe.ts",
          status: "added",
          additions: 5,
          deletions: 0,
          patch: `@@ -0,0 +1,5 @@\n+export const STRIPE_KEY = "${dummyStripe}";`,
        },
      ],
    };

    // Current HEAD file where key was removed
    const currentFiles: ScannedFileContent[] = [
      {
        path: "config/stripe.ts",
        language: "typescript",
        size: 100,
        sha: "current-sha",
        content: `export const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;`,
      },
    ];

    vi.spyOn(githubServer, "githubJson").mockImplementation(async (_userId, path) => {
      if (path.includes("/commits?")) {
        return mockCommits as any;
      }
      if (path.includes("/commits/commit-intro-5678")) {
        return mockCommitDetail as any;
      }
      return { sha: "empty", commit: { message: "empty" }, files: [] } as any;
    });

    const summary = await scanRepositoryGitHistory(
      "test-user-id",
      "acme/billing-service",
      "main",
      currentFiles,
      10,
    );

    expect(summary.totalCommitsInspected).toBe(2);
    expect(summary.authorsIdentified).toContain("alice-dev");
    expect(summary.authorsIdentified).toContain("bob-eng");
    expect(summary.historicalFindings.length).toBeGreaterThanOrEqual(1);

    const secretFinding = summary.historicalFindings.find(
      (f) => f.rule_id === "stripe_secret_key",
    );
    expect(secretFinding).toBeDefined();
    expect(secretFinding?.introduced_commit).toBe("commit-intro-5678");
    // Since HEAD uses process.env.STRIPE_SECRET_KEY, is_historical is true
    expect(secretFinding?.is_historical).toBe(true);
    // Ensure raw secret is masked in evidence
    expect(secretFinding?.evidence).toContain("****");
    expect(secretFinding?.evidence).not.toContain(dummyStripe);
  });

  it("handles GitHub API errors gracefully without crashing the whole repository analysis", async () => {
    vi.spyOn(githubServer, "githubJson").mockRejectedValue(
      new Error("GitHub API secondary rate limit exceeded"),
    );

    const summary = await scanRepositoryGitHistory(
      "test-user-id",
      "acme/rate-limited-repo",
      "main",
      [],
      10,
    );

    expect(summary.totalCommitsInspected).toBe(0);
    expect(summary.historicalFindings).toEqual([]);
    expect(summary.authorsIdentified).toEqual([]);
  });
});
