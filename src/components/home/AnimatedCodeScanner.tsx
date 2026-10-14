import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Check,
  Play,
  Pause,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  ArrowRight,
  GitCommit,
  Cpu,
} from "lucide-react";

interface CodeScenario {
  id: string;
  ticket: string;
  title: string;
  file: string;
  cwe: string;
  riskScoreInitial: number;
  riskScoreFixed: number;
  riskTierInitial: "Critical" | "High" | "Medium";
  vulnerableLineIdx: number;
  initialLines: Array<{ lineNum: string; text: string; isTarget?: boolean }>;
  removedLine: { lineNum: string; text: string };
  addedLine: { lineNum: string; text: string };
  findingTitle: string;
  findingExplanation: string;
  fixExplanation: string;
}

const SCENARIOS: CodeScenario[] = [
  {
    id: "timing-attack",
    ticket: "ENG-2488",
    title: "Session Timing Leak",
    file: "src/auth/session.ts",
    cwe: "CWE-208",
    riskScoreInitial: 78,
    riskScoreFixed: 6,
    riskTierInitial: "High",
    vulnerableLineIdx: 3,
    initialLines: [
      { lineNum: "05", text: "import { createHmac, timingSafeEqual } from 'crypto';" },
      { lineNum: "06", text: "" },
      { lineNum: "07", text: "export function verifySessionToken(token: string, session: Session) {" },
      { lineNum: "08", text: "  if (token === session.signature) {", isTarget: true },
      { lineNum: "09", text: "    return true;" },
      { lineNum: "10", text: "  }" },
      { lineNum: "11", text: "}" },
    ],
    removedLine: { lineNum: "08 -", text: "  if (token === session.signature) {" },
    addedLine: {
      lineNum: "08 +",
      text: "  if (timingSafeEqual(Buffer.from(token), Buffer.from(session.signature))) {",
    },
    findingTitle: "Side-Channel Timing Leak Detected",
    findingExplanation:
      "Direct equality operator `===` terminates on the first mismatching byte, enabling remote statistical token reconstruction.",
    fixExplanation:
      "Replaced with constant-time buffer comparison via timingSafeEqual to eliminate byte-by-byte timing variation.",
  },
  {
    id: "secret-leak",
    ticket: "ENG-2380",
    title: "AWS Access Key Leak",
    file: "src/server/storage.ts",
    cwe: "CWE-798",
    riskScoreInitial: 94,
    riskScoreFixed: 4,
    riskTierInitial: "Critical",
    vulnerableLineIdx: 3,
    initialLines: [
      { lineNum: "12", text: "import { S3Client } from '@aws-sdk/client-s3';" },
      { lineNum: "13", text: "" },
      { lineNum: "14", text: "export const s3 = new S3Client({" },
      { lineNum: "15", text: '  accessKeyId: "AKIAIOSFODNN7EXAMPLE",', isTarget: true },
      { lineNum: "16", text: '  region: "us-east-1"', },
      { lineNum: "17", text: "});" },
    ],
    removedLine: { lineNum: "15 -", text: '  accessKeyId: "AKIAIOSFODNN7EXAMPLE",' },
    addedLine: { lineNum: "15 +", text: "  accessKeyId: process.env.AWS_ACCESS_KEY_ID!," },
    findingTitle: "Plaintext AWS Access Key Exposed",
    findingExplanation:
      "20-character AWS identity key detected in repository diff hunk matching pattern `AKIA[0-9A-Z]{16}`.",
    fixExplanation:
      "Injected runtime environment variable binding to prevent immediate infrastructure compromise.",
  },
  {
    id: "sql-injection",
    ticket: "ENG-2039",
    title: "Raw SQL Interpolation",
    file: "src/routes/repos.ts",
    cwe: "CWE-89",
    riskScoreInitial: 68,
    riskScoreFixed: 8,
    riskTierInitial: "Medium",
    vulnerableLineIdx: 2,
    initialLines: [
      { lineNum: "40", text: "export async function getRepositoryById(req, res) {" },
      { lineNum: "41", text: "  const { repoId } = req.params;" },
      { lineNum: "42", text: "  const query = `SELECT * FROM repos WHERE id = '${repoId}'`;", isTarget: true },
      { lineNum: "43", text: "  return await db.execute(query);" },
      { lineNum: "44", text: "}" },
    ],
    removedLine: { lineNum: "42 -", text: "  const query = `SELECT * FROM repos WHERE id = '${repoId}'`;" },
    addedLine: { lineNum: "42 +", text: '  const query = "SELECT * FROM repos WHERE id = $1";' },
    findingTitle: "Unsanitized Template String in SQL Query",
    findingExplanation:
      "Direct string concatenation with untrusted request parameter `repoId` allows arbitrary SQL execution.",
    fixExplanation:
      "Converted query to parameterized positional binding with `$1` bound as literal value.",
  },
];

export function AnimatedCodeScanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stage, setStage] = useState<"SCANNING" | "DETECTED" | "REMEDIATED">("SCANNING");
  const [progress, setProgress] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);

  const activeScenario = SCENARIOS[selectedScenarioIdx]!;

  // Trigger and synchronize simulation when user scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
        } else {
          setIsInView(false);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Smooth cinematic timeline driven by clean timers & continuous progress
  useEffect(() => {
    if (!isPlaying || !isInView) return;

    setProgress(0);
    setStage("SCANNING");
    let isCancelled = false;

    // Smoothly kick off scanning progress bar to 35%
    const p1 = setTimeout(() => {
      if (!isCancelled) setProgress(35);
    }, 40);

    // Phase 1: SCANNING (1800ms)
    const scanTimer = setTimeout(() => {
      if (isCancelled) return;
      setStage("DETECTED");
      setProgress(70);

      // Phase 2: DETECTED (2200ms)
      const detectTimer = setTimeout(() => {
        if (isCancelled) return;
        setStage("REMEDIATED");
        setProgress(100);

        // Phase 3: REMEDIATED (4000ms), then advance to next scenario
        const nextTimer = setTimeout(() => {
          if (isCancelled) return;
          setSelectedScenarioIdx((curr) => (curr + 1) % SCENARIOS.length);
          setCycleKey((k) => k + 1);
        }, 4000);

        return () => clearTimeout(nextTimer);
      }, 2200);

      return () => clearTimeout(detectTimer);
    }, 1800);

    return () => {
      isCancelled = true;
      clearTimeout(p1);
      clearTimeout(scanTimer);
    };
  }, [selectedScenarioIdx, isPlaying, cycleKey, isInView]);

  const handleSelectScenario = (idx: number) => {
    setSelectedScenarioIdx(idx);
    setCycleKey((k) => k + 1);
  };

  const handleReset = () => {
    setCycleKey((k) => k + 1);
  };

  const isScanning = stage === "SCANNING";
  const isDetected = stage === "DETECTED";
  const isFixed = stage === "REMEDIATED";

  const currentRiskScore = isFixed
    ? activeScenario.riskScoreFixed
    : activeScenario.riskScoreInitial;

  return (
    <div
      ref={containerRef}
      className="w-full border-y border-white/[0.08] bg-[#090a0d] p-6 sm:p-10 relative overflow-hidden linear-preview-fade-bottom"
    >
      {/* Background black radial fade to blend in */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#08090a_100%)] pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-20" />

      <div className="relative z-0 space-y-6">
        {/* Top Control Bar: Scenario Pills + Playback Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-white" />
            <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
              Automated Diff Scanner &amp; Remediation Simulation
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scenario Selector Pills */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              {SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(idx)}
                  className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                    selectedScenarioIdx === idx
                      ? "bg-white text-black font-semibold shadow-xs"
                      : "bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]"
                  }`}
                >
                  <span>{sc.ticket}</span>
                </button>
              ))}
            </div>

            {/* Play/Pause & Reset */}
            <div className="flex items-center gap-1 border-l border-white/[0.08] pl-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={isPlaying ? "Pause simulation" : "Play simulation"}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Restart simulation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Split: Animated Editor on Left, Real-Time Telemetry on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Animated Code Editor with Laser Sweep & In-Place Hunk Replacement */}
          <div className="lg:col-span-7 border border-white/[0.08] bg-[#07080a] relative overflow-hidden font-mono text-xs">
            {/* Window Title Bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5 bg-white/[0.02] text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-white font-medium">{activeScenario.file}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-neutral-500 font-mono">
                  {isScanning && "Scanning AST hunks..."}
                  {isDetected && "Flaw detected"}
                  {isFixed && "Verified safe commit"}
                </span>
                <span
                  className={`h-2 w-2 rounded-full transition-colors duration-500 ${
                    isFixed
                      ? "bg-emerald-400"
                      : isDetected
                      ? "bg-rose-400 animate-pulse"
                      : "bg-white/70 animate-pulse"
                  }`}
                />
              </div>
            </div>

            {/* Code Body with Real-Time Scanning Beam */}
            <div className="p-5 leading-relaxed relative select-none min-h-[260px] flex flex-col justify-center">
              
              {/* Laser Scanning Beam (Visible only during scanning phase) */}
              {isScanning && (
                <div
                  className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none shadow-[0_0_12px_rgba(255,255,255,0.8)] z-30 animate-scanline"
                />
              )}

              {/* Code Lines Rendering */}
              <div className="space-y-1.5 font-mono text-xs">
                {activeScenario.initialLines.map((line, idx) => {
                  const isTargetLine = idx === activeScenario.vulnerableLineIdx;

                  // Normal lines before or after target
                  if (!isTargetLine) {
                    return (
                      <div key={idx} className="flex items-center text-neutral-400 min-h-[1.5rem]">
                        <span className="w-8 shrink-0 select-none text-neutral-600 text-right pr-3 text-[11px]">
                          {line.lineNum}
                        </span>
                        <span className="text-neutral-300 whitespace-pre">{line.text}</span>
                      </div>
                    );
                  }

                  // Target Vulnerable Line: State-dependent rendering
                  if (isFixed) {
                    // Applied Diff State: Deleted line red, Added line green
                    return (
                      <div key={idx} className="space-y-1 my-1">
                        <div className="flex items-center bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border-l-2 border-rose-500/60 transition-all duration-500 min-h-[1.5rem]">
                          <span className="w-10 shrink-0 select-none text-rose-400/70 text-right pr-3 text-[11px]">
                            {activeScenario.removedLine.lineNum}
                          </span>
                          <span className="whitespace-pre">{activeScenario.removedLine.text}</span>
                        </div>
                        <div className="flex items-center bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border-l-2 border-emerald-500/60 transition-all duration-500 min-h-[1.5rem]">
                          <span className="w-10 shrink-0 select-none text-emerald-400/70 text-right pr-3 text-[11px]">
                            {activeScenario.addedLine.lineNum}
                          </span>
                          <span className="whitespace-pre font-semibold">{activeScenario.addedLine.text}</span>
                        </div>
                      </div>
                    );
                  }

                  if (isDetected) {
                    // Flaw Detected State: Glowing red highlight with inline alert
                    return (
                      <div
                        key={idx}
                        className="my-1 py-1 px-2 rounded bg-rose-500/15 border border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)] flex flex-col gap-1 transition-all duration-500 min-h-[1.5rem]"
                      >
                        <div className="flex items-center justify-between text-rose-300">
                          <div className="flex items-center">
                            <span className="w-8 shrink-0 select-none text-rose-400 text-right pr-3 text-[11px]">
                              {line.lineNum}
                            </span>
                            <span className="whitespace-pre font-semibold">{line.text}</span>
                          </div>
                          <span className="text-[10px] font-sans uppercase font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">
                            {activeScenario.cwe}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Default Unscanned State
                  return (
                    <div key={idx} className="flex items-center text-neutral-300 min-h-[1.5rem]">
                      <span className="w-8 shrink-0 select-none text-neutral-600 text-right pr-3 text-[11px]">
                        {line.lineNum}
                      </span>
                      <span className="whitespace-pre">{line.text}</span>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Bottom Progress Bar */}
            <div className="h-0.5 bg-white/[0.04] w-full overflow-hidden">
              <div
                className={`h-full transition-all ease-linear ${
                  isFixed
                    ? "bg-emerald-400 duration-700"
                    : isDetected
                    ? "bg-rose-400 duration-[2200ms]"
                    : "bg-white/80 duration-[1800ms]"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Right: Real-Time Dynamic Telemetry & Risk Scoring Panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Header Telemetry Pill */}
            <div className="flex items-center justify-between text-xs font-mono border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{activeScenario.ticket}</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-400">{activeScenario.title}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  isFixed
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : activeScenario.riskTierInitial === "Critical"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}
              >
                {isFixed ? "PASSED (LOW)" : `${activeScenario.riskTierInitial.toUpperCase()} RISK`}
              </span>
            </div>

            {/* Dynamic Risk Gauge Bar */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Calculated Composite Risk:</span>
                <span className={`font-bold transition-all duration-500 ${isFixed ? "text-emerald-400" : "text-white"}`}>
                  {currentRiskScore} / 100
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    currentRiskScore > 75
                      ? "bg-rose-400"
                      : currentRiskScore > 40
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                  style={{ width: `${currentRiskScore}%` }}
                />
              </div>
            </div>

            {/* Dynamic Detection State Callout */}
            <div className="space-y-3 pt-2">
              {isScanning && (
                <div className="border-l-2 border-l-white/40 bg-white/[0.02] pl-4 py-3 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Cpu className="h-3.5 w-3.5 text-neutral-400 animate-spin" />
                    <span>In-Process AST Scanner Active</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] font-sans">
                    Inspecting syntax tree nodes and regex boundaries before invoking LLM fallbacks...
                  </p>
                </div>
              )}

              {isDetected && (
                <div className="border-l-2 border-l-rose-400 bg-rose-500/[0.04] pl-4 py-3 space-y-2 text-xs transition-opacity duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>{activeScenario.findingTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">
                      {activeScenario.cwe}
                    </span>
                  </div>
                  <p className="text-neutral-300 text-[11px] font-sans leading-relaxed">
                    {activeScenario.findingExplanation}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
                    <GitCommit className="h-3 w-3" />
                    <span>Triggering verified AST hunk synthesis...</span>
                  </div>
                </div>
              )}

              {isFixed && (
                <div className="border-l-2 border-l-emerald-400 bg-emerald-500/[0.04] pl-4 py-3 space-y-2 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Deterministic Remediation Applied</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      VERIFIED AST
                    </span>
                  </div>
                  <p className="text-neutral-300 text-[11px] font-sans leading-relaxed">
                    {activeScenario.fixExplanation}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-neutral-400 border-t border-white/[0.04]">
                    <span>Commit SHA: 4f98a12 (Branch: {activeScenario.ticket})</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Status: Passed
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Interactive Replay Action */}
            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>9-Stage Deterministic Pipeline</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Replay detection sequence</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
