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
} from "lucide-react";

export function LinearProductSections() {
  // Section 1: Diff & PR State
  const [selectedPR, setSelectedPR] = useState<number>(184);
  const [fixCommitted, setFixCommitted] = useState<boolean>(false);
  const [activeFeature1, setActiveFeature1] = useState<string>("diffs");

  // Section 2: AI Multi-Card State
  const [selectedAgent, setSelectedAgent] = useState<"buggers" | "claude" | "gpt4o" | "gemini">("buggers");

  // Section 3: Risk Simulator State
  const [churnLines, setChurnLines] = useState<number>(340);
  const [entropyVal, setEntropyVal] = useState<number>(0.75);
  const [authorCommits, setAuthorCommits] = useState<number>(12);
  const [touchesAuth, setTouchesAuth] = useState<boolean>(true);

  // Compute live mathematical score
  const churnPts = Math.round(100 * (1 - Math.exp(-churnLines / 350)) * 0.20);
  const entropyPts = Math.round(entropyVal * 100 * 0.15);
  const authorPts = Math.round(100 * (1 - Math.min(50, authorCommits) / 50) * 0.15);
  const authPts = touchesAuth ? 20 : 0;
  const baseScore = Math.min(100, Math.round(churnPts + entropyPts + authorPts + authPts + 15));
  const tierInfo =
    baseScore >= 75
      ? { label: "CRITICAL", badge: "text-rose-400 bg-rose-500/10 border-rose-500/30" }
      : baseScore >= 50
      ? { label: "HIGH", badge: "text-amber-400 bg-amber-500/10 border-amber-500/30" }
      : baseScore >= 25
      ? { label: "MEDIUM", badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" }
      : { label: "LOW", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };

  // Section 4: Quality Gate State
  const [gateThreshold, setGateThreshold] = useState<number>(50);
  const gatePassed = baseScore <= gateThreshold;

  return (
    <div className="w-full space-y-36">

      {/* ================================================================ */}
      {/* SECTION 1: Build, review, and ship */}
      {/* ================================================================ */}
      <section id="build-review-ship" className="w-full space-y-8">
        {/* Split Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-4">
          <div className="md:col-span-7">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-[1.1]">
              Build, review, and ship
            </h2>
          </div>
          <div className="md:col-span-5 space-y-2">
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
              Streamline code reviews with clear diffs, whole-repo defect churn context, and fewer noisy back-and-forth comments. Keep PRs moving without sacrificing quality.
            </p>
            <a
              href="#risk-engine"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group"
            >
              <span>Explore triage architecture</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Massive Elevated Product Preview Canvas */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0c0d10] p-4 sm:p-8 lg:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left PR List Column (Linear issue style) */}
            <div className="lg:col-span-5 space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="text-[11px] text-neutral-500 font-semibold px-2 py-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>In Review (3)</span>
                  </span>
                  <span>Active Queue</span>
                </div>

                {/* PR Item 1 */}
                <div
                  onClick={() => setSelectedPR(184)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPR === 184
                      ? "bg-white/[0.07] border-white/20 text-white shadow-lg"
                      : "bg-white/[0.02] border-white/[0.04] text-neutral-400 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">ENG-2488</span>
                    <span className="text-[10px] text-amber-400 font-medium">Risk: 78 (High)</span>
                  </div>
                  <div className="text-xs text-neutral-200 mt-1 truncate">
                    Replace session signature check with timing-safe comparison
                  </div>
                </div>

                {/* PR Item 2 */}
                <div
                  onClick={() => setSelectedPR(142)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPR === 142
                      ? "bg-white/[0.07] border-white/20 text-white shadow-lg"
                      : "bg-white/[0.02] border-white/[0.04] text-neutral-400 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">ENG-2380</span>
                    <span className="text-[10px] text-rose-400 font-medium">Secrets: 1 Flagged</span>
                  </div>
                  <div className="text-xs text-neutral-200 mt-1 truncate">
                    Fix S3 client upload credentials leak in storage.ts
                  </div>
                </div>

                {/* PR Item 3 */}
                <div
                  onClick={() => setSelectedPR(139)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPR === 139
                      ? "bg-white/[0.07] border-white/20 text-white shadow-lg"
                      : "bg-white/[0.02] border-white/[0.04] text-neutral-400 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">ENG-2039</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Risk: 18 (Low)</span>
                  </div>
                  <div className="text-xs text-neutral-200 mt-1 truncate">
                    Pass sync status to the dashboard and sanitize inputs
                  </div>
                </div>
              </div>
            </div>

            {/* Right IDE Diff Editor Window */}
            <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#07080a] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono">
                <span className="text-neutral-400">src/auth/session.ts</span>
                <span className="text-neutral-500">PR #{selectedPR} Unified Diff</span>
              </div>

              {/* Code Lines with Syntax Styling */}
              <div className="font-mono text-xs leading-relaxed space-y-0.5 select-none">
                <div className="text-neutral-600">05  import &#123; createHmac, timingSafeEqual &#125; from 'crypto';</div>
                <div className="text-neutral-600">06  </div>
                <div className="text-neutral-500">07  export function verifySessionToken(token: string, session: Session) &#123;</div>
                <div className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded flex items-center justify-between">
                  <span>08 -   if (token === session.signature) &#123;</span>
                  <span className="text-[10px] font-sans text-rose-400/80">Timing flaw</span>
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded flex items-center justify-between">
                  <span>09 +   if (timingSafeEqual(Buffer.from(token), Buffer.from(session.signature))) &#123;</span>
                  <span className="text-[10px] font-sans text-emerald-400/80">Constant-time</span>
                </div>
                <div className="text-neutral-500">10        return true;</div>
                <div className="text-neutral-500">11      &#125;</div>
              </div>

              {/* Floating Buggers Bot Comment & Action Button */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-medium text-white">Buggers Review Bot</span>
                    <span className="text-[10px] font-mono text-neutral-400">98% Confidence</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase">CWE-208</span>
                </div>
                <p className="text-xs text-neutral-300 leading-normal">
                  Direct equality operator <code className="text-white bg-black/40 px-1 py-0.5 rounded font-mono">===</code> leaks execution time through early byte mismatch termination. Constant-time comparison prevents side-channel token recovery.
                </p>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setFixCommitted(!fixCommitted)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      fixCommitted
                        ? "bg-emerald-500 text-black font-semibold"
                        : "bg-white text-black hover:bg-neutral-200"
                    }`}
                  >
                    {fixCommitted ? (
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

        {/* Bottom Feature Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-mono text-neutral-500 border-b border-white/[0.06] pb-6">
          <span className="uppercase tracking-wider text-neutral-400 font-semibold">Features</span>
          <div className="flex flex-wrap items-center gap-3 text-neutral-300">
            <span className="hover:text-white cursor-pointer transition-colors">AST Diffs +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Guided Reviews +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Inline Fixes +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Git Automations +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Commit Statuses +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Releases +</span>
          </div>
        </div>
      </section>


      {/* ================================================================ */}
      {/* SECTION 2: AI and automations */}
      {/* ================================================================ */}
      <section id="ai-automations" className="w-full space-y-8">
        {/* Split Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-4">
          <div className="md:col-span-7">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-[1.1]">
              AI and automations
            </h2>
          </div>
          <div className="md:col-span-5 space-y-2">
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
              Build and deploy multi-provider fallback chains that triage diffs alongside deterministic scanners. Inspect AST changes together or delegate routine syntax fixes end-to-end.
            </p>
            <a
              href="#pipeline"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group"
            >
              <span>View pipeline specifications</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Multi-Card Agent Execution Deck */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0c0d10] p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Agent Card 1: Buggers Primary Triager */}
            <div
              onClick={() => setSelectedAgent("buggers")}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-6 cursor-pointer transition-all ${
                selectedAgent === "buggers"
                  ? "bg-[#14151b] border-amber-500/40 ring-1 ring-amber-500/20"
                  : "bg-[#0f1014] border-white/[0.06] hover:bg-[#121318]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-white">Buggers Triage</span>
                  <span className="text-emerald-400 text-[10px]">Active</span>
                </div>
                <div className="rounded-lg bg-black/50 p-2.5 text-xs text-neutral-300 font-mono">
                  add retry handling for transient database connection drops
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  Thinking... Evaluated commit against 9-stage AST pipeline in 140ms.
                </div>
              </div>
              <div className="text-[11px] font-mono text-amber-400 flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <span>Stage 6 / 9</span>
                <span>00:07</span>
              </div>
            </div>

            {/* Agent Card 2: Claude 3.5 Sonnet */}
            <div
              onClick={() => setSelectedAgent("claude")}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-6 cursor-pointer transition-all ${
                selectedAgent === "claude"
                  ? "bg-[#14151b] border-amber-500/40 ring-1 ring-amber-500/20"
                  : "bg-[#0f1014] border-white/[0.06] hover:bg-[#121318]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-white">Claude 3.5</span>
                  <span className="text-neutral-500 text-[10px]">Primary AI</span>
                </div>
                <div className="rounded-lg bg-black/50 p-2.5 text-xs text-neutral-300 font-mono">
                  Synthesize deep architecture refactoring advice on API routes
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  Worked for 1.4s &gt; Generated verified diff hunk for session.ts.
                </div>
              </div>
              <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <span>2,410 tokens</span>
                <span>$0.007</span>
              </div>
            </div>

            {/* Agent Card 3: OpenAI GPT-4o */}
            <div
              onClick={() => setSelectedAgent("gpt4o")}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-6 cursor-pointer transition-all ${
                selectedAgent === "gpt4o"
                  ? "bg-[#14151b] border-amber-500/40 ring-1 ring-amber-500/20"
                  : "bg-[#0f1014] border-white/[0.06] hover:bg-[#121318]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-white">GPT-4o</span>
                  <span className="text-neutral-500 text-[10px]">Fallback 1</span>
                </div>
                <div className="rounded-lg bg-black/50 p-2.5 text-xs text-neutral-300 font-mono">
                  Execute secondary verification on complex regex vulnerability
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  Ready in standby pool if primary provider times out.
                </div>
              </div>
              <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <span>Automatic</span>
                <span>&lt;200ms failover</span>
              </div>
            </div>

            {/* Agent Card 4: Gemini 2.0 Flash */}
            <div
              onClick={() => setSelectedAgent("gemini")}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-6 cursor-pointer transition-all ${
                selectedAgent === "gemini"
                  ? "bg-[#14151b] border-amber-500/40 ring-1 ring-amber-500/20"
                  : "bg-[#0f1014] border-white/[0.06] hover:bg-[#121318]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-white">Gemini Flash</span>
                  <span className="text-neutral-500 text-[10px]">Fallback 2</span>
                </div>
                <div className="rounded-lg bg-black/50 p-2.5 text-xs text-neutral-300 font-mono">
                  Zero-downtime high-throughput emergency triage fallback
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  100% test coverage passed in continuous benchmark harness.
                </div>
              </div>
              <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <span>Free tier</span>
                <span>Fast stream</span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Feature Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-mono text-neutral-500 border-b border-white/[0.06] pb-6">
          <span className="uppercase tracking-wider text-neutral-400 font-semibold">Features</span>
          <div className="flex flex-wrap items-center gap-3 text-neutral-300">
            <span className="hover:text-white cursor-pointer transition-colors">Diff Cache +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Heartbeat Leases +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Provider Fallbacks +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Token Caps +</span>
            <span className="hover:text-white cursor-pointer transition-colors">In-Process Reaper +</span>
          </div>
        </div>
      </section>


      {/* ================================================================ */}
      {/* SECTION 3: Planning and monitoring (Risk Engine 1.1.0) */}
      {/* ================================================================ */}
      <section id="planning-monitoring" className="w-full space-y-8">
        {/* Split Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-4">
          <div className="md:col-span-7">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-[1.1]">
              Planning and monitoring
            </h2>
          </div>
          <div className="md:col-span-5 space-y-2">
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
              Calculate multi-dimensional risk scores (0–100) before merging. Align your team with saturating churn curves, historical fault lines, and regression probability.
            </p>
            <a
              href="#risk-engine"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group"
            >
              <span>Explore mathematical formula</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Split Canvas: Live Simulator on Left + Distribution on Right */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0c0d10] p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Interactive Sliders */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-mono font-medium text-white">
                  Risk Engine 1.1.0 Interactive Simulator
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${tierInfo.badge}`}>
                  {tierInfo.label} ({baseScore}/100)
                </span>
              </div>

              {/* Sliders */}
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-400">
                    <span>Lines Churned</span>
                    <span className="text-white font-semibold">{churnLines} lines (+{churnPts} pts)</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="800"
                    step="20"
                    value={churnLines}
                    onChange={(e) => setChurnLines(Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-400">
                    <span>Shannon Diffusion Entropy</span>
                    <span className="text-white font-semibold">{entropyVal.toFixed(2)} (+{entropyPts} pts)</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="1.00"
                    step="0.05"
                    value={entropyVal}
                    onChange={(e) => setEntropyVal(Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-400">
                    <span>Author Prior Commits in Repo</span>
                    <span className="text-white font-semibold">{authorCommits} commits (+{authorPts} pts)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={authorCommits}
                    onChange={(e) => setAuthorCommits(Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <span className="text-neutral-400">Touches Critical Auth/DB Files</span>
                  <button
                    type="button"
                    onClick={() => setTouchesAuth(!touchesAuth)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      touchesAuth ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-white/10 text-neutral-400"
                    }`}
                  >
                    {touchesAuth ? "Yes (+20 pts)" : "No (+0 pts)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Scatter Distribution Chart */}
            <div className="lg:col-span-6 rounded-xl border border-white/[0.08] bg-[#07080a] p-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/[0.06] pb-3">
                <span>Cycle Risk Distribution (100 Pull Requests)</span>
                <span className="text-amber-400">Threshold: {gateThreshold}</span>
              </div>

              {/* Scatter Points Canvas Simulation */}
              <div className="h-48 w-full relative flex items-end justify-between px-2 pt-6">
                {/* Horizontal Critical Band */}
                <div className="absolute inset-x-0 top-10 border-b border-rose-500/30 border-dashed" />
                <span className="absolute right-2 top-6 text-[10px] font-mono text-rose-400">Critical (&gt;75)</span>

                {/* Horizontal Gate Threshold Line */}
                <div
                  className="absolute inset-x-0 border-b border-amber-400/50"
                  style={{ bottom: `${gateThreshold}%` }}
                />

                {/* Data points */}
                {[
                  12, 18, 24, 30, 22, 16, 45, 52, 68, 79, 84, 32, 28, 19, 41, 58, 62, 74, 88, 35, 29, 14, 21,
                  47, 53, 31, 26, 17, 82, 37,
                ].map((val, idx) => {
                  const isBlocked = val > gateThreshold;
                  return (
                    <div
                      key={idx}
                      className="group relative flex flex-col items-center"
                      style={{ height: `${val}%` }}
                    >
                      <div
                        className={`h-2 w-2 rounded-full transition-transform group-hover:scale-150 ${
                          isBlocked ? "bg-rose-400 shadow-rose-500/50 shadow-sm" : "bg-emerald-400/80"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-white/[0.04]">
                <span>Oct 2026 Sprint</span>
                <span className="text-neutral-400">24/30 Merged Safely (80%)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Feature Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-mono text-neutral-500 border-b border-white/[0.06] pb-6">
          <span className="uppercase tracking-wider text-neutral-400 font-semibold">Features</span>
          <div className="flex flex-wrap items-center gap-3 text-neutral-300">
            <span className="hover:text-white cursor-pointer transition-colors">Risk Model 1.1.0 +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Shannon Entropy +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Saturating Curves +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Defect Churn +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Signal Calibration +</span>
          </div>
        </div>
      </section>


      {/* ================================================================ */}
      {/* SECTION 4: Intake and integrations */}
      {/* ================================================================ */}
      <section id="intake-integrations" className="w-full space-y-8">
        {/* Split Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-4">
          <div className="md:col-span-7">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-[1.1]">
              Intake and integrations
            </h2>
          </div>
          <div className="md:col-span-5 space-y-2">
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
              Automatically turn pull request webhooks and security findings into real-time team alerts across Slack, Discord, and GitHub Commit Status Checks.
            </p>
            <a
              href="#api"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors group"
            >
              <span>Explore webhook reference</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Split Canvas: Real-time notification thread on Left + Policy on Right */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0c0d10] p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.85)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Slack/Discord Alert Thread */}
            <div className="lg:col-span-6 rounded-xl border border-white/[0.08] bg-[#07080a] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>#security-deploy-alerts</span>
                </div>
                <span>Slack &amp; Discord Webhook</span>
              </div>

              {/* Message Thread */}
              <div className="space-y-3 text-xs">
                {/* Message 1 */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <div className="h-7 w-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    L
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">lena</span>
                      <span className="text-[10px] text-neutral-500">10:59 AM</span>
                    </div>
                    <p className="text-neutral-300">
                      PR #184 opened for session auth refactoring. Did Buggers run the security check?
                    </p>
                  </div>
                </div>

                {/* Buggers Webhook Alert Card */}
                <div className="ml-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.04] space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-semibold text-rose-400">Buggers Quality Gate: FAILED</span>
                    <span className="text-[10px] text-neutral-400">11:00 AM</span>
                  </div>
                  <p className="text-xs text-neutral-200">
                    Commit <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">4f98a12</code> on <code className="text-white font-mono">acme/api</code> exceeded risk policy threshold:
                  </p>
                  <ul className="text-[11px] font-mono text-neutral-300 space-y-1 list-disc list-inside">
                    <li>Risk score: 78 &gt; 50 threshold</li>
                    <li>OWASP A02:2021 timing attack in session.ts:42</li>
                    <li>GitHub commit status set to <strong className="text-rose-400">action_required</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Interactive Quality Gate Policy Control */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-mono font-medium text-white">
                  Active Policy Enforcement (.buggers.yml)
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${gatePassed ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-rose-400 bg-rose-500/10 border-rose-500/30"}`}>
                  {gatePassed ? "CHECKS PASSED" : "MERGE BLOCKED"}
                </span>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-400">
                    <span>Repository Maximum Allowable Risk Threshold</span>
                    <span className="text-white font-semibold">{gateThreshold} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    step="5"
                    value={gateThreshold}
                    onChange={(e) => setGateThreshold(Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-lg bg-[#07080a] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">GitHub Status Context</span>
                    <span className="text-white font-mono">buggers/quality-gate</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">Block on Plaintext Secrets</span>
                    <span className="text-emerald-400">Strict Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">Required Test Churn Ratio</span>
                    <span className="text-amber-400">&ge; 20%</span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-500 leading-relaxed">
                  Evaluated in 140ms on incoming webhook. Signed via HMAC-SHA256 with constant-time timing-safe digest verification.
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Feature Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-mono text-neutral-500 border-b border-white/[0.06] pb-6">
          <span className="uppercase tracking-wider text-neutral-400 font-semibold">Features</span>
          <div className="flex flex-wrap items-center gap-3 text-neutral-300">
            <span className="hover:text-white cursor-pointer transition-colors">Slack Webhooks +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Discord Embeds +</span>
            <span className="hover:text-white cursor-pointer transition-colors">GitHub Status Checks +</span>
            <span className="hover:text-white cursor-pointer transition-colors">HMAC Verification +</span>
            <span className="hover:text-white cursor-pointer transition-colors">Branch Policies +</span>
          </div>
        </div>
      </section>

    </div>
  );
}
