import { useState, useEffect, useRef } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  GitPullRequest,
  Lock,
  Play,
  Pause,
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
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { CodeBlock } from "./DocsComponents";
import { DEFAULT_RISK_CONFIG } from "@/lib/risk-engine";

interface CodeLine {
  num: string;
  text: string;
  isVulnerable?: boolean;
  fixText?: string;
}

interface PRScenario {
  id: number;
  ticket: string;
  title: string;
  riskTier: "High" | "Critical" | "Low";
  riskScore: number;
  file: string;
  lines: CodeLine[];
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
    issueBadge: "Timing Flaw",
    cwe: "CWE-208",
    botAnalysis:
      "Direct equality operator === leaks execution time through early byte mismatch termination. Constant-time comparison via timingSafeEqual prevents side-channel token recovery.",
    lines: [
      { num: "05", text: "import { createHmac, timingSafeEqual } from 'node:crypto';" },
      { num: "06", text: "export function verifySessionToken(token: string, session: Session) {" },
      { num: "07", text: "  const sig = req.headers.get('x-signature') ?? '';" },
      { num: "08", text: "  if (token === session.signature) {", isVulnerable: true, fixText: "  if (timingSafeEqual(Buffer.from(token), Buffer.from(session.signature))) {" },
      { num: "09", text: "    return { verified: true, session };" },
      { num: "10", text: "  }" },
      { num: "11", text: "  throw new UnauthorizedError('HMAC signature mismatch');" },
      { num: "12", text: "}" },
    ],
  },
  {
    id: 142,
    ticket: "ENG-2380",
    title: "Fix S3 client upload credentials leak in storage.ts",
    riskTier: "Critical",
    riskScore: 92,
    file: "src/server/storage.ts",
    issueBadge: "Hardcoded Secret",
    cwe: "CWE-798",
    botAnalysis:
      "Plaintext AWS Access Key detected in repository diff hunk. Replaced with process.env.AWS_ACCESS_KEY_ID runtime injection to prevent immediate cloud compromise.",
    lines: [
      { num: "11", text: "import { S3Client } from '@aws-sdk/client-s3';" },
      { num: "12", text: "export function initializeStorage() {" },
      { num: "13", text: "  return new S3Client({" },
      { num: "14", text: "    region: 'us-east-1'," },
      { num: "15", text: '    accessKeyId: "AKIAIOSFODNN7EXAMPLE",', isVulnerable: true, fixText: "    accessKeyId: process.env.AWS_ACCESS_KEY_ID!," },
      { num: "16", text: "    endpoint: 'https://s3.amazonaws.com'," },
      { num: "17", text: "  });" },
      { num: "18", text: "}" },
    ],
  },
  {
    id: 139,
    ticket: "ENG-2039",
    title: "Sanitize raw SQL interpolation in repository queries",
    riskTier: "Low",
    riskScore: 18,
    file: "src/routes/repos.ts",
    issueBadge: "SQL Injection",
    cwe: "CWE-89",
    botAnalysis:
      "Direct string template interpolation allows arbitrary SQL injection. Parameterized binding with $1 binds user input as a literal parameter, eliminating SQL injection vectors.",
    lines: [
      { num: "39", text: "import { pool } from '../db/connection';" },
      { num: "40", text: "export async function getRepositoryById(repoId: string) {" },
      { num: "41", text: "  // Query database for repository record:" },
      { num: "42", text: "  const query = `SELECT * FROM repos WHERE id = '${repoId}'`;", isVulnerable: true, fixText: '  const query = sql`SELECT * FROM repos WHERE id = ${repoId}`;' },
      { num: "43", text: "  const result = await pool.query(query);" },
      { num: "44", text: "  return result.rows[0] ?? null;" },
      { num: "45", text: "}" },
    ],
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

  // Chapter 1: Viewport Observer & Full Multi-line Sequential Typewriter Simulation
  const chapter1Ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState<boolean>(false);
  const [simPhase, setSimPhase] = useState<"idle" | "typing" | "scanning" | "detected" | "remediated">("idle");
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);
  const [activeCharIdx, setActiveCharIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [replayKey, setReplayKey] = useState<number>(0);

  // Trigger simulation ONLY when Chapter 1 enters the viewport!
  useEffect(() => {
    const elem = chapter1Ref.current;
    if (!elem) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
        } else {
          // Pause / reset when scrolled far away so it's fresh when user returns
          setIsInView(false);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(elem);
    return () => observer.disconnect();
  }, []);

  // Multi-line typewriter & sequential detection simulation engine
  useEffect(() => {
    if (!isInView || isPaused) return;

    setActiveLineIdx(0);
    setActiveCharIdx(0);
    setSimPhase("typing");

    const lines = activePR.lines;
    let lineI = 0;
    let charI = 0;
    let scanTimer: ReturnType<typeof setTimeout> | null = null;
    let remTimer: ReturnType<typeof setTimeout> | null = null;
    let loopTimer: ReturnType<typeof setTimeout> | null = null;

    const interval = setInterval(() => {
      if (lineI >= lines.length) {
        clearInterval(interval);
        setActiveLineIdx(lines.length);
        setSimPhase("scanning");

        // 750ms AST scanning phase
        scanTimer = setTimeout(() => {
          setSimPhase("detected");

          // Auto-apply remediation after detection
          remTimer = setTimeout(() => {
            setSimPhase("remediated");

            // Loop to next PR scenario after 4.5s so animation is perpetually active
            loopTimer = setTimeout(() => {
              setSelectedPrId((prev) => {
                const idx = PR_SCENARIOS.findIndex((p) => p.id === prev);
                const nextIdx = (idx + 1) % PR_SCENARIOS.length;
                return PR_SCENARIOS[nextIdx]!.id;
              });
            }, 4500);
          }, 2400);
        }, 750);

        return;
      }

      const curLine = lines[lineI];
      if (!curLine) return;

      charI += 2; // fluid, snappy 2-character cadence
      if (charI >= curLine.text.length) {
        charI = 0;
        lineI++;
        setActiveLineIdx(lineI);
        setActiveCharIdx(0);
      } else {
        setActiveCharIdx(charI);
      }
    }, 16);

    return () => {
      clearInterval(interval);
      if (scanTimer) clearTimeout(scanTimer);
      if (remTimer) clearTimeout(remTimer);
      if (loopTimer) clearTimeout(loopTimer);
    };
  }, [isInView, selectedPrId, isPaused, activePR.lines, replayKey]);

  const replayTypewriter = () => {
    setIsPaused(false);
    setReplayKey((k) => k + 1);
  };

  const handleApplyFix = () => {
    if (simPhase === "remediated") {
      setCommittedFixes((prev) => ({ ...prev, [activePR.id]: !prev[activePR.id] }));
      setSimPhase("detected");
    } else {
      setCommittedFixes((prev) => ({ ...prev, [activePR.id]: true }));
      setSimPhase("remediated");
    }
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
    <div className="w-full space-y-16 sm:space-y-20">

      {/* ================================================================ */}
      {/* CHAPTER 1: Build, review, and ship */}
      {/* ================================================================ */}
      <section id="build-review-ship" ref={chapter1Ref} className="w-full space-y-8 scroll-mt-28">
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

        {/* Spacious Elevated Product Preview Canvas (Linear Open Hairline with Seamless Dissolve) */}
        <div className="w-full border-y border-white/[0.08] bg-[#090a0d] p-6 sm:p-10 relative overflow-hidden linear-preview-fade-bottom">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#08090a_100%)] pointer-events-none z-10" />
          
          {/* Black fade gradient at bottom only (no side cutoff) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08090a] to-transparent z-20" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-0">
            
            {/* Left PR List Column - Animated Triage Queue */}
            <div className="lg:col-span-5 space-y-3 font-mono text-xs">
              <div className="text-[11px] text-neutral-500 font-semibold px-2 py-1 flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>In Review (3 active PRs)</span>
                </span>
                <span className="text-[10px] text-neutral-400">AST Triage Active</span>
              </div>

              {/* Live Scanner Activity Bar */}
              <div className="h-0.5 w-full bg-white/[0.04] overflow-hidden rounded-full">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-white animate-scanline" />
              </div>

              <div className="border-y border-white/[0.08] divide-y divide-white/[0.06] rounded-lg overflow-hidden">
                {PR_SCENARIOS.map((pr) => {
                  const isSelected = pr.id === selectedPrId;
                  const isCommitted = Boolean(committedFixes[pr.id]) || (isSelected && simPhase === "remediated");
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => {
                        setSelectedPrId(pr.id);
                        setIsPaused(false);
                      }}
                      className={`w-full text-left py-3.5 px-3.5 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-white/[0.06] border-l-2 border-l-white text-white translate-x-1"
                          : "text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{pr.ticket}</span>
                          {isCommitted ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-sans flex items-center gap-1">
                              <Check className="h-2.5 w-2.5" />
                              <span>Committed</span>
                            </span>
                          ) : isSelected && simPhase === "detected" ? (
                            <span className="text-[10px] text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full font-sans animate-pulse flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              <span>AST Alert</span>
                            </span>
                          ) : isSelected && simPhase === "typing" ? (
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-sans animate-pulse">
                              Typing Code...
                            </span>
                          ) : isSelected && simPhase === "scanning" ? (
                            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-sans animate-pulse">
                              AST Scanning
                            </span>
                          ) : null}
                        </div>
                        <span
                          className={`text-[10px] font-medium transition-colors duration-200 ${
                            isCommitted
                              ? "text-emerald-400 font-semibold"
                              : isSelected && simPhase === "detected"
                              ? "text-rose-400 font-semibold"
                              : isSelected && (simPhase === "typing" || simPhase === "scanning")
                              ? "text-amber-400"
                              : pr.riskTier === "Critical"
                              ? "text-rose-400"
                              : pr.riskTier === "High"
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {isCommitted
                            ? "Risk: 12/100 (Pass)"
                            : isSelected && simPhase === "typing"
                            ? "Streaming Code..."
                            : isSelected && simPhase === "scanning"
                            ? "AST Scanning..."
                            : `Risk: ${pr.riskScore}/100 (${pr.riskTier})`}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-300 mt-1.5 truncate font-sans">
                        {pr.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right IDE Diff Editor Window - Linear Hairline Precision with Dynamic Scanline */}
            <div className="lg:col-span-7 border border-white/[0.08] bg-[#07080a] p-5 space-y-4 relative z-10 rounded-xl overflow-hidden shadow-2xl">
              {/* Dynamic Laser Scanning Line during AST Scan */}
              {simPhase === "scanning" && (
                <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent pointer-events-none animate-scanline z-20" />
              )}
              {simPhase === "detected" && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent pointer-events-none animate-pulse z-20" />
              )}
              {simPhase === "remediated" && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent pointer-events-none z-20" />
              )}

              {/* Black fade gradient at bottom only (no side cutoff) */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#07080a] to-transparent z-20" />

              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono">
                <span className="text-neutral-300 flex items-center gap-1.5 font-medium">
                  <FileCode className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{activePR.file}</span>
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Status Indicator pill */}
                  {simPhase === "idle" && (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Scroll to trigger
                    </span>
                  )}
                  {simPhase === "typing" && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono flex items-center gap-1.5 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>Typing Live Code ({Math.min(activeLineIdx + 1, activePR.lines.length)}/{activePR.lines.length})</span>
                    </span>
                  )}
                  {simPhase === "scanning" && (
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono flex items-center gap-1.5 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>AST Laser Scan...</span>
                    </span>
                  )}
                  {simPhase === "detected" && (
                    <span className="text-[10px] text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30 font-mono flex items-center gap-1 font-semibold animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{activePR.cwe} Detected</span>
                    </span>
                  )}
                  {simPhase === "remediated" && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono flex items-center gap-1 font-semibold">
                      <Check className="h-3 w-3" />
                      <span>AST Patch Applied</span>
                    </span>
                  )}

                  {/* Play / Pause Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsPaused((p) => !p)}
                    className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title={isPaused ? "Resume simulation" : "Pause simulation"}
                  >
                    {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5" />}
                  </button>

                  {/* Replay Button */}
                  <button
                    type="button"
                    onClick={replayTypewriter}
                    className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Replay Code Typewriter & AST Scan"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Code Lines with Sequential Typewriter, Scanline, and Remediated Diff */}
              <div key={`${activePR.id}-${replayKey}`} className="font-mono text-xs leading-relaxed space-y-1 select-none py-1 min-h-[220px]">
                {activePR.lines.map((line, idx) => {
                  if (simPhase === "typing" && idx > activeLineIdx) {
                    return (
                      <div key={idx} className="flex items-center text-neutral-700/30 py-0.5">
                        <span className="w-7 text-neutral-700 select-none shrink-0">{line.num}</span>
                        <span className="opacity-0">.</span>
                      </div>
                    );
                  }

                  const isCurrentTypingLine = simPhase === "typing" && idx === activeLineIdx;
                  const displayText = isCurrentTypingLine
                    ? line.text.slice(0, activeCharIdx)
                    : line.text;

                  // Vulnerable AST line handling
                  if (line.isVulnerable) {
                    if (simPhase === "remediated") {
                      return (
                        <div key={idx} className="space-y-1 my-1">
                          {/* Strikethrough original vulnerable code */}
                          <div className="flex items-center justify-between px-2.5 py-1 rounded bg-rose-500/[0.05] text-rose-400/40 line-through text-[11px] sm:text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-4 text-rose-500/60 select-none font-semibold shrink-0">-</span>
                              <span className="w-6 text-neutral-600 select-none shrink-0">{line.num}</span>
                              <span className="truncate">{line.text}</span>
                            </div>
                            <span className="text-[10px] font-sans text-rose-400/60 shrink-0 ml-2">Vulnerable</span>
                          </div>

                          {/* Green Remediated Fix Line */}
                          <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-emerald-500/[0.14] text-emerald-300 border-l-2 border-emerald-400 text-[11px] sm:text-xs font-semibold shadow-[0_0_16px_rgba(52,211,153,0.15)] animate-in fade-in duration-300">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-4 text-emerald-400 select-none font-bold shrink-0">+</span>
                              <span className="w-6 text-emerald-500/70 select-none shrink-0">{line.num}</span>
                              <span className="truncate">{line.fixText}</span>
                            </div>
                            <span className="text-[10px] font-sans text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ml-2 font-semibold">
                              <Check className="h-2.5 w-2.5" />
                              <span>AST Patch Applied</span>
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (simPhase === "detected") {
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded bg-rose-500/15 text-rose-200 border-l-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)] text-[11px] sm:text-xs font-medium my-1 animate-in fade-in duration-200"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-4 text-rose-400 select-none font-bold shrink-0">!</span>
                            <span className="w-6 text-neutral-500 select-none shrink-0">{line.num}</span>
                            <span className="truncate">{line.text}</span>
                          </div>
                          <span className="text-[10px] font-sans text-rose-300 font-semibold bg-rose-500/25 px-2 py-0.5 rounded border border-rose-500/40 flex items-center gap-1 shrink-0 ml-2 animate-pulse">
                            <AlertTriangle className="h-2.5 w-2.5 text-rose-400" />
                            <span>{activePR.issueBadge} ({activePR.cwe})</span>
                          </span>
                        </div>
                      );
                    }
                  }

                  // Standard line or currently active typing line
                  return (
                    <div
                      key={idx}
                      className={`flex items-center px-2 py-0.5 rounded text-[11px] sm:text-xs transition-colors ${
                        isCurrentTypingLine ? "bg-white/[0.04]" : ""
                      }`}
                    >
                      <span className="w-7 text-neutral-600 select-none shrink-0 font-mono">{line.num}</span>
                      <span
                        className={
                          line.isVulnerable && (simPhase === "typing" || simPhase === "scanning")
                            ? "text-amber-200/90"
                            : "text-neutral-300"
                        }
                      >
                        {displayText}
                      </span>
                      {isCurrentTypingLine && (
                        <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1 animate-pulse shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Buggers Bot Comment & Action Callout */}
              <div
                className={`border-l-2 ${
                  simPhase === "remediated"
                    ? "border-l-emerald-400 bg-emerald-500/[0.03]"
                    : simPhase === "detected"
                    ? "border-l-rose-500 bg-rose-500/[0.03]"
                    : simPhase === "scanning"
                    ? "border-l-cyan-400 bg-cyan-500/[0.02]"
                    : "border-l-amber-400 bg-white/[0.02]"
                } pl-4 py-3 space-y-2.5 rounded-r transition-colors duration-300`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className={`h-3.5 w-3.5 ${
                        simPhase === "remediated"
                          ? "text-emerald-400"
                          : simPhase === "detected"
                          ? "text-rose-400"
                          : simPhase === "scanning"
                          ? "text-cyan-400"
                          : "text-amber-400"
                      }`}
                    />
                    <span className="font-medium text-white">Buggers Review Bot</span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {simPhase === "idle"
                        ? "Ready"
                        : simPhase === "typing"
                        ? "Typing stream..."
                        : simPhase === "scanning"
                        ? "Scanning AST rules..."
                        : simPhase === "remediated"
                        ? "100% Remediated"
                        : "98% Confidence"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase ${
                      simPhase === "remediated"
                        ? "text-emerald-400"
                        : simPhase === "detected"
                        ? "text-rose-400"
                        : "text-amber-400"
                    }`}
                  >
                    {activePR.cwe}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-normal font-sans">
                  {simPhase === "typing"
                    ? `Streaming code modifications into in-process AST analyzer (${activePR.ticket})...`
                    : simPhase === "scanning"
                    ? "Evaluating syntax tree for dangerous patterns, timing vulnerabilities, and raw sinks..."
                    : activePR.botAnalysis}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-neutral-500">
                    {simPhase === "remediated"
                      ? "Commit sha: 4f98a12 (Pushed to PR branch)"
                      : simPhase === "detected"
                      ? "Detection confirmed · AST replacement ready"
                      : simPhase === "scanning"
                      ? "AST traversal active"
                      : "Awaiting AST completion"}
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyFix}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      simPhase === "remediated"
                        ? "bg-emerald-500 text-black font-semibold shadow-[0_0_16px_rgba(52,211,153,0.3)] hover:bg-emerald-400"
                        : "bg-white text-black hover:bg-neutral-200 active:scale-[0.98]"
                    }`}
                  >
                    {simPhase === "remediated" ? (
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
            <div className="p-6 border-y border-white/[0.08] bg-[#0a0b0e] text-xs font-sans text-neutral-300 space-y-2 animate-fadeIn">
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

        {/* Multi-Provider AI Architecture (Linear Open Hairline 4-Column Grid with Edge Blending) */}
        <div className="border-y border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#090a0d] relative overflow-hidden linear-preview-fade-bottom">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-10" />

          {/* Card 1: Buggers In-Process */}
          <div
            onClick={() => setSelectedAgent("buggers")}
            className={`p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-colors cursor-pointer relative z-0 ${
              selectedAgent === "buggers"
                ? "bg-white/[0.05]"
                : "hover:bg-white/[0.02]"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">Buggers Triage</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Active (0ms)
                </span>
              </div>
              <div className="border-l-2 border-l-white/40 pl-3 py-1 font-mono text-[11px] text-neutral-300">
                In-process regex scanner &amp; AST structural verification
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Evaluates diff patches in 140ms with zero token cost before any LLM API is invoked.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>Stage 1-5 In-Process</span>
              <span className="text-amber-400 font-semibold">$0.00 / PR</span>
            </div>
          </div>

          {/* Card 2: Claude 3.5 Sonnet */}
          <div
            onClick={() => setSelectedAgent("claude")}
            className={`p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-colors cursor-pointer relative z-0 ${
              selectedAgent === "claude"
                ? "bg-white/[0.05]"
                : "hover:bg-white/[0.02]"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">Claude 3.5</span>
                <span className="text-[10px] text-neutral-400">Primary AI</span>
              </div>
              <div className="border-l-2 border-l-white/40 pl-3 py-1 font-mono text-[11px] text-neutral-300">
                Deep architectural refactoring &amp; defect reasoning
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Generates verified replacement diff hunks with exact line mappings and rationale.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>~2,410 tokens</span>
              <span className="text-neutral-300">$0.007 / PR</span>
            </div>
          </div>

          {/* Card 3: GPT-4o */}
          <div
            onClick={() => setSelectedAgent("gpt4o")}
            className={`p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-colors cursor-pointer relative z-0 ${
              selectedAgent === "gpt4o"
                ? "bg-white/[0.05]"
                : "hover:bg-white/[0.02]"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">GPT-4o</span>
                <span className="text-[10px] text-neutral-400">Fallback 1</span>
              </div>
              <div className="border-l-2 border-l-white/40 pl-3 py-1 font-mono text-[11px] text-neutral-300">
                Standby secondary verification &amp; JSON schema parsing
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Automatically triggered if primary AI rate-limits or times out after 4 seconds.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>Automatic Failover</span>
              <span className="text-neutral-300">&lt;200ms switch</span>
            </div>
          </div>

          {/* Card 4: Gemini Flash */}
          <div
            onClick={() => setSelectedAgent("gemini")}
            className={`p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-colors cursor-pointer relative z-0 ${
              selectedAgent === "gemini"
                ? "bg-white/[0.05]"
                : "hover:bg-white/[0.02]"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">Gemini Flash</span>
                <span className="text-[10px] text-neutral-400">Fallback 2</span>
              </div>
              <div className="border-l-2 border-l-white/40 pl-3 py-1 font-mono text-[11px] text-neutral-300">
                High-throughput emergency queue processing
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Zero-downtime queue worker fallback handling large mono-repo diff bursts.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
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
            <div className="p-6 border-y border-white/[0.08] bg-[#0a0b0e] text-xs font-sans text-neutral-300 space-y-2 animate-fadeIn">
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

        {/* Spacious Elevated Risk Simulator & Dynamic Scatter/Velocity Graph (Linear Open Hairline with Feathered Edge) */}
        <div className="w-full border-y border-white/[0.08] bg-[#090a0d] p-6 sm:p-10 relative overflow-hidden linear-preview-fade-bottom">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#08090a_100%)] pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-20" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-0">
            
            {/* Left: 8-Signal Interactive Simulator */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-white" />
                  <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
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
                    <span className="text-white font-bold">{churnLines} lines</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={churnLines}
                    onChange={(e) => setChurnLines(Number(e.target.value))}
                    className="w-full accent-white bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-neutral-500 font-sans">
                    Saturating curve: saturate({churnLines}, 400) = {(sChangeSize * 100).toFixed(0)}% contribution (weight: 0.18)
                  </div>
                </div>

                {/* 90-Day Churn Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Historical 90-Day Churn:</span>
                    <span className="text-white font-bold">{fileChurnAvg} avg commits</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={fileChurnAvg}
                    onChange={(e) => setFileChurnAvg(Number(e.target.value))}
                    className="w-full accent-white bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-neutral-500 font-sans">
                    Saturating curve: saturate({fileChurnAvg}, 15) = {(sFileChurn * 100).toFixed(0)}% contribution (weight: 0.20)
                  </div>
                </div>

                {/* Defect History Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Past Defect Commits on Files:</span>
                    <span className="text-white font-bold">{defectCommits} commits</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={defectCommits}
                    onChange={(e) => setDefectCommits(Number(e.target.value))}
                    className="w-full accent-white bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-neutral-500 font-sans">
                    Defect multiplier: {(defectCommits / 20).toFixed(2)} &times; 2.0x (weight: 0.20)
                  </div>
                </div>

                {/* Manifest Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <span className="text-neutral-300">Touches Critical Manifests:</span>
                  <button
                    type="button"
                    onClick={() => setTouchesManifest(!touchesManifest)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                      touchesManifest
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-white/5 text-neutral-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    {touchesManifest ? "Yes (+0.60 penalty)" : "No (Normal)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: 30-PR Cycle Risk Graph (Dynamic Linear Cluster with All Points Moving) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-white font-semibold">Cycle Risk Distribution</span>
                  <span className="text-neutral-500 ml-2">(30 Pull Requests)</span>
                </div>
                <span className="text-neutral-400 font-medium">Policy Threshold: {gateThreshold}</span>
              </div>

              {/* High-Precision Dark Canvas Scatter & Density Plot */}
              <div className="border border-white/[0.08] bg-[#07080a] p-5 relative h-72 flex flex-col justify-between overflow-hidden linear-preview-fade-edges">
                {/* Horizontal Guide Rules */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-5 pb-8">
                  <div className="w-full border-b border-white/[0.04] text-[9px] font-mono text-neutral-600 flex justify-between">
                    <span>100</span>
                    <span className="text-rose-500/60 uppercase">Critical Tier (&gt;75)</span>
                  </div>
                  <div className="w-full border-b border-white/[0.04] text-[9px] font-mono text-neutral-600">
                    <span>75</span>
                  </div>
                  <div className="w-full border-b border-white/[0.04] text-[9px] font-mono text-neutral-600">
                    <span>50</span>
                  </div>
                  <div className="w-full border-b border-white/[0.04] text-[9px] font-mono text-neutral-600">
                    <span>25</span>
                  </div>
                  <div className="w-full border-b border-white/[0.06] text-[9px] font-mono text-neutral-600">
                    <span>0</span>
                  </div>
                </div>

                {/* Dynamic SVG Risk Curve Across Sprints */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  {/* Interactive area fill */}
                  <path
                    d={`M 15 230 Q 180 210, 270 ${Math.max(30, 240 - computedRiskScore * 1.9)} T 520 215 L 520 250 L 15 250 Z`}
                    fill="url(#riskAreaGrad)"
                  />
                  {/* Active Density Line */}
                  <path
                    d={`M 15 230 Q 180 210, 270 ${Math.max(30, 240 - computedRiskScore * 1.9)} T 520 215`}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.7)"
                    strokeWidth="1.5"
                    className="transition-all duration-300"
                  />
                  {/* Policy Gate Dashed Rule */}
                  <line
                    x1="15"
                    y1={240 - gateThreshold * 1.9}
                    x2="520"
                    y2={240 - gateThreshold * 1.9}
                    stroke="rgba(245, 158, 11, 0.5)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* 3 Sprint Columns Clustering (Linear Cycle Style) with ALL Points Dynamically Reacting */}
                <div className="relative w-full h-full z-10 pt-2 pb-6">
                  {(() => {
                    const volatilityDelta = (computedRiskScore - 48);
                    const sprintPoints = [
                      // Column 1: Sprint 24 (Oct) - Baseline historical
                      { id: 1, x: 14, y: 18, isSimulated: false },
                      { id: 2, x: 18, y: 24, isSimulated: false },
                      { id: 3, x: 15, y: 32, isSimulated: false },
                      { id: 4, x: 21, y: 44, isSimulated: false },
                      { id: 5, x: 19, y: 55, isSimulated: false },
                      { id: 6, x: 16, y: 68, isSimulated: false },
                      { id: 7, x: 23, y: 22, isSimulated: false },
                      { id: 8, x: 17, y: 15, isSimulated: false },
                      { id: 9, x: 20, y: 38, isSimulated: false },

                      // Column 2: Sprint 25 (Nov - Current Active Sprint, reacts dynamically to sliders!)
                      { id: 10, x: 48, y: Math.max(8, Math.min(92, Math.round(20 + volatilityDelta * 0.45))), isSimulated: false },
                      { id: 11, x: 52, y: Math.max(10, Math.min(94, Math.round(29 + volatilityDelta * 0.55))), isSimulated: false },
                      { id: 12, x: 49, y: Math.max(12, Math.min(95, Math.round(35 + volatilityDelta * 0.65))), isSimulated: false },
                      { id: 13, x: 54, y: Math.max(14, Math.min(96, Math.round(48 + volatilityDelta * 0.8))), isSimulated: false },
                      { id: 14, x: 47, y: computedRiskScore, isSimulated: true },
                      { id: 15, x: 51, y: Math.max(16, Math.min(98, Math.round(62 + volatilityDelta * 0.7))), isSimulated: false },
                      { id: 16, x: 53, y: Math.max(20, Math.min(99, Math.round(78 + volatilityDelta * 0.5))), isSimulated: false },
                      { id: 17, x: 46, y: Math.max(6, Math.min(88, Math.round(14 + volatilityDelta * 0.4))), isSimulated: false },
                      { id: 18, x: 50, y: Math.max(8, Math.min(90, Math.round(26 + volatilityDelta * 0.5))), isSimulated: false },

                      // Column 3: Sprint 26 (Dec) - Projected pipeline
                      { id: 19, x: 80, y: Math.max(10, Math.min(88, Math.round(16 + volatilityDelta * 0.3))), isSimulated: false },
                      { id: 20, x: 84, y: Math.max(12, Math.min(90, Math.round(23 + volatilityDelta * 0.35))), isSimulated: false },
                      { id: 21, x: 81, y: Math.max(14, Math.min(92, Math.round(31 + volatilityDelta * 0.4))), isSimulated: false },
                      { id: 22, x: 86, y: Math.max(16, Math.min(94, Math.round(42 + volatilityDelta * 0.5))), isSimulated: false },
                      { id: 23, x: 79, y: Math.max(18, Math.min(95, Math.round(53 + volatilityDelta * 0.45))), isSimulated: false },
                      { id: 24, x: 83, y: Math.max(22, Math.min(97, Math.round(74 + volatilityDelta * 0.4))), isSimulated: false },
                      { id: 25, x: 85, y: Math.max(24, Math.min(99, Math.round(86 + volatilityDelta * 0.3))), isSimulated: false },
                      { id: 26, x: 78, y: Math.max(8, Math.min(86, Math.round(19 + volatilityDelta * 0.25))), isSimulated: false },
                      { id: 27, x: 82, y: Math.max(12, Math.min(89, Math.round(27 + volatilityDelta * 0.3))), isSimulated: false },
                    ];

                    return sprintPoints.map((pt) => {
                      const isCritical = pt.y > 75;
                      const isHigh = pt.y > gateThreshold;
                      const colorClass = pt.isSimulated
                        ? isCritical
                          ? "bg-rose-400 ring-4 ring-rose-500/30 scale-150"
                          : isHigh
                          ? "bg-amber-400 ring-4 ring-amber-500/30 scale-150"
                          : "bg-white ring-4 ring-white/30 scale-150"
                        : isCritical
                        ? "bg-rose-400/90"
                        : isHigh
                        ? "bg-amber-400/80"
                        : "bg-neutral-300/80";

                      return (
                        <div
                          key={pt.id}
                          className={`absolute h-2 w-2 rounded-full ${colorClass} transition-all duration-300 hover:scale-150 cursor-pointer`}
                          style={{
                            left: `${pt.x}%`,
                            bottom: `${Math.max(6, Math.min(94, pt.y * 0.72 + 8))}%`,
                          }}
                          title={`PR #${160 + pt.id} — Score: ${pt.y}`}
                        />
                      );
                    });
                  })()}
                </div>

                {/* Sprint Cycle Timeline Labels (Linear Style) */}
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-white/[0.04] z-10">
                  <span className="w-1/3 text-center">Sprint 24 (Oct)</span>
                  <span className="w-1/3 text-center text-white/90 font-semibold">Sprint 25 (Nov - Active)</span>
                  <span className="w-1/3 text-center">Sprint 26 (Dec)</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Exact Mathematical Formula & Weights Matrix: Open Linear 2-Column Hairline */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-y border-white/[0.08] py-8">
          <div className="py-4 md:pr-8 space-y-4">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-white" />
              <span>Additive Normalized Formulation</span>
            </h3>
            <div className="space-y-3 text-xs font-mono text-neutral-300">
              <p className="text-neutral-400 text-xs font-sans">
                Computed deterministically without hallucinated priors:
              </p>
              <div className="text-neutral-200 bg-white/[0.02] p-3 rounded border border-white/[0.06] select-all font-mono">
                Score = round( &Sigma;(s.value &times; s.weight) / &Sigma;(s.weight) &times; 100 )
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-400 font-sans">
                <li>&bull; <strong className="text-white font-mono">saturate(n, mid) = n / (n + mid)</strong>: Smooth non-linear asymptote</li>
                <li>&bull; <strong className="text-white font-mono">insufficient_data</strong>: Automatically dropped from denominator</li>
                <li>&bull; <strong className="text-white font-mono">confidence</strong>: Proportion of observed weights &times; file coverage</li>
              </ul>
            </div>
          </div>

          <div className="py-4 md:pl-8 space-y-4">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-white" />
              <span>Observable Signal Weights Matrix</span>
            </h3>
            <div className="overflow-x-auto text-xs border-y border-white/[0.06]">
              <table className="w-full text-left">
                <thead className="border-b border-white/[0.06] bg-white/[0.02] text-neutral-400 text-[11px] font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Signal ID</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">Midpoint / Parameter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-neutral-300 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 text-white">change_size</td>
                    <td className="py-2 px-3 text-neutral-200">{DEFAULT_RISK_CONFIG.weights.changeSize}</td>
                    <td className="py-2 px-3 text-neutral-400">400 lines</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white">file_churn</td>
                    <td className="py-2 px-3 text-neutral-200">{DEFAULT_RISK_CONFIG.weights.fileChurn}</td>
                    <td className="py-2 px-3 text-neutral-400">15 commits (90-day window)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white">defect_history</td>
                    <td className="py-2 px-3 text-neutral-200">{DEFAULT_RISK_CONFIG.weights.defectHistory}</td>
                    <td className="py-2 px-3 text-neutral-400">2.0x multiplier on fix/revert commits</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white">change_spread</td>
                    <td className="py-2 px-3 text-neutral-200">{DEFAULT_RISK_CONFIG.weights.changeSpread}</td>
                    <td className="py-2 px-3 text-neutral-400">12 files</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white">test_changes</td>
                    <td className="py-2 px-3 text-neutral-200">{DEFAULT_RISK_CONFIG.weights.testChanges}</td>
                    <td className="py-2 px-3 text-neutral-400">0.33 code-to-test ratio</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white">dependency_changes</td>
                    <td className="py-2 px-3 text-neutral-200">{DEFAULT_RISK_CONFIG.weights.dependencyChanges}</td>
                    <td className="py-2 px-3 text-neutral-400">0.60 manifest modification penalty</td>
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
            <div className="p-6 border-y border-white/[0.08] bg-[#0a0b0e] text-xs font-sans text-neutral-300 space-y-2 animate-fadeIn">
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

        {/* Spacious Policy Preview Canvas (Linear Open Hairline with Seamless Dissolve) */}
        <div className="w-full border-y border-white/[0.08] bg-[#090a0d] p-6 sm:p-10 relative overflow-hidden linear-preview-fade-bottom">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#08090a_100%)] pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-20" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-0">
            
            {/* Left: Policy Controller - Linear Hairline List */}
            <div className="lg:col-span-6 space-y-5 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-white font-semibold">Repository Policy Controller</span>
                <span className="text-neutral-400">.buggers.yml</span>
              </div>

              <div className="border-y border-white/[0.08] divide-y divide-white/[0.06]">
                <div className="py-3 px-1 space-y-2">
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

                <div className="flex items-center justify-between py-3.5 px-1">
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

                <div className="flex items-center justify-between py-3.5 px-1">
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

            {/* Right: Live GitHub Check Box Preview - Linear Hairline Precision */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                Simulated GitHub Commit Check Evaluation
              </span>

              <div className="border border-white/[0.08] bg-[#07080a] p-6 space-y-4 font-mono text-xs">
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
            <div className="p-6 border-y border-white/[0.08] bg-[#0a0b0e] text-xs font-sans text-neutral-300 space-y-2 animate-fadeIn">
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
