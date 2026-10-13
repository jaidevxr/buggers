import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BugMark } from "@/components/brand/BugMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Buggers" },
      {
        name: "description",
        content: "Continue with GitHub to review pull requests with Buggers.",
      },
      { property: "og:title", content: "Sign in — Buggers" },
      { property: "og:description", content: "Continue with GitHub to start analyzing pull requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

export function AuthPage() {
  const navigate = useNavigate();
  const [showEmail, setShowEmail] = useState(false);
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
          scopes: "read:user repo",
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
          if (
            body?.msg?.includes("missing OAuth secret") ||
            body?.msg?.includes("not enabled") ||
            check.status === 400
          ) {
            toast.error(
              "GitHub OAuth is not enabled in your Supabase project yet. Please use email/password below or configure GitHub in your Supabase dashboard.",
              { duration: 6000 },
            );
            setShowEmail(true);
            return;
          }
        }
      } catch {
        // Pre-flight check failed; proceed with standard redirect
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
    <div className="dotted-surface flex min-h-screen flex-col items-center justify-center px-4 py-16 text-foreground antialiased selection:bg-primary/20">
      <div className="w-full max-w-sm text-center">
        <BugMark className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Buggers</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in with GitHub to analyze pull requests and triage findings across your repositories.
        </p>

        {/* Primary GitHub Action */}
        <Button
          size="lg"
          className="mt-8 w-full rounded-full shadow-xs active:scale-[0.985]"
          onClick={handleGitHub}
          disabled={busy}
        >
          <Github className="h-4 w-4" />
          <span>{busy ? "Connecting..." : "Continue with GitHub"}</span>
        </Button>

        {/* Secondary Options */}
        {!showEmail ? (
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={handleGoogle}
              className="hover:text-foreground hover:underline"
              disabled={busy}
            >
              Sign in with Google
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              className="hover:text-foreground hover:underline"
            >
              Use Email
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {mode === "signin" ? "Sign in with Email" : "Create Account"}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-[11px] text-primary hover:underline"
              >
                {mode === "signin" ? "Create account" : "Sign in"}
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleEmail}>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <Button type="submit" size="sm" className="w-full rounded-full" disabled={busy}>
                {busy ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setShowEmail(false)}
              className="mt-3 block w-full text-center text-[11px] text-muted-foreground hover:underline"
            >
              Back to GitHub sign-in
            </button>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Read-only access to repository metadata and pull requests.
        </p>

        <Link
          to="/"
          className="mt-8 inline-block text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
