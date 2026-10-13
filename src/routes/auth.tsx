import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Github,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Terminal,
  Lock,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BugMark, BuggersWordmark } from "@/components/brand/BugMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or Sign up — Buggers" },
      {
        name: "description",
        content: "Sign in or create your Buggers account to connect GitHub and analyze real pull requests.",
      },
      { property: "og:title", content: "Sign in or Sign up — Buggers" },
      {
        property: "og:description",
        content: "Connect GitHub to analyze real pull requests with diff grounding and risk triage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

export function AuthPage() {
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
              "Google OAuth is not configured in your Supabase project yet. Please use GitHub or email/password below, or configure Google in your Supabase dashboard.",
              { duration: 6000 },
            );
            return;
          }
        }
      } catch {
        // Pre-flight check failed (e.g. CORS); proceed with standard redirect
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
    <div className="min-h-screen w-full bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Full-Bleed End-to-End Grid Layout (GitHub style) */}
      <div className="grid min-h-screen w-full lg:grid-cols-12">
        {/* Left Hero Column: GitHub Developer Experience & Terminal (Hidden on Mobile) */}
        <div className="github-grid relative hidden flex-col justify-between border-r border-border/70 bg-card/60 p-10 lg:col-span-7 lg:flex xl:col-span-7 xl:p-14 2xl:col-span-8 2xl:p-20">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-info/10 blur-3xl" />

          {/* Top Brand Link */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-85">
              <BugMark className="h-7 w-7 text-primary" />
              <BuggersWordmark className="text-foreground" />
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Engine v3.2 Online
            </span>
          </div>

          {/* Middle: Developer Headline & Interactive Code Terminal */}
          <div className="relative z-10 my-auto py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Zero Hallucinations • Real Diff Grounding
            </div>

            <h1 className="text-display mt-6 text-4xl font-extrabold tracking-tight xl:text-5xl 2xl:text-6xl">
              Inspect pull requests with <br />
              <span className="bg-gradient-to-r from-primary via-primary/90 to-info bg-clip-text text-transparent">
                cryptographic evidence.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Buggers connects directly to your GitHub repository to calculate deterministic risk scores and validate every AI recommendation against actual code diff hunks.
            </p>

            {/* Simulated Live Terminal */}
            <div className="mt-8 max-w-xl overflow-hidden rounded-xl border border-border/80 bg-background/90 font-mono text-xs shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-2 text-xs text-muted-foreground">buggers-auth-handshake.log</span>
                </div>
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="space-y-1.5 p-4 text-[12px] leading-relaxed">
                <div className="text-muted-foreground">
                  $ buggers connect --provider github --mode strict
                </div>
                <div className="text-emerald-500">
                  &#10003; GitHub OAuth App handshake verified
                </div>
                <div className="text-emerald-500">
                  &#10003; AES-256-GCM token encryption keys initialized
                </div>
                <div className="text-emerald-500">
                  &#10003; Supabase multi-tenant Row-Level Security active
                </div>
                <div className="text-info">
                  &rarr; 102/102 test suites hermetically verified
                </div>
                <div className="text-muted-foreground">
                  Ready for live PR risk scoring and triage.
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-4 border-t border-border/60 pt-6">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">100% Grounded</div>
                  <div className="text-muted-foreground">No phantom diff lines</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">AST Scanners</div>
                  <div className="text-muted-foreground">Deterministic churn signals</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Multi-Tier AI</div>
                  <div className="text-muted-foreground">Automatic failover</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary" />
              End-to-end encrypted connection & tokens
            </span>
            <Link to="/" className="text-primary hover:underline">
              Back to overview &rarr;
            </Link>
          </div>
        </div>

        {/* Right Auth Column: End-to-End Form Container */}
        <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-5 lg:p-12 xl:col-span-5 xl:p-16 2xl:col-span-4">
          {/* Top Mobile Brand Bar */}
          <div className="flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <BugMark className="h-6 w-6 text-primary" />
              <BuggersWordmark className="text-foreground" />
            </Link>
            <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Back
            </Link>
          </div>

          <div className="my-auto mx-auto w-full max-w-sm py-8">
            {/* Header & Mode Switcher */}
            <div className="mb-8">
              <h2 className="text-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {mode === "signin" ? "Welcome back" : "Get started with Buggers"}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {mode === "signin"
                  ? "Sign in with GitHub, Google, or email to access your pull request dashboard."
                  : "Create an account to connect your GitHub repositories and analyze pull requests."}
              </p>

              {/* Segmented Mode Switcher */}
              <div className="mt-6 flex rounded-lg border border-border bg-muted/60 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 rounded-md py-1.5 font-medium transition-all duration-200 ${
                    mode === "signin"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-md py-1.5 font-medium transition-all duration-200 ${
                    mode === "signup"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                className="h-10 w-full gap-2.5 text-xs font-semibold shadow-xs hover:shadow-md active:scale-[0.985]"
                onClick={handleGitHub}
                disabled={busy}
              >
                <Github className="h-4 w-4" />
                <span>Continue with GitHub</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full gap-2.5 text-xs font-medium shadow-xs hover:bg-accent active:scale-[0.985]"
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
                <span>Continue with Google</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or continue with work email
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Email Form */}
            <form className="space-y-3.5" onSubmit={handleEmail}>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium">
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="developer@company.com"
                  required
                  className="h-9.5 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                  {mode === "signin" && (
                    <span className="text-[11px] text-muted-foreground hover:underline cursor-pointer">
                      Forgot?
                    </span>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-9.5 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="h-10 w-full text-xs font-semibold shadow-xs transition-all duration-200 active:scale-[0.985]"
                disabled={busy}
              >
                {busy ? (
                  "Processing..."
                ) : mode === "signin" ? (
                  <span className="flex items-center gap-1.5">
                    Sign in with Email
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Create Developer Account
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-muted-foreground">
              {mode === "signin" ? (
                <span>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up now
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Bottom Security / Terms Notice */}
          <div className="text-center text-[11px] text-muted-foreground">
            By continuing, you agree to Buggers&apos; terms of service and security telemetry guidelines.
          </div>
        </div>
      </div>
    </div>
  );
}
