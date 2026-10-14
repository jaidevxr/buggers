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
import { LinearProductSections } from "@/components/docs/LinearProductSections";
import { LinearWireframeGrid } from "@/components/docs/LinearWireframeGrid";
import { RiskEngineExplorer } from "@/components/docs/RiskEngineExplorer";
import { QualityGateSimulator } from "@/components/docs/QualityGateSimulator";
import { PipelineStageVisualizer } from "@/components/docs/PipelineStageVisualizer";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Buggers Engineering Specifications" },
      {
        name: "description",
        content:
          "Engineering documentation for Buggers: Deterministic risk scoring model 1.1.0, 9-stage AST triage pipeline, OWASP SAST & secret scanners, GitHub OAuth & webhooks, and Nitro server functions.",
      },
      { property: "og:title", content: "Documentation — Buggers Engineering Specifications" },
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

type CategoryFilter =
  | "all"
  | "overview"
  | "build-review"
  | "ai"
  | "risk"
  | "gates"
  | "security"
  | "pipeline"
  | "architecture"
  | "api"
  | "deployment";

export function DocsPage() {
  const [activeTab, setActiveTab] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const shouldShow = (category: CategoryFilter) => {
    if (activeTab === "all") return true;
    return activeTab === category;
  };

  return (
    <div className="min-h-screen w-full bg-[#08090a] text-neutral-200 antialiased selection:bg-white/20 flex flex-col justify-between">
      {/* Expansive Main Container */}
      <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 pt-32 pb-32 flex-1 flex flex-col">
        
        {/* ============================================================== */}
        {/* Editorial Hero Header */}
        {/* ============================================================== */}
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 tracking-wider uppercase">
            <span className="text-amber-400 font-semibold">BUGGERS</span>
            <span>/</span>
            <span>SYSTEM ARCHITECTURE &amp; SPECIFICATIONS</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[1.08]">
            Engineering Documentation
          </h1>
          
          <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed max-w-3xl">
            Deterministic release intelligence, mathematical risk models, automated OWASP AST vulnerability scanners, and production deployment specifications grounded in verified pull request diffs.
          </p>

          {/* Quick-Jump Horizontal Navigation & Search Bar */}
          <div className="pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6 sticky top-20 bg-[#08090a]/90 backdrop-blur-md z-30">
            {/* Category Filter Pills */}
            <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 text-xs font-medium no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "all" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                All Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "overview" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Capabilities
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("build-review")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "build-review" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Review Bot &amp; Diffs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("risk")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "risk" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Risk Engine (1.1.0)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("gates")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "gates" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Quality Gates
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "security" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Security &amp; SAST
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pipeline")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "pipeline" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                9-Stage Pipeline
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("architecture")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "architecture" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Architecture
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("api")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "api" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                API &amp; RPC
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("deployment")}
                className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  activeTab === "deployment" ? "bg-white text-black font-semibold" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Deployment
              </button>
            </nav>

            {/* Clean, Integrated Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formulas, APIs, scanners..."
                className="w-full pl-9 pr-8 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 1. Flagship Linear 2x2 Interactive Feature Showcase */}
        {/* ============================================================== */}
        {(shouldShow("overview") || activeTab === "all") && (
          <section id="capabilities" className="mb-24">
            <LinearFeaturePreview />
          </section>
        )}

        {/* ============================================================== */}
        {/* 2. Linear 3-Column Isometric Wireframe Grid */}
        {/* ============================================================== */}
        {(shouldShow("architecture") || activeTab === "all") && (
          <LinearWireframeGrid />
        )}

        {/* ============================================================== */}
        {/* 3. Linear Flagship Product Sections (Build, Review, Ship etc.) */}
        {/* ============================================================== */}
        {(shouldShow("build-review") || shouldShow("ai") || shouldShow("risk") || shouldShow("gates") || activeTab === "all") && (
          <div className="my-24">
            <LinearProductSections />
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. Comprehensive Technical Engineering Deep-Dives */}
        {/* ============================================================== */}
        <div className="space-y-28 pt-12">

          {/* SECTION: Deterministic Risk Engine 1.1.0 */}
          {(shouldShow("risk") || activeTab === "all") && (
            <section id="risk-engine" className="border-t border-white/[0.08] pt-16 space-y-10">
              <div className="space-y-2 max-w-3xl">
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                  SPECIFICATION / MATHEMATICAL MODEL
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                  Deterministic Risk Engine (risk-engine-1.1.0)
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
                  The Buggers risk model synthesizes 8 orthogonal repository signals into a bounded score $R \in [0, 100]$ using saturating exponential curves. The model is 100% deterministic and runs in under 15ms.
                </p>
              </div>

              {/* Full-Width Interactive Risk Explorer */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b0e] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
                <RiskEngineExplorer />
              </div>

              {/* Mathematical Formulas & Weights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-white flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-amber-400" />
                    <span>Composite Scoring Formula</span>
                  </h3>
                  <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-5 text-xs font-mono text-neutral-300 space-y-3">
                    <p className="text-neutral-400 text-[11px]">Normalized additive linear combination:</p>
                    <div className="text-amber-200/95 bg-black/50 p-3 rounded-lg border border-white/[0.04]">
                      R = &Sigma; (w_i &times; S_i) &times; C
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-neutral-400">
                      <li>&bull; <strong className="text-white">w_i</strong>: Static weights summing to 1.00</li>
                      <li>&bull; <strong className="text-white">S_i</strong>: Individual signal functions bounded in [0, 100]</li>
                      <li>&bull; <strong className="text-white">C</strong>: Repository historical calibration factor</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-medium text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-emerald-400" />
                    <span>Signal Weights Matrix</span>
                  </h3>
                  <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 text-[11px] font-mono">
                        <tr>
                          <th className="py-2.5 px-4">Signal</th>
                          <th className="py-2.5 px-4">Weight</th>
                          <th className="py-2.5 px-4">Formula</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-neutral-300 font-mono text-[11px]">
                        <tr>
                          <td className="py-2 px-4 text-white">Churn Volume</td>
                          <td className="py-2 px-4 text-amber-400">0.20</td>
                          <td className="py-2 px-4 text-neutral-400">100 &times; (1 - e^(-churn/350))</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 text-white">Critical Path Files</td>
                          <td className="py-2 px-4 text-amber-400">0.20</td>
                          <td className="py-2 px-4 text-neutral-400">min(100, critical_count &times; 25)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 text-white">File Diffusion Entropy</td>
                          <td className="py-2 px-4 text-amber-400">0.15</td>
                          <td className="py-2 px-4 text-neutral-400">-&Sigma; p_i log2(p_i) / log2(N)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 text-white">Author Unfamiliarity</td>
                          <td className="py-2 px-4 text-amber-400">0.15</td>
                          <td className="py-2 px-4 text-neutral-400">100 &times; (1 - author_commits/50)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 text-white">Test Churn Deficit</td>
                          <td className="py-2 px-4 text-amber-400">0.10</td>
                          <td className="py-2 px-4 text-neutral-400">max(0, 100 - (test_ratio &times; 250))</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 text-white">Historical Revert Pattern</td>
                          <td className="py-2 px-4 text-amber-400">0.10</td>
                          <td className="py-2 px-4 text-neutral-400">revert_match_score &times; 100</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 text-white">Manifest Dependency Drift</td>
                          <td className="py-2 px-4 text-amber-400">0.05</td>
                          <td className="py-2 px-4 text-neutral-400">major_bumps &times; 30 + minor &times; 10</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 text-white">Cyclomatic Complexity Delta</td>
                          <td className="py-2 px-4 text-amber-400">0.05</td>
                          <td className="py-2 px-4 text-neutral-400">min(100, max_delta &times; 15)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Merge Quality Gates */}
          {(shouldShow("gates") || activeTab === "all") && (
            <section id="quality-gates" className="border-t border-white/[0.08] pt-16 space-y-10">
              <div className="space-y-2 max-w-3xl">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  SPECIFICATION / POLICY ENFORCEMENT
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                  Automated Merge Quality Gates (.buggers.yml)
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
                  Configure repository merge policies with declarative rules committed directly into your repository. Buggers synchronizes policy evaluations to GitHub commit status checks in real time.
                </p>
              </div>

              {/* Interactive Simulator */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b0e] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
                <QualityGateSimulator />
              </div>

              {/* Policy Configuration Reference */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-white flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-neutral-400" />
                  <span>Production Policy Specification (.buggers.yml)</span>
                </h3>
                <CodeBlock
                  code={`# .buggers.yml - Repository Quality Gate Policy
version: "1.0"

rules:
  # Maximum allowable composite risk score
  max_risk_score: 50

  # Block merges if any plaintext secrets or credentials are found
  block_on_secrets: true

  # Block on high or critical static analysis (SAST) findings
  block_on_critical_sast: true

  # Require at least 20% of changes to include automated tests
  required_test_ratio: 0.20

  # Files requiring strict security approval when modified
  critical_files:
    - "src/auth/**"
    - "supabase/migrations/**"
    - "server/routes/api.ts"

status_checks:
  context: "buggers/quality-gate"
  post_summary_comment: true
  auto_apply_safe_fixes: false`}
                  language="yaml"
                  filename=".buggers.yml"
                />
              </div>
            </section>
          )}

          {/* SECTION: 9-Stage Analysis Pipeline */}
          {(shouldShow("pipeline") || activeTab === "all") && (
            <section id="pipeline" className="border-t border-white/[0.08] pt-16 space-y-10">
              <div className="space-y-2 max-w-3xl">
                <div className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                  SPECIFICATION / WORKER RUNTIME
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                  9-Stage Deterministic Analysis Pipeline
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
                  Background analysis runs in isolated 9-stage passes governed by 5-minute heartbeat leases and exponential backoff reapers. Explore each stage interactively below:
                </p>
              </div>

              {/* Interactive Pipeline Visualizer */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b0e] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
                <PipelineStageVisualizer />
              </div>
            </section>
          )}

          {/* SECTION: Pre-Execution Security & SAST Scanners */}
          {(shouldShow("security") || activeTab === "all") && (
            <section id="security-scanners" className="border-t border-white/[0.08] pt-16 space-y-10">
              <div className="space-y-2 max-w-3xl">
                <div className="text-xs font-mono text-rose-400 uppercase tracking-wider">
                  SPECIFICATION / STATIC ANALYSIS
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                  Plaintext Secret &amp; OWASP SAST Scanners
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
                  Zero-overhead, in-process scanners inspect every diff hunk before any LLM inference occurs. Hardcoded tokens and injection vulnerabilities are caught deterministically.
                </p>
              </div>

              {/* Scanners Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Secret Scanner Table */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b0e] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-400" />
                      <span>Plaintext Secret Scanner (8 Patterns)</span>
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      In-Process
                    </span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                      <div className="text-white font-medium">AWS Access Key ID</div>
                      <div className="text-[11px] text-neutral-400 font-mono">AKIA[0-9A-Z]{"{16}"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                      <div className="text-white font-medium">GitHub Personal Access Token</div>
                      <div className="text-[11px] text-neutral-400 font-mono">gh[pousr]_[A-Za-z0-9_]{"{36,255}"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                      <div className="text-white font-medium">OpenAI Secret API Key</div>
                      <div className="text-[11px] text-neutral-400 font-mono">sk-(proj-)?[A-Za-z0-9_-]{"{20,}"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                      <div className="text-white font-medium">Stripe Live Secret Key</div>
                      <div className="text-[11px] text-neutral-400 font-mono">sk_live_[0-9a-zA-Z]{"{24,}"}</div>
                    </div>
                  </div>
                </div>

                {/* SAST Scanner Table */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b0e] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                      <span>OWASP Top 10 SAST Scanner (7 Rules)</span>
                    </h3>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      Zero-Token
                    </span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                      <div className="text-white font-medium">SQL String Concatenation (A03:2021)</div>
                      <div className="text-[11px] text-neutral-400">Flags raw template interpolation in db.query or execute()</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                      <div className="text-white font-medium">Path Traversal in File Operations (A01:2021)</div>
                      <div className="text-[11px] text-neutral-400">Detects unsanitized user inputs passed to fs.readFile or path.join</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                      <div className="text-white font-medium">Command Injection (A03:2021)</div>
                      <div className="text-[11px] text-neutral-400">Detects child_process.exec with concatenated variable arguments</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                      <div className="text-white font-medium">Wildcard CORS &amp; Permissive Headers (A05:2021)</div>
                      <div className="text-[11px] text-neutral-400">Flags Access-Control-Allow-Origin: * combined with credentials</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Architecture & Dual-Auth Security */}
          {(shouldShow("architecture") || activeTab === "all") && (
            <section id="architecture" className="border-t border-white/[0.08] pt-16 space-y-10">
              <div className="space-y-2 max-w-3xl">
                <div className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                  SPECIFICATION / CORE ARCHITECTURE
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                  System Architecture &amp; Dual-Auth Model
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
                  Engineered with strict separation of authentication boundaries: User authentication via Supabase JWT with Row-Level Security, and GitHub repository tokens encrypted via AES-256-GCM.
                </p>
              </div>

              {/* Architecture Blueprint Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b0e] p-8 space-y-6">
                <h3 className="text-base font-medium text-white">Dual-Auth Security Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
                  <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0d10] space-y-3">
                    <div className="text-amber-400 font-semibold text-sm">1. Browser Client</div>
                    <p className="text-neutral-400 leading-relaxed">
                      Maintains Supabase JWT session in local storage. Never touches GitHub OAuth tokens or service role keys directly.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0d10] space-y-3">
                    <div className="text-emerald-400 font-semibold text-sm">2. Nitro SSR &amp; RPC</div>
                    <p className="text-neutral-400 leading-relaxed">
                      Verifies caller JWT on every RPC function. Decrypts AES-256-GCM tokens on demand in memory, never logging or leaking them.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0d10] space-y-3">
                    <div className="text-blue-400 font-semibold text-sm">3. PostgreSQL &amp; RLS</div>
                    <p className="text-neutral-400 leading-relaxed">
                      Strict Row-Level Security ensures users can only read their own repositories, pull requests, analyses, and findings.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION: REST Endpoints & Server Functions */}
          {(shouldShow("api") || activeTab === "all") && (
            <section id="api" className="border-t border-white/[0.08] pt-16 space-y-10">
              <div className="space-y-2 max-w-3xl">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  SPECIFICATION / API REFERENCE
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                  REST Endpoints &amp; RPC Server Functions
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
                  All webhook listeners and background cron workers are served via Nitro routes under <code className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">/api/*</code>.
                </p>
              </div>

              {/* Endpoints Table */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b0e] overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 text-[11px] font-mono">
                    <tr>
                      <th className="py-3 px-5">Endpoint</th>
                      <th className="py-3 px-5">Method</th>
                      <th className="py-3 px-5">Authentication</th>
                      <th className="py-3 px-5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-neutral-300 font-mono text-[11px]">
                    <tr>
                      <td className="py-3 px-5 text-white">/api/webhooks/github</td>
                      <td className="py-3 px-5 text-amber-400">POST</td>
                      <td className="py-3 px-5 text-neutral-400">HMAC SHA-256 (X-Hub-Signature-256)</td>
                      <td className="py-3 px-5 text-neutral-300">Receives pull_request opened, synchronize, and closed events</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 text-white">/api/cron/worker</td>
                      <td className="py-3 px-5 text-emerald-400">GET</td>
                      <td className="py-3 px-5 text-neutral-400">Bearer Token (CRON_SECRET)</td>
                      <td className="py-3 px-5 text-neutral-300">Heartbeat worker processing queued PR analyses with lease reclamation</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 text-white">/api/health</td>
                      <td className="py-3 px-5 text-blue-400">GET</td>
                      <td className="py-3 px-5 text-neutral-400">Public</td>
                      <td className="py-3 px-5 text-neutral-300">Returns service uptime and security engine health status</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION: Deployment & Operations Runbook */}
          {(shouldShow("deployment") || activeTab === "all") && (
            <section id="deployment" className="border-t border-white/[0.08] pt-16 space-y-10">
              <div className="space-y-2 max-w-3xl">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  OPERATIONS / RUNBOOK
                </div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
                  Production Deployment &amp; Troubleshooting
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
                  Step-by-step instructions for provisioning Supabase PostgreSQL schemas, GitHub OAuth credentials, and Vercel edge deployment.
                </p>
              </div>

              {/* Deployment Steps Accordions */}
              <div className="space-y-3">
                <AccordionItem
                  title="1. Database Schema Provisioning (Supabase SQL)"
                  defaultOpen={true}
                >
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Open your Supabase SQL editor and execute <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">supabase-setup.sql</code> located at the root of the Buggers repository. This configures the 8 database tables, Row-Level Security policies, and trigger functions.
                  </p>
                </AccordionItem>

                <AccordionItem title="2. GitHub OAuth App Configuration">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Register a new GitHub OAuth App under your organization. Set Authorization callback URL to <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">https://&lt;your-domain&gt;/dashboard</code> and configure scopes <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">read:user repo</code>.
                  </p>
                </AccordionItem>

                <AccordionItem title="3. Generate Cryptographic Secrets">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Run <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"</code> to generate a cryptographically strong 256-bit key for <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">APP_USER_CONNECTION_KEY_SECRET</code>.
                  </p>
                </AccordionItem>

                <AccordionItem title="4. Vercel Production Environment Variables">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Configure all 14 production environment variables: <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">SUPABASE_URL</code>, <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code>, <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">GITHUB_CLIENT_ID</code>, <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">GITHUB_CLIENT_SECRET</code>, <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">APP_USER_CONNECTION_KEY_SECRET</code>, <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">GITHUB_WEBHOOK_SECRET</code>, <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">CRON_SECRET</code>, <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">AI_PROVIDER</code>, and <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">AI_API_KEY</code>.
                  </p>
                </AccordionItem>
              </div>
            </section>
          )}

        </div>

      </main>
    </div>
  );
}
