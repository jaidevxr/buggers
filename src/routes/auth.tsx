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
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BugMark } from "@/components/brand/BugMark";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Buggers – Sign in & Sign up" },
      {
        name: "description",
        content: "Sign in or create your Buggers account to analyze pull requests.",
      },
      { property: "og:title", content: "Buggers – Sign in & Sign up" },
      {
        property: "og:description",
        content: "Continue with GitHub, Google, or Email to start reviewing code with AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preload", href: "/landing-bg.webp", as: "image", type: "image/webp" },
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
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busyProvider, setBusyProvider] = useState<"github" | "google" | "email" | null>(null);

  // Silky smooth entrance transition stage
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
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
    <div className="min-h-screen w-full relative overflow-x-hidden antialiased selection:bg-white/20 bg-transparent text-slate-100 flex flex-col justify-between">
      {/* Main Content Layout */}
      <div className="relative z-10 min-h-screen w-full flex flex-col justify-between">
        {/* Symmetrical Centered Form Card with Linear Glide Animation */}
        <main className="w-full flex-1 flex items-center justify-center px-4 pt-28 pb-12 sm:pt-32 sm:pb-16">
          <div
            className={`w-full max-w-md mx-auto rounded-2xl border border-white/[0.08] bg-[#0c0d10]/95 backdrop-blur-xl p-7 sm:p-9 shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.03)] space-y-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              mounted
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-[0.985]"
            }`}
          >
            {/* Header & Mode Segmented Switcher */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono font-medium tracking-wider text-[#8a8f98] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Instant Workspace Access</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                {mode === "signin" ? "Welcome back" : "Create new account"}
              </h1>

              {/* Linear-Style Segmented Tab Switcher */}
              <div className="relative flex rounded-xl bg-[#121316] p-1 border border-white/[0.08]">
                <div
                  className="absolute top-1 bottom-1 rounded-lg bg-white/[0.08] border border-white/[0.12] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                  style={{
                    left: mode === "signin" ? "4px" : "calc(50% + 2px)",
                    width: "calc(50% - 6px)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`relative z-10 w-1/2 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer text-center ${
                    mode === "signin" ? "text-white font-semibold" : "text-[#8a8f98] hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`relative z-10 w-1/2 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer text-center ${
                    mode === "signup" ? "text-white font-semibold" : "text-[#8a8f98] hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Symmetrical Social OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={Boolean(busyProvider)}
                className="flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#121316] hover:bg-[#18191c] hover:border-white/[0.16] hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)] px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {busyProvider === "github" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                ) : (
                  <Github className="h-4 w-4 text-white" />
                )}
                <span className="truncate">{busyProvider === "github" ? "Connecting…" : "GitHub"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={Boolean(busyProvider)}
                className="flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#121316] hover:bg-[#18191c] hover:border-white/[0.16] hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)] px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {busyProvider === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                ) : (
                  <GoogleIcon className="h-4 w-4" />
                )}
                <span className="truncate">{busyProvider === "google" ? "Connecting…" : "Google"}</span>
              </button>
            </div>

            {/* Symmetrical Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="w-full border-t border-white/[0.08]" />
              <span className="absolute bg-[#0c0d10] px-3 font-mono text-[10px] uppercase tracking-wider text-[#8a8f98]">
                Or continue with email
              </span>
            </div>

            {/* Form Fields with Fluid Height Accordion for Name Fields */}
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div
                className={`grid grid-cols-2 gap-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                  mode === "signup"
                    ? "max-h-24 opacity-100 scale-100 mb-0"
                    : "max-h-0 opacity-0 scale-98 pointer-events-none mb-0"
                }`}
              >
                <div className="rounded-xl border border-white/[0.08] bg-[#121316] px-4 py-2.5 transition-all duration-200 hover:border-white/[0.14] focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/[0.06] focus-within:shadow-[0_0_16px_rgba(255,255,255,0.03)]">
                  <label className="block text-[10px] font-medium text-[#8a8f98]">First name</label>
                  <div className="flex items-center justify-between mt-0.5">
                    <input
                      type="text"
                      required={mode === "signup"}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                    />
                    <User className="h-3.5 w-3.5 text-zinc-500 shrink-0 ml-1" />
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#121316] px-4 py-2.5 transition-all duration-200 hover:border-white/[0.14] focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/[0.06] focus-within:shadow-[0_0_16px_rgba(255,255,255,0.03)]">
                  <label className="block text-[10px] font-medium text-[#8a8f98]">Last name</label>
                  <div className="flex items-center justify-between mt-0.5">
                    <input
                      type="text"
                      required={mode === "signup"}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                    />
                    <User className="h-3.5 w-3.5 text-zinc-500 shrink-0 ml-1" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#121316] px-4 py-2.5 transition-all duration-200 hover:border-white/[0.14] focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/[0.06] focus-within:shadow-[0_0_16px_rgba(255,255,255,0.03)]">
                <label className="block text-[10px] font-medium text-[#8a8f98]">Email address</label>
                <div className="flex items-center justify-between mt-0.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                  <Mail className="h-3.5 w-3.5 text-zinc-500 shrink-0 ml-1" />
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#121316] px-4 py-2.5 transition-all duration-200 hover:border-white/[0.14] focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/[0.06] focus-within:shadow-[0_0_16px_rgba(255,255,255,0.03)]">
                <label className="block text-[10px] font-medium text-[#8a8f98]">Password</label>
                <div className="flex items-center justify-between mt-0.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/[0.06] shrink-0 ml-1 cursor-pointer transition-colors duration-150"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={Boolean(busyProvider)}
                  className="w-full rounded-xl bg-white hover:bg-neutral-100 text-black py-2.5 text-xs font-semibold shadow-md hover:shadow-[0_0_24px_rgba(255,255,255,0.18)] transition-all duration-200 active:scale-[0.985] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {busyProvider === "email" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                      <span>Authenticating…</span>
                    </>
                  ) : (
                    <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
                  )}
                </button>
              </div>
            </form>

            {/* Mode Switcher Secondary Footer Link */}
            <p className="text-center text-xs text-[#8a8f98] pt-1">
              {mode === "signin" ? "Need an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-white font-medium hover:underline cursor-pointer transition-colors duration-150"
              >
                {mode === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>
        </main>

        {/* Bottom Footer Row */}
        <footer className="w-full flex items-center justify-between px-6 sm:px-12 lg:px-20 pb-6 sm:pb-8 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Encrypted zero-trust repository credentials</span>
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/60 font-mono text-xs select-none bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <BugMark className="h-3.5 w-3.5 text-white/60 fill-white/60" />
              <span className="font-semibold tracking-widest text-[10px]">BUGGERS</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
