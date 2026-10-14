import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Cpu, GitPullRequest } from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

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
    <div className="min-h-screen w-full bg-[#08090a] text-slate-100 antialiased overflow-x-hidden selection:bg-white/20 flex flex-col justify-between">
      {/* Main Content */}
      <main className="pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto flex-1 w-full">
        {/* Title Header with Linear editorial spacing */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/[0.08] px-4 py-1 text-xs font-mono text-[#8a8f98]">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse" />
            <span className="uppercase text-[10px] tracking-widest">Built For Engineering Teams</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-[1.1]">
            Code Review Grounded in Reality
          </h1>

          <p className="text-base sm:text-lg text-[#8a8f98] leading-relaxed max-w-2xl mx-auto">
            Buggers was created to solve the fundamental problem of modern code review: generic LLMs leave noisy, useless comments, while humans burn out reviewing massive diffs.
          </p>
        </div>

        {/* 3 Core Pillars in Linear FIG Architectural Grid */}
        <div className="mt-16 border border-white/[0.08] rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] grid grid-cols-1 sm:grid-cols-3 bg-[#0e1015]/40 backdrop-blur-sm">
          <div className="p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
            <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
              FIG 0.1
            </span>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-zinc-400" />
              <h3 className="text-base font-semibold text-white">Repository Churn Context</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#8a8f98]">
              We don't just inspect the isolated diff. We analyze your repo's commit history, hot files, and previous bug fixes to predict regressions.
            </p>
          </div>

          <div className="p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
            <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
              FIG 0.2
            </span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zinc-400" />
              <h3 className="text-base font-semibold text-white">Zero Noise Guarantee</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#8a8f98]">
              Every finding goes through strict AST validation and rule filters. If a warning has low confidence, it's suppressed. Only actionable insights reach your team.
            </p>
          </div>

          <div className="p-7 space-y-3 transition-colors hover:bg-white/[0.02]">
            <span className="font-mono text-[10px] tracking-widest text-[#8a8f98] uppercase block">
              FIG 0.3
            </span>
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-zinc-400" />
              <h3 className="text-base font-semibold text-white">Instant GitHub Integration</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#8a8f98]">
              Install the GitHub App with two clicks. Real-time webhooks, inline PR suggestions, and seamless check runs work out of the box.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-16 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#12141c]/60 via-[#0e1015]/80 to-[#08090a] p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Ready to ship safer pull requests?
            </h2>
            <p className="text-xs sm:text-sm text-[#8a8f98] leading-relaxed">
              Connect your repositories and let Buggers handle the heavy lifting of pull request triage.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link
                to="/auth"
                preload="intent"
                className="rounded-full bg-white text-black px-7 py-2.5 text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.985] flex items-center gap-2"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Consistent Matte-Black Footer */}
      <footer className="w-full border-t border-white/[0.08] py-8 text-center text-xs text-[#8a8f98] bg-[#08090a]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-300 font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-500">AI Code Review &amp; Triage</span>
          </div>
          <div className="flex items-center gap-6 text-[#8a8f98]">
            <Link to="/" className="hover:text-white transition-colors duration-150">Home</Link>
            <Link to="/how-it-works" className="hover:text-white transition-colors duration-150">How it works</Link>
            <Link to="/docs" className="hover:text-white transition-colors duration-150">Docs</Link>
            <Link to="/about" className="text-white font-medium">About</Link>
            <Link to="/auth" className="hover:text-white transition-colors duration-150">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
