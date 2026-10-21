import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { completeGitHubConnect } from "@/lib/github.functions";

export const Route = createFileRoute("/oauth/github/return")({
  component: OAuthReturn,
  ssr: false,
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
});

function OAuthReturn() {
  const [message, setMessage] = useState("Finishing GitHub connection…");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      const errText = errorDescription || error || "GitHub authorization did not complete.";
      setMessage(errText);
      if (window.opener) {
        window.opener.postMessage(
          { type: "gitHubOAuthFailed", connectorId: "github", error: errText },
          window.location.origin,
        );
        window.close();
      }
      return;
    }

    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) {
      const errText = "GitHub authorization completed without required code or state.";
      setMessage(errText);
      if (window.opener) {
        window.opener.postMessage(
          { type: "gitHubOAuthFailed", connectorId: "github", error: errText },
          window.location.origin,
        );
        window.close();
      }
      return;
    }

    if (window.opener) {
      window.opener.postMessage(
        { type: "gitHubOAuthComplete", connectorId: "github", code, state },
        window.location.origin,
      );
      window.close();
      return;
    }

    // Direct navigation fallback (e.g. popup blocked or direct redirect)
    completeGitHubConnect({ data: { code, state } })
      .then(() => {
        setMessage("GitHub connected successfully! Redirecting…");
        setTimeout(() => {
          navigate({ to: "/settings" });
        }, 800);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to exchange GitHub authorization code.";
        setMessage(msg);
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="space-y-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
