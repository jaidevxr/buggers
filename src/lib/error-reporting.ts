/**
 * Application error reporting.
 *
 * When VITE_SENTRY_DSN is set AND @sentry/browser is installed, errors are
 * forwarded to Sentry. Otherwise, errors are logged to the console.
 *
 * Sentry is a peer dependency — the app builds and runs without it.
 */

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[Buggers]", message, context);

  // If Sentry has been initialized externally (e.g. in a Sentry.init() call
  // added to the entry point), capture the exception via the global hub.
  const sentryHub = (window as Record<string, unknown>)["__SENTRY__"];
  if (sentryHub && typeof (sentryHub as Record<string, unknown>)["hub"] === "object") {
    try {
      const hub = (sentryHub as { hub: { captureException?: (e: unknown, ctx?: unknown) => void } }).hub;
      hub.captureException?.(error, { extra: context });
    } catch {
      // Sentry integration broken — swallow silently.
    }
  }
}
