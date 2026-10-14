import { useState } from "react";
import { Calculator, Sparkles, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

interface SignalSpec {
  id: string;
  name: string;
  weight: number;
  kind: "observed" | "derived" | "model";
  midpointOrTarget: string;
  description: string;
  sampleEvidence: string;
  defaultValue: number;
}

const SIGNALS: SignalSpec[] = [
  {
    id: "change_size",
    name: "Change size (additions + deletions)",
    weight: 0.18,
    kind: "observed",
    midpointOrTarget: "Midpoint: 400 lines",
    description: "Evaluates pull request volume via saturating curve saturate(n, 400).",
    sampleEvidence: "320 additions and 95 deletions across 6 files.",
    defaultValue: 0.51,
  },
  {
    id: "change_spread",
    name: "Files touched (blast radius)",
    weight: 0.08,
    kind: "observed",
    midpointOrTarget: "Midpoint: 12 files",
    description: "Wide cross-module changes increase defect probability.",
    sampleEvidence: "6 files modified across 2 packages.",
    defaultValue: 0.33,
  },
  {
    id: "commit_count",
    name: "Commits in pull request",
    weight: 0.05,
    kind: "observed",
    midpointOrTarget: "Midpoint: 10 commits",
    description: "High commit frequency on a single branch correlates with unstable iteration.",
    sampleEvidence: "4 commits on pull request branch.",
    defaultValue: 0.28,
  },
  {
    id: "file_churn",
    name: "Historical file churn (90-day)",
    weight: 0.20,
    kind: "derived",
    midpointOrTarget: "Midpoint: 15 commits",
    description: "Average commits touching these files over the prior 90-day window on base branch.",
    sampleEvidence: "Changed files average 14.2 commits in 90-day window.",
    defaultValue: 0.49,
  },
  {
    id: "defect_history",
    name: "Defect-associated commit history",
    weight: 0.20,
    kind: "derived",
    midpointOrTarget: "Multiplier: 2.0x",
    description: "Ratio of past commits on these paths matching fix:, revert:, or issue closures.",
    sampleEvidence: "5 of 18 prior commits reference fixes or reverts.",
    defaultValue: 0.55,
  },
  {
    id: "file_age",
    name: "File inception age",
    weight: 0.05,
    kind: "derived",
    midpointOrTarget: "Midpoint: 180 days",
    description: "Newly introduced files (< 180 days) carry higher churn risk than mature code.",
    sampleEvidence: "Youngest changed file inception age is 45 days.",
    defaultValue: 0.80,
  },
  {
    id: "test_changes",
    name: "Test coverage movement",
    weight: 0.09,
    kind: "observed",
    midpointOrTarget: "Target: 0.33 ratio (1:3)",
    description: "Ratio of test files to code files. Documentation and configuration PRs are exempt.",
    sampleEvidence: "2 test files updated alongside 4 code files (50% ratio).",
    defaultValue: 0.0,
  },
  {
    id: "dependency_changes",
    name: "Dependency modifications",
    weight: 0.05,
    kind: "observed",
    midpointOrTarget: "Penalty: 0.60",
    description: "Flags manifest modifications (package.json, lockfiles, go.mod, Cargo.lock).",
    sampleEvidence: "No dependency manifests changed.",
    defaultValue: 0.0,
  },
  {
    id: "ai_findings",
    name: "AI review findings (hunk validated)",
    weight: 0.10,
    kind: "model",
    midpointOrTarget: "Weighted by severity",
    description: "Validated AI findings citing exact diff hunk line numbers.",
    sampleEvidence: "1 high-severity validated finding on auth token generation.",
    defaultValue: 0.38,
  },
];

export function RiskEngineExplorer() {
  const [signalValues, setSignalValues] = useState<Record<string, number>>(() =>
    SIGNALS.reduce((acc, s) => ({ ...acc, [s.id]: s.defaultValue }), {})
  );

  const totalWeight = SIGNALS.reduce((acc, s) => acc + s.weight, 0);
  const weightedSum = SIGNALS.reduce(
    (acc, s) => acc + (signalValues[s.id] ?? s.defaultValue) * s.weight,
    0
  );
  const computedScore = Math.round((weightedSum / totalWeight) * 100);

  const getTier = (score: number) => {
    if (score >= 75) return { label: "CRITICAL", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30" };
    if (score >= 55) return { label: "HIGH", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30" };
    if (score >= 30) return { label: "MEDIUM", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" };
    return { label: "LOW", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" };
  };

  const tier = getTier(computedScore);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0e15] p-5 sm:p-6 my-6 shadow-xl space-y-6">
      {/* Explorer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Calculator className="h-4 w-4" />
            <span>INTERACTIVE RISK MODEL 1.1.0</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Deterministic Signal Weight Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust individual observed signals to see how Buggers calculates the normalized 0–100 score.
          </p>
        </div>

        {/* Live Score Display */}
        <div className="flex items-center gap-3 bg-[#07090e] border border-white/10 px-4 py-2.5 rounded-xl">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Simulated Score</div>
            <div className="text-2xl font-black font-mono text-white leading-none mt-0.5">
              {computedScore}
              <span className="text-xs text-slate-500 font-normal"> / 100</span>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${tier.bg} ${tier.color}`}>
            {tier.label}
          </div>
        </div>
      </div>

      {/* Signals Grid */}
      <div className="space-y-3">
        {SIGNALS.map((signal) => {
          const val = signalValues[signal.id] ?? signal.defaultValue;
          return (
            <div
              key={signal.id}
              className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">{signal.name}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                      signal.kind === "observed"
                        ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
                        : signal.kind === "derived"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                    }`}
                  >
                    {signal.kind}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    weight: {signal.weight}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-amber-300/90 w-12 text-right">
                    {(val * 100).toFixed(0)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={val}
                    onChange={(e) =>
                      setSignalValues((prev) => ({
                        ...prev,
                        [signal.id]: parseFloat(e.target.value),
                      }))
                    }
                    className="w-28 sm:w-36 accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-0.5">
                <span>{signal.description}</span>
                <span className="font-mono text-slate-500 shrink-0">{signal.midpointOrTarget}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator Footer note */}
      <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <span>Formula: Score = round( &sum;(value &times; weight) / &sum;(weight) &times; 100 )</span>
        <button
          onClick={() =>
            setSignalValues(
              SIGNALS.reduce((acc, s) => ({ ...acc, [s.id]: s.defaultValue }), {})
            )
          }
          className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer text-xs font-sans"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
