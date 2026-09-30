import { startGitHubConnect, completeGitHubConnect } from "@/lib/github.functions";

function waitForOAuthCompletion(popup: Window) {
  return new Promise<string | null>((resolve, reject) => {
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
        event.data?.connectorId !== "github" ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      )
        return;
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        resolve(typeof event.data?.code === "string" ? event.data.code : null);
        return;
      }
      popup.close();
      reject(new Error("GitHub authorization failed."));
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
  let code: string | null;
  try {
    const { authorizationUrl } = await startGitHubConnect();
    const completion = waitForOAuthCompletion(popup);
    popup.location.href = authorizationUrl;
    code = await completion;
  } catch (error) {
    popup.close();
    throw error;
  }
  if (code) await completeGitHubConnect({ data: { code } });
  return { ok: true };
}
