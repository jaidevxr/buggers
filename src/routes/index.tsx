import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileCode,
  FileWarning,
  GitPullRequest,
  Github,
  Shield,
  ShieldAlert,
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
          "AI-assisted code review and bug triage powered by your GitHub repository history. Buggers reads the diff, churn, and historical regressions together.",
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

const flow = [
  {
    icon: GitPullRequest,
    title: "GitHub PR",
    text: "A pull request opens on your repository.",
  },
  {
    icon: BrainCircuit,
    title: "Buggers analysis",
    text: "Diff, commit history, and churn are analyzed in seconds.",
  },
  {
    icon: ShieldAlert,
    title: "Risk detection",
    text: "Each change receives a grounded risk score with clear reasons.",
  },
  {
    icon: FileWarning,
    title: "AI findings",
    text: "Actionable issues, evidence, and verified code remediations.",
  },
];

export function Landing() {
  const [activeTab, setActiveTab] = useState<"overview" | "diff" | "remediation">("overview");

  return (
    <div className="min-h-screen w-full bg-[#040d21] text-slate-100 antialiased selection:bg-purple-500/30 overflow-x-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#040d21]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-85">
            <BugMark className="h-7 w-7 text-purple-400 fill-purple-400" />
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Buggers
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a href="#preview" className="transition-colors hover:text-white">
              Preview
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-purple-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-purple-500 active:scale-[0.985]"
            >
              <Link to="/auth" className="flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5" /> Continue with GitHub
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full pt-16 pb-0 sm:pt-24 lg:pt-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-medium text-purple-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Code review for teams that ship fast
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Catch risky code <br />
            <span className="bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
              before it catches you.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            AI-assisted code review and bug triage powered by your GitHub repository history.
            Buggers reads the diff, historical churn, and past regressions to highlight what actually matters.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-purple-600 px-6 font-semibold text-white shadow-lg shadow-purple-500/25 hover:bg-purple-500 active:scale-[0.985]"
            >
              <Link to="/auth" className="flex items-center gap-2">
                <Github className="h-4 w-4" /> Continue with GitHub
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/20 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <a href="#how-it-works" className="flex items-center gap-2">
                See how it works <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Ambient Horizon & Floating Mascot Animations Area */}
        <div id="preview" className="relative mt-14 w-full overflow-hidden sm:mt-20">
          {/* Radiant Purple Horizon Glow & Light Beam */}
          <div className="animate-pulse-glow pointer-events-none absolute left-1/2 -bottom-24 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-t from-purple-600/35 via-violet-500/20 to-transparent blur-3xl sm:w-[1100px]" />
          <div className="pointer-events-none absolute left-1/2 bottom-0 h-[2px] w-[900px] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_24px_rgba(167,139,250,0.9)]" />

          {/* Floating Mascots (GitHub-inspired smooth bobbing animations) */}
          <div className="relative z-10 mx-auto flex h-24 max-w-md items-end justify-center gap-10 sm:h-32 sm:gap-16">
            {/* 1. Purple AI Reviewer Bot */}
            <div className="animate-float-slow flex flex-col items-center">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14">
                <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_10px_20px_rgba(99,102,241,0.5)]">
                  <defs>
                    <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="60%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#312e81" />
                    </linearGradient>
                    <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  <rect x="10" y="12" width="44" height="42" rx="16" fill="url(#botGrad)" />
                  <rect x="4" y="24" width="8" height="18" rx="4" fill="#6366f1" />
                  <rect x="52" y="24" width="8" height="18" rx="4" fill="#6366f1" />
                  <rect x="16" y="22" width="32" height="20" rx="8" fill="url(#visorGrad)" />
                  <ellipse cx="26" cy="32" rx="3" ry="4" fill="#ffffff" />
                  <ellipse cx="38" cy="32" rx="3" ry="4" fill="#ffffff" />
                  <circle cx="32" cy="7" r="4" fill="#38bdf8" />
                  <rect x="30" y="9" width="4" height="4" fill="#4f46e5" />
                </svg>
              </div>
            </div>

            {/* 2. Debugger Rubber Duck */}
            <div className="animate-float-fast flex flex-col items-center">
              <div className="relative h-11 w-11 sm:h-12 sm:w-12">
                <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_10px_20px_rgba(245,158,11,0.5)]">
                  <defs>
                    <linearGradient id="duckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="70%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </linearGradient>
                  </defs>
                  <ellipse cx="32" cy="42" rx="20" ry="14" fill="url(#duckGrad)" />
                  <circle cx="38" cy="26" r="13" fill="url(#duckGrad)" />
                  <circle cx="43" cy="24" r="2.5" fill="#1e293b" />
                  <path d="M 48 26 Q 58 29 48 33 Z" fill="#f97316" />
                  <ellipse cx="28" cy="40" rx="10" ry="6" fill="#facc15" />
                </svg>
              </div>
            </div>

            {/* 3. Pink Triage Mascot */}
            <div className="animate-float-medium flex flex-col items-center">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14">
                <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_10px_20px_rgba(236,72,153,0.5)]">
                  <defs>
                    <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="60%" stopColor="#db2777" />
                      <stop offset="100%" stopColor="#9d174d" />
                    </linearGradient>
                  </defs>
                  <circle cx="32" cy="34" r="20" fill="url(#catGrad)" />
                  <polygon points="16,22 22,8 30,18" fill="url(#catGrad)" />
                  <polygon points="48,22 42,8 34,18" fill="url(#catGrad)" />
                  <polygon points="18,20 22,12 28,18" fill="#fbcfe8" />
                  <polygon points="46,20 42,12 36,18" fill="#fbcfe8" />
                  <ellipse cx="26" cy="33" rx="2.5" ry="3.5" fill="#ffffff" />
                  <ellipse cx="38" cy="33" rx="2.5" ry="3.5" fill="#ffffff" />
                  <polygon points="32,38 30,36 34,36" fill="#fbcfe8" />
                </svg>
              </div>
            </div>
          </div>

          {/* The Showcase Window: Initial Buggers Design in Elevated Dark Chrome */}
          <div className="relative z-20 mx-auto max-w-5xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-t-2xl border border-white/20 bg-[#0d1117] shadow-[0_-20px_80px_rgba(139,92,246,0.25)]">
              {/* Window Header & Tabs */}
              <div className="flex flex-wrap items-center justify-between border-b border-white/10 bg-[#161b22] px-4 py-3">
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
                        ? "border-purple-400 bg-[#0d1117] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <GitPullRequest className="h-3.5 w-3.5 text-purple-400" />
                    PR #184: payment-service
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("diff")}
                    className={`flex items-center gap-1.5 rounded-t-md border-t-2 px-3 py-1.5 transition-colors ${
                      activeTab === "diff"
                        ? "border-purple-400 bg-[#0d1117] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    Diff & Findings
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("remediation")}
                    className={`flex items-center gap-1.5 rounded-t-md border-t-2 px-3 py-1.5 transition-colors ${
                      activeTab === "remediation"
                        ? "border-purple-400 bg-[#0d1117] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    AI Triage
                  </button>
                </div>

                <div className="hidden text-xs text-slate-400 sm:block">
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Analysis Ready
                  </span>
                </div>
              </div>

              {/* Window Body: Our Initial Buggers PR Review & Risk Content */}
              <div className="p-5 sm:p-6">
                {/* PR Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">
                      <span className="text-purple-400 font-mono">payment-service #184</span>{" "}
                      Fix payment validation
                    </p>
                    <p className="mt-1 text-xs text-slate-400 font-mono">
                      mira-k · 3 files · <span className="text-emerald-400">+204</span>{" "}
                      <span className="text-rose-400">−74</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    High risk
                  </span>
                </div>

                {/* 2-Column Split: Risk Score & AI Findings on Left, Code Diff & Context on Right */}
                <div className="mt-5 grid gap-5 lg:grid-cols-12">
                  {/* Left Column: Risk & Findings */}
                  <div className="space-y-4 lg:col-span-6">
                    <div className="rounded-xl border border-white/10 bg-[#161b22] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-400">Overall risk score</p>
                        <span className="font-mono text-xs text-rose-400">P95 Regression Rate</span>
                      </div>
                      <p className="mt-1 font-display text-3xl font-bold text-rose-400">
                        HIGH · 82
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#161b22]/70 px-3.5 py-2.5 transition-colors hover:border-white/20">
                        <SeverityBadge severity="critical" />
                        <span className="truncate text-xs font-medium text-slate-200">
                          Partial capture amount silently overwritten
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#161b22]/70 px-3.5 py-2.5 transition-colors hover:border-white/20">
                        <SeverityBadge severity="high" />
                        <span className="truncate text-xs font-medium text-slate-200">
                          Refund no longer wrapped in a transaction
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#161b22]/70 px-3.5 py-2.5 transition-colors hover:border-white/20">
                        <SeverityBadge severity="medium" />
                        <span className="truncate text-xs font-medium text-slate-200">
                          Empty card number treated as valid
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Code Diff with Syntax Highlighting */}
                  <div className="space-y-4 lg:col-span-6">
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#090d16] font-mono text-xs">
                      <div className="border-b border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-400">
                        src/services/paymentValidator.ts
                      </div>
                      <div className="p-1 space-y-0.5">
                        <div className="flex items-center bg-rose-500/15 px-3 py-1 text-rose-300">
                          <span className="w-6 select-none opacity-60">42</span>
                          <span>− if amount &lt;= order.total:</span>
                        </div>
                        <div className="flex items-center bg-emerald-500/15 px-3 py-1 text-emerald-300">
                          <span className="w-6 select-none opacity-60">42</span>
                          <span>+ if amount != order.total:</span>
                        </div>
                        <div className="flex items-center bg-emerald-500/15 px-3 py-1 text-emerald-300">
                          <span className="w-6 select-none opacity-60">43</span>
                          <span>+ &nbsp; amount = order.total</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-purple-300">
                        <Sparkles className="h-4 w-4" />
                        AI Remediation Suggestion
                      </div>
                      <p className="mt-1.5 leading-relaxed text-slate-300">
                        Logic inversion detected: Comparing with <code className="text-purple-300">!=</code> causes partial refunds to overwrite total amounts. Wrap operations in a database transaction to prevent financial state race conditions.
                      </p>
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified against repository churn history
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Buggers Works Section */}
      <section id="how-it-works" className="relative z-20 mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
            Automated Workflow
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How Buggers works
          </h2>
          <p className="mt-3 max-w-xl text-base text-slate-400">
            Four automated steps with zero complex configuration. Connect your repository once and every pull request is analyzed deterministically.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {flow.map((step, i) => (
            <li
              key={step.title}
              className="group rounded-2xl border border-white/10 bg-[#0d1117] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300">
                <step.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-xs font-mono font-semibold text-purple-400">Step {i + 1}</p>
              <h3 className="mt-1 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Feature Pillars Section */}
      <section id="features" className="relative z-20 border-t border-white/10 bg-[#090d16] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                title: "Risk with reasons",
                text: "Every score comes with the signals behind it — churn frequency, defect history, missing tests, and dependency graph shifts.",
                icon: Shield,
              },
              {
                title: "Findings you can act on",
                text: "Problem, why it matters, diff evidence, and a suggested fix. Mark reviewed, resolved, or create tracked GitHub tickets.",
                icon: CheckCircle2,
              },
              {
                title: "History as evidence",
                text: "Buggers learns which files broke in past production incidents, so human review attention lands right where it prevents outages.",
                icon: BrainCircuit,
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-white/10 bg-[#0d1117] p-6 transition-all duration-200 hover:border-purple-500/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#040d21] px-4 py-12 text-xs text-slate-400 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <BugMark className="h-6 w-6 text-purple-400 fill-purple-400" />
            <span className="font-semibold text-slate-200">Buggers</span>
            <span>&copy; 2026 Buggers, Inc. Demo data shown throughout.</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/jaidevxr/buggers"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              GitHub
            </a>
            <Link to="/auth" className="hover:text-white">
              Sign In
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              All Systems Normal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
