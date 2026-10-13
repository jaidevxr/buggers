import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileCode,
  GitPullRequest,
  Github,
  Sparkles,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";
import { SeverityBadge } from "@/components/status/StatusBadges";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buggers — Catch risky code before it catches you" },
      {
        name: "description",
        content:
          "Buggers reviews your pull requests with AI and your repository history, so risky changes get caught before they ship.",
      },
      { property: "og:title", content: "Buggers — Catch risky code before it catches you" },
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
  const [activeTab, setActiveTab] = useState<"overview" | "diff" | "triage">("overview");

  return (
    <div className="min-h-screen w-full bg-black text-slate-100 antialiased selection:bg-white/20 overflow-x-hidden">
      {/* Header — Professional, clean and simple */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-85">
            <BugMark className="h-6 w-6 text-white fill-white" />
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Buggers
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-white px-4 text-xs font-semibold text-black shadow-xs hover:bg-slate-200 active:scale-[0.985]"
            >
              <Link to="/auth" className="flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5" /> Continue with GitHub
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with 2-Column Clean Layout */}
      <section className="relative w-full border-b border-white/10 py-16 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* Left Column: Headline and Call-to-Actions */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Code review for teams that ship fast
              </span>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Catch risky code <br />
                before it catches you.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                AI-assisted code review and bug triage powered by your GitHub repository history.
                Buggers reads the diff and everything that happened to those files before it.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
                <Button
                  size="lg"
                  className="rounded-full bg-white px-6 font-semibold text-black shadow-sm hover:bg-slate-200 active:scale-[0.985]"
                  asChild
                >
                  <Link to="/auth" className="flex items-center gap-2">
                    <Github className="h-4 w-4" /> Continue with GitHub
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link to="/auth" className="flex items-center gap-2">
                    Explore live demo <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Clean Black GitHub-Referenced Product Preview */}
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#09090b] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
              {/* Window Chrome & Tabs */}
              <div className="flex flex-wrap items-center justify-between border-b border-white/10 bg-[#121215] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </div>

                <div className="flex items-center gap-1 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className={`flex items-center gap-1.5 rounded-t-md border-t-2 px-3 py-1.5 transition-colors ${
                      activeTab === "overview"
                        ? "border-white bg-[#09090b] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <GitPullRequest className="h-3 w-3" />
                    PR #184: payment-service
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("diff")}
                    className={`flex items-center gap-1.5 rounded-t-md border-t-2 px-3 py-1.5 transition-colors ${
                      activeTab === "diff"
                        ? "border-white bg-[#09090b] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileCode className="h-3 w-3" />
                    Diff & Findings
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("triage")}
                    className={`flex items-center gap-1.5 rounded-t-md border-t-2 px-3 py-1.5 transition-colors ${
                      activeTab === "triage"
                        ? "border-white bg-[#09090b] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    AI Triage
                  </button>
                </div>

                <div className="hidden text-xs text-slate-400 sm:block">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Analysis Ready
                  </span>
                </div>
              </div>

              {/* Product Preview Card Body */}
              <div className="p-4 sm:p-5">
                {/* PR Header */}
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      <span className="text-slate-400 font-mono">payment-service #184</span> Fix payment validation
                    </p>
                    <p className="mt-1 text-xs text-slate-400 font-mono">
                      mira-k · 3 files · <span className="text-emerald-400">+204</span> <span className="text-rose-400">−74</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400 whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    High risk
                  </span>
                </div>

                {/* Risk Score */}
                <div className="mt-4 rounded-xl border border-white/10 bg-[#121215] p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400">Overall risk score</p>
                    <span className="font-mono text-[11px] text-slate-400">P95 Regression Rate</span>
                  </div>
                  <p className="mt-1 font-display text-2xl font-bold text-rose-400">
                    HIGH · 82
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[82%] rounded-full bg-rose-500" />
                  </div>
                </div>

                {/* Severity Findings */}
                <div className="mt-4 space-y-2">
                  {[
                    { s: "critical", t: "Partial capture amount silently overwritten" },
                    { s: "high", t: "Refund no longer wrapped in a transaction" },
                    { s: "medium", t: "Empty card number treated as valid" },
                  ].map((f) => (
                    <div
                      key={f.t}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#121215]/60 px-3 py-2 transition-colors hover:border-white/20"
                    >
                      <SeverityBadge severity={f.s} />
                      <span className="truncate text-xs text-slate-200">{f.t}</span>
                    </div>
                  ))}
                </div>

                {/* Code Diff */}
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black font-mono text-xs">
                  <div className="border-b border-white/10 bg-[#121215] px-3 py-1.5 text-[11px] text-slate-400">
                    src/services/paymentValidator.ts
                  </div>
                  <div className="p-1 space-y-0.5">
                    <div className="bg-rose-500/15 px-3 py-1 text-rose-300">
                      − if amount &lt;= order.total:
                    </div>
                    <div className="bg-emerald-500/15 px-3 py-1 text-emerald-300">
                      + if amount != order.total:
                    </div>
                    <div className="bg-emerald-500/15 px-3 py-1 text-emerald-300">
                      + &nbsp; amount = order.total
                    </div>
                  </div>
                </div>

                {/* AI Remediation Box */}
                <div className="mt-4 rounded-xl border border-white/10 bg-[#121215] p-3.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    AI Remediation Suggestion
                  </div>
                  <p className="mt-1 leading-relaxed text-slate-400 text-[11px]">
                    Logic inversion detected: Comparing with <code className="text-slate-200 font-mono">!=</code> causes partial refunds to overwrite total amounts. Wrap operations in a database transaction to prevent financial state race conditions.
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified against repository churn history
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Strip — Sleek, ultra-minimal, high-contrast */}
      <section className="border-b border-white/10 bg-black py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3">
          {[
            {
              title: "Risk with reasons",
              text: "Every score comes with the signals behind it — churn frequency, defect history, missing tests, and dependency shifts.",
            },
            {
              title: "Findings you can act on",
              text: "Problem, why it matters, diff evidence, and a verified suggested fix. Mark reviewed, resolved, or create tracked GitHub tickets.",
            },
            {
              title: "History as evidence",
              text: "Buggers learns which files broke before in production, so human review attention lands right where regressions occur.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-white/10 bg-[#09090b] p-6">
              <h3 className="text-base font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer — Minimalist & Clean */}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-xs text-slate-500 sm:px-6">
        <div className="flex items-center gap-2">
          <BugMark className="h-5 w-5 text-slate-400 fill-slate-400" />
          <span className="font-display font-semibold tracking-tight text-slate-300">
            Buggers
          </span>
        </div>
        <span>Demo data shown throughout. Connect GitHub to analyze real repositories.</span>
      </footer>
    </div>
  );
}
