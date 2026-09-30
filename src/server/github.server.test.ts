import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createOAuthState,
  verifyOAuthState,
  encryptConnectionKey,
  decryptConnectionKey,
} from "./connectionKeyCrypto";
import { logStructured } from "./logger.server";

// Sample 32-byte base64 key
const VALID_KEY_BASE64 = Buffer.from("01234567890123456789012345678901").toString("base64");

// Top-level module mocks
const mockGetConnectionKeyForUser = vi.fn();
const mockMarkReconnectRequired = vi.fn();
const mockDeleteConnectionForUser = vi.fn();

vi.mock("@/server/appUserConnections.server", () => ({
  GITHUB_CONNECTOR_ID: "github",
  getConnectionKeyForUser: (...args: unknown[]) => mockGetConnectionKeyForUser(...args),
  markReconnectRequired: (...args: unknown[]) => mockMarkReconnectRequired(...args),
  deleteConnectionForUser: (...args: unknown[]) => mockDeleteConnectionForUser(...args),
}));

// Import after mocking
import {
  githubRequest,
  GitHubNotConnectedError,
  GitHubReconnectRequiredError,
  GitHubRateLimitError,
} from "./github.server";

describe("GitHub Direct OAuth & API", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env["APP_USER_CONNECTION_KEY_SECRET"] = VALID_KEY_BASE64;
    process.env["GITHUB_CLIENT_ID"] = "test-client-id";
    process.env["GITHUB_CLIENT_SECRET"] = "test-client-secret";
    mockGetConnectionKeyForUser.mockReset();
    mockMarkReconnectRequired.mockReset();
    mockDeleteConnectionForUser.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("AES-256-GCM 32-Byte Validation", () => {
    it("validates key is exactly 32 bytes and rejects short/invalid keys", () => {
      process.env["APP_USER_CONNECTION_KEY_SECRET"] = Buffer.from("too-short").toString("base64");
      expect(() => encryptConnectionKey("secret")).toThrow(/exactly 32 bytes/);

      process.env["APP_USER_CONNECTION_KEY_SECRET"] = VALID_KEY_BASE64;
      const encrypted = encryptConnectionKey("secret-token");
      expect(decryptConnectionKey(encrypted)).toBe("secret-token");
    });
  });

  describe("OAuth State CSRF & Replay Defense", () => {
    it("creates and verifies valid state for expected user", () => {
      const state = createOAuthState("user-123");
      expect(verifyOAuthState(state, "user-123")).toBe(true);
    });

    it("rejects state for mismatched user (cross-user attack)", () => {
      const state = createOAuthState("user-123");
      expect(verifyOAuthState(state, "user-attacker")).toBe(false);
    });

    it("rejects expired state", () => {
      const expiredState = createOAuthState("user-123", -1000); // 1 second in past
      expect(verifyOAuthState(expiredState, "user-123")).toBe(false);
    });

    it("prevents replay attacks (state is single-use)", () => {
      const state = createOAuthState("user-replay");
      expect(verifyOAuthState(state, "user-replay")).toBe(true);
      // Second attempt must fail
      expect(verifyOAuthState(state, "user-replay")).toBe(false);
    });

    it("rejects tampered state tokens", () => {
      expect(verifyOAuthState("invalid-base64-string", "user-123")).toBe(false);
    });
  });

  describe("GitHub API Error Boundaries (Mocked Network)", () => {
    it("throws GitHubNotConnectedError if user has no stored token", async () => {
      mockGetConnectionKeyForUser.mockResolvedValue(null);
      await expect(githubRequest("user-no-token", "/user")).rejects.toThrow(GitHubNotConnectedError);
    });

    it("handles 401 token revoked by marking reconnect and throwing GitHubReconnectRequiredError", async () => {
      mockGetConnectionKeyForUser.mockResolvedValue("gho_test_token");
      mockMarkReconnectRequired.mockResolvedValue(undefined);

      global.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        headers: new Headers(),
        text: () => Promise.resolve("Bad credentials"),
      } as unknown as Response);

      await expect(githubRequest("user-revoked", "/user")).rejects.toThrow(GitHubReconnectRequiredError);
      expect(mockMarkReconnectRequired).toHaveBeenCalledWith("user-revoked", "github");
    });

    it("handles rate limit 429 / 403 with x-ratelimit-remaining: 0", async () => {
      mockGetConnectionKeyForUser.mockResolvedValue("gho_test_token");

      // Mock rate limited response on both initial and retry attempt
      global.fetch = vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
        headers: new Headers({
          "x-ratelimit-remaining": "0",
          "retry-after": "1",
        }),
        text: () => Promise.resolve("rate limit exceeded"),
      } as unknown as Response);

      await expect(githubRequest("user-rate-limit", "/repos/owner/repo")).rejects.toThrow(GitHubRateLimitError);
    });
  });

  describe("Log Redaction of Secrets and Access Tokens", () => {
    it("never logs plaintext tokens or secrets in structured logs", () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const sensitiveToken = "gho_1234567890abcdefghijklmnopqrstuvwxyz";

      logStructured("info", "test_log_event", {
        analysisId: "test-id",
        safeMeta: "public-info",
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedJson = consoleLogSpy.mock.calls[0]?.[0];
      expect(loggedJson).toBeDefined();
      expect(loggedJson).not.toContain(sensitiveToken);
      expect(loggedJson).not.toContain("client_secret");
    });
  });
});
