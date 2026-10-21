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
  // Center popup window precisely on user's active screen/browser
  const width = 580;
  const height = 720;
  const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
  const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
  const screenWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const screenHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
  const left = Math.max(0, Math.floor(dualScreenLeft + (screenWidth - width) / 2));
  const top = Math.max(0, Math.floor(dualScreenTop + (screenHeight - height) / 2));

  const popup = window.open(
    "about:blank",
    "buggers-github-oauth",
    `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=yes,resizable=yes`,
  );
  if (popup) {
    try {
      popup.focus();
    } catch {}
  }

  if (popup && !popup.closed) {
    try {
      popup.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Connecting to GitHub &bull; Buggers</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      user-select: none;
    }
    .card {
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      animation: fadeIn 0.25s ease-out;
    }
    .spinner {
      width: 38px;
      height: 38px;
      border: 3px solid rgba(255, 255, 255, 0.12);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    h2 {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin: 0;
    }
    p {
      font-size: 13px;
      color: #71717a;
      margin: 0;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Connecting to GitHub</h2>
    <p>Opening secure authorization window&hellip;</p>
  </div>
</body>
</html>`);
      popup.document.close();
    } catch {
      // Ignore document.write issues if restricted
    }
  }

  let authorizationUrl: string;
  try {
    const res = await startGitHubConnect({
      data: { origin: window.location.origin },
    });
    authorizationUrl = res.authorizationUrl;
  } catch (error) {
    if (popup) popup.close();
    throw error;
  }

  // If popup was blocked by browser, seamlessly fall back to full-page redirect
  if (!popup || popup.closed) {
    window.location.href = authorizationUrl;
    return { ok: true };
  }

  let result: OAuthResult;
  try {
    const completion = waitForOAuthCompletion(popup);
    popup.location.replace(authorizationUrl);
    result = await completion;
  } catch (error) {
    popup.close();
    throw error;
  }

  await completeGitHubConnect({ data: { code: result.code, state: result.state } });
  return { ok: true };
}
