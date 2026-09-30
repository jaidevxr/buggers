/**
 * In-memory sliding window rate limiter for user actions.
 * Automatically clears expired windows to avoid unbounded memory growth.
 */

type RateLimitRecord = {
  timestamps: number[];
};

const userLimits = new Map<string, RateLimitRecord>();

export class UserRateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "UserRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Enforces a rate limit for a specific user and action.
 * @param key unique user action identifier e.g. `${userId}:startAnalysis`
 * @param maxRequests maximum requests allowed in the window
 * @param windowMs time window in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkUserRateLimit(key: string, maxRequests = 10, windowMs = 60_000): void {
  const now = Date.now();
  const cutoff = now - windowMs;

  let record = userLimits.get(key);
  if (!record) {
    record = { timestamps: [now] };
    userLimits.set(key, record);
    return;
  }

  // Filter timestamps within the sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0] ?? now;
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    throw new UserRateLimitError(
      `Rate limit exceeded. You can perform at most ${maxRequests} requests per minute. Try again in ${Math.max(1, retryAfter)}s.`,
      Math.max(1, retryAfter),
    );
  }

  record.timestamps.push(now);
}

/** Resets rate limits (primarily for testing purposes) */
export function resetRateLimits(): void {
  userLimits.clear();
}
