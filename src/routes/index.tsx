import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  FileCode,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Play,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

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
  const [mousePos, setMousePos] = useState({ x: 50, y: 55 });

  // Subtle natural cursor ambient drift
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#07090e] text-slate-100 antialiased overflow-x-hidden selection:bg-white/20">
      {/* Floating Pill Header — Clean, focused, official BugMark, Docs & How it works */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <div className="flex items-center gap-6 sm:gap-8 rounded-full bg-black/75 backdrop-blur-md px-6 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-white/10 text-xs font-medium text-slate-200 transition-all duration-300">
          {/* Official Buggers Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold text-white transition-opacity duration-200 hover:opacity-85"
          >
            <BugMark className="h-5 w-5 text-white fill-white" />
            <span className="tracking-tight text-sm font-bold text-white">
              Buggers
            </span>
          </Link>

          {/* Useful Header Navigation */}
          <nav className="flex items-center gap-6 text-slate-300 font-medium">
            <Link
              to="/how-it-works"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors duration-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>How it works</span>
            </Link>
            <Link
              to="/docs"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors duration-200"
            >
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              <span>Docs</span>
            </Link>
          </nav>

          {/* Login Pill Button */}
          <Link
            to="/auth"
            className="rounded-full bg-white text-black px-5 py-1.5 text-xs font-semibold hover:bg-slate-200 transition-all duration-200 shadow-xs active:scale-[0.985]"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Main Full-Bleed Atmospheric Night Studio Hero Section (4K Uncompressed Background) */}
      <section
        id="hero"
        className="relative min-h-screen w-full bg-cover bg-center flex flex-col justify-center items-center px-4 sm:px-6 py-24"
        style={{ backgroundImage: `url('/landing-bg.png')` }}
      >
        {/* Soft atmospheric night vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/60 pointer-events-none" />

        {/* Natural Ambient Lamp Breathing Animation (Positioned near the warm desk lamp) */}
        <div className="pointer-events-none absolute left-[38%] bottom-[28%] -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl animate-lamp-breathe" />

        {/* Subtle, Organic Lakeside Light Twinkling (Distant cottage reflections on the water) */}
        <div className="pointer-events-none absolute left-[49%] top-[48%] h-1.5 w-1.5 rounded-full bg-amber-200/60 blur-[0.5px] animate-soft-twinkle-1" />
        <div className="pointer-events-none absolute left-[53%] top-[50%] h-1 w-1 rounded-full bg-amber-100/70 blur-[0.5px] animate-soft-twinkle-2" />
        <div className="pointer-events-none absolute left-[56%] top-[49%] h-1.5 w-1.5 rounded-full bg-amber-300/60 blur-[0.5px] animate-soft-twinkle-3" />

        {/* Gentle, Natural Warm Filament Accent Following Cursor (Zero neon, zero harsh bloom) */}
        <div
          className="pointer-events-none absolute h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.04] blur-3xl transition-all duration-700 ease-out"
          style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
        />

        {/* Centered Hero Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Main Heading: Buggers */}
          <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
            Buggers
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            Review smarter with AI that understands your repository. <br />
            So you can take a breath.
          </p>

          {/* Action Buttons with silky smooth micro-interactions */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/auth"
              className="rounded-full bg-white text-black px-8 py-3.5 text-xs sm:text-sm font-semibold shadow-xl shadow-black/40 hover:bg-slate-200 transition-all duration-300 active:scale-[0.985] flex items-center gap-2 hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/how-it-works"
              className="rounded-full bg-black/40 backdrop-blur-md px-7 py-3.5 text-xs sm:text-sm font-medium text-white hover:bg-black/65 border border-white/15 transition-all duration-300 flex items-center gap-2 active:scale-[0.985] hover:-translate-y-0.5"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>See How it Works</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* AUTHENTIC BUGGERS PRODUCT SECTION (Pure project functionality) */}
      {/* ======================================================== */}
      <section className="relative z-10 bg-[#0a0c10] border-t border-white/10 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-20">

          {/* Section 1: Live Triage Showcase — PR #184 */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1 text-xs font-mono text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Real Pull Request Triage</span>
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Grounded triage citing real diff line numbers
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
                Buggers inspects the raw unified diff against your repository churn history to surface high-risk logic flaws before merge.
              </p>
            </div>

            {/* PR #184 Card */}
            <div className="rounded-3xl border border-white/15 bg-[#11141e] p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-amber-400 font-semibold">
                      PR #184: payment-service
                    </span>
                    <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-0.5 text-xs font-semibold text-rose-400 font-mono">
                      HIGH · 82 Risk
                    </span>
                  </div>
                  <h3 className="mt-1 text-base sm:text-lg font-bold text-white">
                    Fix payment validation
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">
                    mira-k · 3 files · +204 −74
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Analysis Ready
                </span>
              </div>

              {/* Findings List */}
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
                  <span className="rounded-md bg-rose-500/20 text-rose-400 px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-rose-500/30">
                    Critical
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-200">
                    Partial capture amount silently overwritten
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
                  <span className="rounded-md bg-amber-500/20 text-amber-400 px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-amber-500/30">
                    High
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-200">
                    Refund no longer wrapped in a transaction
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
                  <span className="rounded-md bg-blue-500/20 text-blue-400 px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-blue-500/30">
                    Medium
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-200">
                    Empty card number treated as valid
                  </span>
                </div>
              </div>

              {/* Real Diff Code Box */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black font-mono text-xs">
                <div className="border-b border-white/10 bg-white/5 px-4 py-2 text-slate-400 text-[11px] flex items-center justify-between">
                  <span>src/services/paymentValidator.ts</span>
                  <span>Lines 42–44</span>
                </div>
                <div className="p-3.5 space-y-1 text-[11px]">
                  <div className="rounded bg-rose-500/15 text-rose-300 px-2.5 py-1">
                    − if amount &lt;= order.total:
                  </div>
                  <div className="rounded bg-emerald-500/15 text-emerald-300 px-2.5 py-1">
                    + if amount != order.total:
                  </div>
                  <div className="rounded bg-emerald-500/15 text-emerald-300 px-2.5 py-1">
                    + &nbsp; amount = order.total
                  </div>
                </div>
              </div>

              {/* Verified Remediation Advisory */}
              <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-amber-300 text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Remediation Suggestion</span>
                </div>
                <p className="mt-2 text-slate-300">
                  Logic inversion detected: Comparing with <code className="font-mono text-amber-300">!=</code> causes partial refunds to overwrite total amounts. Wrap operations in a database transaction to prevent financial state race conditions.
                </p>
                <div className="mt-3 flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified against repository churn history</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: 4 Core Pillars of Buggers */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#11141e] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <Zap className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-semibold text-orange-400 block">
                01 · Instant Webhook
              </span>
              <h3 className="text-base font-semibold text-white">Sub-Second Trigger</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                PR openings and pushes trigger AST diff evaluation via HMAC-verified webhooks without poll delays.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11141e] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-semibold text-blue-400 block">
                02 · Commit Churn
              </span>
              <h3 className="text-base font-semibold text-white">Historical Context</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Correlates changed functions with past rollback commits and defect density in that file.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11141e] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-semibold text-rose-400 block">
                03 · Risk Scoring
              </span>
              <h3 className="text-base font-semibold text-white">P95 Regression Rate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic 0-100 score weighing cyclomatic complexity, test delta, and critical mutation paths.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11141e] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-400 block">
                04 · Grounded Fixes
              </span>
              <h3 className="text-base font-semibold text-white">Zero Phantom Lines</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI remediations cite real diff line numbers only. Hallucinated file paths are strictly discarded.
              </p>
            </div>
          </div>

          {/* Section 3: Simple Repository Config (.buggers.yml) */}
          <div className="rounded-3xl border border-white/10 bg-[#11141e] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-mono text-amber-300">
                <FileCode className="h-3.5 w-3.5" />
                <span>Repository Policy</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Simple declarative configuration
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Add a <code className="font-mono text-amber-300 bg-white/5 px-1.5 py-0.5 rounded">.buggers.yml</code> to your repository root to configure thresholds, block merge on critical bugs, and specify ignored paths.
              </p>
              <div className="pt-2">
                <Link
                  to="/docs"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <span>View config options in Docs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="w-full md:w-auto rounded-2xl bg-black border border-white/10 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              <div className="text-[11px] text-slate-500 border-b border-white/10 pb-2 mb-2">
                .buggers.yml
              </div>
              <pre className="text-[11px] leading-relaxed">
{`version: 1
risk:
  threshold: 75
  fail_on_critical: true
ignore:
  paths:
    - "docs/**"
    - "**/*.spec.ts"`}
              </pre>
            </div>
          </div>

          {/* Section 4: Final Call to Action */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#141824] to-[#0a0c10] p-8 sm:p-12 text-center space-y-5">
            <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to review pull requests with ease?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Connect your GitHub repository. Buggers runs non-blocking checks on your next pull request.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth"
                className="w-full sm:w-auto rounded-full bg-white text-black px-8 py-3 text-xs sm:text-sm font-semibold shadow-xl hover:bg-slate-200 transition-all active:scale-[0.985] flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="w-full sm:w-auto rounded-full bg-white/5 border border-white/15 px-7 py-3 text-xs sm:text-sm font-medium text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>See How it Works</span>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Minimal Dark Footer */}
      <footer className="bg-black py-10 px-4 sm:px-6 text-xs text-slate-500 border-t border-white/10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-slate-300 font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-slate-500 text-[11px]">
              &copy; 2026 Buggers, Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/how-it-works"
              className="hover:text-white transition-colors duration-200"
            >
              How it works
            </Link>
            <Link
              to="/docs"
              className="hover:text-white transition-colors duration-200"
            >
              Docs
            </Link>
            <Link
              to="/auth"
              className="hover:text-white transition-colors duration-200"
            >
              Sign In
            </Link>
            <span className="text-emerald-400 font-mono text-[11px]">
              All Systems Normal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
