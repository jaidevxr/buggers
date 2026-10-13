import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Search,
  Sparkles,
  Terminal,
  Shield,
  FileCode,
  GitPullRequest,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The future of code review happens with Buggers" },
      {
        name: "description",
        content:
          "Tools and trends evolve, but collaboration endures. With Buggers, developers, AI agents, and code review signals come together on one platform.",
      },
      { property: "og:title", content: "The future of code review happens with Buggers" },
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
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("copilot");

  return (
    <div className="min-h-screen w-full bg-[#040d21] text-slate-100 antialiased selection:bg-purple-500/30 overflow-x-hidden">
      {/* Top Navbar — Identical to GitHub */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#040d21]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-80">
              <BugMark className="h-8 w-8 text-white fill-white" />
            </Link>

            <nav className="hidden items-center gap-5 text-sm font-medium text-slate-300 lg:flex">
              <button type="button" className="flex items-center gap-1 transition-colors hover:text-white">
                Platform <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              <button type="button" className="flex items-center gap-1 transition-colors hover:text-white">
                Solutions <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              <button type="button" className="flex items-center gap-1 transition-colors hover:text-white">
                Resources <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              <button type="button" className="flex items-center gap-1 transition-colors hover:text-white">
                Open Source <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              <button type="button" className="transition-colors hover:text-white">
                Enterprise
              </button>
              <button type="button" className="transition-colors hover:text-white">
                Pricing
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="hidden items-center gap-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 sm:flex">
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
                /
              </kbd>
            </div>

            <Button asChild variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white hover:bg-white/10">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-md border border-white/20 bg-white/10 text-xs font-semibold text-white shadow-xs hover:bg-white/20 active:scale-[0.985]"
            >
              <Link to="/auth">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full pt-20 pb-0 sm:pt-28 lg:pt-32">
        {/* Centered Hero Header */}
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            The future of building <br />
            happens together
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Tools and trends evolve, but collaboration endures. With Buggers, developers, AI agents, and code review signals come together on one platform.
          </p>

          {/* Email + Sign up CTA Bar */}
          <div className="mx-auto mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="flex w-full max-w-md items-center rounded-md bg-white p-1 shadow-lg sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none sm:w-64"
              />
              <Button
                asChild
                className="shrink-0 rounded-md bg-[#238636] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2ea043] active:scale-[0.985]"
              >
                <Link to="/auth">Sign up for Buggers</Link>
              </Button>
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full rounded-md border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <Link to="/auth">Download Buggers CLI</Link>
            </Button>
          </div>
        </div>

        {/* Ambient Glowing Horizon & Floating Characters Area */}
        <div className="relative mt-16 w-full overflow-hidden sm:mt-20">
          {/* Radiant Purple / Violet Nebula Beam */}
          <div className="animate-pulse-glow pointer-events-none absolute left-1/2 -bottom-24 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-t from-purple-600/40 via-violet-500/25 to-transparent blur-3xl sm:w-[1100px]" />
          <div className="pointer-events-none absolute left-1/2 bottom-0 h-[2px] w-[900px] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_24px_rgba(167,139,250,0.9)]" />

          {/* Floating Mascots / 3D Characters (Matching Screenshot) */}
          <div className="relative z-10 mx-auto flex h-28 max-w-xl items-end justify-center gap-12 sm:h-36 sm:gap-20">
            {/* 1. Purple/Blue 3D Robot Head */}
            <div className="animate-float-slow flex flex-col items-center">
              <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_10px_20px_rgba(99,102,241,0.5)]">
                  <defs>
                    <linearGradient id="robotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="60%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#312e81" />
                    </linearGradient>
                    <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  {/* Helmet Body */}
                  <rect x="10" y="12" width="44" height="42" rx="16" fill="url(#robotGrad)" />
                  {/* Ears */}
                  <rect x="4" y="24" width="8" height="18" rx="4" fill="#6366f1" />
                  <rect x="52" y="24" width="8" height="18" rx="4" fill="#6366f1" />
                  {/* Visor Screen */}
                  <rect x="16" y="22" width="32" height="20" rx="8" fill="url(#visorGrad)" />
                  {/* Glowing Eyes */}
                  <ellipse cx="26" cy="32" rx="3" ry="4" fill="#ffffff" />
                  <ellipse cx="38" cy="32" rx="3" ry="4" fill="#ffffff" />
                  {/* Antenna */}
                  <circle cx="32" cy="7" r="4" fill="#38bdf8" />
                  <rect x="30" y="9" width="4" height="4" fill="#4f46e5" />
                </svg>
              </div>
            </div>

            {/* 2. Yellow Floating Rubber Duck */}
            <div className="animate-float-fast flex flex-col items-center">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14">
                <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_10px_20px_rgba(245,158,11,0.5)]">
                  <defs>
                    <linearGradient id="duckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="70%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </linearGradient>
                  </defs>
                  {/* Body */}
                  <ellipse cx="32" cy="42" rx="20" ry="14" fill="url(#duckGrad)" />
                  {/* Head */}
                  <circle cx="38" cy="26" r="13" fill="url(#duckGrad)" />
                  {/* Eye */}
                  <circle cx="43" cy="24" r="2.5" fill="#1e293b" />
                  {/* Beak */}
                  <path d="M 48 26 Q 58 29 48 33 Z" fill="#f97316" />
                  {/* Wing */}
                  <ellipse cx="28" cy="40" rx="10" ry="6" fill="#facc15" />
                </svg>
              </div>
            </div>

            {/* 3. Pink Floating 3D Cat Head */}
            <div className="animate-float-medium flex flex-col items-center">
              <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_10px_20px_rgba(236,72,153,0.5)]">
                  <defs>
                    <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="60%" stopColor="#db2777" />
                      <stop offset="100%" stopColor="#9d174d" />
                    </linearGradient>
                  </defs>
                  {/* Cat Head */}
                  <circle cx="32" cy="34" r="20" fill="url(#catGrad)" />
                  {/* Ears */}
                  <polygon points="16,22 22,8 30,18" fill="url(#catGrad)" />
                  <polygon points="48,22 42,8 34,18" fill="url(#catGrad)" />
                  {/* Inner Ears */}
                  <polygon points="18,20 22,12 28,18" fill="#fbcfe8" />
                  <polygon points="46,20 42,12 36,18" fill="#fbcfe8" />
                  {/* Eyes */}
                  <ellipse cx="26" cy="33" rx="2.5" ry="3.5" fill="#ffffff" />
                  <ellipse cx="38" cy="33" rx="2.5" ry="3.5" fill="#ffffff" />
                  {/* Nose */}
                  <polygon points="32,38 30,36 34,36" fill="#fbcfe8" />
                </svg>
              </div>
            </div>
          </div>

          {/* Floating Raised IDE / Code Window (Popping Out From Bottom) */}
          <div className="relative z-20 mx-auto max-w-6xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-t-2xl border border-white/20 bg-[#0d1117] shadow-[0_-20px_80px_rgba(139,92,246,0.3)]">
              {/* Window Chrome & Tabs */}
              <div className="flex flex-wrap items-center justify-between border-b border-white/10 bg-[#161b22] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveTab("copilot")}
                    className={`flex items-center gap-1.5 rounded-t-md border-t-2 px-3 py-1.5 transition-colors ${
                      activeTab === "copilot"
                        ? "border-purple-400 bg-[#0d1117] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    GITHUB COPILOT CHAT
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("game")}
                    className={`flex items-center gap-1.5 rounded-t-md border-t-2 px-3 py-1.5 transition-colors ${
                      activeTab === "game"
                        ? "border-purple-400 bg-[#0d1117] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileCode className="h-3 w-3" />
                    game.ts
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("css")}
                    className={`flex items-center gap-1.5 rounded-t-md border-t-2 px-3 py-1.5 transition-colors ${
                      activeTab === "css"
                        ? "border-purple-400 bg-[#0d1117] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    characters.module.css
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bonus")}
                    className={`flex items-center gap-1.5 rounded-t-md border-t-2 px-3 py-1.5 transition-colors ${
                      activeTab === "bonus"
                        ? "border-purple-400 bg-[#0d1117] text-white font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    bonus-level.ts
                  </button>
                </div>

                <div className="hidden text-[11px] font-mono text-slate-400 sm:block">
                  UTF-8 • TypeScript
                </div>
              </div>

              {/* Window Content: Split Chat & Code Editor */}
              <div className="grid divide-y divide-white/10 lg:grid-cols-12 lg:divide-y-0 lg:divide-x">
                {/* Left Panel: Copilot Chat */}
                <div className="bg-[#090d16] p-5 font-mono text-xs lg:col-span-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold text-slate-200">GitHub Copilot</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <p className="text-slate-400 leading-relaxed">
                      Hi @monalisa, how can I help you?
                    </p>

                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-slate-200">
                      <div className="text-[11px] font-semibold text-purple-300">
                        Reviewing pull request #184:
                      </div>
                      <p className="mt-1 text-xs text-slate-300">
                        Diff grounding check: Line 59 score texts validated. No race conditions detected.
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        0 vulnerabilities found in 3 files
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Code Editor with Line Numbers */}
                <div className="bg-[#0d1117] p-5 font-mono text-xs lg:col-span-8">
                  <div className="space-y-1 leading-relaxed">
                    <div className="flex items-center text-slate-500">
                      <span className="w-8 select-none text-slate-600">58</span>
                      <span className="text-slate-500">// Create score texts</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-8 select-none text-slate-600">59</span>
                      <span className="text-blue-400">this</span>
                      <span className="text-slate-300">.player1ScoreText = </span>
                      <span className="text-blue-400">this</span>
                      <span className="text-slate-300">.add.text(</span>
                      <span className="text-amber-400">16</span>
                      <span className="text-slate-300">, </span>
                      <span className="text-amber-400">16</span>
                      <span className="text-slate-300">, </span>
                      <span className="text-emerald-300">&apos;Player 1: 0&apos;</span>
                      <span className="text-slate-300">, &#123; fontSize: </span>
                      <span className="text-emerald-300">&apos;32px&apos;</span>
                      <span className="text-slate-300"> &#125;);</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-8 select-none text-slate-600">60</span>
                      <span className="text-blue-400">this</span>
                      <span className="text-slate-300">.player2ScoreText = </span>
                      <span className="text-blue-400">this</span>
                      <span className="text-slate-300">.add.text(</span>
                      <span className="text-amber-400">300</span>
                      <span className="text-slate-300">, </span>
                      <span className="text-amber-400">16</span>
                      <span className="text-slate-300">, </span>
                      <span className="text-emerald-300">&apos;Player 2: 0&apos;</span>
                      <span className="text-slate-300">, &#123; fontSize: </span>
                      <span className="text-emerald-300">&apos;32px&apos;</span>
                      <span className="text-slate-300"> &#125;);</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                      <span className="w-8 select-none text-slate-600">61</span>
                      <span className="text-purple-400 animate-pulse">|</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section (GitHub Style) */}
      <section className="relative z-20 border-t border-white/10 bg-[#090d16] px-4 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#0d1117] p-6 transition-all duration-200 hover:border-purple-500/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Diff Line Grounding</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                AI review suggestions must directly match modified diff hunks. Non-existent files or phantom line citations are purged before they ever post.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0d1117] p-6 transition-all duration-200 hover:border-blue-500/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <GitPullRequest className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Engineering Signals</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Combines change complexity, test coverage movements, author repository experience, and past defect history into deterministic risk scores.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0d1117] p-6 transition-all duration-200 hover:border-emerald-500/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Encrypted Security</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Repository credentials and access tokens are secured with AES-256-GCM encryption and guarded by strict Row-Level Security policies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub-Styled Footer */}
      <footer className="border-t border-white/10 bg-[#040d21] px-4 py-12 text-xs text-slate-400 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <BugMark className="h-6 w-6 text-white fill-white" />
            <span className="font-semibold text-slate-200">Buggers</span>
            <span>&copy; 2026 Buggers, Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/jaidevxr/buggers" target="_blank" rel="noreferrer" className="hover:text-white">
              GitHub
            </a>
            <Link to="/auth" className="hover:text-white">
              Sign In
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All Systems Normal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
