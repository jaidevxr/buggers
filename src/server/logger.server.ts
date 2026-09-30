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

export function logStructured(level: LogLevel, message: string, payload: LogPayload = {}) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
    ...payload,
  };

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
