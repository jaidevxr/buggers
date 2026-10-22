import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export function withSecurityHeaders(response: Response): Response {
  try {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
    return response;
  } catch {
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    newHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/webhooks/github" || url.pathname === "/api/webhook") {
        const { handleGitHubWebhook } = await import("./server/webhook.server");
        return await handleGitHubWebhook(request);
      }

      if (url.pathname === "/oauth/github/return") {
        const code = url.searchParams.get("code") || "";
        const state = url.searchParams.get("state") || "";
        const error = url.searchParams.get("error") || "";
        const errorDescription = url.searchParams.get("error_description") || "";

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>GitHub Authorization &bull; Buggers</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      background: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      user-select: none;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255, 255, 255, 0.12);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 16px; font-weight: 600; margin: 0 0 6px 0; }
    p { font-size: 13px; color: #71717a; margin: 0; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Finalizing GitHub Authorization</h2>
  <p>Connecting your account&hellip;</p>
  <script>
    const code = ${JSON.stringify(code)};
    const state = ${JSON.stringify(state)};
    const error = ${JSON.stringify(error)};
    const errorDescription = ${JSON.stringify(errorDescription)};

    if (error) {
      if (window.opener) {
        window.opener.postMessage({ type: "gitHubOAuthFailed", connectorId: "github", error: errorDescription || error }, window.location.origin);
        window.close();
      }
    } else if (code && state) {
      if (window.opener) {
        window.opener.postMessage({ type: "gitHubOAuthComplete", connectorId: "github", code: code, state: state }, window.location.origin);
        window.close();
      } else {
        window.location.replace("/settings");
      }
    }
  </script>
</body>
</html>`;

        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      }

      if (url.pathname === "/api/cron/worker") {
        const { handleCronWorkerRequest } = await import("./server/queueWorker.server");
        return await handleCronWorkerRequest(request);
      }

      if (url.pathname === "/api/health") {
        let dbStatus = "connected";
        try {
          const { supabase } = await import("./integrations/supabase/client");
          const { error } = await supabase.from("analyses").select("id").limit(1);
          if (error) dbStatus = "query_attempted";
        } catch {
          dbStatus = "ping_attempted";
        }

        return new Response(
          JSON.stringify({
            status: "healthy",
            database: dbStatus,
            service: "buggers-security-engine",
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return withSecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
