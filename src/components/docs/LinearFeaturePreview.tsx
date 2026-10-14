import { useState } from "react";
import {
  ShieldAlert,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  FileCode2,
  Lock,
  ArrowRight,
  Terminal,
} from "lucide-react";

export function LinearFeaturePreview() {
  const [activeTab, setActiveTab] = useState<"triage" | "gate" | "churn" | "scanners">("triage");
  const [selectedScanner, setSelectedScanner] = useState<string>("secrets");

  return (
    <div className="my-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-amber-400 uppercase">
            Platform Capabilities
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Core Triage & Review Architecture
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500 hidden sm:inline-block">
          Interactive System Overview
        </span>
      </div>

      {/* 2x2 Feature Grid Inspired by Linear */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Grounded Pull Request Triage */}
        <div
          onClick={() => setActiveTab("triage")}
          className={`group rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
            activeTab === "triage"
              ? "bg-[#10131d] border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20"
              : "bg-[#0c0e15] border-white/10 hover:border-white/20 hover:bg-[#0f1118]"
          }`}
        >
          {/* Top Interactive Simulation Box */}
          <div className="rounded-xl border border-white/10 bg-[#07090e] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/10 text-slate-300">
                Finding #1
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/25">
                High Severity
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                98% Confidence
              </span>
            </div>

            <div className="rounded-lg bg-black/60 border border-white/5 p-3 text-xs font-mono text-slate-300 space-y-1">
              <div className="text-slate-400 text-[11px]">auth.server.ts:42</div>
              <div className="text-amber-200/90">
                Missing constant-time comparison in session signature verification
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-slate-500">Verified against diff hunk</span>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors border border-white/10"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Apply Fix to Branch</span>
              </button>
            </div>
          </div>

          {/* Bottom Descriptive Content */}
          <div className="pt-4 space-y-1">
            <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
              <span>Grounded Pull Request Triage</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesizes AST diff changes and defect churn history into exact inline remediations
              with mathematically verified diff line numbers.
            </p>
          </div>
        </div>

        {/* Card 2: Automated Merge Quality Gates */}
        <div
          onClick={() => setActiveTab("gate")}
          className={`group rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
            activeTab === "gate"
              ? "bg-[#10131d] border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20"
              : "bg-[#0c0e15] border-white/10 hover:border-white/20 hover:bg-[#0f1118]"
          }`}
        >
          {/* Top Interactive Simulation Box */}
          <div className="rounded-xl border border-white/10 bg-[#07090e] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Merge Quality Gate</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                All Passed
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-400">Score &le; 75 Threshold</span>
                <span className="text-emerald-400 font-semibold">42 / 100</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-400">Block on Plaintext Secrets</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 0 Leaks
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              Evaluated in 140ms &middot; GitHub Commit Status synced
            </div>
          </div>

          {/* Bottom Descriptive Content */}
          <div className="pt-4 space-y-1">
            <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
              <span>Automated Merge Quality Gates</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforces declarative repository security thresholds via instant GitHub commit status
              checks and real-time Slack/Discord alert dispatches.
            </p>
          </div>
        </div>

        {/* Card 3: Deterministic Churn Evaluation */}
        <div
          onClick={() => setActiveTab("churn")}
          className={`group rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
            activeTab === "churn"
              ? "bg-[#10131d] border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20"
              : "bg-[#0c0e15] border-white/10 hover:border-white/20 hover:bg-[#0f1118]"
          }`}
        >
          {/* Top Interactive Simulation Box */}
          <div className="rounded-xl border border-white/10 bg-[#07090e] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Historical Defect Density</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                90-day window
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>src/server/auth.ts</span>
                <span className="text-amber-300">18 commits</span>
              </div>
              <p className="text-[11px] text-slate-400">
                4 of 18 past commits are conventional reverts or bug fixes. Churn multiplier (2.0x) applied.
              </p>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              Youngest changed file inception: 34 days
            </div>
          </div>

          {/* Bottom Descriptive Content */}
          <div className="pt-4 space-y-1">
            <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
              <span>Deterministic Churn Evaluation</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Weighs actual commit frequency, rollback history, and file inception age to
              differentiate high-risk fault lines from stable code modules.
            </p>
          </div>
        </div>

        {/* Card 4: Full-Spectrum Vulnerability Scanners */}
        <div
          onClick={() => setActiveTab("scanners")}
          className={`group rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
            activeTab === "scanners"
              ? "bg-[#10131d] border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20"
              : "bg-[#0c0e15] border-white/10 hover:border-white/20 hover:bg-[#0f1118]"
          }`}
        >
          {/* Top Interactive Simulation Box */}
          <div className="rounded-xl border border-white/10 bg-[#07090e] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Active Static Scanners</span>
              <span className="text-[10px] font-mono text-slate-400">Deterministic</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedScanner("secrets");
                }}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  selectedScanner === "secrets"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    : "bg-black/40 border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                Secrets (8 rules)
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedScanner("sast");
                }}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  selectedScanner === "sast"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    : "bg-black/40 border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                OWASP SAST (7 rules)
              </button>
            </div>

            <div className="text-[11px] text-slate-400 bg-black/40 p-2 rounded-lg border border-white/5 font-mono">
              {selectedScanner === "secrets"
                ? "Scans for AWS, GitHub PATs, OpenAI, Slack, Stripe, Google & DB keys"
                : "Scans for Command Injection, SQL Injection, Path Traversal & SSRF"}
            </div>
          </div>

          {/* Bottom Descriptive Content */}
          <div className="pt-4 space-y-1">
            <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
              <span>Full-Spectrum Security Scanners</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects high-entropy plaintext credential leaks, injection flaws, and vulnerable
              dependencies before code merges into production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
