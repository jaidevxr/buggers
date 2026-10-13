import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Play, CheckCircle2, Shield, BrainCircuit, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buggers — Review with ease" },
      {
        name: "description",
        content:
          "Design and review smarter with AI that understands your repository. So you can take a breath.",
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
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-[#f4f6f8] text-slate-900 antialiased overflow-x-hidden">
      {/* Floating Pill Header (Matching Reference Image 1) */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <div className="flex items-center gap-6 sm:gap-8 rounded-full bg-white/90 backdrop-blur-md px-5 py-2 sm:px-6 sm:py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-black/5 text-xs font-medium text-slate-700">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900 transition-opacity hover:opacity-85">
            <div className="h-4 w-4 rounded-full border-[2.5px] border-orange-500 bg-orange-100 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            </div>
            <span className="tracking-tight text-sm font-bold text-slate-900">Buggers</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-slate-600 font-medium">
            <a href="#hero" className="transition-colors hover:text-slate-900">Home</a>
            <a href="#usecases" className="transition-colors hover:text-slate-900">Usecases</a>
            <a href="#pricing" className="transition-colors hover:text-slate-900">Pricing</a>
            <a href="#careers" className="transition-colors hover:text-slate-900">Careers</a>
            <a href="#contact" className="transition-colors hover:text-slate-900">Contact</a>
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
            <span>We just raised 20M🚀</span>
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
              onClick={() => setDemoOpen(true)}
              className="rounded-full bg-black/10 backdrop-blur-md px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-slate-900 hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Bottom SCROLL Indicator */}
        <div className="relative z-10 mx-auto pt-10">
          <a
            href="#usecases"
            className="inline-flex items-center gap-1.5 rounded-full bg-black/25 backdrop-blur-md px-4 py-1.5 text-[11px] font-mono tracking-widest text-white/95 border border-white/20 shadow-md hover:bg-black/35 transition-all"
          >
            <span>SCROLL</span>
            <span>↓</span>
          </a>
        </div>
      </section>

      {/* Demo Modal */}
      {demoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0e1117] p-6 text-white border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-400" />
                <h3 className="font-semibold text-sm">Interactive Buggers Walkthrough</h3>
              </div>
              <button
                type="button"
                onClick={() => setDemoOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕ Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed font-mono">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-emerald-400 font-semibold">1. Webhook Triggered</p>
                <p className="mt-1 text-slate-400">PR #184 opened on payment-service. Automated churn analysis commenced.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-rose-400 font-semibold">2. Logic Inversion Detected</p>
                <p className="mt-1 text-slate-400">Lines 42-44 evaluated against historic incident #309. High risk (82/100) flagged.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-blue-400 font-semibold">3. Deterministic Grounding</p>
                <p className="mt-1 text-slate-400">Zero phantom citations. Suggested fix wrapped in DB transaction ready for review.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Link
                to="/auth"
                className="rounded-full bg-white text-black px-5 py-2 text-xs font-semibold hover:bg-slate-200"
              >
                Sign In to Review Repositories →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Usecases & Features Section */}
      <section id="usecases" className="relative z-10 bg-white py-24 px-4 sm:px-6 border-t border-black/5">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Built for Modern Engineering</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Less noise. More signal. Zero burn out.
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Buggers connects directly with your GitHub pull requests to surface regressions and vulnerabilities before code ever merges.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Grounded Diff Citations</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Every AI suggestion maps strictly to modified diff lines. Ghost hallucinations and phantom references are completely blocked.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Historical Churn Intelligence</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Cross-references previous defect files and author churn history so human attention focuses where regressions historically occur.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Instant Triage & Tracking</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Convert critical findings into GitHub issues or automated fixes with a single click, keeping your release pipeline clean.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-slate-900 py-10 px-4 sm:px-6 text-xs text-slate-400">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-medium">
            <div className="h-3 w-3 rounded-full border-2 border-orange-500 bg-orange-100" />
            <span>Buggers</span>
            <span className="text-slate-500 text-[11px]">&copy; 2026 Buggers, Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5">
            <a href="https://github.com/jaidevxr/buggers" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
            <Link to="/auth" className="hover:text-white">Sign In</Link>
            <span className="text-emerald-400 font-mono text-[11px]">All Systems Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
