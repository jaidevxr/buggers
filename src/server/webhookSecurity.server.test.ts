import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  verifyWebhookSignature,
  checkWebhookRateLimit,
  sanitizeString,
  sanitizeRef,
  sanitizeRepoFullName,
  sanitizeSha,
} from "./webhookSecurity.server";

describe("Webhook Signature Verification", () => {
  const secret = "test-super-secret-key-12345";

  function createSignature(payload: string, key: string): string {
    const hmac = crypto.createHmac("sha256", key);
    hmac.update(payload, "utf8");
    return `sha256=${hmac.digest("hex")}`;
  }

  it("successfully verifies valid HMAC-SHA256 signature", () => {
    const payload = JSON.stringify({ action: "opened", number: 42 });
    const signature = createSignature(payload, secret);

    const valid = verifyWebhookSignature(payload, signature, secret);
    expect(valid).toBe(true);
  });

  it("rejects payload with invalid secret or tampered content", () => {
    const payload = JSON.stringify({ action: "opened", number: 42 });
    const signature = createSignature(payload, "wrong-secret");

    const valid = verifyWebhookSignature(payload, signature, secret);
    expect(valid).toBe(false);
  });

  it("rejects malformed signature headers missing sha256 prefix", () => {
    const payload = JSON.stringify({ action: "opened" });
    const valid = verifyWebhookSignature(payload, "bad_format_signature", secret);
    expect(valid).toBe(false);
  });

  it("handles empty or missing signature header gracefully", () => {
    const payload = JSON.stringify({ action: "opened" });
    expect(verifyWebhookSignature(payload, null, secret)).toBe(false);
    expect(verifyWebhookSignature(payload, "", secret)).toBe(false);
  });
});

describe("IP Rate Limiting", () => {
  it("allows requests under the rate limit threshold", () => {
    const ip = "192.168.1.100";
    const status = checkWebhookRateLimit(ip, 5, 10_000);
    expect(status.allowed).toBe(true);
  });

  it("blocks requests when rate limit is exceeded", () => {
    const ip = "10.0.0.50";
    for (let i = 0; i < 5; i++) {
      checkWebhookRateLimit(ip, 5, 10_000);
    }
    const blocked = checkWebhookRateLimit(ip, 5, 10_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("Input Sanitization & Defenses", () => {
  it("sanitizes dangerous HTML tags and control characters in strings", () => {
    const dangerous = "<script>alert('xss')</script> Hello <b>World</b>\x00";
    const clean = sanitizeString(dangerous);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("<b>");
    expect(clean).toContain("alert('xss') Hello World");
  });

  it("sanitizes git ref / branch names", () => {
    expect(sanitizeRef("feature/add-auth; rm -rf /")).toBe("feature/add-authrm-rf/");
    expect(sanitizeRef("release/v1.0.0")).toBe("release/v1.0.0");
  });

  it("validates and sanitizes repo full names strictly", () => {
    expect(sanitizeRepoFullName("facebook/react")).toBe("facebook/react");
    expect(sanitizeRepoFullName("injected/repo; evil_cmd")).toBe("");
    expect(sanitizeRepoFullName("invalid-name-without-slash")).toBe("");
  });

  it("validates and sanitizes git commit SHAs", () => {
    expect(sanitizeSha("e3b0c44298fc1c149afbf4c8996fb92427ae41e4")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4"
    );
    expect(sanitizeSha("short-sha")).toBe("");
    expect(sanitizeSha("not-hex-chars-xxxxxxxxxxxxxxxxxxxxxxxxxx")).toBe("");
  });
});
