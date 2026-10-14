import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileCode,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Buggers" },
      {
        name: "description",
        content:
          "See how Buggers ingests pull requests, detects regression risks using churn history, and suggests verified fixes.",
      },
      { property: "og:title", content: "How It Works — Buggers" },
      {
        property: "og:description",
        content:
          "End-to-end pull request triage powered by repository history and grounded AI models.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorksPage,
});

export function HowItWorksPage() {
  return (
    <div className="min-h-screen w-full bg-[#08090a] text-slate-100 antialiased overflow-x-hidden selection:bg-white/20 flex flex-col justify-between">
      {/* Main Content Hero */}
      <main className="pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto flex-1 w-full">
        {/* Title Header with Linear editorial spacing */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/[0.08] px-4 py-1 text-xs font-mono text-[#8a8f98]">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse" />
            <span className="uppercase text-[10px] tracking-widest">Deterministic Release Intelligence</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-[1.1]">
            How Buggers Protects Your Release Pipeline
          </h1>

          <p className="text-base sm:text-lg text-[#8a8f98] leading-relaxed max-w-2xl mx-auto">
            From the second a pull request is opened to automated remediation comments, here is how Buggers reads code diffs and repository history together.
          </p>
        </div>

        {/* 4-Step Architecture Grid in Linear FIG Minimal Style */}
        <div className="mt-16 border border-white/[0.08] rounded-2xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#0e1015]/40 backdrop-blur-sm">
          <div className="p-6 sm:p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
            <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
              STEP 01
            </span>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-white">Instant Webhook</h3>
            </div>
            <p className="text-xs text-[#8a8f98] leading-relaxed">
              Every PR opening, commit push, or synchronize event triggers analysis in &lt;1s via secure HMAC-verified webhooks.
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
            <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
              STEP 02
            </span>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-white">Churn Analysis</h3>
            </div>
            <p className="text-xs text-[#8a8f98] leading-relaxed">
              Buggers evaluates historical churn, past defect records, and code ownership patterns to gauge volatility.
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
            <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
              STEP 03
            </span>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-white">Risk Scoring</h3>
            </div>
            <p className="text-xs text-[#8a8f98] leading-relaxed">
              Deterministic 0-100 scoring based on test coverage delta, cyclomatic complexity, and regression indicators.
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
            <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
              STEP 04
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-white">Grounded Triage</h3>
            </div>
            <p className="text-xs text-[#8a8f98] leading-relaxed">
              AI suggestions cite real diff line numbers only. Phantom line citations and hallucinations are discarded.
            </p>
          </div>
        </div>

        {/* Live Scenario Preview: PR #184 with Feathered Bottom Edges */}
        <div className="mt-16 relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141c]/90 via-[#0e1017]/90 to-[#08090a] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 hover:border-white/15">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-zinc-300 font-semibold">PR #184: payment-service</span>
                <span className="rounded-full bg-rose-950/40 border border-rose-900/40 px-3 py-0.5 text-xs font-semibold text-rose-300/80 font-mono">
                  HIGH · 82 Risk
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-white">Fix payment validation</h2>
              <p className="mt-0.5 font-mono text-xs text-[#8a8f98]">mira-k · 3 files · +204 −74</p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/40 bg-emerald-950/40 px-3 py-1 text-xs font-mono text-emerald-300/80">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Analysis Complete
            </span>
          </div>

          {/* Finding items */}
          <div className="mt-6 space-y-2.5">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/40 p-3.5">
              <span className="rounded-md bg-rose-950/60 px-2.5 py-0.5 font-mono text-xs font-semibold text-rose-300/90 uppercase border border-rose-900/50">
                Critical
              </span>
              <span className="text-sm font-medium text-slate-200">
                Partial capture amount silently overwritten
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/40 p-3.5">
              <span className="rounded-md bg-amber-950/60 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-300/90 uppercase border border-amber-900/50">
                High
              </span>
              <span className="text-sm font-medium text-slate-200">
                Refund no longer wrapped in a transaction
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/40 p-3.5">
              <span className="rounded-md bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-300/90 uppercase border border-slate-800">
                Medium
              </span>
              <span className="text-sm font-medium text-slate-200">
                Empty card number treated as valid
              </span>
            </div>
          </div>

          {/* Code Diff Display */}
          <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08] bg-black font-mono text-xs">
            <div className="border-b border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[#8a8f98] text-[11px] flex items-center justify-between">
              <span>src/services/paymentValidator.ts</span>
              <span>Lines 42–44</span>
            </div>
            <div className="p-3 space-y-1">
              <div className="rounded bg-rose-950/30 px-3 py-1.5 text-rose-300/80 border-l-2 border-rose-900/60">
                − if amount &lt;= order.total:
              </div>
              <div className="rounded bg-emerald-950/30 px-3 py-1.5 text-emerald-300/80 border-l-2 border-emerald-900/60">
                + if amount != order.total:
              </div>
              <div className="rounded bg-emerald-950/30 px-3 py-1.5 text-emerald-300/80 border-l-2 border-emerald-900/60">
                + &nbsp; amount = order.total
              </div>
            </div>
          </div>

          {/* AI Remediation Box */}
          <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#0e121a]/80 p-5 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              <Sparkles className="h-4 w-4 text-zinc-400" />
              <span>AI Remediation Advisory</span>
            </div>
            <p className="mt-2 text-[#8a8f98]">
              Logic inversion detected: Comparing with <code className="font-mono text-zinc-300">!=</code> causes partial refund amounts to overwrite the order total. Wrap operations in a database transaction to prevent financial state race conditions.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[#8a8f98] font-mono text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80" />
              <span>Grounding verified against modified diff hunks.</span>
            </div>
          </div>

          {/* Subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none" />
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 text-center rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141c]/60 via-[#0e1015]/80 to-[#08090a] p-10 shadow-xl space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Ready to review pull requests with ease?
          </h2>
          <p className="text-xs sm:text-sm text-[#8a8f98] max-w-md mx-auto leading-relaxed">
            Connect your repository once. Buggers runs automatically on your next pull request.
          </p>
          <div className="pt-2 flex justify-center">
            <Link
              to="/auth"
              preload="intent"
              className="rounded-full bg-white text-black px-7 py-2.5 text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-[background-color,color,transform,box-shadow] duration-150 shadow-md active:scale-[0.985] flex items-center gap-2"
            >
              <span>Get Started with GitHub</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer - Pinned to bottom */}
      <footer className="border-t border-white/[0.08] bg-[#08090a] py-10 px-4 sm:px-6 text-xs text-[#8a8f98] mt-auto">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-zinc-300 font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-zinc-600 text-[11px]">&copy; 2026 Buggers, Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-[#8a8f98]">
            <Link to="/" className="hover:text-white transition-colors duration-150">
              Home
            </Link>
            <Link to="/docs" className="hover:text-white transition-colors duration-150">
              Docs
            </Link>
            <Link to="/auth" className="hover:text-white transition-colors duration-150">
              Sign In
            </Link>
            <span className="text-zinc-500 font-mono text-[11px]">All Systems Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
