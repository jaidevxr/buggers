import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
  ExternalLink,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";
import { CodeBlock, Callout, AccordionItem } from "@/components/docs/DocsComponents";
import { LinearProductSections } from "@/components/docs/LinearProductSections";
import { LinearWireframeGrid } from "@/components/docs/LinearWireframeGrid";
import { LiveScannerPlayground } from "@/components/docs/LiveScannerPlayground";
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

type SectionId =
  | "all"
  | "build-review-ship"
  | "ai-automations"
  | "risk-engine"
  | "quality-gates"
  | "security-scanners"
  | "pipeline"
  | "architecture"
  | "api"
  | "deployment";

interface NavTab {
  id: SectionId;
  label: string;
  targetId: string;
}

const NAV_TABS: NavTab[] = [
  { id: "all", label: "All Specifications", targetId: "hero" },
  { id: "build-review-ship", label: "Review & Diffs", targetId: "build-review-ship" },
  { id: "ai-automations", label: "AI Engine", targetId: "ai-automations" },
  { id: "risk-engine", label: "Risk Model 1.1.0", targetId: "risk-engine" },
  { id: "quality-gates", label: "Quality Gates", targetId: "quality-gates" },
  { id: "security-scanners", label: "Security & SAST", targetId: "security-scanners" },
  { id: "pipeline", label: "9-Stage Pipeline", targetId: "pipeline" },
  { id: "architecture", label: "Architecture", targetId: "architecture" },
  { id: "api", label: "API Reference", targetId: "api" },
  { id: "deployment", label: "Deployment & Ops", targetId: "deployment" },
];

export function DocsPage() {
  const [activeTab, setActiveTab] = useState<SectionId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  // Smooth scroll jump
  const scrollToSection = (tab: NavTab) => {
    setActiveTab(tab.id);
    if (tab.targetId === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const elem = document.getElementById(tab.targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Auto-track active section while scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 200) {
        setActiveTab("all");
        return;
      }
      const sections = NAV_TABS.filter((t) => t.id !== "all");
      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        if (!sec) continue;
        const elem = document.getElementById(sec.targetId);
        if (elem) {
          const rect = elem.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveTab(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyCurl = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCurl(id);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#08090a] text-neutral-200 antialiased selection:bg-white/20 flex flex-col justify-between overflow-x-clip">
      {/* Expansive Main Editorial Container */}
      <main className="w-full max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-12 pt-28 pb-32 flex-1 flex flex-col">
        
        {/* ============================================================== */}
        {/* Editorial Masthead */}
        {/* ============================================================== */}
        <header id="hero" className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 tracking-wider uppercase">
            <span className="text-white font-semibold">BUGGERS</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">SYSTEM ARCHITECTURE &amp; TECHNICAL SPECIFICATIONS</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[1.08]">
            Engineering Documentation
          </h1>
          
          <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed max-w-3xl">
            Deterministic release intelligence, mathematical risk models, automated OWASP AST vulnerability scanners, and production deployment specifications grounded in verified pull request diffs.
          </p>

          {/* Sticky, Frosted Category Filter Bar & Live Search */}
          <div className="pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5 sticky top-16 bg-[#08090a]/85 backdrop-blur-md z-30">
            {/* Category Filter Pills */}
            <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium no-scrollbar">
              {NAV_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => scrollToSection(tab)}
                    className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-white text-black font-semibold shadow-md"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Clean Integrated Search Bar */}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 1. Linear 3-Column Isometric Wireframe Grid */}
        {/* ============================================================== */}
        <LinearWireframeGrid />

        {/* ============================================================== */}
        {/* 2. Flagship Linear Product Chapters (Chapters 1 - 4) */}
        {/* ============================================================== */}
        <div className="my-20">
          <LinearProductSections />
        </div>

        {/* ============================================================== */}
        {/* 3. CHAPTER 5: Pre-Execution Security & SAST Scanners */}
        {/* ============================================================== */}
        <section id="security-scanners" className="w-full space-y-8 scroll-mt-28 border-t border-white/[0.08] pt-24">
          {/* Split Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
            <div className="lg:col-span-7">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-2 block">
                SPECIFICATION 05 / IN-PROCESS SCANNER TESTBED
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
                Pre-execution security &amp; SAST
              </h2>
            </div>
            <div className="lg:col-span-5 space-y-2">
              <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
                Zero-overhead, in-process scanners inspect every diff hunk before any LLM inference occurs. Plaintext credentials and OWASP Top 10 vulnerabilities are caught deterministically.
              </p>
              <a
                href="#pipeline"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group cursor-pointer"
              >
                <span>Inspect worker execution pipeline</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Interactive In-Process Scanner Testbed */}
          <div className="w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0e1015] via-[#0a0b0f] to-[#08090a] p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-10" />
            <div className="relative z-0">
              <LiveScannerPlayground />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. CHAPTER 6: Worker Runtime & 9-Stage Pipeline */}
        {/* ============================================================== */}
        <section id="pipeline" className="w-full space-y-8 scroll-mt-28 border-t border-white/[0.08] pt-24">
          {/* Split Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
            <div className="lg:col-span-7">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-2 block">
                SPECIFICATION 06 / WORKER RUNTIME &amp; HEARTBEAT LEASES
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
                Worker runtime &amp; 9-stage pipeline
              </h2>
            </div>
            <div className="lg:col-span-5 space-y-2">
              <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
                Background analysis runs in isolated 9-stage passes governed by 5-minute heartbeat leases and exponential backoff reapers.
              </p>
              <a
                href="#architecture"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group cursor-pointer"
              >
                <span>Explore dual-auth architecture</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Interactive 9-Stage Pipeline Visualizer */}
          <div className="w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0e1015] via-[#0a0b0f] to-[#08090a] p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-10" />
            <div className="relative z-0">
              <PipelineStageVisualizer />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. CHAPTER 7: Architecture & API Reference */}
        {/* ============================================================== */}
        <section id="architecture" className="w-full space-y-8 scroll-mt-28 border-t border-white/[0.08] pt-24">
          {/* Split Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
            <div className="lg:col-span-7">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-2 block">
                SPECIFICATION 07 / DUAL-AUTH ISOLATION &amp; NITRO ROUTES
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
                Architecture &amp; API reference
              </h2>
            </div>
            <div className="lg:col-span-5 space-y-2">
              <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
                Strict separation of authentication boundaries: User authentication via Supabase JWT with Row-Level Security, and GitHub repository tokens encrypted via AES-256-GCM.
              </p>
              <a
                href="#deployment"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group cursor-pointer"
              >
                <span>View production deployment runbook</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Dual-Auth Architecture Blueprint */}
          <div className="w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0e1015] via-[#0a0b0f] to-[#08090a] p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] space-y-8 relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-10" />
            <div className="relative z-0 space-y-8">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono">
              <span className="text-white font-semibold uppercase">Dual-Auth Boundary Isolation</span>
              <span className="text-neutral-400">Zero Secret Leakage</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
              <div className="p-6 rounded-xl border border-white/[0.06] bg-[#07080a] space-y-3">
                <div className="text-amber-400 font-semibold text-sm">1. Browser Client</div>
                <p className="text-neutral-400 leading-relaxed font-sans">
                  Maintains Supabase JWT session in local storage. Never touches GitHub OAuth tokens or database service role keys directly.
                </p>
                <div className="pt-2 text-[10px] text-neutral-500">
                  Headers: Bearer &lt;SUPABASE_JWT&gt;
                </div>
              </div>

              <div className="p-6 rounded-xl border border-white/[0.06] bg-[#07080a] space-y-3">
                <div className="text-emerald-400 font-semibold text-sm">2. Nitro SSR &amp; RPC</div>
                <p className="text-neutral-400 leading-relaxed font-sans">
                  Verifies caller JWT on every RPC function. Decrypts AES-256-GCM tokens on demand in memory, never logging or leaking them.
                </p>
                <div className="pt-2 text-[10px] text-neutral-500">
                  Key: APP_USER_CONNECTION_KEY_SECRET (AES-256)
                </div>
              </div>

              <div className="p-6 rounded-xl border border-white/[0.06] bg-[#07080a] space-y-3">
                <div className="text-blue-400 font-semibold text-sm">3. PostgreSQL &amp; RLS</div>
                <p className="text-neutral-400 leading-relaxed font-sans">
                  Strict Row-Level Security ensures users can only read their own repositories, pull requests, analyses, and findings.
                </p>
                <div className="pt-2 text-[10px] text-neutral-500">
                  Policy: auth.uid() = user_id
                </div>
              </div>
            </div>

            {/* REST Endpoints Table */}
            <div id="api" className="space-y-4 pt-4 border-t border-white/[0.06] scroll-mt-28">
              <h3 className="text-base font-medium text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-cyan-400" />
                <span>Nitro REST Webhooks &amp; Internal Endpoints</span>
              </h3>

              <div className="rounded-xl border border-white/[0.08] bg-[#07080a] overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 text-[11px] font-mono">
                    <tr>
                      <th className="py-3 px-5">Endpoint</th>
                      <th className="py-3 px-5">Method</th>
                      <th className="py-3 px-5">Authentication</th>
                      <th className="py-3 px-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-neutral-300 font-mono text-[11px]">
                    <tr>
                      <td className="py-3 px-5 text-white">/api/webhooks/github</td>
                      <td className="py-3 px-5 text-amber-400">POST</td>
                      <td className="py-3 px-5 text-neutral-400">HMAC SHA-256 (X-Hub-Signature-256)</td>
                      <td className="py-3 px-5">
                        <button
                          type="button"
                          onClick={() => handleCopyCurl('curl -X POST https://buggers.vercel.app/api/webhooks/github -H "X-Hub-Signature-256: sha256=..." -d \'{"action":"opened"}\'', "webhook")}
                          className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 font-sans cursor-pointer"
                        >
                          {copiedCurl === "webhook" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>Copy cURL</span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 text-white">/api/cron/worker</td>
                      <td className="py-3 px-5 text-emerald-400">GET</td>
                      <td className="py-3 px-5 text-neutral-400">Bearer Token (CRON_SECRET)</td>
                      <td className="py-3 px-5">
                        <button
                          type="button"
                          onClick={() => handleCopyCurl('curl -X GET https://buggers.vercel.app/api/cron/worker -H "Authorization: Bearer YOUR_CRON_SECRET"', "cron")}
                          className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 font-sans cursor-pointer"
                        >
                          {copiedCurl === "cron" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>Copy cURL</span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 text-white">/api/health</td>
                      <td className="py-3 px-5 text-blue-400">GET</td>
                      <td className="py-3 px-5 text-neutral-400">Public</td>
                      <td className="py-3 px-5">
                        <button
                          type="button"
                          onClick={() => handleCopyCurl("curl -X GET https://buggers.vercel.app/api/health", "health")}
                          className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 font-sans cursor-pointer"
                        >
                          {copiedCurl === "health" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>Copy cURL</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 6. CHAPTER 8: Production Deployment & Runbook */}
        {/* ============================================================== */}
        <section id="deployment" className="w-full space-y-8 scroll-mt-28 border-t border-white/[0.08] pt-24">
          {/* Split Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
            <div className="lg:col-span-7">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-2 block">
                SPECIFICATION 08 / VERIFIED DEPLOYMENT RUNBOOK
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
                Production deployment &amp; runbook
              </h2>
            </div>
            <div className="lg:col-span-5 space-y-2">
              <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
                Step-by-step verified guide for provisioning Supabase PostgreSQL schemas, GitHub OAuth credentials, cryptographic secrets, and Vercel edge deployment.
              </p>
            </div>
          </div>

          {/* Interactive 4-Phase Deployment Checklist */}
          <div className="space-y-4">
            <AccordionItem
              title="1. Database Schema Provisioning (Supabase SQL)"
              defaultOpen={true}
            >
              <div className="space-y-3 text-xs text-neutral-300 font-sans leading-relaxed">
                <p>
                  Open your Supabase SQL editor and execute the complete schema definition located in <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">supabase-setup.sql</code> at the root of the repository. This provisions the 8 core tables:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-amber-300">
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">profiles</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">user_connections</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">repositories</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">pull_requests</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">pr_analyses</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">findings</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">finding_comments</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">diff_caches</div>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="2. GitHub OAuth App Configuration">
              <div className="space-y-3 text-xs text-neutral-300 font-sans leading-relaxed">
                <p>
                  Register a new GitHub OAuth App under your organization settings:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                  <li>Homepage URL: <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">https://&lt;your-domain&gt;</code></li>
                  <li>Authorization callback URL: <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">https://&lt;your-domain&gt;/dashboard</code></li>
                  <li>Required Scopes: <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">read:user repo</code></li>
                </ul>
              </div>
            </AccordionItem>

            <AccordionItem title="3. Generate 256-Bit Cryptographic Secrets">
              <div className="space-y-3 text-xs text-neutral-300 font-sans leading-relaxed">
                <p>
                  Generate a cryptographically secure 256-bit encryption key for user GitHub token storage:
                </p>
                <CodeBlock
                  code='node -e "console.log(require(\x27crypto\x27).randomBytes(32).toString(\x27hex\x27))"'
                  language="bash"
                  filename="terminal"
                />
              </div>
            </AccordionItem>

            <AccordionItem title="4. Vercel Production Environment Variables (14 Keys)">
              <div className="space-y-3 text-xs text-neutral-300 font-sans leading-relaxed">
                <p>
                  Configure all 14 production environment variables in your Vercel project settings:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-neutral-300">SUPABASE_URL</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-neutral-300">SUPABASE_SERVICE_ROLE_KEY</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-neutral-300">GITHUB_CLIENT_ID</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-neutral-300">GITHUB_CLIENT_SECRET</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-neutral-300">APP_USER_CONNECTION_KEY_SECRET</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-neutral-300">GITHUB_WEBHOOK_SECRET</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-neutral-300">CRON_SECRET</div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-neutral-300">AI_PROVIDER (claude | openai | gemini)</div>
                </div>
              </div>
            </AccordionItem>
          </div>
        </section>

      </main>
    </div>
  );
}
