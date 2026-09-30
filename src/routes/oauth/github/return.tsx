import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/github/return")({
  component: OAuthReturn,
  ssr: false,
});

function OAuthReturn() {
  const [message, setMessage] = useState("Finishing GitHub connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notifyOpenerAndClose = (
      type: "gitHubOAuthComplete" | "gitHubOAuthFailed",
      payload?: { code?: string; state?: string; error?: string },
    ) => {
      window.opener?.postMessage(
        { type, connectorId: "github", ...payload },
        window.location.origin,
      );
      window.close();
    };

    const error = params.get("error");
    const errorDescription = params.get("error_description");
    if (error) {
      const errText = errorDescription || error || "GitHub authorization did not complete.";
      setMessage(errText);
      notifyOpenerAndClose("gitHubOAuthFailed", { error: errText });
      return;
    }

    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) {
      setMessage("GitHub authorization completed without required code or state.");
      notifyOpenerAndClose("gitHubOAuthFailed", { error: "Missing code or state" });
      return;
    }

    notifyOpenerAndClose("gitHubOAuthComplete", { code, state });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
