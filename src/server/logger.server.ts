/**
 * Structured logger and error tracking hooks.
 * Outputs formatted JSON logs with analysis_id, stage, duration_ms, and token metrics.
 * Env-gated Sentry-compatible hook for observability.
 */

export interface LogPayload {
  analysisId?: string;
  stage?: string;
  durationMs?: number;
  tokens?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  costUsd?: number;
  [key: string]: unknown;
}

export type LogLevel = "info" | "warn" | "error" | "debug";

const SENSITIVE_KEY_PATTERN = /(token|secret|password|apikey|api_key|auth|bearer|private_key|ciphertext|credential)/i;

export function redactSensitiveData<T>(obj: T, depth = 0): T {
  if (depth > 5 || !obj) return obj;
  if (typeof obj === "string") {
    return obj
      .replace(/(?:gh[pousr]_[A-Za-z0-9_]{10,})/g, "[REDACTED_GH_TOKEN]")
      .replace(/(?:sk-[A-Za-z0-9_\-]{10,})/g, "[REDACTED_AI_KEY]")
      .replace(/(?:Bearer\s+[A-Za-z0-9_\-\.]+)/gi, "Bearer [REDACTED]") as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1)) as unknown as T;
  }
  if (typeof obj === "object") {
    const copy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        copy[k] = "[REDACTED]";
      } else {
        copy[k] = redactSensitiveData(v, depth + 1);
      }
    }
    return copy as T;
  }
  return obj;
}

export function logStructured(level: LogLevel, message: string, payload: LogPayload = {}) {
  const timestamp = new Date().toISOString();
  const entry = redactSensitiveData({
    timestamp,
    level,
    message,
    ...payload,
  });

  const formatted = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "debug":
      if (process.env["DEBUG"] === "true") console.debug(formatted);
      break;
    default:
      console.log(formatted);
      break;
  }

  // Sentry / Error Tracking integration hook (env-gated)
  if (level === "error" && process.env["SENTRY_DSN"]) {
    dispatchSentryError(message, payload);
  }
}

/**
 * Dispatches error context to Sentry or monitoring backend if SENTRY_DSN is configured.
 */
function dispatchSentryError(message: string, payload: LogPayload) {
  try {
    const sentryDsn = process.env["SENTRY_DSN"];
    if (!sentryDsn) return;

    // Optional lightweight HTTP event capture or webhook notification
    if (process.env["SENTRY_WEBHOOK_URL"]) {
      void fetch(process.env["SENTRY_WEBHOOK_URL"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "error",
          message,
          extra: payload,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  } catch {
    // Non-blocking observability error
  }
}
