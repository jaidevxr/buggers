import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  FileCode,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Lock,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";
import { CodeBlock, Callout, AccordionItem } from "@/components/docs/DocsComponents";
import { LinearFeaturePreview } from "@/components/docs/LinearFeaturePreview";
import { RiskEngineExplorer } from "@/components/docs/RiskEngineExplorer";
import { QualityGateSimulator } from "@/components/docs/QualityGateSimulator";
import { PipelineStageVisualizer } from "@/components/docs/PipelineStageVisualizer";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Buggers" },
      {
        name: "description",
        content:
          "Engineering documentation for Buggers: Deterministic risk scoring model 1.1.0, 9-stage AST triage pipeline, OWASP SAST & secret scanners, GitHub OAuth & webhooks, and Nitro server functions.",
      },
      { property: "og:title", content: "Documentation — Buggers" },
      {
        property: "og:description",
        content:
          "Precision release intelligence and bug triage platform documentation, architecture specifications, API references, and deployment guides.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocsPage,
});

type DocSection = {
  id: string;
  title: string;
  category: string;
  keywords: string[];
};

const DOC_SECTIONS: DocSection[] = [
  {
    id: "quickstart",
    title: "Quickstart & Overview",
    category: "Getting Started",
    keywords: ["install", "setup", "quickstart", "overview", "run", "dev", "clone"],
  },
  {
    id: "architecture",
    title: "System Architecture",
    category: "Architecture",
    keywords: ["architecture", "tanstack start", "nitro", "supabase", "rls", "jwt", "crypto"],
  },
  {
    id: "pipeline",
    title: "9-Stage Analysis Pipeline",
    category: "Architecture",
    keywords: ["pipeline", "stages", "queue", "heartbeat", "lease", "reaper", "diff cache"],
  },
  {
    id: "risk-scoring",
    title: "Deterministic Risk Model (0–100)",
    category: "Risk Engine",
    keywords: ["risk", "model", "formula", "signals", "churn", "weights", "confidence", "tiers"],
  },
  {
    id: "quality-gate",
    title: "Merge Quality Gates (.buggers.yml)",
    category: "Risk Engine",
    keywords: ["quality gate", "policy", "threshold", "block", "commit status", "alerts", "slack"],
  },
  {
    id: "secret-scanner",
    title: "Plaintext Secret Scanner",
    category: "Security & Scanners",
    keywords: ["secrets", "aws", "github token", "openai", "stripe", "slack", "regex", "keys"],
  },
  {
    id: "sast-scanner",
    title: "OWASP Top 10 SAST Scanner",
    category: "Security & Scanners",
    keywords: ["sast", "sql injection", "command injection", "path traversal", "ssrf", "cors"],
  },
  {
    id: "api-reference",
    title: "REST Endpoints & Server Functions",
    category: "Reference",
    keywords: ["api", "webhook", "cron", "health", "serverfn", "rpc", "remediation", "git trees"],
  },
  {
    id: "setup-deployment",
    title: "Setup & Production Deployment",
    category: "Operations",
    keywords: ["deploy", "vercel", "supabase setup", "github oauth app", "environment", "env"],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting & Runbook",
    category: "Operations",
    keywords: ["troubleshooting", "error", "rate limit", "token expired", "reconnect", "stuck"],
  },
];

export function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>("quickstart");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOC_SECTIONS;
    const q = searchQuery.toLowerCase();
    return DOC_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-slate-100 antialiased selection:bg-white/20 flex flex-col justify-between">
      {/* Main Container */}
      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Docs Header Bar */}
        <div className="mb-8 pb-6 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>BUGGERS ENGINEERING DOCUMENTATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Documentation
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Architecture specifications, deterministic risk models, automated security scanners,
              and deployment runbooks grounded in the actual Buggers codebase.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, scanners, APIs, formulas..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Two-Column Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
          {/* Left Sidebar Navigation */}
          <aside className="lg:col-span-4 sticky top-28 space-y-4">
            <div className="rounded-2xl bg-[#0c0e15] border border-white/10 p-3 shadow-xl">
              <div className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 flex items-center justify-between">
                <span>Documentation Suite</span>
                <span className="text-[10px] text-slate-500">{filteredSections.length} topics</span>
              </div>
              <nav className="space-y-1">
                {filteredSections.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        window.scrollTo({ top: 120, behavior: "smooth" });
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 text-left cursor-pointer ${
                        isActive
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Links Card */}
            <div className="p-4 rounded-2xl bg-[#0c0e15] border border-white/10 space-y-3 hidden lg:block">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                Core Specifications
              </span>
              <div className="space-y-2 text-xs">
                <a
                  href="#risk-scoring"
                  onClick={() => setActiveSection("risk-scoring")}
                  className="flex items-center gap-2 text-slate-400 hover:text-amber-300 transition-colors"
                >
                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                  <span>Risk Model 1.1.0 Formula</span>
                </a>
                <a
                  href="#secret-scanner"
                  onClick={() => setActiveSection("secret-scanner")}
                  className="flex items-center gap-2 text-slate-400 hover:text-amber-300 transition-colors"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span>High-Entropy Secret Rules</span>
                </a>
                <a
                  href="#api-reference"
                  onClick={() => setActiveSection("api-reference")}
                  className="flex items-center gap-2 text-slate-400 hover:text-amber-300 transition-colors"
                >
                  <Code2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>REST Webhooks & RPCs</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Right Main Content Panel */}
          <main className="lg:col-span-8 space-y-8 min-h-[750px] flex flex-col">
            {/* 1. Quickstart & Overview */}
            {activeSection === "quickstart" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Zap className="h-4 w-4" />
                  <span>GETTING STARTED</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Quickstart & System Overview
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Buggers provides deterministic release intelligence for modern engineering teams.
                    It intercepts pull request diffs, cross-references historical repository fault lines,
                    and flags defect density, vulnerabilities, and credential leaks before code reaches production.
                  </p>
                </div>

                {/* Linear-Style 2x2 Feature Overview Grid */}
                <LinearFeaturePreview />

                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold text-white">Three-Step Walkthrough</h3>

                  <div className="space-y-3 font-sans">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-mono font-bold text-amber-300">
                        1
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Clone Repository & Configure Environment
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Copy the verified configuration template and supply your Supabase and GitHub OAuth keys.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-mono font-bold text-amber-300">
                        2
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Apply Postgres Schema & RLS Policies
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Execute <code className="text-amber-300 bg-white/5 px-1 py-0.5 rounded font-mono">supabase-setup.sql</code> in the Supabase SQL editor to create all tables and RLS security boundaries.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-mono font-bold text-amber-300">
                        3
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Connect GitHub & Launch Triage
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Sign in, connect your GitHub account via direct OAuth, select repositories, and start real-time pull request reviews.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">Local Development Commands</h3>
                  <CodeBlock
                    filename="terminal"
                    code={`# Clone the repository
git clone https://github.com/jaidevxr/buggers.git
cd buggers

# Install dependencies
npm install

# Run TypeScript type check
npm run typecheck

# Run test suite with Vitest
npm run test

# Launch local development server on port 8080
npm run dev`}
                  />
                </div>

                <Callout type="tip" title="LOCAL ACCESS">
                  Once started, open <code className="text-white font-mono">http://localhost:8080</code> (or <code className="text-white font-mono">http://localhost:8081</code> if port 8080 is occupied). You can sign in via Google, GitHub, or Email.
                </Callout>
              </div>
            )}

            {/* 2. System Architecture */}
            {activeSection === "architecture" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Cpu className="h-4 w-4" />
                  <span>ARCHITECTURE SPECIFICATION</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    System Architecture & Design Decisions
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Buggers is built on a full-stack TypeScript stack featuring <strong>TanStack Start</strong> (React 19, Vite, TanStack Router with type-safe file routes, Nitro SSR) and <strong>Supabase</strong> (PostgreSQL with Row Level Security).
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">High-Level Component Interaction</h3>
                  <CodeBlock
                    filename="architecture.diagram"
                    code={`┌────────────────────────────────────────────────────────┐
│                      Client Browser                    │
│  React 19 · TanStack Router · Supabase Auth (JWT)      │
│  auth-attacher client middleware → sets Bearer Token   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS (serverFn RPCs & REST)
┌───────────────────────────▼────────────────────────────┐
│                  Nitro Server Runtime                  │
│                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │ requireSupabaseAuth     │  │ Sliding Window      │  │
│  │ Middleware (JWT verify) │  │ Rate Limiter        │  │
│  └────────────┬────────────┘  └──────────┬──────────┘  │
│               ▼                          ▼             │
│  ┌──────────────────────────────────────────────────┐  │
│  │               Server Functions & APIs            │  │
│  │  analysis · findings · github · settings · cron  │  │
│  └────────────┬──────────────────────────┬──────────┘  │
│               │                          │             │
│        ┌──────▼──────┐            ┌──────▼──────┐      │
│        │ GitHub REST │            │  AI Provider│      │
│        │ & Reviews   │            │  (Vercel AI │      │
│        │ API         │            │   SDK)      │      │
│        └─────────────┘            └─────────────┘      │
└───────────────────────────┬────────────────────────────┘
                            │ SQL (Service Role)
                 ┌──────────▼──────────┐
                 │  Supabase Postgres  │
                 │  (RLS Enabled)      │
                 │  profiles · findings│
                 │  analyses · tickets │
                 │  app_user_conn.     │
                 └─────────────────────┘`}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Dual-Auth Separation Model</h3>
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-white/10 text-slate-300 font-semibold font-mono text-[11px]">
                        <tr>
                          <th className="py-2.5 px-4">Auth Mechanism</th>
                          <th className="py-2.5 px-4">Provider</th>
                          <th className="py-2.5 px-4">Purpose</th>
                          <th className="py-2.5 px-4">Storage Security</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-slate-300 font-mono text-[11px]">
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">User Identity</td>
                          <td className="py-3 px-4 text-amber-300">Supabase Auth</td>
                          <td className="py-3 px-4 font-sans">App sign-in, session maintenance & RBAC</td>
                          <td className="py-3 px-4 font-sans text-slate-400">JWT stored in localStorage; Bearer header validated per RPC</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">GitHub API Connection</td>
                          <td className="py-3 px-4 text-emerald-300">GitHub OAuth App</td>
                          <td className="py-3 px-4 font-sans">Reading diffs, posting status checks & inline review bot</td>
                          <td className="py-3 px-4 font-sans text-slate-400">AES-256-GCM encrypted in app_user_connections; service_role only</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <Callout type="warning" title="RLS BOUNDARY">
                  The <code className="text-white font-mono">app_user_connections</code> table grants permissions exclusively to the backend <code className="text-white font-mono">service_role</code>. Client-side queries through Supabase can never read or decrypt stored GitHub tokens.
                </Callout>
              </div>
            )}

            {/* 3. 9-Stage Analysis Pipeline */}
            {activeSection === "pipeline" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Activity className="h-4 w-4" />
                  <span>PIPELINE SPECIFICATION</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    9-Stage Analysis Execution Pipeline
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Whenever a pull request is submitted or updated, Buggers executes an asynchronous,
                    resilient 9-stage pipeline defined in <code className="text-amber-300 font-mono text-xs">src/server/analysis.server.ts</code>.
                  </p>
                </div>

                {/* Interactive Pipeline Stage Visualizer */}
                <PipelineStageVisualizer />

                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold text-white">Key Pipeline Guarantees</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                      <div className="font-mono text-amber-300 font-bold text-[11px] uppercase">
                        1. Idempotency per Head SHA
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        Re-running an analysis on the same pull request commit SHA reuses existing records,
                        preventing duplicate upstream AI invocations and GitHub rate limit depletion.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                      <div className="font-mono text-amber-300 font-bold text-[11px] uppercase">
                        2. Diff Caching via SHA-256
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        Diff hunks are hashed using SHA-256. Identical patches across repeated PR commits
                        retrieve cached AI review findings in 0ms.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                      <div className="font-mono text-amber-300 font-bold text-[11px] uppercase">
                        3. Heartbeat & 5-Minute Lease
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        Workers refresh <code className="text-white font-mono">heartbeat_at</code> every 60 seconds with a 5-minute lease.
                        Aborted or crashed lambdas are automatically detected and re-queued by the stale job reaper.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                      <div className="font-mono text-amber-300 font-bold text-[11px] uppercase">
                        4. Atomic PostgreSQL Findings Upsert
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        Findings are persisted in a single transaction via the <code className="text-white font-mono">replace_analysis_findings</code> stored procedure.
                        There are never partial or corrupt findings on failure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Deterministic Risk Model 1.1.0 */}
            {activeSection === "risk-scoring" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Shield className="h-4 w-4" />
                  <span>DETERMINISTIC RISK ENGINE 1.1.0</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Deterministic Risk Scoring Model (0–100)
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Buggers rejects arbitrary, hallucinated scores. Every pull request receives a mathematical
                    score derived from 8 observable repository signals, historical churn metrics, and validated defect findings.
                  </p>
                </div>

                {/* Interactive Simulator */}
                <RiskEngineExplorer />

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Mathematical Weight Distribution</h3>
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-white/10 text-slate-300 font-semibold font-mono text-[11px]">
                        <tr>
                          <th className="py-2.5 px-4">Signal ID</th>
                          <th className="py-2.5 px-4">Signal Name</th>
                          <th className="py-2.5 px-4">Kind</th>
                          <th className="py-2.5 px-4">Weight</th>
                          <th className="py-2.5 px-4">Midpoint / Curve</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-slate-300 font-mono text-[11px]">
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">change_size</td>
                          <td className="py-3 px-4">Change size</td>
                          <td className="py-3 px-4 text-sky-300">observed</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">0.18</td>
                          <td className="py-3 px-4 font-sans text-slate-400">Midpoint: 400 additions + deletions</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">change_spread</td>
                          <td className="py-3 px-4">Files touched</td>
                          <td className="py-3 px-4 text-sky-300">observed</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">0.08</td>
                          <td className="py-3 px-4 font-sans text-slate-400">Midpoint: 12 files</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">commit_count</td>
                          <td className="py-3 px-4">Commits in PR</td>
                          <td className="py-3 px-4 text-sky-300">observed</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">0.05</td>
                          <td className="py-3 px-4 font-sans text-slate-400">Midpoint: 10 commits</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">file_churn</td>
                          <td className="py-3 px-4">Historical file churn</td>
                          <td className="py-3 px-4 text-amber-300">derived</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">0.20</td>
                          <td className="py-3 px-4 font-sans text-slate-400">Midpoint: 15 commits in 90-day window</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">defect_history</td>
                          <td className="py-3 px-4">Defect-associated history</td>
                          <td className="py-3 px-4 text-amber-300">derived</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">0.20</td>
                          <td className="py-3 px-4 font-sans text-slate-400">Multiplier: 2.0x conventional fixes/reverts</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">file_age</td>
                          <td className="py-3 px-4">File inception age</td>
                          <td className="py-3 px-4 text-amber-300">derived</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">0.05</td>
                          <td className="py-3 px-4 font-sans text-slate-400">Midpoint: 180 days (younger = higher risk)</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">test_changes</td>
                          <td className="py-3 px-4">Test coverage movement</td>
                          <td className="py-3 px-4 text-sky-300">observed</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">0.09</td>
                          <td className="py-3 px-4 font-sans text-slate-400">Target: 0.33 ratio (docs/config exempt)</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">dependency_changes</td>
                          <td className="py-3 px-4">Dependency modifications</td>
                          <td className="py-3 px-4 text-sky-300">observed</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">0.05</td>
                          <td className="py-3 px-4 font-sans text-slate-400">Penalty: 0.6 if manifest modified</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-white">ai_findings</td>
                          <td className="py-3 px-4">AI review findings</td>
                          <td className="py-3 px-4 text-purple-300">model</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">0.10</td>
                          <td className="py-3 px-4 font-sans text-slate-400">Weighted by finding severity & confidence</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">Categorical Risk Bands</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <span className="text-emerald-400 font-bold">LOW (0–29)</span>
                      <p className="font-sans text-[11px] text-slate-300">
                        Focused updates, documentation, or changes with verified tests.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                      <span className="text-amber-400 font-bold">MEDIUM (30–54)</span>
                      <p className="font-sans text-[11px] text-slate-300">
                        Moderate churn, multiple modules touched, or minor untested branches.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-1">
                      <span className="text-orange-400 font-bold">HIGH (55–74)</span>
                      <p className="font-sans text-[11px] text-slate-300">
                        Significant file churn, past defect hotspots, or missing tests on code changes.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                      <span className="text-rose-400 font-bold">CRITICAL (75–100)</span>
                      <p className="font-sans text-[11px] text-slate-300">
                        Plaintext secret leaks, injection flaws, or severe rollback churn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Merge Quality Gates */}
            {activeSection === "quality-gate" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Sliders className="h-4 w-4" />
                  <span>MERGE QUALITY GATES</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Repository Quality Gate Configuration
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Buggers acts as an automated merge gatekeeper for pull requests.
                    Thresholds can be configured declaratively in <code className="text-amber-300 font-mono">.buggers.yml</code> or managed via repository settings.
                  </p>
                </div>

                {/* Quality Gate Simulator */}
                <QualityGateSimulator />

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">Declarative Configuration Format</h3>
                  <CodeBlock
                    filename=".buggers.yml"
                    language="yaml"
                    code={`version: 1

risk:
  threshold: 75             # Block pull request merge if score exceeds 75
  fail_on_critical: true     # Block merge if critical vulnerability is detected
  block_on_secrets: true     # Enforce hard block on leaked credentials
  block_on_cve: true         # Block on vulnerable dependency packages

ignore:
  paths:
    - "docs/**"
    - "**/*.spec.ts"
    - "**/*.test.ts"
    - "dist/**"`}
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">Commit Status Integration</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    When a pull request is triaged, Buggers calls GitHub's Commit Status API:
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 font-mono">
                    <li><span className="text-amber-300">pending</span>: Posted immediately upon webhook receipt ("Buggers AI Security Review queued...").</li>
                    <li><span className="text-emerald-400">success</span>: Quality gate passed. Displays risk score (e.g. "Passed (Risk 38/100)").</li>
                    <li><span className="text-rose-400">failure</span>: Quality gate blocked. Explains the exact violation (e.g. "Blocked: 1 plaintext secret / credential leak(s) detected").</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 6. Plaintext Secret Scanner */}
            {activeSection === "secret-scanner" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Lock className="h-4 w-4" />
                  <span>DETERMINISTIC SECURITY SCANNER</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    High-Entropy Plaintext Secret Scanner
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Implemented in <code className="text-amber-300 font-mono text-xs">src/server/secretScanner.server.ts</code>.
                    Directly inspects added lines in unified diff patches for exposed cloud API keys, tokens, and private keys.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">Active Secret Rules (Click to Expand)</h3>

                  <AccordionItem title="AWS Access Key ID" badge="AKIA Prefix" badgeColor="amber" defaultOpen>
                    <p>Detects standard 20-character AWS Access Key IDs exposed in code or configuration.</p>
                    <div className="font-mono text-xs bg-black/50 p-2.5 rounded border border-white/5 text-amber-300">
                      <code>{"Pattern: /\\b(AKIA[0-9A-Z]{16})\\b/g"}</code>
                    </div>
                    <p className="text-slate-400 text-xs">
                      <strong>Remediation:</strong> Store AWS credentials in AWS Secrets Manager or runtime environment variables (<code className="text-white font-mono">AWS_ACCESS_KEY_ID</code>).
                    </p>
                  </AccordionItem>

                  <AccordionItem title="GitHub Personal Access Token" badge="ghp_ / ghu_ / ghs_" badgeColor="amber">
                    <p>Detects classic and fine-grained GitHub personal access tokens.</p>
                    <div className="font-mono text-xs bg-black/50 p-2.5 rounded border border-white/5 text-amber-300">
                      <code>{"Pattern: /\\b(gh[pousr]_[A-Za-z0-9_]{36,255})\\b/g"}</code>
                    </div>
                    <p className="text-slate-400 text-xs">
                      <strong>Remediation:</strong> Revoke token immediately in GitHub Settings and inject via repository secrets (<code className="text-white font-mono">GITHUB_TOKEN</code>).
                    </p>
                  </AccordionItem>

                  <AccordionItem title="OpenAI Secret API Key" badge="sk- Prefix" badgeColor="amber">
                    <p>Detects OpenAI high-entropy secret API keys.</p>
                    <div className="font-mono text-xs bg-black/50 p-2.5 rounded border border-white/5 text-amber-300">
                      <code>{"Pattern: /\\b(sk-[a-zA-Z0-9_\\-]{20,64})\\b/g"}</code>
                    </div>
                    <p className="text-slate-400 text-xs">
                      <strong>Remediation:</strong> Move OpenAI key to server-side environment variables (<code className="text-white font-mono">process.env.OPENAI_API_KEY</code>).
                    </p>
                  </AccordionItem>

                  <AccordionItem title="Slack Webhooks & Bot Tokens" badge="hooks.slack.com / xoxb-" badgeColor="amber">
                    <p>Detects Slack Incoming Webhooks and OAuth bot tokens in plaintext.</p>
                    <div className="font-mono text-xs bg-black/50 p-2.5 rounded border border-white/5 text-amber-300">
                      <code>{"Pattern: /(https:\\/\\/hooks\\.slack\\.com\\/services\\/T...|xox[baprs]-...)/g"}</code>
                    </div>
                  </AccordionItem>

                  <AccordionItem title="Stripe Live Secret Key" badge="sk_live_ Prefix" badgeColor="rose">
                    <p>Detects production Stripe API keys.</p>
                    <div className="font-mono text-xs bg-black/50 p-2.5 rounded border border-white/5 text-rose-300">
                      <code>{"Pattern: /\\b(sk_live_[0-9a-zA-Z]{24,34})\\b/g"}</code>
                    </div>
                    <p className="text-slate-400 text-xs">
                      <strong>Remediation:</strong> Immediately roll the key in Stripe Dashboard and configure <code className="text-white font-mono">STRIPE_SECRET_KEY</code> in server environment.
                    </p>
                  </AccordionItem>

                  <AccordionItem title="Unencrypted Private Key Block" badge="BEGIN PRIVATE KEY" badgeColor="rose">
                    <p>Detects RSA, EC, DSA, OpenSSH, or PGP private key headers in commit diffs.</p>
                    <div className="font-mono text-xs bg-black/50 p-2.5 rounded border border-white/5 text-rose-300">
                      <code>{"Pattern: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP|PRIVATE) KEY-----/g"}</code>
                    </div>
                  </AccordionItem>

                  <AccordionItem title="Database Connection URIs" badge="postgres:// / mongodb://" badgeColor="amber">
                    <p>Detects database connection URIs embedding plaintext credentials.</p>
                    <div className="font-mono text-xs bg-black/50 p-2.5 rounded border border-white/5 text-amber-300">
                      <code>{"Pattern: /(postgres|mysql|mongodb(?:\\+srv)?):\\/\\/[^\\s:@]+:[^\\s:@]+@/g"}</code>
                    </div>
                  </AccordionItem>
                </div>
              </div>
            )}

            {/* 7. OWASP Top 10 SAST Scanner */}
            {activeSection === "sast-scanner" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <ShieldAlert className="h-4 w-4" />
                  <span>STATIC APPLICATION SECURITY TESTING</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    OWASP Top 10 SAST Scanner
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Implemented in <code className="text-amber-300 font-mono text-xs">src/server/sastScanner.server.ts</code>.
                    Scans diff patches for syntax patterns representing dangerous execution flaws.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">SAST Rules & Fix Recommendations</h3>

                  <AccordionItem title="Command Injection via Child Process" badge="Critical" badgeColor="rose" defaultOpen>
                    <p>Detects user input or variable concatenation inside shell execution commands.</p>
                    <CodeBlock
                      filename="example_fix.ts"
                      language="typescript"
                      code={`// Avoid string concatenation in exec:
// ❌ const { exec } = require("child_process");
// ❌ exec("ls -la " + userInput);

// Use execFile or spawn with argument arrays:
const { execFile } = require("child_process");
execFile("ls", ["-la", sanitizedDir], (err, stdout) => {
  // Safe execution without shell interpolation
});`}
                    />
                  </AccordionItem>

                  <AccordionItem title="SQL Injection via String Concatenation" badge="Critical" badgeColor="rose">
                    <p>Detects raw string template interpolation inside SQL query statements.</p>
                    <CodeBlock
                      filename="example_fix.ts"
                      language="typescript"
                      code={`// Avoid template literal query concatenation:
// ❌ await client.query(\`SELECT * FROM users WHERE email = '\${email}'\`);

// Use parameterized queries:
await client.query("SELECT * FROM users WHERE email = $1", [email]);`}
                    />
                  </AccordionItem>

                  <AccordionItem title="Path Traversal in File Operations" badge="High" badgeColor="rose">
                    <p>Detects unsanitized file path concatenation with user input in filesystem operations.</p>
                    <CodeBlock
                      filename="example_fix.ts"
                      language="typescript"
                      code={`const path = require("path");
const safePath = path.resolve(SAFE_DIR, path.basename(userInput));
if (!safePath.startsWith(SAFE_DIR)) {
  throw new Error("Path traversal blocked");
}`}
                    />
                  </AccordionItem>

                  <AccordionItem title="Server-Side Request Forgery (SSRF)" badge="High" badgeColor="amber">
                    <p>Detects unvalidated user input passed directly into outbound HTTP requests.</p>
                  </AccordionItem>

                  <AccordionItem title="Insecure Randomness for Security Tokens" badge="Medium" badgeColor="amber">
                    <p>Detects <code className="text-white font-mono">Math.random()</code> used for cryptographic nonces or tokens.</p>
                    <CodeBlock
                      filename="example_fix.ts"
                      language="typescript"
                      code={`// ❌ const token = Math.random().toString(36);
// Use crypto.randomBytes:
const crypto = require("node:crypto");
const token = crypto.randomBytes(32).toString("hex");`}
                    />
                  </AccordionItem>
                </div>
              </div>
            )}

            {/* 8. REST Endpoints & Server Functions */}
            {activeSection === "api-reference" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Code2 className="h-4 w-4" />
                  <span>API SPECIFICATION</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    REST Endpoints & Server Functions
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Buggers provides REST endpoints for GitHub webhooks and cron tasks, alongside
                    type-safe TanStack Start server functions (`serverFn`) for all application workflows.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Nitro REST Endpoints</h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          POST
                        </span>
                        <span className="text-white font-bold">/api/webhooks/github</span>
                        <span className="text-slate-500 text-[10px]">(Alias: /api/webhook)</span>
                      </div>
                      <p className="font-sans text-xs text-slate-300 leading-relaxed">
                        Receives signed GitHub webhooks. Verifies <code className="text-amber-300 font-mono">X-Hub-Signature-256</code> with HMAC-SHA256, applies IP sliding-window rate limit, sanitizes inputs, handles <code className="text-white font-mono">ping</code> and <code className="text-white font-mono">pull_request</code> (opened, synchronize, reopened), checks idempotency, and queues background triage.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          POST / GET
                        </span>
                        <span className="text-white font-bold">/api/cron/worker</span>
                      </div>
                      <p className="font-sans text-xs text-slate-300 leading-relaxed">
                        Reaps stale analyses (heartbeat &gt; 5 min), re-queues retries up to 3 attempts, acquires distributed 6-minute lease locks, and processes queued analyses. Authenticated via constant-time SHA-256 digest comparison against <code className="text-white font-mono">CRON_SECRET</code> and <code className="text-white font-mono">CRON_SECRET_PREVIOUS</code>.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                          GET
                        </span>
                        <span className="text-white font-bold">/api/health</span>
                      </div>
                      <p className="font-sans text-xs text-slate-300 leading-relaxed">
                        Returns engine status, service timestamp, and server uptime in seconds.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">TanStack Server Functions (RPCs)</h3>
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-white/10 text-slate-300 font-semibold font-mono text-[11px]">
                        <tr>
                          <th className="py-2.5 px-4">Function</th>
                          <th className="py-2.5 px-4">Module</th>
                          <th className="py-2.5 px-4">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-slate-300 font-mono text-[11px]">
                        <tr>
                          <td className="py-2.5 px-4 font-bold text-white">startAnalysis</td>
                          <td className="py-2.5 px-4 text-slate-400">analysis.functions</td>
                          <td className="py-2.5 px-4 font-sans">Enqueues analysis with idempotency per head SHA</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-bold text-white">runAnalysis</td>
                          <td className="py-2.5 px-4 text-slate-400">analysis.functions</td>
                          <td className="py-2.5 px-4 font-sans">Executes pipeline stages synchronously for polling</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-bold text-white">getAnalysis</td>
                          <td className="py-2.5 px-4 text-slate-400">analysis.functions</td>
                          <td className="py-2.5 px-4 font-sans">Returns risk score, signals, stages, and token cost</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-bold text-white">applyFindingFix</td>
                          <td className="py-2.5 px-4 text-slate-400">findings.functions</td>
                          <td className="py-2.5 px-4 font-sans">Directly commits verified fix to PR branch via Git Trees API</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-bold text-white">applyBatchFindingFixes</td>
                          <td className="py-2.5 px-4 text-slate-400">findings.functions</td>
                          <td className="py-2.5 px-4 font-sans">Applies multiple finding fixes in a single atomic commit</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-bold text-white">startGitHubConnect</td>
                          <td className="py-2.5 px-4 text-slate-400">github.functions</td>
                          <td className="py-2.5 px-4 font-sans">Generates AES-256-GCM encrypted CSRF state nonce</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-bold text-white">completeGitHubConnect</td>
                          <td className="py-2.5 px-4 text-slate-400">github.functions</td>
                          <td className="py-2.5 px-4 font-sans">Exchanges OAuth code and encrypts token in app_user_connections</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 9. Setup & Deployment */}
            {activeSection === "setup-deployment" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Server className="h-4 w-4" />
                  <span>OPERATIONS & HOSTING</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Setup & Production Deployment Guide
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Step-by-step instructions for provisioning Supabase, creating the GitHub OAuth App,
                    generating encryption keys, and deploying to Vercel.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">1. Generate Encryption Keys</h3>
                  <CodeBlock
                    filename="keygen.sh"
                    code={`# Generate 32-byte base64 AES-256-GCM key for token encryption:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate 32-byte hex key for HMAC webhook verification:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">2. Complete Environment Specification</h3>
                  <CodeBlock
                    filename=".env"
                    language="env"
                    code={`# Supabase Database & Auth
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."

# GitHub OAuth App Connection
GITHUB_CLIENT_ID="Ov23li..."
GITHUB_CLIENT_SECRET="abc123..."
GITHUB_WEBHOOK_SECRET="hex-webhook-secret"
APP_USER_CONNECTION_KEY_SECRET="base64-32-byte-secret"

# AI Provider Selection
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
# ANTHROPIC_API_KEY="sk-ant-..."
# GOOGLE_GENERATIVE_AI_API_KEY="..."

# Cron Worker Authentication
CRON_SECRET="hex-cron-secret"`}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">3. Deploying to Vercel</h3>
                  <CodeBlock
                    filename="terminal"
                    code={`# Compile production bundle
npm run build

# Deploy prebuilt Nitro output to Vercel
npx vercel deploy --prebuilt --prod`}
                  />
                </div>
              </div>
            )}

            {/* 10. Troubleshooting & Operations Runbook */}
            {activeSection === "troubleshooting" && (
              <div className="rounded-3xl border border-white/10 bg-[#0c0e15] p-6 sm:p-9 space-y-7 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <ShieldCheck className="h-4 w-4" />
                  <span>DIAGNOSTICS & RUNBOOK</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Troubleshooting & Diagnostics
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Diagnostic checklist and resolution procedures for common operational scenarios.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="font-mono text-amber-300 font-bold text-xs uppercase">
                      Issue: "GitHub authorization expired. Reconnect your account."
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      The GitHub OAuth access token was revoked or expired. Navigate to <strong>Settings &rarr; GitHub Connection</strong>, click <strong>Disconnect Account</strong>, and re-connect via <strong>Connect GitHub</strong> to issue a fresh encrypted token.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="font-mono text-amber-300 font-bold text-xs uppercase">
                      Issue: Webhook 401 "Invalid webhook signature"
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      The signature in <code className="text-white font-mono">X-Hub-Signature-256</code> failed HMAC-SHA256 verification. Ensure that <code className="text-white font-mono">GITHUB_WEBHOOK_SECRET</code> in your server environment matches the Secret field configured in GitHub Webhook settings.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="font-mono text-amber-300 font-bold text-xs uppercase">
                      Issue: Analysis Stuck in "Processing" State
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      If an analysis process crashes unexpectedly, the 5-minute lease lock (<code className="text-white font-mono">lease_expires_at</code>) expires. The cron worker at <code className="text-white font-mono">/api/cron/worker</code> detects expired heartbeats and automatically re-queues the job up to 3 attempts.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="font-mono text-amber-300 font-bold text-xs uppercase">
                      Issue: High "AI Findings Rejected" Count
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      This is expected protective behavior. Buggers' <code className="text-white font-mono">validateAiFindings</code> filter verifies every finding against actual diff hunks. If a model hallucinates citations outside the diff, they are discarded to ensure zero phantom line comments.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Consistent Matte-Black Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-xs text-slate-500 bg-[#07090e]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span className="font-semibold text-slate-400">Buggers</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-500">Deterministic Code Review &amp; Triage</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-slate-300 transition-colors">
              Home
            </Link>
            <Link to="/about" className="hover:text-slate-300 transition-colors">
              About
            </Link>
            <Link to="/how-it-works" className="hover:text-slate-300 transition-colors">
              How It Works
            </Link>
            <Link to="/auth" className="hover:text-slate-300 transition-colors">
              Sign In
            </Link>
            <span className="text-emerald-400 font-mono text-[11px]">&bull; Systems Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
