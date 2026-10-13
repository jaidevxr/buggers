/**
 * Webhook security: HMAC-SHA256 signature verification & IP-based rate limiting.
 *
 * GitHub signs every webhook payload with a shared secret. This module verifies
 * that signature using constant-time comparison to prevent timing attacks, and
 * adds IP-based rate limiting to prevent abuse.
 */
import crypto from "crypto";
import { logStructured } from "@/server/logger.server";

// ─── Signature Verification ────────────────────────────────────────

/**
 * Verifies the `x-hub-signature-256` header against the raw request body.
 * Returns `true` if the signature is valid, `false` otherwise.
 *
 * @see https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signatureHeader, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ─── IP-based Rate Limiting for Webhooks ───────────────────────────

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const ipLimits = new Map<string, RateLimitEntry>();

/** Interval to sweep expired entries (every 5 minutes) */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweepExpiredEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of ipLimits) {
    if (now - entry.windowStart > windowMs) {
      ipLimits.delete(key);
    }
  }
}

/**
 * IP-based rate limiter for the webhook endpoint.
 * Returns `{ allowed: true }` if the request is within limits,
 * or `{ allowed: false, retryAfterSeconds }` if rate-limited.
 */
export function checkWebhookRateLimit(
  ip: string,
  maxRequests = 30,
  windowMs = 60_000,
): { allowed: boolean; retryAfterSeconds?: number } {
  sweepExpiredEntries(windowMs);
  const now = Date.now();
  const entry = ipLimits.get(ip);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    ipLimits.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil(
      (entry.windowStart + windowMs - now) / 1000,
    );
    logStructured("warn", "webhook_rate_limit_exceeded", {
      ip,
      count: entry.count,
      maxRequests,
    });
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  entry.count++;
  return { allowed: true };
}

// ─── Input Sanitization ────────────────────────────────────────────

/**
 * Sanitizes a user-controlled string for safe storage.
 * Strips HTML tags and control characters, trims to maxLength.
 */
export function sanitizeString(
  input: unknown,
  maxLength = 500,
): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")          // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip control chars (keep newline, tab, CR)
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes a GitHub ref (branch name) — alphanumeric, hyphens, underscores, slashes, dots only.
 */
export function sanitizeRef(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^a-zA-Z0-9\-_./]/g, "").slice(0, 256);
}

/**
 * Sanitizes a repo full name (owner/repo) — alphanumeric, hyphens, underscores, dots, slash.
 */
export function sanitizeRepoFullName(input: unknown): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim();
  if (!/^[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+$/.test(trimmed)) return "";
  return trimmed.slice(0, 200);
}

/**
 * Sanitizes a SHA hash — only hex characters, exactly 40 chars.
 */
export function sanitizeSha(input: unknown): string {
  if (typeof input !== "string") return "";
  const clean = input.replace(/[^a-fA-F0-9]/g, "");
  if (clean.length < 7 || clean.length > 40) return "";
  return clean;
}

/**
 * Extracts the client IP from a request (handles proxies).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
