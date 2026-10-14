import { useState } from "react";
import {
  Check,
  CheckCircle2,
  GitPullRequest,
  Shield,
  ShieldAlert,
  Sparkles,
  Sliders,
  Terminal,
  Paperclip,
  ArrowUp,
  Cpu,
  Lock,
  ChevronDown,
} from "lucide-react";

export function LinearFeaturePreview() {
  // Quadrant 1 state: Inline fix applied
  const [fixApplied, setFixApplied] = useState(false);
  const [q1Tab, setQ1Tab] = useState<"comment" | "update">("update");

  // Quadrant 3 state: Live mini-risk calculator
  const [churn, setChurn] = useState(280);
  const [entropy, setEntropy] = useState(0.72);
  const [hasCriticalFile, setHasCriticalFile] = useState(true);

  // Calculate live score
  const churnScore = Math.min(100, Math.round((churn / 500) * 45));
  const entropyScore = Math.round(entropy * 30);
  const criticalScore = hasCriticalFile ? 25 : 0;
  const liveScore = Math.min(100, churnScore + entropyScore + criticalScore);
  const liveTier =
    liveScore >= 75
      ? { label: "CRITICAL", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" }
      : liveScore >= 50
      ? { label: "HIGH", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" }
      : liveScore >= 25
      ? { label: "MEDIUM", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" }
      : { label: "LOW", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };

  // Quadrant 4 state: Scanner selection
  const [selectedScanner, setSelectedScanner] = useState<"secrets" | "sql" | "path" | "cors">("secrets");

  return (
    <div className="w-full my-12">
      {/* 2x2 Showcase Grid with Hairline Dividers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border border-white/[0.08] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] rounded-2xl overflow-hidden bg-[#0a0b0e]">
        
        {/* ============================================================== */}
        {/* QUADRANT 1: Draft PR Reviews & Inline Fixes */}
        {/* ============================================================== */}
        <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-gradient-to-b from-[#0c0d11] to-[#090a0d] border-b lg:border-b-0 border-white/[0.08]">
          {/* Top Preview Canvas */}
          <div className="min-h-[300px] sm:min-h-[340px] flex items-center justify-center w-full">
            <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#121316] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-4">
              {/* Header Pills */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQ1Tab("comment")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      q1Tab === "comment" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Comment
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ1Tab("update")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      q1Tab === "update" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Update
                  </button>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>On track</span>
                </div>
              </div>

              {/* Code Diff Box */}
              <div className="rounded-lg bg-black/60 border border-white/[0.06] p-3 text-xs font-mono text-neutral-300 space-y-1">
                <div className="text-[11px] text-neutral-500 flex items-center justify-between">
                  <span>src/auth/session.ts:42</span>
                  <span className="text-amber-400/90 font-medium">OWASP A02:2021</span>
                </div>
                <div className="text-rose-400/90 bg-rose-500/10 px-1 py-0.5 rounded text-[11px] truncate">
                  - if (token === session.signature) &#123;
                </div>
                <div className="text-emerald-400/90 bg-emerald-500/10 px-1 py-0.5 rounded text-[11px] truncate">
                  + if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(session.signature))) &#123;
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-neutral-500">Verified against AST hunk</span>
                <button
                  type="button"
                  onClick={() => setFixApplied(!fixApplied)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    fixApplied
                      ? "bg-emerald-500 text-black font-semibold"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                  }`}
                >
                  {fixApplied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Committed to Branch</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>Apply Fix to Branch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Editorial */}
          <div className="pt-8 space-y-2">
            <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-white">
              Draft project updates &amp; inline fixes
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed max-w-md">
              Summarize AST diff changes, regression risks, and security flaws into precise inline review comments your team can review, test, and commit with one click.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUADRANT 2: Plan & Execute Merge Quality Gates */}
        {/* ============================================================== */}
        <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-gradient-to-b from-[#0c0d11] to-[#090a0d] border-b lg:border-b-0 border-white/[0.08]">
          {/* Top Preview Canvas */}
          <div className="min-h-[300px] sm:min-h-[340px] flex items-center justify-center w-full">
            <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#121316] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-xs font-mono font-medium text-neutral-300">
                  Plan the next cycle &amp; merge gate
                </span>
                <span className="text-[10px] font-mono text-neutral-500">.buggers.yml</span>
              </div>

              {/* Task card */}
              <div className="rounded-lg bg-black/40 border border-white/[0.06] p-3 space-y-1">
                <div className="text-xs text-neutral-200 font-medium">
                  Evaluate release gate on PR #142 for acme/api
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  Worked for 140ms &gt; Evaluated 3 blocking rules against commit 4f98a12
                </div>
              </div>

              {/* Gate Checks List */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">ENG-2521</span>
                    <span className="text-neutral-300">Risk score 34 &le; 45 threshold</span>
                  </div>
                  <span className="text-emerald-400 text-[11px]">Passed</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">ENG-2364</span>
                    <span className="text-neutral-300">Plaintext secrets detected: 0</span>
                  </div>
                  <span className="text-emerald-400 text-[11px]">Passed</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">ENG-2401</span>
                    <span className="text-neutral-300">Test churn ratio 0.38 &ge; 0.20</span>
                  </div>
                  <span className="text-emerald-400 text-[11px]">Passed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Editorial */}
          <div className="pt-8 space-y-2">
            <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-white">
              Plan the next cycle &amp; merge gates
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed max-w-md">
              Enforce declarative repository security policies via instant GitHub commit status checks, custom branch protection rules, and real-time team alerts.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUADRANT 3: Identify Pull Request Risks */}
        {/* ============================================================== */}
        <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-gradient-to-b from-[#0c0d11] to-[#090a0d]">
          {/* Top Preview Canvas */}
          <div className="min-h-[300px] sm:min-h-[340px] flex items-center justify-center w-full">
            <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#121316] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-neutral-300">
                  Identify project risks (Risk Engine 1.1.0)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${liveTier.color}`}>
                  {liveTier.label} ({liveScore}/100)
                </span>
              </div>

              {/* Search prompt box */}
              <div className="rounded-lg bg-black/50 border border-white/[0.06] p-2.5 text-xs text-neutral-300">
                what could delay the deployment or cause regressions?
              </div>

              {/* Context Tag */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400/90">
                <Sparkles className="h-3 w-3" />
                <span>8 signals evaluated with saturating curves</span>
              </div>

              {/* Interactive Micro-Sliders */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Lines Churned</span>
                    <span className="text-white">{churn} lines</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="800"
                    step="25"
                    value={churn}
                    onChange={(e) => setChurn(Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>File Diffusion Entropy</span>
                    <span className="text-white">{entropy.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="1.00"
                    step="0.05"
                    value={entropy}
                    onChange={(e) => setEntropy(Number(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                  <span className="text-neutral-400">Touches Critical Auth/DB Files</span>
                  <button
                    type="button"
                    onClick={() => setHasCriticalFile(!hasCriticalFile)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      hasCriticalFile ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-white/10 text-neutral-400"
                    }`}
                  >
                    {hasCriticalFile ? "Yes (+25 pts)" : "No (+0 pts)"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Editorial */}
          <div className="pt-8 space-y-2">
            <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-white">
              Identify project risks
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed max-w-md">
              Evaluate multi-dimensional risk signals including code churn velocity, Shannon entropy, core system file touches, and author familiarity before merging.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUADRANT 4: Pre-Execution Security & Plaintext Secret Scanners */}
        {/* ============================================================== */}
        <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-gradient-to-b from-[#0c0d11] to-[#090a0d] border-t lg:border-t-0 border-white/[0.08]">
          {/* Top Preview Canvas */}
          <div className="min-h-[300px] sm:min-h-[340px] flex items-center justify-center w-full">
            <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#121316] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-3">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                Pre-Execution Scanners
              </div>

              {/* Skills / Scanner Menu */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedScanner("secrets")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedScanner === "secrets" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Plaintext Credential Scanner (8 patterns)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Active</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScanner("sql")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedScanner === "sql" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                    <span>SQL &amp; Raw Query Injection</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">AST Check</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScanner("path")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedScanner === "path" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-blue-400" />
                    <span>Path Traversal &amp; SSRF Detection</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">Deterministic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScanner("cors")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedScanner === "cors" ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-purple-400" />
                    <span>Wildcard CORS &amp; Permissive Headers</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">Zero-Token</span>
                </button>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-neutral-300">
                  <span>Scanners</span>
                  <ChevronDown className="h-3 w-3 text-neutral-500" />
                </div>
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                  <span className="text-[11px] font-mono text-neutral-500">In-process AST</span>
                  <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center text-white">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Editorial */}
          <div className="pt-8 space-y-2">
            <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-white">
              Pre-execution security &amp; secret scanners
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed max-w-md">
              Block credential leaks and high-impact injection flaws before any LLM is invoked, saving token budget and catching zero-day mistakes deterministically.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
