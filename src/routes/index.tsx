import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileCode,
  GitPullRequest,
  Github,
  Play,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buggers — Review with ease" },
      {
        name: "description",
        content:
          "Review smarter with AI that understands your repository. So you can take a breath.",
      },
      { property: "og:title", content: "Buggers — Review with ease" },
      {
        property: "og:description",
        content:
          "AI-assisted code review and bug triage powered by your GitHub repository history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

export function Landing() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-[#f4f6f8] text-slate-900 antialiased overflow-x-hidden">
      {/* Floating Pill Header — Clean, focused, only useful options */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <div className="flex items-center gap-5 sm:gap-7 rounded-full bg-white/95 backdrop-blur-md px-5 py-2 sm:px-6 sm:py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-black/5 text-xs font-medium text-slate-700">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900 transition-opacity hover:opacity-85">
            <div className="h-4 w-4 rounded-full border-[2.5px] border-orange-500 bg-orange-100 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            </div>
            <span className="tracking-tight text-sm font-bold text-slate-900">Buggers</span>
          </Link>

          {/* Useful Header Options Only */}
          <nav className="flex items-center gap-5 text-slate-700 font-medium">
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="flex items-center gap-1.5 transition-colors hover:text-black font-semibold cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              <span>How it works</span>
            </button>

            <a
              href="https://github.com/jaidevxr/buggers"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 transition-colors hover:text-black"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </nav>

          {/* Login Pill Button */}
          <Link
            to="/auth"
            className="rounded-full bg-[#15171c] text-white px-5 py-1.5 text-xs font-semibold hover:bg-black transition-colors shadow-xs active:scale-[0.985]"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Main Full-Bleed Scenic Hero Section (Matching Image 1) */}
      <section
        id="hero"
        className="relative min-h-screen w-full bg-cover bg-center flex flex-col justify-between pt-32 pb-10 px-4 sm:px-6"
        style={{ backgroundImage: `url('/landing-bg.jpg')` }}
      >
        {/* Soft atmospheric gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20 pointer-events-none" />

        {/* Top Spacer */}
        <div className="relative z-10" />

        {/* Centered Hero Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-medium text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-black/5 animate-fade-in">
            <span>AI Code Review 2026🚀</span>
          </div>

          {/* Heading */}
          <h1 className="mt-7 font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 drop-shadow-xs">
            Review with ease.
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-xl mx-auto text-sm sm:text-base text-slate-800 font-normal leading-relaxed drop-shadow-xs">
            Review smarter with AI that understands your repository. <br />
            So you can take a breath.
          </p>

          {/* Action Buttons */}
          <div className="mt-9 flex items-center justify-center gap-4">
            <Link
              to="/auth"
              className="rounded-full bg-white text-slate-900 px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-semibold shadow-lg shadow-black/10 hover:bg-slate-50 transition-all active:scale-[0.985] flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="rounded-full bg-black/10 backdrop-blur-md px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-slate-900 hover:bg-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>See How it Works</span>
            </button>
          </div>
        </div>

        {/* Bottom SCROLL Indicator */}
        <div className="relative z-10 mx-auto pt-10">
          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/25 backdrop-blur-md px-4 py-1.5 text-[11px] font-mono tracking-widest text-white/95 border border-white/20 shadow-md hover:bg-black/35 transition-all cursor-pointer"
          >
            <span>HOW IT WORKS</span>
            <span>↓</span>
          </button>
        </div>
      </section>

      {/* Interactive "How It Works" Overlay (Shows when clicked from header or hero) */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-[#0d1117] border border-white/15 text-slate-100 shadow-2xl overflow-hidden my-auto animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#161b22] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
                <h2 className="font-display font-bold text-sm sm:text-base text-white">
                  How Buggers Works: Pull Request Triage
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* 4-Step Process Strip */}
              <div className="grid gap-3 sm:grid-cols-4 font-mono text-xs">
                <div className="rounded-xl border border-white/10 bg-[#161b22] p-3">
                  <span className="text-orange-400 font-semibold">01. Webhook</span>
                  <p className="mt-1 text-[11px] text-slate-400">PR opens on your repo & triggers analysis in &lt;1s.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#161b22] p-3">
                  <span className="text-blue-400 font-semibold">02. History Churn</span>
                  <p className="mt-1 text-[11px] text-slate-400">Reads git history to find past defect-prone files.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#161b22] p-3">
                  <span className="text-rose-400 font-semibold">03. Risk Scoring</span>
                  <p className="mt-1 text-[11px] text-slate-400">Calculates deterministic 0-100 risk score.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#161b22] p-3">
                  <span className="text-emerald-400 font-semibold">04. AI Triage</span>
                  <p className="mt-1 text-[11px] text-slate-400">Posts grounded fixes directly on modified lines.</p>
                </div>
              </div>

              {/* Real Triage Scenario Card */}
              <div className="rounded-xl border border-white/10 bg-[#161b22] p-4 text-xs font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-slate-400 font-semibold">payment-service #184</span>
                    <span className="text-white ml-2">Fix payment validation</span>
                  </div>
                  <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-rose-300 font-semibold text-[11px]">
                    Risk: HIGH · 82
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Critical: Partial capture amount silently overwritten</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>High: Refund no longer wrapped in a transaction</span>
                  </div>
                </div>

                {/* Diff Preview */}
                <div className="mt-3.5 overflow-hidden rounded-lg border border-white/10 bg-[#090d16] p-2 text-[11px]">
                  <div className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    − if amount &lt;= order.total:
                  </div>
                  <div className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mt-0.5">
                    + if amount != order.total:
                  </div>
                  <div className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mt-0.5">
                    + &nbsp; amount = order.total
                  </div>
                </div>

                {/* AI Advice */}
                <div className="mt-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-slate-300 text-[11px] leading-relaxed">
                  <span className="font-semibold text-purple-300">AI Suggested Remediation:</span> Logic inversion detected. Wrap operation in a database transaction to protect account balance consistency.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">Ready to test on your own repository?</span>
                <Link
                  to="/auth"
                  className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-slate-200 transition-colors"
                >
                  Connect GitHub & Start Reviewing →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="bg-slate-900 py-10 px-4 sm:px-6 text-xs text-slate-400">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-medium">
            <div className="h-3 w-3 rounded-full border-2 border-orange-500 bg-orange-100" />
            <span>Buggers</span>
            <span className="text-slate-500 text-[11px]">&copy; 2026 Buggers, Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How it works
            </button>
            <a href="https://github.com/jaidevxr/buggers" target="_blank" rel="noreferrer" className="hover:text-white">
              GitHub
            </a>
            <Link to="/auth" className="hover:text-white">
              Sign In
            </Link>
            <span className="text-emerald-400 font-mono text-[11px]">All Systems Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
