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
      className="min-h-screen w-full relative overflow-x-hidden antialiased selection:bg-white/20 bg-cover bg-center bg-no-repeat text-slate-100 flex flex-col justify-between"
      style={{ backgroundImage: `url('/landing-bg.png')` }}
    >
      {/* Overall backdrop tint: subtly darker on the side where the form sits, preserving the full background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#07090e]/92 via-[#07090e]/65 to-black/20 pointer-events-none" />

      {/* Main Content Layout */}
      <div className="relative z-10 min-h-screen w-full flex flex-col justify-between">
        {/* Top Header across the top */}
        <header className="w-full flex items-center justify-between px-6 sm:px-12 lg:px-20 pt-6 sm:pt-8">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-white hover:opacity-85 transition-opacity">
            <BugMark className="h-5 w-5 text-white fill-white" />
            <span className="text-sm font-bold tracking-tight">Buggers</span>
          </Link>
          <div className="flex items-center gap-6 text-xs font-medium text-slate-300">
            <Link to="/" className="hover:text-white transition-colors duration-200">Home</Link>
            <Link to="/docs" className="hover:text-white transition-colors duration-200">Docs</Link>
          </div>
        </header>

        {/* Center/Side Form - Comfortably sized and spacious, NOT compressed against left */}
        <div className="w-full max-w-xl lg:max-w-2xl px-6 sm:px-12 lg:px-20 py-8 my-auto space-y-6">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              START FOR FREE
            </span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {mode === "signin" ? (
                <>Welcome back<span className="text-[#0084ff]">.</span></>
              ) : (
                <>Create new account<span className="text-[#0084ff]">.</span></>
              )}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
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

          {/* Symmetrical Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={Boolean(busyProvider)}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 active:scale-[0.985] cursor-pointer disabled:opacity-50 backdrop-blur-xs"
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
              className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 active:scale-[0.985] cursor-pointer disabled:opacity-50 backdrop-blur-xs"
            >
              {busyProvider === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              <span className="truncate">{busyProvider === "google" ? "Connecting…" : "Google"}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-[#0c1017]/80 backdrop-blur-sm px-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Or continue with email
            </span>
          </div>

          {/* Form Fields */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-[#121620]/90 px-4 py-2.5 transition-all duration-200 focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
                  <label className="block text-[10px] font-medium text-slate-400">First name</label>
                  <div className="flex items-center justify-between mt-0.5">
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Michał"
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 opacity-70" />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#121620]/90 px-4 py-2.5 transition-all duration-200 focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
                  <label className="block text-[10px] font-medium text-slate-400">Last name</label>
                  <div className="flex items-center justify-between mt-0.5">
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Masiak"
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 opacity-70" />
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-[#121620]/90 px-4 py-2.5 transition-all duration-200 focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
              <label className="block text-[10px] font-medium text-slate-400">Email</label>
              <div className="flex items-center justify-between mt-0.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 opacity-70" />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#121620]/90 px-4 py-2.5 transition-all duration-200 focus-within:border-[#0084ff] focus-within:ring-2 focus-within:ring-[#0084ff]/20">
              <label className="block text-[10px] font-medium text-slate-400">Password</label>
              <div className="flex items-center justify-between mt-0.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none font-mono"
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

            {/* Action Buttons Row */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 px-4 py-2.5 text-xs font-medium text-slate-300 transition-all duration-200 active:scale-[0.985] cursor-pointer"
              >
                {mode === "signin" ? "Create account" : "Log In"}
              </button>

              <button
                type="submit"
                disabled={Boolean(busyProvider)}
                className="flex-1 rounded-xl bg-[#0084ff] hover:bg-[#0074e0] text-white py-2.5 text-xs font-semibold shadow-md transition-all duration-200 active:scale-[0.985] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {busyProvider === "email" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>{mode === "signin" ? "Sign In" : "Create account"}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Footer Row */}
        <footer className="w-full flex items-center justify-between px-6 sm:px-12 lg:px-20 pb-6 sm:pb-8 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Encrypted repository credentials</span>
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/50 font-mono text-xs select-none bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <BugMark className="h-3.5 w-3.5 text-white/50 fill-white/50" />
              <span className="font-semibold tracking-widest text-[10px]">BUGGERS</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
