import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Github,
  Loader2,
  Mail,
  User,
  Shield,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [busyProvider, setBusyProvider] = useState<"github" | "google" | "email" | null>(null);

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
    <div className="min-h-screen w-full bg-[#12141a] flex items-center justify-center p-4 sm:p-6 lg:p-10 text-slate-100 antialiased">
      {/* Outer Floating Window Container (Matching Image 2) */}
      <div className="relative w-full max-w-4xl rounded-[28px] overflow-hidden bg-[#181d29] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.85)] grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Form Panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-between md:col-span-7 bg-[#181d29] z-10">
          {/* Top Bar inside Card */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="h-3.5 w-3.5 rounded-full bg-[#0084ff] shadow-[0_0_10px_rgba(0,132,255,0.8)]" />
              <span className="text-sm font-semibold tracking-tight text-white group-hover:text-slate-200">
                Buggers app.
              </span>
            </Link>

            <div className="flex items-center gap-5 text-xs font-medium text-slate-400">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="hover:text-white transition-colors"
              >
                {mode === "signup" ? "Join" : "Create"}
              </button>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="mt-8 mb-6">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              START FOR FREE
            </span>

            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {mode === "signup" ? (
                <>
                  Create new account<span className="text-[#0084ff]">.</span>
                </>
              ) : (
                <>
                  Welcome back<span className="text-[#0084ff]">.</span>
                </>
              )}
            </h1>

            <p className="mt-2 text-xs text-slate-400">
              {mode === "signup" ? "Already A Member? " : "Need an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="text-[#0084ff] font-medium hover:underline"
              >
                {mode === "signup" ? "Log In" : "Sign Up"}
              </button>
            </p>

            {/* Input Form */}
            <form className="mt-7 space-y-3.5" onSubmit={handleSubmit}>
              {/* First & Last name row (when in sign-up mode) */}
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-xl border border-white/10 bg-[#212736] px-3.5 py-2 transition-all focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
                    <label className="block text-[10px] font-medium text-slate-400">First name</label>
                    <div className="flex items-center justify-between">
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

                  <div className="relative rounded-xl border border-white/10 bg-[#212736] px-3.5 py-2 transition-all focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
                    <label className="block text-[10px] font-medium text-slate-400">Last name</label>
                    <div className="flex items-center justify-between">
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

              {/* Email row */}
              <div className="relative rounded-xl border border-white/10 bg-[#212736] px-3.5 py-2 transition-all focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
                <label className="block text-[10px] font-medium text-slate-400">Email</label>
                <div className="flex items-center justify-between">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="michal.masiak@anywhere.co"
                    className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 opacity-70" />
                </div>
              </div>

              {/* Password row */}
              <div className="relative rounded-xl border border-[#0084ff] ring-2 ring-[#0084ff]/20 bg-[#212736] px-3.5 py-2 transition-all">
                <label className="block text-[10px] font-medium text-[#0084ff]">Password</label>
                <div className="flex items-center justify-between">
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
                    className="text-slate-400 hover:text-white shrink-0 ml-1"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Bottom Action Buttons (Matching Image 2) */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowOAuthModal(!showOAuthModal)}
                  className="rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white px-5 py-2.5 text-xs font-medium transition-all active:scale-[0.985] flex items-center gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5 text-slate-300" />
                  <span>Change method</span>
                </button>

                <button
                  type="submit"
                  disabled={Boolean(busyProvider)}
                  className="rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white px-7 py-2.5 text-xs font-semibold shadow-[0_0_24px_rgba(0,132,255,0.45)] transition-all active:scale-[0.985] flex items-center gap-2 disabled:opacity-50"
                >
                  {busyProvider === "email" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <span>{mode === "signup" ? "Create account" : "Log In"}</span>
                  )}
                </button>
              </div>
            </form>

            {/* Quick OAuth Selection Modal / Card when "Change method" clicked */}
            {showOAuthModal && (
              <div className="mt-4 rounded-xl border border-white/15 bg-[#141824] p-3.5 space-y-2 animate-fade-in">
                <p className="text-[11px] font-medium text-slate-400 mb-2">Continue with third-party authentication:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOAuth("github")}
                    disabled={Boolean(busyProvider)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-3 text-xs font-semibold text-white transition-all"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    disabled={Boolean(busyProvider)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-3 text-xs font-semibold text-white transition-all"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    <span>Google</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer security note */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-2">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>End-to-end encrypted repository credentials.</span>
          </div>
        </div>

        {/* Right Photo Panel (Matching Image 2) */}
        <div
          className="relative hidden md:block md:col-span-5 bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: `url('/auth-bg.jpg')` }}
        >
          {/* Subtle dark gradient overlay blending into left panel */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#181d29] via-transparent to-black/40" />

          {/* Organic soft curved boundary line on left edge */}
          <svg
            className="absolute left-0 top-0 bottom-0 h-full w-12 text-[#181d29] pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 Q30,50 0,100 L0,0 Z"
              fill="currentColor"
            />
          </svg>

          {/* Bottom-right stylized watermark logo matching Image 2 */}
          <div className="absolute bottom-8 right-8 text-white/90 font-black tracking-tighter text-2xl flex items-center gap-1 select-none pointer-events-none drop-shadow-md">
            <span>.AW</span>
          </div>
        </div>
      </div>
    </div>
  );
}
