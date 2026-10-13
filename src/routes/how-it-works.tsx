import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileCode,
  GitPullRequest,
  Lock,
  Shield,
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
    <div className="min-h-screen w-full bg-[#0a0c10] text-slate-100 antialiased overflow-x-hidden selection:bg-white/20 flex flex-col justify-between">
      {/* Floating Pill Header */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <div className="flex items-center gap-6 rounded-full bg-black/75 backdrop-blur-md px-6 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-white/10 text-xs font-medium text-slate-200">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-white transition-opacity hover:opacity-85">
            <BugMark className="h-5 w-5 text-white fill-white" />
            <span className="tracking-tight text-sm font-bold text-white">Buggers</span>
          </Link>

          <nav className="flex items-center gap-5 text-slate-300 font-medium">
            <Link to="/" className="transition-colors duration-200 hover:text-white">
              Home
            </Link>
            <Link to="/how-it-works" className="text-white font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>How it works</span>
            </Link>
            <Link to="/docs" className="transition-colors duration-200 hover:text-white">
              Docs
            </Link>
          </nav>

          <Link
            to="/auth"
            className="rounded-full bg-white text-black px-5 py-1.5 text-xs font-semibold hover:bg-slate-200 transition-all duration-200 shadow-xs active:scale-[0.985]"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Main Content Hero - flex-1 ensures it pushes the footer to the bottom */}
      <main className="pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto flex-1 w-full">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Deterministic Release Intelligence</span>
          </div>

          <h1 className="mt-6 font-display text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            How Buggers Protects Your Release Pipeline
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            From the second a pull request is opened to automated remediation comments, here is how Buggers reads code diffs and repository history together.
          </p>
        </div>

        {/* 4-Step Architecture Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#12151e] p-6 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
              <Zap className="h-5 w-5" />
            </div>
            <span className="mt-4 block font-mono text-xs font-semibold text-orange-400">Step 01</span>
            <h3 className="mt-1 text-base font-semibold text-white">Instant Webhook</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Every PR opening, commit push, or synchronize event triggers analysis in &lt;1s via secure HMAC-verified webhooks.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12151e] p-6 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <span className="mt-4 block font-mono text-xs font-semibold text-blue-400">Step 02</span>
            <h3 className="mt-1 text-base font-semibold text-white">Churn Analysis</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Buggers evaluates historical churn, past defect records, and code ownership patterns to gauge volatility.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12151e] p-6 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="mt-4 block font-mono text-xs font-semibold text-rose-400">Step 03</span>
            <h3 className="mt-1 text-base font-semibold text-white">Risk Scoring</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Deterministic 0-100 scoring based on test coverage delta, cyclomatic complexity, and regression indicators.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12151e] p-6 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="mt-4 block font-mono text-xs font-semibold text-emerald-400">Step 04</span>
            <h3 className="mt-1 text-base font-semibold text-white">Grounded Triage</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              AI suggestions cite real diff line numbers only. Phantom line citations and halluncinations are rejected.
            </p>
          </div>
        </div>

        {/* Live Scenario Card: PR #184 */}
        <div className="mt-16 rounded-3xl border border-white/15 bg-[#12151e] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-purple-400 font-semibold">PR #184: payment-service</span>
                <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-0.5 text-xs font-semibold text-rose-400">
                  HIGH · 82 Risk
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-white">Fix payment validation</h2>
              <p className="mt-0.5 font-mono text-xs text-slate-400">mira-k · 3 files · +204 −74</p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Analysis Complete
            </span>
          </div>

          {/* Finding items */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#181d29] p-3.5">
              <span className="rounded-md bg-rose-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-rose-400 uppercase">
                Critical
              </span>
              <span className="text-sm font-medium text-slate-200">
                Partial capture amount silently overwritten
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#181d29] p-3.5">
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-amber-400 uppercase">
                High
              </span>
              <span className="text-sm font-medium text-slate-200">
                Refund no longer wrapped in a transaction
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#181d29] p-3.5">
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-blue-400 uppercase">
                Medium
              </span>
              <span className="text-sm font-medium text-slate-200">
                Empty card number treated as valid
              </span>
            </div>
          </div>

          {/* Code Diff Display */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black font-mono text-xs">
            <div className="border-b border-white/10 bg-[#161b22] px-4 py-2 text-slate-400 text-[11px] flex items-center justify-between">
              <span>src/services/paymentValidator.ts</span>
              <span>Lines 42–44</span>
            </div>
            <div className="p-3 space-y-1">
              <div className="rounded bg-rose-500/15 px-3 py-1.5 text-rose-300">
                − if amount &lt;= order.total:
              </div>
              <div className="rounded bg-emerald-500/15 px-3 py-1.5 text-emerald-300">
                + if amount != order.total:
              </div>
              <div className="rounded bg-emerald-500/15 px-3 py-1.5 text-emerald-300">
                + &nbsp; amount = order.total
              </div>
            </div>
          </div>

          {/* AI Remediation Box */}
          <div className="mt-6 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-purple-300 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>AI Remediation Advisory</span>
            </div>
            <p className="mt-2 text-slate-300">
              Logic inversion detected: Comparing with <code className="font-mono text-purple-300">!=</code> causes partial refund amounts to overwrite the order total. Wrap operations in a database transaction to prevent financial state race conditions.
            </p>
            <div className="mt-3 flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Grounding verified against modified diff hunks.</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 text-center rounded-3xl border border-white/10 bg-gradient-to-b from-[#161a26] to-[#0f1118] p-10 shadow-2xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Ready to review pull requests with ease?
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Connect your repository once. Buggers runs automatically on your next pull request.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/auth"
              className="rounded-full bg-white text-black px-7 py-3 text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-all duration-200 shadow-xl active:scale-[0.985] flex items-center gap-2"
            >
              <span>Get Started with GitHub</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer - Pinned to bottom */}
      <footer className="border-t border-white/10 bg-black py-10 px-4 sm:px-6 text-xs text-slate-500 mt-auto">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-white font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-slate-500 text-[11px]">&copy; 2026 Buggers, Inc.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-white transition-colors duration-200">
              Home
            </Link>
            <Link to="/docs" className="hover:text-white transition-colors duration-200">
              Docs
            </Link>
            <Link to="/auth" className="hover:text-white transition-colors duration-200">
              Sign In
            </Link>
            <span className="text-emerald-400 font-mono text-[11px]">All Systems Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
