import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BuggersWordmark } from "@/components/brand/BugMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleGitHub() {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        toast.error("GitHub sign-in failed. Please try again.");
        return;
      }

      try {
        const check = await fetch(data.url);
        if (!check.ok) {
          const body = await check.json().catch(() => null);
          if (body?.msg?.includes("missing OAuth secret") || body?.msg?.includes("not enabled") || check.status === 400) {
            toast.error(
              "GitHub OAuth is not enabled in your Supabase project yet. Please use email/password below or configure GitHub in your Supabase dashboard.",
              { duration: 6000 }
            );
            return;
          }
        }
      } catch {
        // Pre-flight check failed (e.g. CORS/redirect); proceed with standard redirect
      }

      window.location.href = data.url;
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }

      // Check if Supabase project has Google OAuth secret configured
      try {
        const check = await fetch(data.url);
        if (!check.ok) {
          const body = await check.json().catch(() => null);
          if (body?.msg?.includes("missing OAuth secret") || body?.msg?.includes("not enabled") || check.status === 400) {
            toast.error(
              "Google OAuth is not configured in your Supabase project yet. Please use GitHub or email/password below, or configure Google in your Supabase dashboard.",
              { duration: 6000 }
            );
            return;
          }
        }
      } catch {
        // If pre-flight fetch fails (e.g. CORS), proceed with standard redirect
      }

      window.location.href = data.url;
    } finally {
      setBusy(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          toast.success("Account created! Redirecting to dashboard...");
          navigate({ to: "/dashboard" });
        } else {
          toast.info("Account created. Please check your email to confirm or sign in.");
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          toast.success("Signed in successfully!");
          navigate({ to: "/dashboard" });
        }
      }
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
        <div className="surface-card w-full max-w-md p-7">
          <h1 className="text-display text-2xl font-bold">
            {mode === "signin" ? "Sign in to Buggers" : "Create your Buggers account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with GitHub, Google, or email to access your dashboard.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              type="button"
              className="w-full gap-2 font-medium"
              onClick={handleGitHub}
              disabled={busy}
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 font-medium"
              onClick={handleGoogle}
              disabled={busy}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or use email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={handleEmail}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="••••••••"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
              {busy
                ? "Processing..."
                : mode === "signin"
                  ? "Sign in with Email"
                  : "Create Account"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-5 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin"
              ? "New to Buggers? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </main>
    </div>
  );
}
