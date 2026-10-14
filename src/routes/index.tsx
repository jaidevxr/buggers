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
      { title: "Buggers — Catch critical issues before they reach production" },
      {
        name: "description",
        content:
          "Buggers automatically reviews your pull requests, detects bugs, security risks, and code quality issues — so you can ship with confidence.",
      },
      { property: "og:title", content: "Buggers — Catch critical issues before they reach production" },
      {
        property: "og:description",
        content:
          "Buggers automatically reviews your pull requests, detects bugs, security risks, and code quality issues — so you can ship with confidence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preload", href: "/landing-bg.webp", as: "image", type: "image/webp" },
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
    <div className="relative min-h-screen w-full bg-transparent text-slate-100 antialiased overflow-x-hidden selection:bg-white/20 flex flex-col justify-between">
      {/* Main Full-Bleed Atmospheric Night Studio Hero Section (Rendered over persistent AtmosphericBackdrop) */}
      <section
        id="hero"
        className="relative min-h-screen w-full bg-transparent flex flex-col justify-center items-center px-4 sm:px-6 py-24 overflow-hidden"
      >
        {/* Subtle feathered fade at bottom edge into #08090a background */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08090a] via-[#08090a]/80 to-transparent pointer-events-none" />

        {/* Centered Hero Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Neutral Category Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/60 px-4 py-1 text-[11px] font-mono tracking-wider text-slate-300 shadow-sm backdrop-blur-md mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70 inline-block animate-pulse" />
            <span className="uppercase text-[10px] tracking-widest text-[#8a8f98]">Automated Code Review</span>
          </div>

          {/* Main Headline with Linear's neutral editorial contrast */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
            Catch critical issues <br />
            <span className="font-serif italic font-normal text-white tracking-wide px-1">
              before
            </span>{" "}
            they reach production
          </h1>

          {/* Subtitle in Linear's muted reference gray #8a8f98 */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            Buggers automatically reviews your pull requests, detects bugs, security risks, and code quality issues — so you can ship with confidence.
          </p>

          {/* Action Buttons with silky smooth micro-interactions */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/auth"
              preload="intent"
              viewTransition={true}
              className="rounded-full bg-white text-black px-8 py-3.5 text-xs sm:text-sm font-semibold shadow-xl shadow-black/40 hover:bg-slate-200 transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.985] flex items-center gap-2 hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/how-it-works"
              preload="intent"
              viewTransition={true}
              className="rounded-full bg-black/40 backdrop-blur-md px-7 py-3.5 text-xs sm:text-sm font-medium text-white hover:bg-black/65 border border-white/[0.08] transition-[background-color,color,transform,border-color] duration-150 flex items-center gap-2 active:scale-[0.985] hover:-translate-y-0.5"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>See How it Works</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* AUTHENTIC BUGGERS PRODUCT SHOWCASE (Linear-Style 2-Column Split) */}
      {/* ======================================================== */}
      <section className="relative z-10 bg-[#08090a] pt-12 sm:pt-20 pb-24 sm:pb-36">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">

          {/* Feature 1: Data & Regression Protection (Text on Left, PR #184 Card on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-[#8a8f98] uppercase">
                CODE REVIEW &amp; REGRESSION PROTECTION
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-[1.15]">
                Deterministic PR triage with whole-repo context
              </h2>
              <p className="text-sm sm:text-base text-[#8a8f98] leading-relaxed">
                Buggers inspects the raw unified diff against historical fault lines in your repository. Our deterministic engine detects silent state overwrites, unhandled transaction race conditions, and boundary flaws before code merges into production.
              </p>
              <div className="pt-2">
                <Link
                  to="/how-it-works"
                  preload="intent"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white hover:text-zinc-300 transition-colors group"
                >
                  <span>Explore triage architecture</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* PR #184 Realistic Triage Preview with Feathered Edges */}
            <div className="lg:col-span-7 relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141c]/90 via-[#0e1017]/90 to-[#08090a] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 hover:border-white/15">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-zinc-300 font-semibold">
                      PR #184: payment-service
                    </span>
                    <span className="rounded-full bg-rose-950/40 border border-rose-900/40 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300/80 font-mono">
                      HIGH · 82 Risk
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white">
                    Fix payment validation
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] text-[#8a8f98]">
                    mira-k · 3 files · +204 −74
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-mono text-emerald-300/80">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Analysis Ready
                </span>
              </div>

              {/* Real Findings */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-black/40 p-2.5">
                  <span className="rounded bg-rose-950/60 text-rose-300/90 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase border border-rose-900/50">
                    Critical
                  </span>
                  <span className="text-xs font-medium text-slate-200">
                    Partial capture amount silently overwritten
                  </span>
                </div>

                <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-black/40 p-2.5">
                  <span className="rounded bg-amber-950/60 text-amber-300/90 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase border border-amber-900/50">
                    High
                  </span>
                  <span className="text-xs font-medium text-slate-200">
                    Refund no longer wrapped in a transaction
                  </span>
                </div>

                <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-black/40 p-2.5">
                  <span className="rounded bg-slate-900 text-slate-300/90 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase border border-slate-800">
                    Medium
                  </span>
                  <span className="text-xs font-medium text-slate-200">
                    Empty card number treated as valid
                  </span>
                </div>
              </div>

              {/* Real Diff Code Box */}
              <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-black font-mono text-xs">
                <div className="border-b border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[#8a8f98] text-[11px] flex items-center justify-between">
                  <span>src/services/paymentValidator.ts</span>
                  <span>Lines 42–44</span>
                </div>
                <div className="p-3 space-y-1 text-[11px]">
                  <div className="rounded bg-rose-950/30 text-rose-300/80 px-2.5 py-1 border-l-2 border-rose-900/60">
                    − if amount &lt;= order.total:
                  </div>
                  <div className="rounded bg-emerald-950/30 text-emerald-300/80 px-2.5 py-1 border-l-2 border-emerald-900/60">
                    + if amount != order.total:
                  </div>
                  <div className="rounded bg-emerald-950/30 text-emerald-300/80 px-2.5 py-1 border-l-2 border-emerald-900/60">
                    + &nbsp; amount = order.total
                  </div>
                </div>
              </div>

              {/* Verified Remediation Advisory with Feathered Bottom Blend */}
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#0e121a]/80 p-3.5 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-slate-200 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
                  <span>AI Remediation Suggestion</span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#8a8f98]">
                  Logic inversion detected: Comparing with <code className="font-mono text-zinc-300">!=</code> causes partial refunds to overwrite total amounts. Wrap operations in a database transaction to prevent race conditions.
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[#8a8f98] font-mono text-[10px]">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500/80" />
                  <span>Verified against repository churn history</span>
                </div>
              </div>

              {/* Subtle bottom fade to seamlessly merge preview into canvas */}
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Feature 2: Churn & P95 Risk Engine (Alternating: Metrics Card on Left, Text on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Churn & Volatility Visual Card with Feathered Edges */}
            <div className="lg:col-span-7 order-2 lg:order-1 relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141c]/90 via-[#0e1017]/90 to-[#08090a] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 hover:border-white/15 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-semibold text-white">Repository Churn &amp; Volatility Metrics</span>
                </div>
                <span className="font-mono text-[11px] text-[#8a8f98]">P95 Confidence: 99.4%</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3.5">
                  <div className="text-[10px] font-mono uppercase text-[#8a8f98]">Test Coverage Delta</div>
                  <div className="mt-1 text-xl font-bold text-rose-300/85 font-mono">−14.2%</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Critical paths left uncovered</div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3.5">
                  <div className="text-[10px] font-mono uppercase text-[#8a8f98]">Cyclomatic Complexity</div>
                  <div className="mt-1 text-xl font-bold text-zinc-300 font-mono">+8 Delta</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Nested conditional branches</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-900/80" />
                    <span className="text-slate-200">paymentValidator.ts</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#8a8f98]">Top 5% volatile in repo (12 defect rollbacks)</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-900/80" />
                    <span className="text-slate-200">stripeGateway.ts</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#8a8f98]">Clean ownership pattern (98% author overlap)</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3 flex items-center justify-between text-xs">
                <span className="text-[#8a8f98]">Risk Score Evaluation:</span>
                <span className="font-mono font-bold text-zinc-200">82 / 100 (HIGH REGRESSION RISK)</span>
              </div>

              {/* Subtle bottom fade */}
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none" />
            </div>

            {/* Text on Right */}
            <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-[#8a8f98] uppercase">
                INTELLIGENCE &amp; VOLATILITY ENGINE
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-[1.15]">
                Eliminate phantom alerts with AST-level signals
              </h2>
              <p className="text-sm sm:text-base text-[#8a8f98] leading-relaxed">
                Generic LLM wrappers hallucinate phantom line numbers and suggest libraries you don't even have installed. Buggers correlates modified functions with your real git commit history, defect frequency, and coverage deltas to score real regression risk.
              </p>
              <div className="pt-2">
                <Link
                  to="/docs"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white hover:text-zinc-300 transition-colors group"
                >
                  <span>Explore risk methodology in Docs</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Feature 3: CI Quality Gates & Policy (Text on Left, Config Card on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-[#8a8f98] uppercase">
                CI / CD &amp; MERGE GATES
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-[1.15]">
                Enforce quality gates with declarative repository rules
              </h2>
              <p className="text-sm sm:text-base text-[#8a8f98] leading-relaxed">
                Define review thresholds with a simple <code className="font-mono text-zinc-300 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">.buggers.yml</code> in your repository root. Set GitHub check runs to automatically block pull request merges when critical severity findings or high risk are detected.
              </p>
              <div className="pt-2">
                <Link
                  to="/docs"
                  preload="intent"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white hover:text-zinc-300 transition-colors group"
                >
                  <span>View .buggers.yml configuration reference</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Config & Check Run Card with Feathered Edges */}
            <div className="lg:col-span-7 relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141c]/90 via-[#0e1017]/90 to-[#08090a] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 hover:border-white/15 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-semibold text-white">.buggers.yml</span>
                </div>
                <span className="font-mono text-[11px] text-[#8a8f98]">Repository Root Config</span>
              </div>

              <div className="rounded-xl bg-black border border-white/[0.08] p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                <pre className="text-[11px] leading-relaxed">
{`version: 1
risk:
  threshold: 75             # Maximum allowable risk score
  fail_on_critical: true     # Block merge if critical finding exists
  block_on_secrets: true     # Fail check if hardcoded secrets found
ignore:
  paths:
    - "docs/**"
    - "**/*.spec.ts"`}
                </pre>
              </div>

              {/* GitHub Check Run Status Simulation */}
              <div className="rounded-xl border border-rose-900/30 bg-rose-950/25 p-3.5 flex items-center justify-between transition-all duration-200 hover:border-rose-900/40">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-950/60 text-rose-300/80 font-bold text-xs border border-rose-900/40">
                    ✕
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-white">GitHub Check: Buggers Risk Gate</div>
                    <div className="text-[11px] text-[#8a8f98]">Risk 82 exceeds threshold 75 · Merge Blocked</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-rose-300/70 uppercase tracking-wider font-semibold">
                  Required Check
                </span>
              </div>

              {/* Subtle bottom fade */}
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Section 4: Linear FIG Minimal Wireframe Grid */}
          <div className="border border-white/[0.08] rounded-2xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#0e1015]/40 backdrop-blur-sm">
            <div className="p-6 sm:p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
              <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
                FIG 0.1
              </span>
              <h3 className="text-sm font-semibold text-white">Instant Webhook</h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                PR openings and pushes trigger AST evaluation via HMAC-verified webhooks without poll delays.
              </p>
            </div>

            <div className="p-6 sm:p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
              <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
                FIG 0.2
              </span>
              <h3 className="text-sm font-semibold text-white">Commit Churn</h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Correlates changed functions with past rollback commits and defect density in that file.
              </p>
            </div>

            <div className="p-6 sm:p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
              <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
                FIG 0.3
              </span>
              <h3 className="text-sm font-semibold text-white">Risk Scoring</h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Deterministic 0-100 score weighing cyclomatic complexity, test delta, and mutation paths.
              </p>
            </div>

            <div className="p-6 sm:p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
              <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
                FIG 0.4
              </span>
              <h3 className="text-sm font-semibold text-white">Grounded Fixes</h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                AI remediations cite real diff line numbers only. Hallucinated file paths are discarded.
              </p>
            </div>
          </div>

          {/* Section 5: Bottom CTA */}
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141c]/60 via-[#0e1015]/80 to-[#08090a] p-8 sm:p-12 text-center space-y-4 shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Ready to review pull requests with ease?
            </h3>
            <p className="text-xs sm:text-sm text-[#8a8f98] max-w-md mx-auto leading-relaxed">
              Connect your GitHub repository once. Buggers runs non-blocking checks on your next pull request.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/auth"
                preload="intent"
                className="w-full sm:w-auto rounded-full bg-white text-black px-7 py-2.5 text-xs sm:text-sm font-semibold shadow-md hover:bg-slate-200 transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.985] flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                preload="intent"
                className="w-full sm:w-auto rounded-full bg-white/5 border border-white/[0.08] px-6 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-white/10 transition-[background-color,border-color,transform] duration-150 flex items-center justify-center gap-2 active:scale-[0.985]"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>See How it Works</span>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Minimal Dark Footer - Pinned to bottom */}
      <footer className="bg-[#08090a] py-10 px-4 sm:px-6 text-xs text-[#8a8f98] border-t border-white/[0.08] mt-auto">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-zinc-300 font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-zinc-600 text-[11px]">
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
            <span className="inline-flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-800/80" />
              All Systems Normal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
