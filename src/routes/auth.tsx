import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Github,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BugMark } from "@/components/brand/BugMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in & Sign up — Buggers" },
      {
        name: "description",
        content: "Continue with GitHub, Google, or Email to review pull requests with Buggers.",
      },
      { property: "og:title", content: "Sign in — Buggers" },
      {
        property: "og:description",
        content: "Continue with GitHub, Google, or Email to start analyzing pull requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busyProvider, setBusyProvider] = useState<"github" | "google" | "email" | null>(null);

  useEffect(() => {
    // Read optional ?mode=signup from URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlMode = urlParams.get("mode");
      if (urlMode === "signup" || urlMode === "signin") {
        setMode(urlMode);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleOAuth(provider: "github" | "google") {
    setBusyProvider(provider);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          ...(provider === "github" ? { scopes: "read:user repo" } : {}),
        },
      });

      if (error || !data?.url) {
        toast.error(
          `${provider === "github" ? "GitHub" : "Google"} sign-in failed. ${error?.message || "Please try again."}`
        );
        return;
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to connect with ${provider}.`;
      toast.error(message);
    } finally {
      setBusyProvider(null);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusyProvider("email");
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
          toast.info("Account created. Please check your email to confirm your account or sign in.");
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
      setBusyProvider(null);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between bg-black text-slate-100 antialiased selection:bg-white/20">
      {/* Top Bar with Clean Back Link */}
      <header className="w-full px-6 py-6 sm:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Buggers</span>
        </Link>
      </header>

      {/* Centered Auth Card */}
      <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8">
        <div className="w-full rounded-2xl border border-white/15 bg-[#09090b] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] sm:p-8">
          {/* Logo & Headline */}
          <div className="text-center">
            <Link to="/" className="inline-block transition-opacity hover:opacity-85">
              <BugMark className="mx-auto h-12 w-12 text-white fill-white" />
            </Link>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              AI-assisted code review and risk triage across your repositories.
            </p>
          </div>

          {/* Equal First-Class Dual OAuth Buttons: GitHub and Google */}
          <div className="mt-6 space-y-2.5">
            {/* Continue with GitHub */}
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={Boolean(busyProvider)}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/5 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyProvider === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
              ) : (
                <Github className="h-4 w-4 text-white" />
              )}
              <span>{busyProvider === "github" ? "Connecting to GitHub…" : "Continue with GitHub"}</span>
            </button>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={Boolean(busyProvider)}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/5 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyProvider === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              <span>{busyProvider === "google" ? "Connecting to Google…" : "Continue with Google"}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[#09090b] px-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Or continue with email
            </span>
          </div>

          {/* Mode Switcher Pills */}
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/50 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-md py-1.5 transition-colors ${
                mode === "signin"
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-md py-1.5 transition-colors ${
                mode === "signup"
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Email / Password Form */}
          <form className="space-y-3.5" onSubmit={handleEmail}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-xl border-white/15 bg-black/60 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:ring-1 focus:ring-white/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                  Password
                </Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => toast.info("Please use your registered email or GitHub account to access Buggers.")}
                    className="text-[11px] text-slate-400 hover:text-white hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-xl border-white/15 bg-black/60 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:ring-1 focus:ring-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-[11px] text-slate-500">Must be at least 6 characters.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={Boolean(busyProvider)}
              className="mt-2 h-10 w-full rounded-xl bg-white font-semibold text-black hover:bg-slate-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyProvider === "email" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </span>
              ) : mode === "signin" ? (
                "Sign In with Email"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Security Guarantee */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>End-to-end encrypted repository credentials</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Buggers uses read-only tokens for pull request risk triage.</span>
        </div>
      </footer>
    </div>
  );
}
