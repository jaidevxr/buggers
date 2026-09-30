import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BuggersWordmark } from "@/components/brand/BugMark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Buggers" },
      { name: "description", content: "Sign in to Buggers to connect GitHub and analyze real pull requests." },
      { property: "og:title", content: "Sign in to Buggers" },
      { property: "og:description", content: "Sign in to analyze your real GitHub pull requests with Buggers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
  ssr: false,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleGoogle() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      // Supabase redirects the browser to Google; no further action needed.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto w-full max-w-6xl px-5 py-5">
        <Link to="/">
          <BuggersWordmark />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="surface-card w-full max-w-md p-7 text-center">
          <h1 className="text-display text-2xl font-bold">
            Sign in to Buggers
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with Google to access your dashboard. You will connect GitHub separately to analyze your repositories.
          </p>

          <Button
            type="button"
            className="mt-6 w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            Continue with Google
          </Button>

          <p className="mt-6 text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
}
