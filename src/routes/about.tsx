import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  GitPullRequest,
  CheckCircle2,
  FileCode,
  Sparkles,
  GitCommit,
  Terminal,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Check,
  Zap,
  GitMerge,
  Eye,
  Code2,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About – Buggers" },
      {
        name: "description",
        content:
          "About Buggers: Precision AI pull request triage and automated code review that eliminates developer fatigue.",
      },
      { property: "og:title", content: "About – Buggers" },
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

type FeatureTab = "diffs" | "guided" | "churn" | "ast" | "automations";

interface ShowcaseTabConfig {
  id: FeatureTab;
  label: string;
  file: string;
  prTitle: string;
  prMeta: string;
  riskScore: number;
  remediatedRiskScore: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "VERIFIED";
  diffLines: Array<{
    numOld?: string;
    numNew?: string;
    type: "context" | "delete" | "add";
    text: string;
  }>;
  findingTitle: string;
  findingRule: string;
  findingDescription: string;
}

const SHOWCASE_TABS: ShowcaseTabConfig[] = [
  {
    id: "diffs",
    label: "Diffs +",
    file: "services/billing/webhook-dispatcher.ts",
    prTitle: "PR #184: Fix race condition in stripe webhook idempotency",
    prMeta: "mira-k · 3 files · +42 −18 · target: main",
    riskScore: 84,
    remediatedRiskScore: 12,
    riskLevel: "HIGH",
    diffLines: [
      { numOld: "01", numNew: "01", type: "context", text: 'import { createHmac, timingSafeEqual } from "node:crypto";' },
      { numOld: "02", numNew: "02", type: "context", text: 'import { db } from "@/db";' },
      { numOld: "03", numNew: "", type: "delete", text: '- export async function verifyAndDispatch(req: Request) {' },
      { numOld: "04", numNew: "", type: "delete", text: '-   const sig = req.headers.get("x-signature") || "";' },
      { numOld: "05", numNew: "", type: "delete", text: '-   if (sig !== process.env.WEBHOOK_SECRET) return false;' },
      { numOld: "", numNew: "03", type: "add", text: '+ export async function verifyAndDispatch(req: Request) {' },
      { numOld: "", numNew: "04", type: "add", text: '+   const sig = req.headers.get("x-signature") ?? "";' },
      { numOld: "", numNew: "05", type: "add", text: '+   const body = await req.clone().arrayBuffer();' },
      { numOld: "", numNew: "06", type: "add", text: '+   const expected = computeHmac(body, process.env.WEBHOOK_SECRET!);' },
      { numOld: "", numNew: "07", type: "add", text: '+   if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {' },
      { numOld: "", numNew: "08", type: "add", text: '+     throw new UnauthorizedError("Constant-time HMAC check failed");' },
      { numOld: "", numNew: "09", type: "add", text: '+   }' },
    ],
    findingTitle: "CWE-208 Timing Attack Remediated",
    findingRule: "AST-SAST-004 · Constant-Time Byte Verification",
    findingDescription: "Replaced non-constant string equality with timingSafeEqual. Eliminates side-channel timing leaks on signature validation.",
  },
  {
    id: "guided",
    label: "Guided reviews +",
    file: "packages/core/src/auth/session-token.ts",
    prTitle: "PR #182: Migrate session rotation to atomic PostgreSQL transaction",
    prMeta: "dev-lead · 2 files · +67 −14 · target: staging",
    riskScore: 68,
    remediatedRiskScore: 8,
    riskLevel: "MEDIUM",
    diffLines: [
      { numOld: "14", numNew: "14", type: "context", text: 'export async function rotateSession(userId: string) {' },
      { numOld: "15", numNew: "", type: "delete", text: '-   await db.sessions.delete({ where: { userId } });' },
      { numOld: "16", numNew: "", type: "delete", text: '-   return await db.sessions.create({ data: { userId, token } });' },
      { numOld: "", numNew: "15", type: "add", text: '+   return await db.$transaction(async (tx) => {' },
      { numOld: "", numNew: "16", type: "add", text: '+     await tx.sessions.updateMany({ where: { userId }, data: { revoked: true } });' },
      { numOld: "", numNew: "17", type: "add", text: '+     return await tx.sessions.create({ data: { userId, token, expiresAt } });' },
      { numOld: "", numNew: "18", type: "add", text: '+   });' },
    ],
    findingTitle: "Session Invalidation Atomicity Guaranteed",
    findingRule: "AST-CONC-002 · Transaction Isolation Check",
    findingDescription: "Prevents token reuse window between delete and create. Verified against PostgreSQL RLS policies.",
  },
  {
    id: "churn",
    label: "Repository Churn +",
    file: "src/engine/risk-calculator.ts",
    prTitle: "PR #179: Volatility scoring for historical hotspot modules",
    prMeta: "alex · 5 files · +112 −45 · target: main",
    riskScore: 92,
    remediatedRiskScore: 16,
    riskLevel: "CRITICAL",
    diffLines: [
      { numOld: "40", numNew: "40", type: "context", text: 'export function computeModuleVolatility(file: RepoFile): number {' },
      { numOld: "41", numNew: "", type: "delete", text: '-   return file.revisionsCount * 0.2;' },
      { numOld: "", numNew: "41", type: "add", text: '+   const defectRatio = file.pastDefectCommits / Math.max(1, file.totalCommits);' },
      { numOld: "", numNew: "42", type: "add", text: '+   const entropy = computeShannonEntropy(file.authorDistribution);' },
      { numOld: "", numNew: "43", type: "add", text: '+   return (defectRatio * 0.6 + entropy * 0.4) * 100;' },
    ],
    findingTitle: "High-Churn Hotspot Volatility Detected",
    findingRule: "CHURN-HOTSPOT-001 · 14 Past Regressions in 90 Days",
    findingDescription: "This module has been edited 38 times with 14 defect reverts. Mandatory 2-reviewer signoff enforced.",
  },
  {
    id: "ast",
    label: "AST Rules +",
    file: "src/server/routes/api/export.ts",
    prTitle: "PR #175: Strict sanitization on dynamic SQL query builders",
    prMeta: "security-bot · 1 file · +28 −6 · target: main",
    riskScore: 78,
    remediatedRiskScore: 6,
    riskLevel: "VERIFIED",
    diffLines: [
      { numOld: "22", numNew: "22", type: "context", text: 'export async function exportUserData(req: Request) {' },
      { numOld: "23", numNew: "", type: "delete", text: '-   const query = `SELECT * FROM users WHERE org_id = "${req.query.id}"`;' },
      { numOld: "", numNew: "23", type: "add", text: '+   const id = sanitizeUuid(req.query.id);' },
      { numOld: "", numNew: "24", type: "add", text: '+   const query = sql`SELECT * FROM users WHERE org_id = ${id}`;' },
    ],
    findingTitle: "SQL Injection Vector Mitigated",
    findingRule: "AST-SAST-001 · Parameterized SQL Enforcement",
    findingDescription: "Zero raw template string interpolation. AST walker verified parameterized identifier binding.",
  },
  {
    id: "automations",
    label: "Git automations +",
    file: "github/workflows/quality-gates.yml",
    prTitle: "PR #171: Automated Check Run status and inline diff suggestions",
    prMeta: "automation · 1 file · +19 −2 · target: main",
    riskScore: 62,
    remediatedRiskScore: 4,
    riskLevel: "VERIFIED",
    diffLines: [
      { numOld: "08", numNew: "08", type: "context", text: 'name: Buggers Quality Gate' },
      { numOld: "09", numNew: "09", type: "context", text: 'on: [pull_request_target]' },
      { numOld: "", numNew: "10", type: "add", text: '+ - name: Run Buggers Deterministic Triage' },
      { numOld: "", numNew: "11", type: "add", text: '+   uses: buggers-ai/action@v1.1' },
      { numOld: "", numNew: "12", type: "add", text: '+   with: { fail_on_critical: true, post_review_comments: true }' },
    ],
    findingTitle: "Automated PR Check Suite Attached",
    findingRule: "GIT-AUTOMATION-001 · GitHub Status Checks",
    findingDescription: "Posts non-blocking advisory suggestions inline with exact git patch hunks for 1-click apply.",
  },
];

type SimStage = "SCANNING" | "EVALUATING" | "REMEDIATING" | "VERIFIED";

export function AboutPage() {
  const [activeTab, setActiveTab] = useState<FeatureTab>("diffs");
  const [isSimulating, setIsSimulating] = useState(true);
  const [simStage, setSimStage] = useState<SimStage>("SCANNING");
  const [progress, setProgress] = useState(0);
  const [patchApplied, setPatchApplied] = useState(false);
  const [displayRisk, setDisplayRisk] = useState(84);
  const [activeFig, setActiveFig] = useState<number | null>(null);

  const current = SHOWCASE_TABS.find((t) => t.id === activeTab) ?? SHOWCASE_TABS[0]!;

  // Reset simulation whenever tab changes
  useEffect(() => {
    setProgress(0);
    setPatchApplied(false);
    setDisplayRisk(current.riskScore);
    setSimStage("SCANNING");
  }, [activeTab, current.riskScore]);

  // High-precision simulation loop with stage-based motion transitions (settles at 100% without jarring loops)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsSimulating(false);
          return 100;
        }
        const next = prev + 1.25;
        if (next >= 100) {
          setIsSimulating(false);
          return 100;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Map progress percentage to pipeline stages
  useEffect(() => {
    if (progress < 28) {
      setSimStage("SCANNING");
      setPatchApplied(false);
      setDisplayRisk(current.riskScore);
    } else if (progress < 55) {
      setSimStage("EVALUATING");
      setPatchApplied(false);
      setDisplayRisk(current.riskScore);
    } else if (progress < 85) {
      setSimStage("REMEDIATING");
      setPatchApplied(true);
      // Smoothly interpolate risk reduction
      const ratio = (progress - 55) / 30;
      const target = Math.round(
        current.riskScore - (current.riskScore - current.remediatedRiskScore) * ratio
      );
      setDisplayRisk(target);
    } else {
      setSimStage("VERIFIED");
      setPatchApplied(true);
      setDisplayRisk(current.remediatedRiskScore);
    }
  }, [progress, current.riskScore, current.remediatedRiskScore]);

  return (
    <div className="min-h-screen w-full bg-[#08090a] text-neutral-200 antialiased overflow-x-hidden selection:bg-white/20 flex flex-col justify-between">
      {/* Expansive Main Editorial Content with generous top padding to clear floating island */}
      <main className="pt-40 sm:pt-48 pb-24 px-4 sm:px-6 lg:px-12 max-w-[1240px] mx-auto flex-1 w-full space-y-24">
        
        {/* ============================================================== */}
        {/* Masthead: Linear Typography & Restrained Hierarchy */}
        {/* ============================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/[0.08] px-3.5 py-1 text-xs font-mono text-[#8a8f98]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            <span className="uppercase text-[10px] tracking-widest text-neutral-300">Built For Engineering Teams</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[1.08]">
            Code Review Grounded in Reality
          </h1>

          <p className="text-base sm:text-lg text-[#8a8f98] leading-relaxed max-w-2xl mx-auto font-normal">
            Buggers was created to solve the fundamental problem of modern code review: generic LLMs leave noisy, useless comments, while human engineers burn out reviewing massive pull requests.
          </p>
        </div>

        {/* ============================================================== */}
        {/* Linear Layered Interactive PR Triage & Simulation Showcase */}
        {/* Motion Design · Scanning Laser · Live AST & Churn Simulations */}
        {/* ============================================================== */}
        <section className="relative w-full rounded-2xl border border-white/[0.08] bg-[#090a0d] overflow-hidden">
          {/* Subtle Linear top lighting flare */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20" />

          {/* Black fade gradient from below to seamlessly dissolve into the canvas */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#090a0d] to-transparent z-20" />

          {/* Authentic macOS Window Header Bar */}
          <div className="px-4 sm:px-6 py-2.5 bg-[#0b0c10] border-b border-white/[0.06] flex items-center justify-between select-none relative z-10">
            {/* macOS 3 Traffic Light Window Dots */}
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/80 inline-block shadow-sm transition-transform hover:scale-110 cursor-pointer" title="Close" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/80 inline-block shadow-sm transition-transform hover:scale-110 cursor-pointer" title="Minimize" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]/80 inline-block shadow-sm transition-transform hover:scale-110 cursor-pointer" title="Expand" />
            </div>

            {/* Centered Window Title & Breadcrumb */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
              <Terminal className="h-3.5 w-3.5 text-neutral-500" />
              <span className="text-neutral-300 font-medium">buggers-studio</span>
              <span className="text-neutral-600">—</span>
              <span className="text-neutral-500">triage-workspace.zsh</span>
              <span className="text-neutral-600">—</span>
              <span className="text-emerald-400/90 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-semibold">
                git:(main)
              </span>
            </div>

            {/* Right macOS Window Status Pill */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 hidden sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Node v22 · Deterministic AST</span>
            </div>
          </div>

          {/* Interactive Top Tab Navigation & Simulation Controls */}
          <div className="border-b border-white/[0.08] px-4 sm:px-8 py-3 bg-[#0c0d10] flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mr-2 hidden sm:inline-block">
                Triage Views
              </span>
              {SHOWCASE_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSimulating(true);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-white/[0.08] text-white font-medium border border-white/15 shadow-sm"
                        : "text-[#8a8f98] hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Live Simulation Controls Bar */}
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/[0.08] rounded-full px-2.5 py-1">
                <button
                  type="button"
                  onClick={() => setIsSimulating(!isSimulating)}
                  className="p-1 hover:text-white text-neutral-400 transition-colors cursor-pointer"
                  title={isSimulating ? "Pause Simulation" : "Play Simulation"}
                >
                  {isSimulating ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProgress(0);
                    setPatchApplied(false);
                    setDisplayRisk(current.riskScore);
                    setSimStage("SCANNING");
                    setIsSimulating(true);
                  }}
                  className="p-1 hover:text-white text-neutral-400 transition-colors cursor-pointer"
                  title="Replay Current Simulation"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>

              {/* Status pill with animated pulse */}
              <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    simStage === "VERIFIED"
                      ? "bg-emerald-400"
                      : simStage === "REMEDIATING"
                      ? "bg-emerald-500 animate-pulse"
                      : simStage === "EVALUATING"
                      ? "bg-amber-400 animate-ping"
                      : "bg-blue-400 animate-pulse"
                  }`}
                />
                <span className="hidden sm:inline-block">
                  {simStage === "SCANNING" && "Diff AST Scan"}
                  {simStage === "EVALUATING" && "Risk Calibration"}
                  {simStage === "REMEDIATING" && "AST Patch Applied"}
                  {simStage === "VERIFIED" && "Quality Gate Passed"}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Timeline Tracker */}
          <div className="h-0.5 w-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-white transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Layered Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left Layer: Triage Queue & Hotspot Activity */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] p-5 sm:p-6 space-y-6 bg-[#0a0b0e]">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/[0.06] pb-3">
                <span className="uppercase text-[10px] tracking-wider font-semibold text-neutral-300">
                  Triage Queue (4 Active)
                </span>
                <span className="text-neutral-500">Auto-prioritized</span>
              </div>

              {/* Status Groups */}
              <div className="space-y-4 font-mono text-xs">
                {/* Group 1: High Volatility */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-rose-400 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span>High Volatility (1)</span>
                  </div>
                  <div
                    onClick={() => setActiveTab("churn")}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      activeTab === "churn"
                        ? "border-rose-500/30 bg-rose-500/[0.04]"
                        : "border-white/[0.06] bg-[#0c0d10] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-200 font-medium">PR #179</span>
                      <span className="text-rose-400 font-semibold">92 Risk</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1 line-clamp-1">
                      Volatility scoring for historical hotspots
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500 font-sans">
                      <span>alex</span>
                      <span>&bull;</span>
                      <span>14 past reverts</span>
                    </div>
                  </div>
                </div>

                {/* Group 2: In Review */}
                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>In Review (2)</span>
                  </div>
                  <div
                    onClick={() => setActiveTab("diffs")}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      activeTab === "diffs"
                        ? "border-amber-400/30 bg-amber-400/[0.04]"
                        : "border-white/[0.06] bg-[#0c0d10] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-200 font-medium">PR #184</span>
                      <span className="text-amber-300 font-semibold">84 Risk</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1 line-clamp-1">
                      Fix race condition in stripe webhook idempotency
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500 font-sans">
                      <span>mira-k</span>
                      <span>&bull;</span>
                      <span>3 files · +42 −18</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab("guided")}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      activeTab === "guided"
                        ? "border-neutral-400/30 bg-white/[0.04]"
                        : "border-white/[0.06] bg-[#0c0d10] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-200 font-medium">PR #182</span>
                      <span className="text-neutral-300">68 Risk</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1 line-clamp-1">
                      Migrate session rotation to atomic transaction
                    </p>
                  </div>
                </div>

                {/* Group 3: Verified */}
                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Verified &amp; Clean (2)</span>
                  </div>
                  <div
                    onClick={() => setActiveTab("ast")}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      activeTab === "ast"
                        ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                        : "border-white/[0.06] bg-[#0c0d10] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-200 font-medium">PR #175</span>
                      <span className="text-emerald-400 font-semibold">PASS (18)</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1 line-clamp-1">
                      Strict sanitization on dynamic SQL builders
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Layer: Interactive Code Diff, AST Simulation & Live Churn Engine */}
            <div className="lg:col-span-8 p-5 sm:p-8 flex flex-col justify-between bg-[#08090a] relative overflow-hidden">
              {/* Dynamic Scanning Laser Beam */}
              {simStage === "SCANNING" && (
                <div
                  className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-emerald-400/15 to-transparent pointer-events-none transition-all duration-75 ease-linear z-20"
                  style={{ top: `${(progress / 28) * 85}%` }}
                >
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                </div>
              )}

              {/* Black fade gradient from below only (no side cutoff) */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08090a] to-transparent z-20" />

              <div className="space-y-5 relative z-10">
                {/* PR Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-white font-mono">{current.prTitle}</span>
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-bold uppercase transition-all duration-300 ${
                          displayRisk <= 20
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : displayRisk <= 50
                            ? "bg-neutral-800 text-neutral-300 border border-white/15"
                            : displayRisk <= 80
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        Risk {displayRisk}/100 {displayRisk <= 20 ? "· PASSED" : "· ACTION NEEDED"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono">{current.prMeta}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                    <FileCode className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-white">{current.file}</span>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* Special View: TAB 3 "Repository Churn +" (Animated Heatmap & Volatility Curve) */}
                {/* ============================================================== */}
                {activeTab === "churn" ? (
                  <div className="rounded-lg border border-white/[0.08] bg-[#0a0b0e] p-5 space-y-4 font-mono text-xs relative overflow-hidden">
                    {/* Bottom fade gradient only (no side cutoff) */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0a0b0e] to-transparent z-10" />

                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-[11px] text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-rose-400" />
                        <span className="text-white font-semibold">90-Day Commit Volatility &amp; Hotspot Frequency</span>
                      </div>
                      <span className="text-rose-400">14 Revert Spikes Detected</span>
                    </div>

                    {/* Animated SVG Hotspot Timeline Curve */}
                    <div className="h-44 w-full relative flex items-center justify-center">
                      <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="churnAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(244,63,94,0.3)" />
                            <stop offset="100%" stopColor="rgba(244,63,94,0.01)" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="20" y1="30" x2="480" y2="30" stroke="white" strokeOpacity="0.05" />
                        <line x1="20" y1="75" x2="480" y2="75" stroke="white" strokeOpacity="0.05" />
                        <line x1="20" y1="120" x2="480" y2="120" stroke="white" strokeOpacity="0.08" />

                        {/* Shaded Area */}
                        <path
                          d="M20 120 Q 80 115, 120 70 T 200 85 T 280 25 T 360 65 T 440 30 L 480 90 L 480 120 Z"
                          fill="url(#churnAreaGrad)"
                        />

                        {/* Animated Spline Line */}
                        <path
                          d="M20 120 Q 80 115, 120 70 T 200 85 T 280 25 T 360 65 T 440 30 L 480 90"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="600"
                          strokeDashoffset={progress < 25 ? 600 - (progress / 25) * 600 : 0}
                          style={{ transition: "stroke-dashoffset 200ms ease-out" }}
                        />

                        {/* Historical Rollback Hotspot Nodes */}
                        <circle cx="120" cy="70" r="4" fill="#f43f5e" className="animate-ping opacity-60" />
                        <circle cx="120" cy="70" r="3" fill="#ffffff" />
                        <text x="110" y="55" fill="#f43f5e" fontSize="9" fontFamily="monospace">REV-04</text>

                        <circle cx="280" cy="25" r="5" fill="#f43f5e" className="animate-ping opacity-75" />
                        <circle cx="280" cy="25" r="3.5" fill="#ffffff" />
                        <text x="260" y="15" fill="#f43f5e" fontSize="9" fontFamily="monospace" fontWeight="bold">HOTSPOT PEAK (92 RISK)</text>

                        <circle cx="440" cy="30" r="4" fill="#f43f5e" />
                        <text x="430" y="20" fill="#f43f5e" fontSize="9" fontFamily="monospace">REV-14</text>
                      </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.06] text-[11px]">
                      <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-neutral-500 block">Shannon Entropy</span>
                        <span className="text-white font-semibold">3.42 bits (4 authors)</span>
                      </div>
                      <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-neutral-500 block">Historical Reverts</span>
                        <span className="text-rose-400 font-semibold">14 in last 90 days</span>
                      </div>
                      <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-neutral-500 block">Hotspot Ranking</span>
                        <span className="text-amber-400 font-semibold">Top 2% Volatile</span>
                      </div>
                    </div>
                  </div>
                ) : activeTab === "ast" ? (
                  /* ============================================================== */
                  /* Special View: TAB 4 "AST Rules +" (Interactive AST Node Inspector) */
                  /* ============================================================== */
                  <div className="rounded-lg border border-white/[0.08] bg-[#0a0b0e] p-5 space-y-4 font-mono text-xs relative overflow-hidden">
                    {/* Bottom fade gradient only (no side cutoff) */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0a0b0e] to-transparent z-10" />

                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-[11px] text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-white font-semibold">AST Walker · Concrete Syntax Tree Verification</span>
                      </div>
                      <span className="text-emerald-400">Rule AST-SAST-001 Passed</span>
                    </div>

                    {/* Interactive AST Node Hierarchy Diagram */}
                    <div className="p-4 rounded border border-white/[0.06] bg-black/40 space-y-3">
                      <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white">Program</span>
                        <span>&rarr;</span>
                        <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white">ExportNamedDeclaration</span>
                        <span>&rarr;</span>
                        <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white">FunctionDeclaration (exportUserData)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {/* Vulnerable Node */}
                        <div className={`p-3 rounded border transition-all duration-300 ${
                          patchApplied ? "border-white/[0.06] opacity-40 bg-transparent" : "border-rose-500/40 bg-rose-500/[0.06]"
                        }`}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-rose-300 font-semibold">BinaryExpression</span>
                            <span className="text-[10px] text-rose-400">Raw Interpolation</span>
                          </div>
                          <code className="text-[11px] text-neutral-400 block mt-1.5 whitespace-pre">
                            `SELECT * WHERE id = "${"${id}"}"`
                          </code>
                          <span className="text-[10px] text-neutral-500 mt-2 block">
                            Direct user payload interpolated into SQL string literal.
                          </span>
                        </div>

                        {/* Remediated Node */}
                        <div className={`p-3 rounded border transition-all duration-300 ${
                          patchApplied ? "border-emerald-500/50 bg-emerald-500/[0.08]" : "border-white/[0.06] bg-transparent"
                        }`}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-300 font-semibold">TaggedTemplateExpression</span>
                            <span className="text-[10px] text-emerald-400">Safe Parameterized $1</span>
                          </div>
                          <code className="text-[11px] text-neutral-200 block mt-1.5 whitespace-pre font-bold">
                            sql`SELECT * WHERE id = ${"${id}"}`
                          </code>
                          <span className="text-[10px] text-emerald-400/90 mt-2 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            AST AST-SAST-001 verified against parameter binding.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === "automations" ? (
                  /* ============================================================== */
                  /* Special View: TAB 5 "Git automations +" (GitHub Action Status & 1-Click Patch) */
                  /* ============================================================== */
                  <div className="rounded-lg border border-white/[0.08] bg-[#0a0b0e] p-5 space-y-4 font-mono text-xs relative overflow-hidden">
                    {/* Bottom fade gradient only (no side cutoff) */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0a0b0e] to-transparent z-10" />

                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-[11px] text-neutral-400">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-white font-semibold">GitHub Pull Request #171 Check Suite Simulation</span>
                      </div>
                      <span className="text-emerald-400 font-mono">100% Deterministic</span>
                    </div>

                    {/* Step-by-Step GitHub Actions Pipeline */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-neutral-200">1. GitHub Webhook Received &amp; Ingested</span>
                        </div>
                        <span className="text-neutral-500 text-[10px]">12ms</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-neutral-200">2. Deterministic AST Scanners Executed</span>
                        </div>
                        <span className="text-neutral-500 text-[10px]">34ms</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-neutral-200">3. Multi-Signal Risk Calibration (Score: 12/100)</span>
                        </div>
                        <span className="text-neutral-500 text-[10px]">78ms</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded bg-emerald-500/[0.05] border border-emerald-500/20">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">4. Inline Diff Suggestion Hunk Ready</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPatchApplied(true)}
                          className="px-2.5 py-1 rounded bg-emerald-500 text-black font-semibold text-[10px] hover:bg-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="h-3 w-3 fill-current" />
                          <span>1-Click Apply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ============================================================== */
                  /* Standard Views: TAB 1 ("Diffs +") & TAB 2 ("Guided reviews +") */
                  /* Floating Code Diff Window with Line-by-Line Transitions */
                  /* ============================================================== */
                  <div className="rounded-lg border border-white/[0.08] bg-[#0a0b0e] overflow-hidden font-mono text-xs leading-relaxed relative">
                    {/* Bottom fade gradient only (no side cutoff) */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0a0b0e] to-transparent z-20" />

                    <div className="bg-white/[0.02] border-b border-white/[0.06] px-4 py-2 flex items-center justify-between text-[11px] text-neutral-500 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${patchApplied ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                        <span className="text-neutral-300">{current.file}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400">
                          {patchApplied ? "Remediated AST Patch" : "Raw Unified Diff"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 space-y-0.5 divide-y divide-white/[0.02] overflow-x-auto relative">
                      {current.diffLines.map((line, idx) => {
                        const isDel = line.type === "delete";
                        const isAdd = line.type === "add";

                        // If user is watching before/after patch
                        return (
                          <div
                            key={current.id + idx}
                            className={`flex items-start gap-4 py-1 px-2 rounded transition-all duration-300 ${
                              isDel
                                ? patchApplied
                                  ? "bg-rose-500/[0.03] text-rose-400/40 line-through"
                                  : "bg-rose-500/[0.08] text-rose-300"
                                : isAdd
                                ? patchApplied
                                  ? "bg-emerald-500/[0.12] text-emerald-300 font-semibold border-l-2 border-emerald-400 pl-2.5"
                                  : "bg-emerald-500/[0.08] text-emerald-300"
                                : "text-neutral-400"
                            }`}
                            style={{
                              transitionDelay: `${idx * 25}ms`,
                            }}
                          >
                            <div className="w-10 shrink-0 select-none text-[10px] text-neutral-600 flex justify-between pr-2 border-r border-white/[0.06]">
                              <span>{line.numOld || " "}</span>
                              <span>{line.numNew || " "}</span>
                            </div>
                            <code className="text-xs font-mono whitespace-pre">{line.text}</code>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Inline Grounded Finding Advisory with motion transition */}
                <div className="border border-white/[0.08] rounded-lg p-4 bg-[#0c0d10] space-y-2 relative overflow-hidden">

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-white">
                      <Sparkles className="h-3.5 w-3.5 text-neutral-300" />
                      <span>{current.findingTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">
                      {current.findingRule}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    {current.findingDescription}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                    <span className="text-emerald-400/90 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Verified against modified AST coordinates</span>
                    </span>
                    <span>Confidence: 0.98</span>
                  </div>
                </div>
              </div>

              {/* Bottom Linear feathered footer */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-neutral-500">
                <span>Buggers Engine v1.1.0 · Zero-Hallucination Pipeline</span>
                <span className="text-white">Active Hunk: 1 of 1</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3 Core Architectural Pillars: Pure Linear Hairline Grid with Layer Motion */}
        {/* ============================================================== */}
        <section className="space-y-6 pt-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
              SYSTEM ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-white leading-tight">
              Designed from first principles for zero noise.
            </h2>
          </div>

          <div className="border-y border-white/[0.08] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] grid grid-cols-1 lg:grid-cols-3 py-4">
            {/* FIG 0.1 Card */}
            <div
              onMouseEnter={() => setActiveFig(1)}
              onMouseLeave={() => setActiveFig(null)}
              className="py-8 lg:px-8 first:lg:pl-0 space-y-4 group transition-colors duration-300 hover:bg-white/[0.015]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase block">
                  FIG 0.1 / CHURN GRAPH
                </span>
                <Cpu className={`h-4 w-4 text-white transition-transform duration-300 ${activeFig === 1 ? "scale-110 text-emerald-400" : ""}`} />
              </div>
              <h3 className="text-base font-medium text-white">Repository Churn Context</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[#8a8f98] font-normal">
                We don't inspect code diffs in a vacuum. Buggers correlates each change with historical commit churn, file hotspots, and previous bug fixes to calculate statistical volatility.
              </p>
              {/* Subtle animated mini-graph line */}
              <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden pt-0.5">
                <div className={`h-full bg-emerald-400/80 rounded-full transition-all duration-500 ${activeFig === 1 ? "w-full" : "w-1/3"}`} />
              </div>
            </div>

            {/* FIG 0.2 Card */}
            <div
              onMouseEnter={() => setActiveFig(2)}
              onMouseLeave={() => setActiveFig(null)}
              className="py-8 lg:px-8 space-y-4 group transition-colors duration-300 hover:bg-white/[0.015]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase block">
                  FIG 0.2 / DETERMINISTIC GATE
                </span>
                <ShieldCheck className={`h-4 w-4 text-white transition-transform duration-300 ${activeFig === 2 ? "scale-110 text-emerald-400" : ""}`} />
              </div>
              <h3 className="text-base font-medium text-white">Zero Noise Guarantee</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[#8a8f98] font-normal">
                Every candidate finding is checked through deterministic AST scanners and rule engines. Warnings with low confidence or missing diff citations are suppressed automatically.
              </p>
              <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden pt-0.5">
                <div className={`h-full bg-emerald-400/80 rounded-full transition-all duration-500 ${activeFig === 2 ? "w-full" : "w-2/3"}`} />
              </div>
            </div>

            {/* FIG 0.3 Card */}
            <div
              onMouseEnter={() => setActiveFig(3)}
              onMouseLeave={() => setActiveFig(null)}
              className="py-8 lg:px-8 last:lg:pr-0 space-y-4 group transition-colors duration-300 hover:bg-white/[0.015]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase block">
                  FIG 0.3 / NATIVE INTEGRATION
                </span>
                <GitPullRequest className={`h-4 w-4 text-white transition-transform duration-300 ${activeFig === 3 ? "scale-110 text-emerald-400" : ""}`} />
              </div>
              <h3 className="text-base font-medium text-white">Instant GitHub Integration</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[#8a8f98] font-normal">
                Installs natively via GitHub Apps. Real-time webhooks, inline commit review comments, and GitHub check suites execute in parallel with sub-second feedback.
              </p>
              <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden pt-0.5">
                <div className={`h-full bg-emerald-400/80 rounded-full transition-all duration-500 ${activeFig === 3 ? "w-full" : "w-1/2"}`} />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* Call to Action: Non-Boxy Linear Editorial Banner */}
        {/* ============================================================== */}
        <section className="border-t border-white/[0.08] pt-16 pb-8 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-white leading-tight">
              Ready to ship safer pull requests?
            </h2>
            <p className="text-xs sm:text-sm text-[#8a8f98] leading-relaxed font-normal">
              Connect your repositories and let Buggers handle the heavy lifting of pull request triage and regression detection.
            </p>
          </div>

          <div className="flex justify-center items-center gap-4">
            <Link
              to="/auth"
              preload="intent"
              className="rounded-full bg-white text-black px-7 py-2.5 text-xs sm:text-sm font-semibold hover:bg-neutral-200 transition-all duration-150 active:scale-[0.985] flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/docs"
              className="rounded-full border border-white/[0.12] bg-white/[0.02] text-neutral-300 hover:text-white hover:border-white/25 px-6 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer"
            >
              Read Documentation
            </Link>
          </div>
        </section>
      </main>

      {/* Consistent Matte-Black Linear Footer */}
      <footer className="w-full border-t border-white/[0.08] py-8 text-center text-xs text-[#8a8f98] bg-[#08090a]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-neutral-300 font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-neutral-600">&bull;</span>
            <span className="text-neutral-500">AI Code Review &amp; Triage</span>
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
