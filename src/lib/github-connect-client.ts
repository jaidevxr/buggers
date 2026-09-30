import { startGitHubConnect, completeGitHubConnect } from "@/lib/github.functions";

interface OAuthResult {
  code: string;
  state: string;
}

function waitForOAuthCompletion(popup: Window): Promise<OAuthResult> {
  return new Promise<OAuthResult>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };

    const onMessage = (event: MessageEvent) => {
      const type = event.data?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        (type !== "gitHubOAuthComplete" && type !== "gitHubOAuthFailed")
      ) {
        return;
      }

      cleanup();
      if (type === "gitHubOAuthComplete") {
        const { code, state } = event.data;
        if (typeof code === "string" && typeof state === "string") {
          resolve({ code, state });
          return;
        }
      }

      popup.close();
      reject(new Error(event.data?.error || "GitHub authorization failed."));
    };

    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("GitHub authorization window closed before completion."));
    }, 500);
  });
}

/** Runs the whole per-user GitHub OAuth round trip from a click handler. */
export async function connectGitHub() {
  const popup = window.open("", "buggers-github-oauth", "width=640,height=760");
  if (!popup) throw new Error("Popup blocked. Allow popups and try again.");

  let result: OAuthResult;
  try {
    const { authorizationUrl } = await startGitHubConnect();
    const completion = waitForOAuthCompletion(popup);
    popup.location.href = authorizationUrl;
    result = await completion;
  } catch (error) {
    popup.close();
    throw error;
  }

  await completeGitHubConnect({ data: { code: result.code, state: result.state } });
  return { ok: true };
}
