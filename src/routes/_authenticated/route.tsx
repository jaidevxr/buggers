import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";

let cachedUserId: string | null = null;
let lastAuthCheck = 0;
const AUTH_CACHE_TTL = 30_000; // 30 seconds

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      cachedUserId = null;
      lastAuthCheck = 0;
    }
  });
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const now = Date.now();
    // Fast path: Check local session first (<1ms synchronous check)
    let { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session && typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { data: setSessionData } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setSessionData?.session) {
          sessionData = setSessionData;
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    }
    const sessionUser = sessionData.session?.user;
    if (!sessionUser) {
      cachedUserId = null;
      throw redirect({ to: "/auth" });
    }

    // If verified recently, don't stall navigation with an external round-trip
    if (cachedUserId === sessionUser.id && now - lastAuthCheck < AUTH_CACHE_TTL) {
      return { user: sessionUser };
    }

    // Verify user with Supabase Auth
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      cachedUserId = null;
      throw redirect({ to: "/auth" });
    }

    cachedUserId = data.user.id;
    lastAuthCheck = now;
    return { user: data.user };
  },
  component: AppShell,
});
