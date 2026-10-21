import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
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
import { AnimatedCodeScanner } from "@/components/home/AnimatedCodeScanner";
import { VsCodeExtensionHeroSection } from "@/components/home/VsCodeExtensionHeroSection";
import { createRouteSeo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const seo = createRouteSeo({
      path: "/",
      title: "Buggers",
      description:
        "Buggers automatically reviews your GitHub pull requests, detects OWASP vulnerabilities, flags security regressions, and predicts risk velocity before code reaches production.",
      keywords: [
        "Buggers",
        "Buggers AI",
        "buggers github",
        "AI code review",
        "pull request analysis",
        "vulnerability scanner",
        "automated code review",
        "GitHub PR security",
        "static code analysis",
        "DevSecOps",
        "code triage",
        "VS Code extension",
        "vsix download",
        "in-editor security scanner",
        "IDE vulnerability detection",
      ],
    });

    return {
      meta: seo.meta,
      links: [
        ...seo.links,
        { rel: "preload", href: "/landing-bg.webp", as: "image", type: "image/webp", fetchPriority: "high" },
      ],
    };
  },
  component: Landing,
});

export function Landing() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 50, y: 55 });

  // If user returns from OAuth with tokens/hash/pending-flag, immediately route to /dashboard
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isPendingAuth = sessionStorage.getItem("buggers_auth_pending") === "true";
    const hasOAuthHash = window.location.hash.includes("access_token") || window.location.hash === "#";
    const hasOAuthCode = window.location.search.includes("code=");

    if (isPendingAuth || hasOAuthHash || hasOAuthCode) {
      const handleRedirect = () => {
        sessionStorage.removeItem("buggers_auth_pending");
        navigate({ to: "/dashboard" });
      };

      // Check current session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          handleRedirect();
        }
      });

      // Listen for auth event
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          handleRedirect();
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
    return undefined;
  }, [navigate]);

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
    <div className="relative min-h-screen w-full bg-transparent text-slate-100 antialiased overflow-x-hidden selection:bg-white/20 flex flex-col justify-between route-fade-entrance">
      {/* Main Full-Bleed Atmospheric Night Studio Hero Section (Rendered over persistent AtmosphericBackdrop) */}
      <section
        id="hero"
        className="relative min-h-screen w-full bg-transparent flex flex-col justify-center items-center px-4 sm:px-6 py-24 overflow-hidden"
      >
        {/* Centered Hero Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Neutral Category Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/60 px-4 py-1 text-[11px] font-mono tracking-wider text-slate-300 shadow-sm backdrop-blur-md mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70 inline-block animate-pulse" />
            <span className="uppercase text-[10px] tracking-widest text-[#8a8f98]">Buggers · Automated PR Code Review</span>
          </div>

          {/* Main Headline with Linear's neutral editorial contrast */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            <span className="sr-only">Buggers — </span>Catch critical issues <br />
            <span className="font-serif italic font-normal text-white tracking-wide px-1">
              before
            </span>{" "}
            they reach production
          </h1>

          {/* Subtitle in Linear's muted reference gray #8a8f98 */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            Buggers automatically reviews your pull requests, detects bugs, security risks, and code quality issues — so you can ship with confidence.
          </p>

          {/* Action Buttons with silky smooth micro-interactions */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/auth"
              preload="intent"
              className="rounded-full bg-white text-black px-8 py-3.5 text-xs sm:text-sm font-semibold shadow-xl shadow-black/40 hover:bg-neutral-200 transition-colors duration-150 flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/how-it-works"
              preload="intent"
              className="rounded-full bg-black/40 backdrop-blur-md px-7 py-3.5 text-xs sm:text-sm font-medium text-white hover:bg-black/65 border border-white/[0.08] transition-colors duration-150 flex items-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>See How it Works</span>
            </Link>
          </div>
        </div>

        {/* Sleek, Minimal Mouse Scroll Indicator at Very Bottom of Screen */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <a
            href="#showcase"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center justify-center cursor-pointer select-none transition-all duration-300 opacity-60 hover:opacity-100 hover:scale-110"
            aria-label="Scroll to interactive review engine showcase"
          >
            <div className="p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 group-hover:border-white/40 transition-colors shadow-lg">
              <svg
                className="w-3.5 h-5 text-neutral-400 group-hover:text-white transition-colors"
                viewBox="0 0 16 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="1"
                  y="1"
                  width="14"
                  height="22"
                  rx="7"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <line
                  x1="8"
                  y1="5"
                  x2="8"
                  y2="9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="animate-mouse-wheel text-emerald-400 group-hover:text-white"
                />
              </svg>
            </div>
          </a>
        </div>
      </section>

      {/* ======================================================== */}
      {/* AUTHENTIC BUGGERS PRODUCT SHOWCASE (Linear-Style 2-Column Split) */}
      {/* ======================================================== */}
      <section id="showcase" className="relative z-10 bg-[#000000] pt-12 sm:pt-20 pb-24 sm:pb-36 scroll-mt-16">
        {/* Subtle, smooth top gradient transition into black showcase on scroll */}
        <div className="absolute inset-x-0 -top-20 sm:-top-28 h-20 sm:h-28 bg-gradient-to-b from-transparent to-[#000000] pointer-events-none z-10" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">

          {/* Feature 1: Live Animated Code Detection & Remediation Simulator (Linear Style) */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
              <div className="lg:col-span-7 space-y-2">
                <span className="text-[10px] font-mono font-semibold tracking-wider text-[#8a8f98] uppercase block">
                  CODE REVIEW &amp; REGRESSION PROTECTION
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium text-white tracking-tight leading-[1.08]">
                  Deterministic PR triage with whole-repo context
                </h2>
              </div>
              <div className="lg:col-span-5 space-y-2">
                <p className="text-sm sm:text-base text-[#8a8f98] leading-relaxed">
                  Buggers inspects the raw unified diff against historical fault lines. In-process scanners catch side-channel timing flaws, plaintext secrets, and SQL injections in 140ms before synthesising AST-grounded patches.
                </p>
                <Link
                  to="/how-it-works"
                  preload="intent"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white hover:text-zinc-300 transition-colors group cursor-pointer"
                >
                  <span>Explore triage architecture</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Live Interactive Code Scanner & Fix Simulator */}
            <AnimatedCodeScanner />
          </div>

          {/* Feature 2: Churn & P95 Risk Engine (Linear Open Hairline) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Churn & Volatility Visual Card with Linear Hairline and Edge Dissolve */}
            <div className="lg:col-span-7 order-2 lg:order-1 relative border-y border-white/[0.08] bg-[#0a0a0a] p-6 sm:p-8 space-y-5 linear-preview-fade-bottom">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#000000_100%)] pointer-events-none z-10" />
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 relative z-0">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-white" />
                  <span className="text-xs font-semibold text-white">Repository Churn &amp; Volatility Metrics</span>
                </div>
                <span className="font-mono text-[11px] text-[#8a8f98]">P95 Confidence: 99.4%</span>
              </div>

              <div className="grid grid-cols-2 divide-x divide-white/[0.06] border-y border-white/[0.06] py-3 relative z-0">
                <div className="pr-4">
                  <div className="text-[10px] font-mono uppercase text-[#8a8f98]">Test Coverage Delta</div>
                  <div className="mt-1 text-2xl font-bold text-rose-400 font-mono">−14.2%</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Critical paths left uncovered</div>
                </div>

                <div className="pl-4">
                  <div className="text-[10px] font-mono uppercase text-[#8a8f98]">Cyclomatic Complexity</div>
                  <div className="mt-1 text-2xl font-bold text-white font-mono">+8 Delta</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Nested conditional branches</div>
                </div>
              </div>

              <div className="space-y-2 relative z-0 font-mono text-xs">
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <span className="text-neutral-200">paymentValidator.ts</span>
                  </div>
                  <span className="text-[11px] text-[#8a8f98]">Top 5% volatile in repo (12 defect rollbacks)</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-neutral-200">stripeGateway.ts</span>
                  </div>
                  <span className="text-[11px] text-[#8a8f98]">Clean ownership pattern (98% author overlap)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono relative z-0">
                <span className="text-[#8a8f98]">Risk Score Evaluation:</span>
                <span className="font-bold text-amber-400">82 / 100 (HIGH REGRESSION RISK)</span>
              </div>

              {/* Linear bottom fade */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#000000] to-transparent pointer-events-none z-10" />
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
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white hover:text-zinc-300 transition-colors group cursor-pointer"
                >
                  <span>Explore risk methodology in Docs</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Feature 3: CI Quality Gates & Policy (Linear Open Hairline) */}
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
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white hover:text-zinc-300 transition-colors group cursor-pointer"
                >
                  <span>View .buggers.yml configuration reference</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Config & Check Run Card with Linear Feathered Edges */}
            <div className="lg:col-span-7 relative border-y border-white/[0.08] bg-[#0a0a0a] p-6 sm:p-8 space-y-4 linear-preview-fade-bottom">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#000000_100%)] pointer-events-none z-10" />
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 relative z-0">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-white" />
                  <span className="text-xs font-semibold text-white">.buggers.yml</span>
                </div>
                <span className="font-mono text-[11px] text-[#8a8f98]">Repository Root Config</span>
              </div>

              <div className="border border-white/[0.06] bg-[#050505] p-4 font-mono text-xs text-neutral-300 overflow-x-auto relative z-0">
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
              <div className="border-l-2 border-l-rose-400 bg-rose-500/[0.04] p-3.5 flex items-center justify-between relative z-0 font-mono text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/40">
                    ✕
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-white">GitHub Check: Buggers Risk Gate</div>
                    <div className="text-[11px] text-[#8a8f98]">Risk 82 exceeds threshold 75 · Merge Blocked</div>
                  </div>
                </div>
                <span className="text-[10px] text-rose-300 uppercase tracking-wider font-semibold">
                  Required Check
                </span>
              </div>

              {/* Linear bottom fade */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#000000] to-transparent pointer-events-none z-10" />
            </div>
          </div>

          {/* Section 4: Linear FIG Minimal Wireframe Grid (Open Hairline) */}
          <div className="border-y border-white/[0.08] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#0a0a0a]">
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

          {/* Section 4.5: Official VS Code Extension Showcase (Black Fade Gradient & Motions) */}
          <VsCodeExtensionHeroSection />

          {/* Section 5: Bottom CTA (Open Linear Hairline) */}
          <div className="border-t border-white/[0.08] pt-16 pb-8 text-center space-y-4">
            <h3 className="text-2xl sm:text-4xl font-medium text-white tracking-tight leading-tight">
              Ready to review pull requests with ease?
            </h3>
            <p className="text-xs sm:text-sm text-[#8a8f98] max-w-md mx-auto leading-relaxed">
              Connect your GitHub repository once. Buggers runs non-blocking checks on your next pull request.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/auth"
                preload="intent"
                className="w-full sm:w-auto rounded-full bg-white text-black px-7 py-2.5 text-xs sm:text-sm font-semibold shadow-md hover:bg-neutral-200 transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                preload="intent"
                className="w-full sm:w-auto rounded-full bg-white/5 border border-white/[0.08] px-6 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-white/10 transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>See How it Works</span>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Minimal Dark Footer - Pinned to bottom */}
      <footer className="bg-[#000000] py-10 px-4 sm:px-6 text-xs text-[#8a8f98] border-t border-white/[0.08] mt-auto">
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
            <a
              href="https://github.com/jaidevxr/buggers"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-200"
            >
              GitHub
            </a>
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
