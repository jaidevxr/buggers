import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
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
      { title: "Documentation – Buggers Engineering Specifications" },
      {
        name: "description",
        content:
          "Engineering documentation for Buggers: Deterministic risk scoring model 1.1.0, 9-stage AST triage pipeline, OWASP SAST & secret scanners, GitHub OAuth & webhooks, and Nitro server functions.",
      },
      { property: "og:title", content: "Documentation – Buggers Engineering Specifications" },
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

interface SpecSearchItem {
  id: string;
  category: string;
  title: string;
  description: string;
  targetId: string;
  keywords: string[];
}

const SPEC_SEARCH_INDEX: SpecSearchItem[] = [
  {
    id: "diff-triage",
    category: "Spec 01",
    title: "Build, review, and ship · Diff Triage",
    description: "AST coordinate verification, confidence thresholds, and line-by-line diff remediation.",
    targetId: "build-review-ship",
    keywords: ["diff", "review", "ast", "timing", "cwe-208", "cwe-89", "sql", "bot", "triage", "pr", "patch", "typewriter"],
  },
  {
    id: "ai-automations",
    category: "Spec 02",
    title: "AI & Automations · Multi-Provider Orchestration",
    description: "Multi-provider fallback chains across Claude 3.5 Sonnet, GPT-4o, and Gemini 2.0 Flash.",
    targetId: "ai-automations",
    keywords: ["ai", "automations", "claude", "gpt4o", "gemini", "orchestration", "fallback", "tokens", "cost"],
  },
  {
    id: "risk-engine",
    category: "Spec 03",
    title: "Mathematical Risk Engine 1.1.0",
    description: "Deterministic risk calibration: entropy, commit volatility, defect ratio, and change spread.",
    targetId: "risk-engine",
    keywords: ["risk", "engine", "weights", "entropy", "churn", "volatility", "scoring", "defects", "thresholds"],
  },
  {
    id: "quality-gates",
    category: "Spec 04",
    title: "Quality Gate Simulator & Policy Enforcement",
    description: "Threshold enforcement, hard blocks on secrets, and branch protection checks.",
    targetId: "quality-gates",
    keywords: ["quality", "gates", "block", "secrets", "threshold", "policy", "branch", "checks"],
  },
  {
    id: "security-scanners",
    category: "Spec 05",
    title: "Pre-Execution Security & OWASP SAST",
    description: "In-process regex scanner and concrete syntax tree verification catching leaks in 140ms.",
    targetId: "security-scanners",
    keywords: ["security", "sast", "owasp", "scanner", "secrets", "aws", "pat", "injection", "testbed", "regex"],
  },
  {
    id: "worker-pipeline",
    category: "Spec 06",
    title: "Worker Runtime & 9-Stage Pipeline",
    description: "5-minute heartbeat leases, exponential backoff reapers, and webhook ingestion.",
    targetId: "pipeline",
    keywords: ["worker", "runtime", "pipeline", "stages", "heartbeat", "lease", "reaper", "webhook", "redis"],
  },
  {
    id: "architecture",
    category: "Spec 07",
    title: "Architecture & Dual-Auth Isolation",
    description: "Supabase JWT authentication, Row-Level Security (RLS), and AES-256-GCM token encryption.",
    targetId: "architecture",
    keywords: ["architecture", "dual-auth", "supabase", "rls", "aes-256", "jwt", "encryption", "nitro", "routes"],
  },
  {
    id: "api-reference",
    category: "Spec 08",
    title: "API Reference & Nitro RPC Endpoints",
    description: "RPC endpoints for analysis jobs, findings queries, and webhook signature verification.",
    targetId: "api",
    keywords: ["api", "reference", "rpc", "endpoints", "nitro", "curl", "post", "get", "findings", "jobs"],
  },
  {
    id: "deployment-ops",
    category: "Spec 09",
    title: "Deployment & Production Runbooks",
    description: "Vercel Nitro preset, Docker Compose deployment, and environment configurations.",
    targetId: "deployment",
    keywords: ["deployment", "production", "runbook", "vercel", "docker", "compose", "env", "nitro"],
  },
];

export function DocsPage() {
  const [activeTab, setActiveTab] = useState<SectionId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  // Instant reactive search filter calculation
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SPEC_SEARCH_INDEX.filter((spec) => {
      return (
        spec.title.toLowerCase().includes(q) ||
        spec.description.toLowerCase().includes(q) ||
        spec.category.toLowerCase().includes(q) ||
        spec.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  // Press ESC to close search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

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
        <header id="hero" className="space-y-4">
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

          {/* Sticky, Frosted Category Filter Bar & Live Search (Zero Horizontal Overflow) */}
          <div className="pt-6 pb-4 border-b border-white/[0.08] sticky top-16 bg-[#08090a]/90 backdrop-blur-md z-30 space-y-3.5">
            {/* Top row: Section status indicator & Live Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Mobile compact dropdown selector (< lg screens) */}
              <div className="block lg:hidden w-full sm:w-auto">
                <div className="relative">
                  <select
                    value={activeTab}
                    aria-label="Select Specification Section"
                    onChange={(e) => {
                      const target = NAV_TABS.find((t) => t.id === e.target.value);
                      if (target) scrollToSection(target);
                    }}
                    className="w-full sm:w-80 appearance-none bg-[#121316] border border-white/[0.12] rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/40 cursor-pointer pr-8"
                  >
                    {NAV_TABS.map((tab) => (
                      <option key={tab.id} value={tab.id} className="bg-[#121316] text-neutral-200">
                        {tab.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Desktop Section Count Indicator */}
              <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                <span>10 SPECIFICATION MODULES</span>
              </div>

              {/* Clean Integrated Search Bar with Live Results Drawer */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults.length > 0) {
                      const first = searchResults[0];
                      if (first) {
                        const elem = document.getElementById(first.targetId);
                        if (elem) elem.scrollIntoView({ behavior: "smooth", block: "start" });
                        setSearchQuery("");
                      }
                    }
                  }}
                  placeholder="Filter specifications (e.g. AST, Timing, RLS)..."
                  className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                {/* Instant Floating Search Results Drawer */}
                {searchQuery.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-white/[0.12] bg-[#0c0d11]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-b border-white/[0.06]">
                      <span>{searchResults.length} {searchResults.length === 1 ? "SPECIFICATION MATCH" : "SPECIFICATIONS MATCHED"}</span>
                      <span>ESC to close</span>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            type="button"
                            onClick={() => {
                              const elem = document.getElementById(result.targetId);
                              if (elem) {
                                elem.scrollIntoView({ behavior: "smooth", block: "start" });
                                elem.classList.add("ring-1", "ring-emerald-400/60");
                                setTimeout(() => elem.classList.remove("ring-1", "ring-emerald-400/60"), 2500);
                              }
                              const tab = NAV_TABS.find((t) => t.targetId === result.targetId);
                              if (tab) setActiveTab(tab.id);
                              setSearchQuery("");
                            }}
                            className="w-full text-left p-2.5 rounded-lg hover:bg-white/[0.06] transition-colors group flex items-start justify-between gap-3 cursor-pointer"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-emerald-400 uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-semibold">
                                  {result.category}
                                </span>
                                <span className="text-xs font-medium text-white group-hover:text-emerald-300 transition-colors">
                                  {result.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 font-sans line-clamp-2">
                                {result.description}
                              </p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-neutral-400 font-sans">
                          No specifications match <span className="text-white font-mono">"{searchQuery}"</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="text-[11px] font-mono text-neutral-300 hover:text-white underline cursor-pointer"
                        >
                          Clear search filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Category Filter Pills (flex-wrap: zero horizontal scrolling, all pills visible) */}
            <nav className="hidden lg:flex flex-wrap items-center gap-1.5 text-xs font-medium">
              {NAV_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const matchesSearch = searchQuery.trim().length > 0 && searchResults.some((r) => r.targetId === tab.targetId);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => scrollToSection(tab)}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-black font-semibold shadow-sm"
                        : matchesSearch
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "text-[#8a8f98] hover:text-white hover:bg-white/[0.05] border border-white/[0.04]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 1. Linear 3-Column Isometric Wireframe Grid */}
        {/* ============================================================== */}
        <LinearWireframeGrid />

        {/* ============================================================== */}
        {/* 2. Flagship Linear Product Chapters (Chapters 1 - 4) */}
        {/* ============================================================== */}
        <div className="my-8 sm:my-12">
          <LinearProductSections />
        </div>

        {/* ============================================================== */}
        {/* 3. CHAPTER 5: Pre-Execution Security & SAST Scanners */}
        {/* ============================================================== */}
        <section id="security-scanners" className="w-full space-y-8 scroll-mt-28 border-t border-white/[0.08] pt-14 sm:pt-16">
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

          {/* Interactive In-Process Scanner Testbed (Linear Open Hairline with Seamless Dissolve) */}
          <div className="w-full border-y border-white/[0.08] bg-[#090a0d] p-6 sm:p-10 relative overflow-hidden linear-preview-fade-bottom">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#08090a_100%)] pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-20" />
            <div className="relative z-0">
              <LiveScannerPlayground />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. CHAPTER 6: Worker Runtime & 9-Stage Pipeline */}
        {/* ============================================================== */}
        <section id="pipeline" className="w-full space-y-8 scroll-mt-28 border-t border-white/[0.08] pt-14 sm:pt-16">
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

          {/* Interactive 9-Stage Pipeline Visualizer (Linear Open Hairline with Seamless Dissolve) */}
          <div className="w-full border-y border-white/[0.08] bg-[#090a0d] p-6 sm:p-10 relative overflow-hidden linear-preview-fade-bottom">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#08090a_100%)] pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-20" />
            <div className="relative z-0">
              <PipelineStageVisualizer />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. CHAPTER 7: Architecture & API Reference */}
        {/* ============================================================== */}
        <section id="architecture" className="w-full space-y-8 scroll-mt-28 border-t border-white/[0.08] pt-14 sm:pt-16">
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

          {/* Dual-Auth Architecture Blueprint: Pure Linear Open Hairline Architecture */}
          <div className="w-full border-y border-white/[0.08] py-8 space-y-10">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono">
              <span className="text-white font-semibold uppercase tracking-wider">Dual-Auth Boundary Isolation</span>
              <span className="text-neutral-400">Zero Secret Leakage</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] py-2 text-xs font-mono">
              <div className="py-4 md:px-6 first:md:pl-0 space-y-2.5">
                <div className="text-amber-400 font-semibold text-sm">1. Browser Client</div>
                <p className="text-neutral-400 leading-relaxed font-sans text-xs">
                  Maintains Supabase JWT session in local storage. Never touches GitHub OAuth tokens or database service role keys directly.
                </p>
                <div className="pt-2 text-[10px] text-neutral-500 font-mono">
                  Headers: Bearer &lt;SUPABASE_JWT&gt;
                </div>
              </div>

              <div className="py-4 md:px-6 space-y-2.5">
                <div className="text-emerald-400 font-semibold text-sm">2. Nitro SSR &amp; RPC</div>
                <p className="text-neutral-400 leading-relaxed font-sans text-xs">
                  Verifies caller JWT on every RPC function. Decrypts AES-256-GCM tokens on demand in memory, never logging or leaking them.
                </p>
                <div className="pt-2 text-[10px] text-neutral-500 font-mono">
                  Key: APP_USER_CONNECTION_KEY_SECRET (AES-256)
                </div>
              </div>

              <div className="py-4 md:px-6 last:md:pr-0 space-y-2.5">
                <div className="text-neutral-200 font-semibold text-sm">3. PostgreSQL &amp; RLS</div>
                <p className="text-neutral-400 leading-relaxed font-sans text-xs">
                  Strict Row-Level Security ensures users can only read their own repositories, pull requests, analyses, and findings.
                </p>
                <div className="pt-2 text-[10px] text-neutral-500 font-mono">
                  Policy: auth.uid() = user_id
                </div>
              </div>
            </div>

            {/* REST Endpoints Table: Open Linear Table */}
            <div id="api" className="space-y-4 pt-6 border-t border-white/[0.06] scroll-mt-28">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-white flex items-center gap-2">
                  <Server className="h-4 w-4 text-neutral-300" />
                  <span>Nitro REST Webhooks &amp; Internal Endpoints</span>
                </h3>
                <span className="text-[11px] font-mono text-neutral-500">HTTP / JSON</span>
              </div>

              <div className="overflow-x-auto text-xs border-y border-white/[0.08]">
                <table className="w-full text-left">
                  <thead className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 text-[11px] font-mono">
                    <tr>
                      <th className="py-3 px-4 font-medium">Endpoint</th>
                      <th className="py-3 px-4 font-medium">Method</th>
                      <th className="py-3 px-4 font-medium">Authentication</th>
                      <th className="py-3 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-neutral-300 font-mono text-[11px]">
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white">/api/webhooks/github</td>
                      <td className="py-3 px-4 text-amber-400 font-semibold">POST</td>
                      <td className="py-3 px-4 text-neutral-400">HMAC SHA-256 (X-Hub-Signature-256)</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopyCurl('curl -X POST https://buggers.vercel.app/api/webhooks/github -H "X-Hub-Signature-256: sha256=..." -d \'{"action":"opened"}\'', "webhook")}
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white font-sans cursor-pointer transition-colors"
                        >
                          {copiedCurl === "webhook" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>Copy cURL</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white">/api/cron/worker</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">GET</td>
                      <td className="py-3 px-4 text-neutral-400">Bearer Token (CRON_SECRET)</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopyCurl('curl -X GET https://buggers.vercel.app/api/cron/worker -H "Authorization: Bearer YOUR_CRON_SECRET"', "cron")}
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white font-sans cursor-pointer transition-colors"
                        >
                          {copiedCurl === "cron" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>Copy cURL</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white">/api/health</td>
                      <td className="py-3 px-4 text-neutral-300 font-semibold">GET</td>
                      <td className="py-3 px-4 text-neutral-400">Public</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopyCurl("curl -X GET https://buggers.vercel.app/api/health", "health")}
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white font-sans cursor-pointer transition-colors"
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
        </section>

        {/* ============================================================== */}
        {/* 6. CHAPTER 8: Production Deployment & Runbook */}
        {/* ============================================================== */}
        <section id="deployment" className="w-full space-y-8 scroll-mt-28 border-t border-white/[0.08] pt-14 sm:pt-16">
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
                <div className="flex flex-wrap gap-2 font-mono text-[11px] pt-1.5">
                  {[
                    "profiles",
                    "user_connections",
                    "repositories",
                    "pull_requests",
                    "pr_analyses",
                    "findings",
                    "finding_comments",
                    "diff_caches",
                  ].map((tbl) => (
                    <span
                      key={tbl}
                      className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-neutral-300 hover:text-white hover:border-white/20 transition-colors"
                    >
                      {tbl}
                    </span>
                  ))}
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="2. GitHub OAuth App Configuration">
              <div className="space-y-3 text-xs text-neutral-300 font-sans leading-relaxed">
                <p>
                  Register a new GitHub OAuth App under your organization settings:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-400 font-mono text-[11px]">
                  <li>Homepage URL: <code className="text-white bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10">https://&lt;your-domain&gt;</code></li>
                  <li>Authorization callback URL: <code className="text-white bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10">https://&lt;your-domain&gt;/dashboard</code></li>
                  <li>Required Scopes: <code className="text-white bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10">read:user repo</code></li>
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
                <div className="border-t border-b border-white/[0.08] divide-y divide-white/[0.04] font-mono text-[11px] mt-2">
                  {[
                    "SUPABASE_URL",
                    "SUPABASE_SERVICE_ROLE_KEY",
                    "GITHUB_CLIENT_ID",
                    "GITHUB_CLIENT_SECRET",
                    "APP_USER_CONNECTION_KEY_SECRET",
                    "GITHUB_WEBHOOK_SECRET",
                    "CRON_SECRET",
                    "AI_PROVIDER (claude | openai | gemini)",
                  ].map((env) => (
                    <div
                      key={env}
                      className="py-2.5 px-2 text-neutral-300 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-white">{env}</span>
                      <span className="text-[10px] text-neutral-500 font-sans">Required</span>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionItem>
          </div>
        </section>

      </main>
    </div>
  );
}
