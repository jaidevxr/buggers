import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  FileCode2,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Lock,
  Play,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
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
  const [selectedInfra, setSelectedInfra] = useState<
    "cloud" | "enterprise" | "monorepo" | "actions"
  >("cloud");

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
      {/* ALTERNATING PRODUCT SHOWCASE (Inspired by Modern Tier-1 Docs & Product Design) */}
      {/* ======================================================== */}
      <div className="relative z-10 bg-[#0a0c10] border-t border-white/10 py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28 sm:space-y-36">

          {/* -------------------------------------------------------- */}
          {/* SECTION 1: Accelerate Review with Repository History (Left text / Right visual) */}
          {/* -------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-1 text-xs font-mono text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Deterministic AST Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Accelerate innovation with repository history
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Buggers simplifies pull request triage by correlating unified diffs with past commit churn, production rollback records, and test flakiness. This eliminates false alarms, isolates critical regressions, and empowers engineers to merge with confidence.
              </p>
              <div className="pt-2">
                <Link
                  to="/how-it-works"
                  className="group inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
                >
                  <span>Learn how triage works</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right Visual Card Mockup (Layered Code Editor & Triage Modal) */}
            <div className="lg:col-span-6 relative">
              {/* Backing Glow */}
              <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-3xl pointer-events-none" />

              {/* Background Code File Card */}
              <div className="relative rounded-2xl bg-black/80 border border-white/15 p-4 sm:p-5 shadow-2xl font-mono text-xs text-slate-300 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>src/services/paymentValidator.ts</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Lines 41–45</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="text-slate-500">40 &nbsp; export function validateCapture(order) &#123;</div>
                  <div className="rounded bg-rose-500/15 text-rose-300 px-2 py-0.5">
                    41 − &nbsp; if amount &lt;= order.total:
                  </div>
                  <div className="rounded bg-emerald-500/15 text-emerald-300 px-2 py-0.5">
                    42 + &nbsp; if amount != order.total:
                  </div>
                  <div className="rounded bg-emerald-500/15 text-emerald-300 px-2 py-0.5">
                    43 + &nbsp; &nbsp; amount = order.total
                  </div>
                  <div className="text-slate-500">44 &nbsp; &nbsp; return executeCapture(order.id);</div>
                </div>
              </div>

              {/* Foreground Floating Triage Finding Card (Overlapping layer) */}
              <div className="relative -mt-6 sm:-mt-8 ml-4 sm:ml-10 rounded-2xl bg-[#141824] border border-emerald-500/30 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-rose-500/20 text-rose-400 px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-rose-500/30">
                      CRITICAL · 82
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Partial capture amount silently overwritten
                    </span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Logic inversion detected: Comparing with <code className="font-mono text-emerald-300">!=</code> causes partial refund amounts to overwrite total transactions. Wrap in a database lock.
                </p>
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Confidence: 99.4%</span>
                  <span className="text-emerald-400 font-semibold">1-Click Remediation Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* SECTION 2: Operate Confidently with Automated Tools (Left visual / Right text) */}
          {/* -------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Visual Card Mockup (Ops Manager / Config Rules Panel) */}
            <div className="lg:col-span-6 relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-3xl pointer-events-none" />

              <div className="relative rounded-2xl bg-black/85 border border-white/15 p-5 shadow-2xl backdrop-blur-md">
                {/* Ops Window Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-mono text-xs font-semibold text-white">
                      .buggers.yml · Policy Enforcement
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                    Active Ruleset
                  </span>
                </div>

                {/* Simulated Config Items with Toggles */}
                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-xs font-semibold text-white">Automated PR Check Runs</div>
                      <div className="text-[10px] text-slate-400">Run AST diff inspection on every commit</div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 font-mono text-[10px] font-semibold border border-emerald-500/40">
                      ENABLED
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-xs font-semibold text-white">P95 Regression Guard</div>
                      <div className="text-[10px] text-slate-400">Block merge if regression score exceeds threshold</div>
                    </div>
                    <span className="rounded-full bg-amber-500/20 text-amber-300 px-2.5 py-0.5 font-mono text-[10px] font-semibold border border-amber-500/40">
                      SCORE &ge; 75
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="text-xs font-semibold text-white">Zero Code Retention</div>
                      <div className="text-[10px] text-slate-400">Purge diff memory instantly after review</div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 font-mono text-[10px] font-semibold border border-emerald-500/40">
                      STRICT
                    </span>
                  </div>
                </div>

                {/* Footer Status Pill */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Target: main / release-*</span>
                  <span className="text-white font-semibold">100% Policy Pass</span>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/25 px-3.5 py-1 text-xs font-mono text-amber-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>Automated Administration</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Operate confidently with tools and governance
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Automate code governance and stay ahead of release regressions. Buggers configuration tools make team-wide deployment simple: configure review rules in simple YAML, manage thresholds, and get 24/7 grounded triage without interrupting sprint flow.
              </p>
              <div className="pt-2">
                <Link
                  to="/docs"
                  className="group inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium text-sm transition-colors"
                >
                  <span>Explore configuration rules</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* SECTION 3: Data & Source Code Protection (Left text / Right visual) */}
          {/* -------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-1 text-xs font-mono text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>SOC 2 Type II Architecture</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Data and repository protection
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Enterprise-grade security and strict zero-retention guarantees protect your codebase. Buggers seamlessly integrates with existing GitHub permissions, executing in isolated memory enclaves without training third-party models or persisting proprietary code.
              </p>
              <div className="pt-2">
                <Link
                  to="/docs"
                  className="group inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
                >
                  <span>View security architecture</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right Visual Card Mockup (Security Enclave Dialog) */}
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-3xl pointer-events-none" />

              <div className="relative rounded-2xl bg-black/85 border border-white/15 p-5 shadow-2xl backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <span>Security & Enclave Enclosure</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">TLS 1.3 Strict</span>
                </div>

                <div className="space-y-2.5 font-sans">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Zero Code Retention</div>
                      <div className="text-[10px] text-slate-400">Diffs parsed ephemerally in RAM</div>
                    </div>
                    <span className="rounded-full bg-emerald-500 text-black px-3 py-0.5 font-mono text-[10px] font-bold">
                      YES
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">No Model Training</div>
                      <div className="text-[10px] text-slate-400">Strict zero data ingestion policy</div>
                    </div>
                    <span className="rounded-full bg-emerald-500 text-black px-3 py-0.5 font-mono text-[10px] font-bold">
                      GUARANTEED
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">HMAC Webhook Verification</div>
                      <div className="text-[10px] text-slate-400">Cryptographic payload validation</div>
                    </div>
                    <span className="rounded-full bg-emerald-500 text-black px-3 py-0.5 font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* SECTION 4: Run Buggers Anywhere (Left visual / Right text) */}
          {/* -------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Visual Card Mockup (Infrastructure Selector Tabs) */}
            <div className="lg:col-span-6 relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-3xl pointer-events-none" />

              <div className="relative rounded-2xl bg-black/85 border border-white/15 p-5 shadow-2xl backdrop-blur-md">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Choose Your Git Infrastructure
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {(
                    [
                      { id: "cloud", label: "GitHub Cloud" },
                      { id: "enterprise", label: "Enterprise Server" },
                      { id: "monorepo", label: "Monorepos" },
                      { id: "actions", label: "CI Actions" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedInfra(tab.id)}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-medium font-mono text-center transition-all ${
                        selectedInfra === tab.id
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm"
                          : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Active Infrastructure Card Details */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Selected Node:</span>
                    <span className="text-white font-semibold">
                      {selectedInfra === "cloud"
                        ? "github.com/apps/buggers"
                        : selectedInfra === "enterprise"
                          ? "ghe.internal.corp/buggers"
                          : selectedInfra === "monorepo"
                            ? "Turborepo / Nx Workspace"
                            : "buggers/action@v3"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Analysis Latency:</span>
                    <span className="text-emerald-400 font-semibold">&lt; 2.8 seconds</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Webhook Status:</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Listening (HMAC-SHA256)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/25 px-3.5 py-1 text-xs font-mono text-blue-400 font-medium">
                <FolderGit2 className="h-3.5 w-3.5" />
                <span>Zero Lock-In</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Run Buggers anywhere across your stack
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Buggers is the most flexible code review engine for production teams. Native support for GitHub Cloud, Enterprise Server, polyrepos, and complex monorepos guarantees instant deployment across your entire organization.
              </p>
              <div className="pt-2">
                <Link
                  to="/auth"
                  className="group inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                >
                  <span>Connect your repositories</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* STATS & METRICS STRIP */}
          {/* -------------------------------------------------------- */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-8 sm:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              <div className="pt-4 sm:pt-0">
                <div className="font-display text-3xl sm:text-5xl font-extrabold text-white">99.4%</div>
                <div className="mt-2 text-xs font-medium text-slate-400">Regression Accuracy</div>
              </div>
              <div className="pt-4 sm:pt-0">
                <div className="font-display text-3xl sm:text-5xl font-extrabold text-white">0ms</div>
                <div className="mt-2 text-xs font-medium text-slate-400">Code Retention Footprint</div>
              </div>
              <div className="pt-4 sm:pt-0">
                <div className="font-display text-3xl sm:text-5xl font-extrabold text-white">140K+</div>
                <div className="mt-2 text-xs font-medium text-slate-400">Pull Requests Triaged</div>
              </div>
              <div className="pt-4 sm:pt-0">
                <div className="font-display text-3xl sm:text-5xl font-extrabold text-white">&lt; 3.2s</div>
                <div className="mt-2 text-xs font-medium text-slate-400">Average Review Latency</div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* BOTTOM FINAL CALL-TO-ACTION */}
          {/* -------------------------------------------------------- */}
          <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#151926] to-[#0a0c10] p-8 sm:p-14 text-center space-y-6 shadow-2xl">
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to review with ease?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
              Connect your repository once. Buggers runs non-blocking checks on your next pull request so you can take a breath.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth"
                className="w-full sm:w-auto rounded-full bg-white text-black px-8 py-3.5 text-xs sm:text-sm font-semibold shadow-xl hover:bg-slate-200 transition-all active:scale-[0.985] flex items-center justify-center gap-2"
              >
                <span>Get Started with GitHub</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/docs"
                className="w-full sm:w-auto rounded-full bg-white/5 border border-white/15 px-7 py-3.5 text-xs sm:text-sm font-medium text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span>Read Documentation</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

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
