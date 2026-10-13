import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Github,
  Loader2,
  Mail,
  User,
  Shield,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BugMark } from "@/components/brand/BugMark";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Buggers — Sign in & Sign up" },
      {
        name: "description",
        content: "Sign in or create your Buggers account to analyze pull requests.",
      },
      { property: "og:title", content: "Buggers — Sign in & Sign up" },
      {
        property: "og:description",
        content: "Continue with GitHub, Google, or Email to start reviewing code with AI.",
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busyProvider, setBusyProvider] = useState<"github" | "google" | "email" | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleDemoLogin() {
    setBusyProvider("email");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "demo@buggers.com",
        password: "BuggersDemo2026!",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.session) {
        toast.success("Welcome! Logged in as demo reviewer.");
        navigate({ to: "/dashboard" });
      }
    } catch {
      toast.error("Failed to sign in with demo credentials.");
    } finally {
      setBusyProvider(null);
    }
  }

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
        toast.error(`${provider === "github" ? "GitHub" : "Google"} authentication failed.`);
        return;
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to connect with ${provider}.`;
      toast.error(msg);
    } finally {
      setBusyProvider(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusyProvider("email");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          toast.success("Account created! Redirecting to dashboard...");
          navigate({ to: "/dashboard" });
        } else {
          toast.info("Account created. Please check your email to confirm or log in.");
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
    <div
      className="min-h-screen w-full bg-cover bg-center flex flex-col justify-between items-center relative p-4 sm:p-6 lg:p-10 text-slate-100 antialiased selection:bg-white/20"
      style={{ backgroundImage: `url('/landing-bg.png')` }}
    >
      {/* Whole Screen Dark Overlay (Making it darker and atmospheric as requested) */}
      <div className="absolute inset-0 bg-black/82 backdrop-blur-[3px] pointer-events-none" />

      {/* Top Header Link */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between py-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors duration-200 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Back to Buggers</span>
        </Link>

        <Link to="/" className="flex items-center gap-2 font-semibold text-white transition-opacity duration-200 hover:opacity-85">
          <BugMark className="h-5 w-5 text-white fill-white" />
          <span className="text-sm font-bold tracking-tight text-white">Buggers</span>
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 w-full max-w-md my-auto py-6">
        <div className="w-full rounded-3xl border border-white/10 bg-[#0e121a]/90 backdrop-blur-xl p-8 sm:p-9 shadow-[0_30px_90px_rgba(0,0,0,0.9)] transition-all duration-300">
          {/* Logo & Headline */}
          <div className="text-center">
            <BugMark className="mx-auto h-10 w-10 text-white fill-white" />

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                START FOR FREE
              </span>
            </div>

            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {mode === "signin" ? (
                <>
                  Welcome back<span className="text-[#0084ff]">.</span>
                </>
              ) : (
                <>
                  Create account<span className="text-[#0084ff]">.</span>
                </>
              )}
            </h1>

            <p className="mt-2 text-xs text-slate-400">
              {mode === "signin" ? "Need an account? " : "Already a member? "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-[#0084ff] font-semibold hover:underline cursor-pointer transition-colors duration-200"
              >
                {mode === "signin" ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>

          {/* Symmetrical Google and GitHub Options AT TOP FIRST (As Requested!) */}
          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={Boolean(busyProvider)}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 px-4 py-3 text-xs font-semibold text-white transition-all duration-200 active:scale-[0.985] cursor-pointer disabled:opacity-50"
            >
              {busyProvider === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
              ) : (
                <Github className="h-4 w-4 text-white" />
              )}
              <span>{busyProvider === "github" ? "Connecting to GitHub…" : "Continue with GitHub"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={Boolean(busyProvider)}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 px-4 py-3 text-xs font-semibold text-white transition-all duration-200 active:scale-[0.985] cursor-pointer disabled:opacity-50"
            >
              {busyProvider === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              <span>{busyProvider === "google" ? "Connecting to Google…" : "Continue with Google"}</span>
            </button>

            {/* Instant Demo Sign-In (Guaranteed instant entry to Dashboard) */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={Boolean(busyProvider)}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 text-xs font-semibold text-amber-200 transition-all duration-200 active:scale-[0.985] cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>1-Click Instant Demo Login</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[#0e121a] px-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Or continue with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {/* First & Last Name (in Sign Up Mode) */}
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-xl border border-white/10 bg-[#161a24] px-3.5 py-2.5 transition-all duration-200 focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
                  <label className="block text-[10px] font-medium text-slate-400">First name</label>
                  <div className="flex items-center justify-between mt-0.5">
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Michał"
                      className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 opacity-70" />
                  </div>
                </div>

                <div className="relative rounded-xl border border-white/10 bg-[#161a24] px-3.5 py-2.5 transition-all duration-200 focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
                  <label className="block text-[10px] font-medium text-slate-400">Last name</label>
                  <div className="flex items-center justify-between mt-0.5">
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Masiak"
                      className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 opacity-70" />
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="relative rounded-xl border border-white/10 bg-[#161a24] px-3.5 py-2.5 transition-all duration-200 focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
              <label className="block text-[10px] font-medium text-slate-400">Email</label>
              <div className="flex items-center justify-between mt-0.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 opacity-70" />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative rounded-xl border border-white/10 bg-[#161a24] px-3.5 py-2.5 transition-all duration-200 focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
              <label className="block text-[10px] font-medium text-slate-400">Password</label>
              <div className="flex items-center justify-between mt-0.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white shrink-0 ml-1 cursor-pointer transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={Boolean(busyProvider)}
                className="w-full rounded-xl bg-[#0084ff] hover:bg-[#0074e0] text-white py-3 text-xs font-semibold shadow-[0_0_24px_rgba(0,132,255,0.45)] transition-all duration-200 active:scale-[0.985] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {busyProvider === "email" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>{mode === "signin" ? "Sign In with Email" : "Create Account with Email"}</span>
                )}
              </button>
            </div>
          </form>

          {/* Security note */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>End-to-end encrypted repository credentials.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-4xl text-center text-xs text-slate-500 py-2">
        <span>&copy; 2026 Buggers, Inc. All rights reserved.</span>
      </footer>
    </div>
  );
}
