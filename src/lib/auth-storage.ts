/**
 * Synchronous local session check utility.
 * Used to avoid Flash of Unauthenticated Content (FOUC) when authenticated
 * users navigate to public routes like `/` or `/auth`.
 */
export function hasActiveLocalSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const search = new URLSearchParams(window.location.search);
    if (search.has("public") || search.has("landing")) {
      return false;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes("-auth-token") ||
          (key.startsWith("sb-") && key.endsWith("-auth-token")))
      ) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (
              parsed &&
              (parsed.access_token || parsed.user || parsed.refresh_token)
            ) {
              return true;
            }
          } catch {
            if (item.includes("access_token") || item.includes("user")) {
              return true;
            }
          }
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}
