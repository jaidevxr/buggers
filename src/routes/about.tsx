import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Cpu, GitPullRequest, Code2, Heart } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Buggers" },
      {
        name: "description",
        content:
          "About Buggers: Precision AI pull request triage and automated code review that eliminates developer fatigue.",
      },
      { property: "og:title", content: "About — Buggers" },
      {
        property: "og:description",
        content:
          "Engineered to catch regression risks before production with zero hallucination and repository-grounded context.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

export function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-[#020203] text-slate-100 antialiased overflow-x-hidden selection:bg-white/20 flex flex-col justify-between">
      {/* Unified Public Floating Pill Header */}
      <PublicHeader />

      {/* Main Content */}
      <main className="pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto flex-1 w-full">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Built For Engineering Teams</span>
          </div>

          <h1 className="mt-6 font-display text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Code Review Grounded in Reality
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Buggers was created to solve the fundamental problem of modern code review: generic LLMs leave noisy, useless comments, while humans burn out reviewing massive diffs.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-[#07070a] p-7 transition-all duration-300 hover:border-white/10 hover:-translate-y-1 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Repository Churn Context</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              We don't just inspect the isolated diff. We analyze your repo's commit history, hot files, and previous bug fixes to predict regressions.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#07070a] p-7 transition-all duration-300 hover:border-white/10 hover:-translate-y-1 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Zero Noise Guarantee</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Every finding goes through strict AST validation and rule filters. If a warning has low confidence, it's suppressed. Only actionable insights reach your team.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#07070a] p-7 transition-all duration-300 hover:border-white/10 hover:-translate-y-1 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Instant GitHub Integration</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Install the GitHub App with two clicks. Real-time webhooks, inline PR suggestions, and seamless check runs work out of the box.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-16 rounded-3xl border border-white/5 bg-[#060608] p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Ready to ship safer pull requests?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-400">
              Connect your repositories and let Buggers handle the heavy lifting of pull request triage.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                to="/auth"
                className="rounded-full bg-white text-black px-7 py-3 text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-all duration-200 active:scale-[0.985] flex items-center gap-2"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Consistent Matte-Black Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-xs text-slate-500 bg-[#020203]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Buggers</span>
            <span>&bull;</span>
            <span>AI Code Review &amp; Triage</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
            <Link to="/how-it-works" className="hover:text-slate-300 transition-colors">How it works</Link>
            <Link to="/docs" className="hover:text-slate-300 transition-colors">Docs</Link>
            <Link to="/about" className="text-slate-300 font-medium">About</Link>
            <Link to="/auth" className="hover:text-slate-300 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
