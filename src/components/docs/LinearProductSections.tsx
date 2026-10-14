import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  GitPullRequest,
  Lock,
  Play,
  Shield,
  ShieldAlert,
  Sparkles,
  Sliders,
  Terminal,
  Paperclip,
  ArrowUp,
  Cpu,
  ChevronDown,
  ArrowRight,
  Send,
  GitBranch,
  Copy,
  RefreshCw,
  Activity,
  FileCode,
  Layers,
} from "lucide-react";
import { CodeBlock } from "./DocsComponents";
import { DEFAULT_RISK_CONFIG } from "@/lib/risk-engine";

interface PRScenario {
  id: number;
  ticket: string;
  title: string;
  riskTier: "High" | "Critical" | "Low";
  riskScore: number;
  file: string;
  oldCode: string;
  newCode: string;
  issueBadge: string;
  cwe: string;
  botAnalysis: string;
}

const PR_SCENARIOS: PRScenario[] = [
  {
    id: 184,
    ticket: "ENG-2488",
    title: "Replace session signature check with timing-safe comparison",
    riskTier: "High",
    riskScore: 78,
    file: "src/auth/session.ts",
    oldCode: "08 -   if (token === session.signature) {",
    newCode: "09 +   if (timingSafeEqual(Buffer.from(token), Buffer.from(session.signature))) {",
    issueBadge: "Timing Flaw",
    cwe: "CWE-208",
    botAnalysis:
      "Direct equality operator === leaks execution time through early byte mismatch termination. Constant-time comparison via timingSafeEqual prevents side-channel token recovery.",
  },
  {
    id: 142,
    ticket: "ENG-2380",
    title: "Fix S3 client upload credentials leak in storage.ts",
    riskTier: "Critical",
    riskScore: 92,
    file: "src/server/storage.ts",
    oldCode: '14 -   accessKeyId: "AKIAIOSFODNN7EXAMPLE",',
    newCode: "15 +   accessKeyId: process.env.AWS_ACCESS_KEY_ID,",
    issueBadge: "Hardcoded Secret",
    cwe: "CWE-798",
    botAnalysis:
      "Plaintext AWS Access Key detected in repository diff hunk. Replaced with process.env.AWS_ACCESS_KEY_ID runtime injection to prevent immediate cloud compromise.",
  },
  {
    id: 139,
    ticket: "ENG-2039",
    title: "Sanitize raw SQL interpolation in repository queries",
    riskTier: "Low",
    riskScore: 18,
    file: "src/routes/repos.ts",
    oldCode: "42 -   const query = `SELECT * FROM repos WHERE id = '${repoId}'`;",
    newCode: '43 +   const query = "SELECT * FROM repos WHERE id = $1";',
    issueBadge: "SQL Injection",
    cwe: "CWE-89",
    botAnalysis:
      "Direct string template interpolation allows arbitrary SQL injection. Parameterized binding with $1 binds user input as a literal parameter, eliminating SQL injection vectors.",
  },
];

export function LinearProductSections() {
  // Chapter 1: Review Bot & Diffs State
  const [selectedPrId, setSelectedPrId] = useState<number>(184);
  const [committedFixes, setCommittedFixes] = useState<Record<number, boolean>>({});
  const [activeFeature1, setActiveFeature1] = useState<string | null>(null);

  const activePR = PR_SCENARIOS.find((p) => p.id === selectedPrId) ?? PR_SCENARIOS[0]!;
  const isFixCommitted = Boolean(committedFixes[activePR.id]);

  const toggleCommitFix = (id: number) => {
    setCommittedFixes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Chapter 2: AI Orchestration State
  const [selectedAgent, setSelectedAgent] = useState<"buggers" | "claude" | "gpt4o" | "gemini">("buggers");
  const [activeFeature2, setActiveFeature2] = useState<string | null>(null);

  // Chapter 3: Deterministic Risk Engine State (Using genuine Buggers formulas)
  const [churnLines, setChurnLines] = useState<number>(340);
  const [fileChurnAvg, setFileChurnAvg] = useState<number>(18);
  const [defectCommits, setDefectCommits] = useState<number>(6);
  const [filesTouched, setFilesTouched] = useState<number>(8);
  const [testRatio, setTestRatio] = useState<number>(0.25);
  const [touchesManifest, setTouchesManifest] = useState<boolean>(false);
  const [activeFeature3, setActiveFeature3] = useState<string | null>(null);

  // Calculate live risk score grounded in src/lib/risk-engine.ts
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const saturate = (n: number, mid: number) => (n <= 0 ? 0 : clamp01(n / (n + mid)));

  const sChangeSize = saturate(churnLines, DEFAULT_RISK_CONFIG.midpoints.changeSize);
  const sFileChurn = saturate(fileChurnAvg, DEFAULT_RISK_CONFIG.midpoints.fileChurn);
  const sDefectHistory = clamp01((defectCommits / 20) * DEFAULT_RISK_CONFIG.thresholds.defectRatioMultiplier);
  const sFilesTouched = saturate(filesTouched, DEFAULT_RISK_CONFIG.midpoints.changeSpread);
  const sTestChanges = testRatio >= DEFAULT_RISK_CONFIG.thresholds.targetTestToCodeRatio ? 0 : clamp01(1 - testRatio / 0.33);
  const sDependency = touchesManifest ? DEFAULT_RISK_CONFIG.thresholds.dependencyChangePenalty : 0;

  const weights = DEFAULT_RISK_CONFIG.weights;
  const observedSum =
    sChangeSize * weights.changeSize +
    sFileChurn * weights.fileChurn +
    sDefectHistory * weights.defectHistory +
    sFilesTouched * weights.changeSpread +
    sTestChanges * weights.testChanges +
    sDependency * weights.dependencyChanges;

  const totalWeights =
    weights.changeSize +
    weights.fileChurn +
    weights.defectHistory +
    weights.changeSpread +
    weights.testChanges +
    weights.dependencyChanges;

  const computedRiskScore = Math.round((observedSum / totalWeights) * 100);

  const riskTier =
    computedRiskScore >= DEFAULT_RISK_CONFIG.thresholds.riskLevels.critical
      ? { label: "CRITICAL", badge: "text-rose-400 bg-rose-500/10 border-rose-500/30" }
      : computedRiskScore >= DEFAULT_RISK_CONFIG.thresholds.riskLevels.high
      ? { label: "HIGH", badge: "text-amber-400 bg-amber-500/10 border-amber-500/30" }
      : computedRiskScore >= DEFAULT_RISK_CONFIG.thresholds.riskLevels.medium
      ? { label: "MEDIUM", badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" }
      : { label: "LOW", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };

  // Chapter 4: Quality Gate State
  const [gateThreshold, setGateThreshold] = useState<number>(50);
  const [blockOnSecrets, setBlockOnSecrets] = useState<boolean>(true);
  const [blockOnCriticalSast, setBlockOnCriticalSast] = useState<boolean>(true);
  const [activeFeature4, setActiveFeature4] = useState<string | null>(null);

  const gatePassed = computedRiskScore <= gateThreshold;

  return (
    <div className="w-full space-y-36">

      {/* ================================================================ */}
      {/* CHAPTER 1: Build, review, and ship */}
      {/* ================================================================ */}
      <section id="build-review-ship" className="w-full space-y-8 scroll-mt-28">
        {/* Editorial Split Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
          <div className="lg:col-span-7">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-2 block">
              SPECIFICATION 01 / DIFF TRIAGE &amp; BOT ACTIONS
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
              Build, review, and ship
            </h2>
          </div>
          <div className="lg:col-span-5 space-y-2">
            <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
              Streamline code reviews with clear diffs, whole-repo defect churn context, and fewer noisy back-and-forth comments. Keep PRs moving without sacrificing quality.
            </p>
            <a
              href="#risk-engine"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group cursor-pointer"
            >
              <span>Explore triage architecture</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Spacious Elevated Product Preview Canvas (No clunky card styling) */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0e1015] via-[#0a0b0f] to-[#08090a] p-4 sm:p-8 lg:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-0">
            
            {/* Left PR List Column */}
            <div className="lg:col-span-5 space-y-3 font-mono text-xs">
              <div className="text-[11px] text-neutral-500 font-semibold px-2 py-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>In Review (3 active PRs)</span>
                </span>
                <span>Select to inspect</span>
              </div>

              {PR_SCENARIOS.map((pr) => {
                const isSelected = pr.id === selectedPrId;
                const isCommitted = Boolean(committedFixes[pr.id]);
                return (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setSelectedPrId(pr.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.08] border-white/20 text-white shadow-lg"
                        : "bg-white/[0.02] border-white/[0.04] text-neutral-400 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{pr.ticket}</span>
                        {isCommitted && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-sans">
                            Committed
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          pr.riskTier === "Critical"
                            ? "text-rose-400"
                            : pr.riskTier === "High"
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        Risk: {pr.riskScore}/100 ({pr.riskTier})
                      </span>
                    </div>
                    <div className="text-xs text-neutral-200 mt-1 truncate font-sans">
                      {pr.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right IDE Diff Editor Window */}
            <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#07080a] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono">
                <span className="text-neutral-400">{activePR.file}</span>
                <span className="text-neutral-500">PR #{activePR.id} Unified Diff</span>
              </div>

              {/* Code Lines with Syntax Styling */}
              <div className="font-mono text-xs leading-relaxed space-y-1 select-none">
                <div className="text-neutral-600">05  import &#123; createHmac, timingSafeEqual &#125; from 'crypto';</div>
                <div className="text-neutral-600">06  </div>
                <div className="text-neutral-500">07  export function verifySessionToken(token: string, session: Session) &#123;</div>
                <div className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded flex items-center justify-between">
                  <span>{activePR.oldCode}</span>
                  <span className="text-[10px] font-sans text-rose-400/80">{activePR.issueBadge}</span>
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded flex items-center justify-between">
                  <span>{activePR.newCode}</span>
                  <span className="text-[10px] font-sans text-emerald-400/80">Deterministic Fix</span>
                </div>
                <div className="text-neutral-500">10        return true;</div>
                <div className="text-neutral-500">11      &#125;</div>
              </div>

              {/* Floating Buggers Bot Comment & Action Button */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-medium text-white">Buggers Review Bot</span>
                    <span className="text-[10px] font-mono text-neutral-400">98% Confidence</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase">{activePR.cwe}</span>
                </div>
                <p className="text-xs text-neutral-300 leading-normal font-sans">
                  {activePR.botAnalysis}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-neutral-500">
                    {isFixCommitted ? "Commit sha: 4f98a12 (Pushed to PR branch)" : "Verified AST Hunk Replacement"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCommitFix(activePR.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      isFixCommitted
                        ? "bg-emerald-500 text-black font-semibold"
                        : "bg-white text-black hover:bg-neutral-200"
                    }`}
                  >
                    {isFixCommitted ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Fix Committed to Branch</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        <span>Apply Fix to Branch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Features Row with Fully-Working Interactive Drawers */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-500 border-b border-white/[0.06] pb-4">
            <span className="uppercase tracking-wider text-neutral-400 font-semibold">Features</span>
            <div className="flex flex-wrap items-center gap-2 text-neutral-300">
              {[
                { id: "ast_diffs", label: "AST Diffs +" },
                { id: "guided_reviews", label: "Guided Reviews +" },
                { id: "inline_fixes", label: "Inline Fixes +" },
                { id: "git_automations", label: "Git Automations +" },
                { id: "commit_statuses", label: "Commit Statuses +" },
                { id: "releases", label: "Releases +" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveFeature1(activeFeature1 === pill.id ? null : pill.id)}
                  className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    activeFeature1 === pill.id
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-white/[0.03] text-neutral-300 hover:text-white hover:bg-white/[0.08] border-white/[0.06]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Feature Drawer */}
          {activeFeature1 && (
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0c0d10] text-xs font-sans text-neutral-300 space-y-2 animate-fadeIn">
              {activeFeature1 === "ast_diffs" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">AST Diff Parser &amp; Node Replacement</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Buggers parses added lines from GitHub unified diffs into concrete Abstract Syntax Tree nodes. Line ranges and column coordinates are mathematically verified against original repository files to guarantee zero hallucinated comments.
                  </p>
                </div>
              )}
              {activeFeature1 === "guided_reviews" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Confidence-Weighted Guided Reviews</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Reviews are filtered through a 95% confidence threshold. Trivial stylistic complaints are suppressed, allowing engineering teams to focus solely on high-impact security and regression risks.
                  </p>
                </div>
              )}
              {activeFeature1 === "inline_fixes" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">One-Click Branch Commit Engine</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    The RPC server function <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">applyFindingFix(findingId)</code> formats the verified patch hunk and pushes a git commit directly to the pull request branch via GitHub REST API without requiring local checkouts.
                  </p>
                </div>
              )}
              {activeFeature1 === "git_automations" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Webhook Dispatch &amp; Synchronize Lifecycle</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Listening at <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">/api/webhooks/github</code>, Buggers verifies HMAC SHA-256 signatures and automatically schedules idempotent background triage passes whenever commits are pushed.
                  </p>
                </div>
              )}
              {activeFeature1 === "commit_statuses" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">GitHub Commit Status Checks</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Buggers publishes real-time commit statuses under context <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">buggers/quality-gate</code>, synchronizing state with GitHub branch protection policies to block non-compliant merges.
                  </p>
                </div>
              )}
              {activeFeature1 === "releases" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Release Intelligence &amp; Tagging</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Correlates PR risk metrics with subsequent production release tags to compute historical defect fault lines and calibrate author familiarity factors across quarters.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>


      {/* ================================================================ */}
      {/* CHAPTER 2: AI and automations */}
      {/* ================================================================ */}
      <section id="ai-automations" className="w-full space-y-8 scroll-mt-28">
        {/* Editorial Split Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
          <div className="lg:col-span-7">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-2 block">
              SPECIFICATION 02 / MULTI-PROVIDER AI ORCHESTRATION
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
              AI and automations
            </h2>
          </div>
          <div className="lg:col-span-5 space-y-2">
            <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
              Build and deploy multi-provider fallback chains that triage diffs alongside deterministic scanners. Inspect AST changes together or delegate routine syntax fixes end-to-end.
            </p>
            <a
              href="#pipeline"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group cursor-pointer"
            >
              <span>View pipeline specifications</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Spacious 4-Card Multi-Provider Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Buggers In-Process */}
          <div
            onClick={() => setSelectedAgent("buggers")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
              selectedAgent === "buggers"
                ? "bg-[#0f1117] border-white/30 shadow-2xl scale-[1.01]"
                : "bg-[#090a0d] border-white/[0.06] hover:bg-[#0c0d12] hover:border-white/10"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">Buggers Triage</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Active (0ms)
                </span>
              </div>
              <div className="rounded-lg bg-black/40 p-3 font-mono text-[11px] text-neutral-300 border border-white/[0.04]">
                In-process regex scanner &amp; AST structural verification
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Evaluates diff patches in 140ms with zero token cost before any LLM API is invoked.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>Stage 1-5 In-Process</span>
              <span className="text-amber-400 font-semibold">$0.00 / PR</span>
            </div>
          </div>

          {/* Card 2: Claude 3.5 Sonnet */}
          <div
            onClick={() => setSelectedAgent("claude")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
              selectedAgent === "claude"
                ? "bg-[#0f1117] border-white/30 shadow-2xl scale-[1.01]"
                : "bg-[#090a0d] border-white/[0.06] hover:bg-[#0c0d12] hover:border-white/10"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">Claude 3.5</span>
                <span className="text-[10px] text-neutral-400">Primary AI</span>
              </div>
              <div className="rounded-lg bg-black/40 p-3 font-mono text-[11px] text-neutral-300 border border-white/[0.04]">
                Deep architectural refactoring &amp; defect reasoning
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Generates verified replacement diff hunks with exact line mappings and rationale.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>~2,410 tokens</span>
              <span className="text-neutral-300">$0.007 / PR</span>
            </div>
          </div>

          {/* Card 3: GPT-4o */}
          <div
            onClick={() => setSelectedAgent("gpt4o")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
              selectedAgent === "gpt4o"
                ? "bg-[#0f1117] border-white/30 shadow-2xl scale-[1.01]"
                : "bg-[#090a0d] border-white/[0.06] hover:bg-[#0c0d12] hover:border-white/10"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">GPT-4o</span>
                <span className="text-[10px] text-neutral-400">Fallback 1</span>
              </div>
              <div className="rounded-lg bg-black/40 p-3 font-mono text-[11px] text-neutral-300 border border-white/[0.04]">
                Standby secondary verification &amp; JSON schema parsing
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Automatically triggered if primary AI rate-limits or times out after 4 seconds.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>Automatic Failover</span>
              <span className="text-neutral-300">&lt;200ms switch</span>
            </div>
          </div>

          {/* Card 4: Gemini Flash */}
          <div
            onClick={() => setSelectedAgent("gemini")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
              selectedAgent === "gemini"
                ? "bg-[#0f1117] border-white/30 shadow-2xl scale-[1.01]"
                : "bg-[#090a0d] border-white/[0.06] hover:bg-[#0c0d12] hover:border-white/10"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">Gemini Flash</span>
                <span className="text-[10px] text-neutral-400">Fallback 2</span>
              </div>
              <div className="rounded-lg bg-black/40 p-3 font-mono text-[11px] text-neutral-300 border border-white/[0.04]">
                High-throughput emergency queue processing
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Zero-downtime queue worker fallback handling large mono-repo diff bursts.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>1M Context Window</span>
              <span className="text-neutral-300">Fast Stream</span>
            </div>
          </div>
        </div>

        {/* Features Row with Working Drawers */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-500 border-b border-white/[0.06] pb-4">
            <span className="uppercase tracking-wider text-neutral-400 font-semibold">Features</span>
            <div className="flex flex-wrap items-center gap-2 text-neutral-300">
              {[
                { id: "diff_cache", label: "Diff Cache +" },
                { id: "heartbeat_leases", label: "Heartbeat Leases +" },
                { id: "provider_fallbacks", label: "Provider Fallbacks +" },
                { id: "token_caps", label: "Token Caps +" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveFeature2(activeFeature2 === pill.id ? null : pill.id)}
                  className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    activeFeature2 === pill.id
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-white/[0.03] text-neutral-300 hover:text-white hover:bg-white/[0.08] border-white/[0.06]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {activeFeature2 && (
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0c0d10] text-xs font-sans text-neutral-300 space-y-2 animate-fadeIn">
              {activeFeature2 === "diff_cache" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Content-Addressable Diff Caching</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Identical patch hunks across synchronized commits are indexed by SHA-256 hash in Postgres. Repeated pushes that rebase without modifying logic hit the cache in 12ms with zero token cost.
                  </p>
                </div>
              )}
              {activeFeature2 === "heartbeat_leases" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">5-Minute Distributed Heartbeat Leases</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    The background worker cron acquires analyses with an atomic lease timestamp. If a worker instance dies mid-run, the lease expires and an automated reaper reclaims the job without duplicate execution.
                  </p>
                </div>
              )}
              {activeFeature2 === "provider_fallbacks" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Multi-Tier AI Fallback Chain</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Configured via <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">AI_PROVIDER</code> with automatic cascade: Claude 3.5 Sonnet &rarr; GPT-4o &rarr; Gemini 1.5 Flash. Ensures 99.9% uptime during third-party LLM outages.
                  </p>
                </div>
              )}
              {activeFeature2 === "token_caps" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Hard Cost &amp; Token Budget Caps</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Large pull request diffs exceeding 4,000 tokens are automatically truncated to priority high-churn files, capping worst-case API spend at under $0.01 per pull request.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>


      {/* ================================================================ */}
      {/* CHAPTER 3: Deterministic risk scoring (Risk Engine 1.1.0) */}
      {/* ================================================================ */}
      <section id="risk-engine" className="w-full space-y-8 scroll-mt-28">
        {/* Editorial Split Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
          <div className="lg:col-span-7">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-2 block">
              SPECIFICATION 03 / MATHEMATICAL RISK MODEL 1.1.0
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
              Deterministic risk scoring
            </h2>
          </div>
          <div className="lg:col-span-5 space-y-2">
            <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
              Calculate multi-dimensional risk scores (0–100) before merging. Align your team with saturating churn curves, historical fault lines, and regression probability.
            </p>
            <a
              href="#quality-gates"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group cursor-pointer"
            >
              <span>Explore quality gate integration</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Spacious Elevated Risk Simulator & Scatter Plot Grid */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0e1015] via-[#0a0b0f] to-[#08090a] p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-0">
            
            {/* Left: 8-Signal Interactive Simulator */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-mono font-semibold text-white uppercase">
                    Risk Engine 1.1.0 Live Simulator
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${riskTier.badge}`}>
                  {riskTier.label} ({computedRiskScore}/100)
                </span>
              </div>

              {/* Sliders */}
              <div className="space-y-4 text-xs font-mono">
                {/* Churn Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Lines Churned:</span>
                    <span className="text-amber-400 font-bold">{churnLines} lines</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={churnLines}
                    onChange={(e) => setChurnLines(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-neutral-500 font-sans">
                    Saturating curve: saturate({churnLines}, 400) = {(sChangeSize * 100).toFixed(0)}% contribution (weight: 0.18)
                  </div>
                </div>

                {/* 90-Day Churn Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Historical 90-Day Churn:</span>
                    <span className="text-amber-400 font-bold">{fileChurnAvg} avg commits</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={fileChurnAvg}
                    onChange={(e) => setFileChurnAvg(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-neutral-500 font-sans">
                    Saturating curve: saturate({fileChurnAvg}, 15) = {(sFileChurn * 100).toFixed(0)}% contribution (weight: 0.20)
                  </div>
                </div>

                {/* Defect History Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Past Defect Commits on Files:</span>
                    <span className="text-amber-400 font-bold">{defectCommits} commits</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={defectCommits}
                    onChange={(e) => setDefectCommits(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-neutral-500 font-sans">
                    Defect multiplier: {(defectCommits / 20).toFixed(2)} &times; 2.0x (weight: 0.20)
                  </div>
                </div>

                {/* Manifest Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-neutral-300">Touches Critical Manifests (package.json, go.mod):</span>
                  <button
                    type="button"
                    onClick={() => setTouchesManifest(!touchesManifest)}
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                      touchesManifest
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-white/5 text-neutral-400 border border-white/10"
                    }`}
                  >
                    {touchesManifest ? "Yes (+0.60 penalty)" : "No"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: 30-PR Cycle Risk Scatter Plot */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-semibold">Cycle Risk Distribution (30 Pull Requests)</span>
                <span className="text-amber-400 font-bold">Policy Threshold: {gateThreshold}</span>
              </div>

              {/* High-Resolution SVG Scatter Plot */}
              <div className="rounded-xl border border-white/[0.08] bg-[#07080a] p-4 relative h-64 flex flex-col justify-between">
                {/* Threshold Guideline */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-amber-400/50 flex items-center justify-end pr-2 text-[10px] font-mono text-amber-400"
                  style={{ bottom: `${gateThreshold}%` }}
                >
                  Threshold {gateThreshold}
                </div>

                {/* Critical Zone Marker */}
                <div className="absolute top-2 right-2 text-[10px] font-mono text-rose-400/70">
                  Critical Zone (&gt;75)
                </div>

                {/* Simulated Pull Request Scatter Points */}
                <div className="relative w-full h-full">
                  {[
                    { id: 1, x: 5, y: 18, color: "bg-emerald-400" },
                    { id: 2, x: 8, y: 22, color: "bg-emerald-400" },
                    { id: 3, x: 12, y: 15, color: "bg-emerald-400" },
                    { id: 4, x: 16, y: 35, color: "bg-yellow-400" },
                    { id: 5, x: 20, y: 48, color: "bg-yellow-400" },
                    { id: 6, x: 24, y: computedRiskScore, color: riskTier.badge.includes("rose") ? "bg-rose-400 ring-4 ring-rose-500/30" : "bg-amber-400 ring-4 ring-amber-500/30" },
                    { id: 7, x: 28, y: 72, color: "bg-rose-400" },
                    { id: 8, x: 32, y: 84, color: "bg-rose-400" },
                    { id: 9, x: 36, y: 62, color: "bg-amber-400" },
                    { id: 10, x: 40, y: 29, color: "bg-emerald-400" },
                    { id: 11, x: 44, y: 14, color: "bg-emerald-400" },
                    { id: 12, x: 48, y: 41, color: "bg-yellow-400" },
                    { id: 13, x: 52, y: 53, color: "bg-amber-400" },
                    { id: 14, x: 56, y: 79, color: "bg-rose-400" },
                    { id: 15, x: 60, y: 12, color: "bg-emerald-400" },
                    { id: 16, x: 64, y: 31, color: "bg-yellow-400" },
                    { id: 17, x: 68, y: 24, color: "bg-emerald-400" },
                    { id: 18, x: 72, y: 88, color: "bg-rose-400" },
                    { id: 19, x: 76, y: 45, color: "bg-yellow-400" },
                    { id: 20, x: 80, y: 20, color: "bg-emerald-400" },
                    { id: 21, x: 84, y: 68, color: "bg-amber-400" },
                    { id: 22, x: 88, y: 16, color: "bg-emerald-400" },
                    { id: 23, x: 92, y: 38, color: "bg-yellow-400" },
                    { id: 24, x: 96, y: 27, color: "bg-emerald-400" },
                  ].map((pt) => (
                    <div
                      key={pt.id}
                      className={`absolute h-2.5 w-2.5 rounded-full ${pt.color} transition-all duration-300 hover:scale-150 cursor-pointer`}
                      style={{ left: `${pt.x}%`, bottom: `${pt.y}%` }}
                      title={`PR #${140 + pt.id} — Score: ${pt.y}`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-2 border-t border-white/[0.04]">
                  <span>Sprint Start</span>
                  <span>Active Release Candidate</span>
                  <span>26/30 Merged Safely (87%)</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Exact Mathematical Formula & Weights Matrix from Source Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-4">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-amber-400" />
              <span>Additive Normalized Formulation</span>
            </h3>
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-5 text-xs font-mono text-neutral-300 space-y-3">
              <p className="text-neutral-400 text-[11px] font-sans">
                Computed deterministically without hallucinated priors:
              </p>
              <div className="text-amber-200/95 bg-black/50 p-3 rounded-lg border border-white/[0.04] select-all">
                Score = round( &Sigma;(s.value &times; s.weight) / &Sigma;(s.weight) &times; 100 )
              </div>
              <ul className="space-y-1.5 text-[11px] text-neutral-400 font-sans">
                <li>&bull; <strong className="text-white font-mono">saturate(n, mid) = n / (n + mid)</strong>: Smooth non-linear asymptote</li>
                <li>&bull; <strong className="text-white font-mono">insufficient_data</strong>: Automatically dropped from denominator</li>
                <li>&bull; <strong className="text-white font-mono">confidence</strong>: Proportion of observed weights &times; file coverage</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>Observable Signal Weights Matrix</span>
            </h3>
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 text-[11px] font-mono">
                  <tr>
                    <th className="py-2.5 px-4">Signal ID</th>
                    <th className="py-2.5 px-4">Weight</th>
                    <th className="py-2.5 px-4">Midpoint / Parameter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-neutral-300 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-4 text-white">change_size</td>
                    <td className="py-2 px-4 text-amber-400">{DEFAULT_RISK_CONFIG.weights.changeSize}</td>
                    <td className="py-2 px-4 text-neutral-400">400 lines</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-white">file_churn</td>
                    <td className="py-2 px-4 text-amber-400">{DEFAULT_RISK_CONFIG.weights.fileChurn}</td>
                    <td className="py-2 px-4 text-neutral-400">15 commits (90-day window)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-white">defect_history</td>
                    <td className="py-2 px-4 text-amber-400">{DEFAULT_RISK_CONFIG.weights.defectHistory}</td>
                    <td className="py-2 px-4 text-neutral-400">2.0x multiplier on fix/revert commits</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-white">change_spread</td>
                    <td className="py-2 px-4 text-amber-400">{DEFAULT_RISK_CONFIG.weights.changeSpread}</td>
                    <td className="py-2 px-4 text-neutral-400">12 files</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-white">test_changes</td>
                    <td className="py-2 px-4 text-amber-400">{DEFAULT_RISK_CONFIG.weights.testChanges}</td>
                    <td className="py-2 px-4 text-neutral-400">0.33 code-to-test ratio</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-white">dependency_changes</td>
                    <td className="py-2 px-4 text-amber-400">{DEFAULT_RISK_CONFIG.weights.dependencyChanges}</td>
                    <td className="py-2 px-4 text-neutral-400">0.60 manifest modification penalty</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Features Row with Working Drawers */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-500 border-b border-white/[0.06] pb-4">
            <span className="uppercase tracking-wider text-neutral-400 font-semibold">Features</span>
            <div className="flex flex-wrap items-center gap-2 text-neutral-300">
              {[
                { id: "saturating_curves", label: "Saturating Curves +" },
                { id: "defect_regex", label: "Defect Regex +" },
                { id: "signal_calibration", label: "Signal Calibration +" },
                { id: "confidence_metric", label: "Confidence Metric +" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveFeature3(activeFeature3 === pill.id ? null : pill.id)}
                  className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    activeFeature3 === pill.id
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-white/[0.03] text-neutral-300 hover:text-white hover:bg-white/[0.08] border-white/[0.06]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {activeFeature3 && (
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0c0d10] text-xs font-sans text-neutral-300 space-y-2 animate-fadeIn">
              {activeFeature3 === "saturating_curves" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Smooth Asymptotic Saturation</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    By passing raw line counts through <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">n / (n + midpoint)</code>, a 2,000-line pull request cannot unilaterally dominate the score, preventing distorted risk spikes on generated lockfiles.
                  </p>
                </div>
              )}
              {activeFeature3 === "defect_regex" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Conventional Defect Regex Isolation</h4>
                  <div className="p-2 rounded bg-black/50 font-mono text-[11px] text-amber-300/90 border border-white/[0.04] truncate mb-1">
                    DEFECT_PATTERN = /^(?:fix|revert)(?:\([a-zA-Z0-9_.-]+\))?!?:|\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+#\d+/i
                  </div>
                  <p className="text-neutral-400 leading-relaxed">
                    Scans 90-day base branch commit history for modified file paths, excluding ambiguous keywords while capturing explicit issue closures and git reverts.
                  </p>
                </div>
              )}
              {activeFeature3 === "signal_calibration" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Repository Dynamic Calibration</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    As repositories evolve, Buggers recalculates the moving average churn window, automatically adapting thresholds for high-velocity teams without manual reconfiguration.
                  </p>
                </div>
              )}
              {activeFeature3 === "confidence_metric" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Observable Confidence Percentage</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    If git history is truncated (e.g. initial commit or squashed branch), signals report <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">insufficient_data</code>. Confidence drops rather than generating hallucinated scores.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>


      {/* ================================================================ */}
      {/* CHAPTER 4: Policy enforcement & merge gates */}
      {/* ================================================================ */}
      <section id="quality-gates" className="w-full space-y-8 scroll-mt-28">
        {/* Editorial Split Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
          <div className="lg:col-span-7">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold mb-2 block">
              SPECIFICATION 04 / DECLARATIVE MERGE GATES (.buggers.yml)
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
              Policy enforcement &amp; merge gates
            </h2>
          </div>
          <div className="lg:col-span-5 space-y-2">
            <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
              Enforce declarative repository security policies via instant GitHub commit status checks, custom branch protection rules, and real-time team alerts.
            </p>
            <a
              href="#security-scanners"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group cursor-pointer"
            >
              <span>Inspect pre-execution scanners</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Spacious Policy Preview Canvas */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0e1015] via-[#0a0b0f] to-[#08090a] p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-0">
            
            {/* Left: Policy Controller */}
            <div className="lg:col-span-6 space-y-5 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-white font-semibold">Repository Policy Controller</span>
                <span className="text-neutral-400">.buggers.yml</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.04] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">Max Allowable Risk Threshold:</span>
                    <span className="text-amber-400 font-bold">{gateThreshold} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    step="5"
                    value={gateThreshold}
                    onChange={(e) => setGateThreshold(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                  <span className="text-neutral-300">Block on Plaintext Secrets:</span>
                  <button
                    type="button"
                    onClick={() => setBlockOnSecrets(!blockOnSecrets)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                      blockOnSecrets
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-neutral-400 border border-white/10"
                    }`}
                  >
                    {blockOnSecrets ? "Enabled (Strict)" : "Disabled"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                  <span className="text-neutral-300">Block on Critical OWASP SAST:</span>
                  <button
                    type="button"
                    onClick={() => setBlockOnCriticalSast(!blockOnCriticalSast)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                      blockOnCriticalSast
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-neutral-400 border border-white/10"
                    }`}
                  >
                    {blockOnCriticalSast ? "Enabled (Strict)" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Live GitHub Check Box Preview */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                Simulated GitHub Commit Check Evaluation
              </span>

              <div className="rounded-xl border border-white/[0.08] bg-[#07080a] p-5 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    {gatePassed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                    )}
                    <span className="text-white font-semibold">buggers/quality-gate</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      gatePassed
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {gatePassed ? "Passed" : "Action Required"}
                  </span>
                </div>

                <div className="space-y-2 text-[11px] text-neutral-400 font-sans">
                  <div className="flex items-center justify-between">
                    <span>1. Composite Risk Score:</span>
                    <span className={computedRiskScore <= gateThreshold ? "text-emerald-400 font-mono" : "text-rose-400 font-mono font-bold"}>
                      {computedRiskScore} &le; {gateThreshold} ({computedRiskScore <= gateThreshold ? "Passed" : "Violated"})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>2. Plaintext Credentials:</span>
                    <span className="text-emerald-400 font-mono">0 Detected (Passed)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>3. Critical SAST Vulnerabilities:</span>
                    <span className="text-emerald-400 font-mono">0 Detected (Passed)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.04] text-[10px] text-neutral-500 flex items-center justify-between">
                  <span>Context: buggers/quality-gate</span>
                  <span>Evaluated in 140ms</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Copyable .buggers.yml Specification */}
        <div className="space-y-3">
          <h3 className="text-base font-medium text-white flex items-center gap-2">
            <FileCode className="h-4 w-4 text-emerald-400" />
            <span>Declarative Configuration File (.buggers.yml)</span>
          </h3>
          <CodeBlock
            code={`# .buggers.yml - Declarative Repository Quality Gate Policy
version: "1.0"

rules:
  # Maximum allowable composite risk score (0-100)
  max_risk_score: 50

  # Block pull requests if any plaintext credentials are discovered
  block_on_secrets: true

  # Block on critical static analysis findings (Command/SQL injection)
  block_on_critical_sast: true

  # Minimum required test-to-code change ratio
  required_test_ratio: 0.20

  # Files requiring strict review when modified
  critical_files:
    - "src/auth/**"
    - "src/server/**"
    - "supabase/migrations/**"

status_checks:
  context: "buggers/quality-gate"
  post_summary_comment: true
  auto_apply_safe_fixes: false`}
            language="yaml"
            filename=".buggers.yml"
          />
        </div>

        {/* Features Row with Working Drawers */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-500 border-b border-white/[0.06] pb-4">
            <span className="uppercase tracking-wider text-neutral-400 font-semibold">Features</span>
            <div className="flex flex-wrap items-center gap-2 text-neutral-300">
              {[
                { id: "branch_protection", label: "Branch Protection +" },
                { id: "custom_context", label: "Custom Context +" },
                { id: "auto_apply", label: "Auto-Apply Fixes +" },
                { id: "team_alerts", label: "Slack/Discord Alerts +" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveFeature4(activeFeature4 === pill.id ? null : pill.id)}
                  className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    activeFeature4 === pill.id
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-white/[0.03] text-neutral-300 hover:text-white hover:bg-white/[0.08] border-white/[0.06]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {activeFeature4 && (
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0c0d10] text-xs font-sans text-neutral-300 space-y-2 animate-fadeIn">
              {activeFeature4 === "branch_protection" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">GitHub Native Branch Protection</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Add <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">buggers/quality-gate</code> to your required status checks in GitHub Settings &rarr; Branches &rarr; Branch protection rules to block merging automatically.
                  </p>
                </div>
              )}
              {activeFeature4 === "custom_context" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Custom Status Check Contexts</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Configure multiple independent status checks for multi-repo monorepos (e.g. <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">buggers/client</code> and <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">buggers/api</code>).
                  </p>
                </div>
              )}
              {activeFeature4 === "auto_apply" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Automated Safe Fix Merging</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    When <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">auto_apply_safe_fixes: true</code> is configured, trivial import or constant-time comparison fixes are committed automatically to the branch with verified AST validation.
                  </p>
                </div>
              )}
              {activeFeature4 === "team_alerts" && (
                <div>
                  <h4 className="text-white font-semibold font-mono text-sm mb-1">Real-Time Team Notifications</h4>
                  <p className="text-neutral-400 leading-relaxed">
                    Dispatches formatted webhook alerts to Slack or Discord channels whenever a pull request exceeds the configured critical risk threshold.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
