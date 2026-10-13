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
    const { data: sessionData } = await supabase.auth.getSession();
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
