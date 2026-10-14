import { useState } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Sliders } from "lucide-react";

export function QualityGateSimulator() {
  const [maxRisk, setMaxRisk] = useState<number>(75);
  const [blockCritical, setBlockCritical] = useState<boolean>(true);
  const [blockHigh, setBlockHigh] = useState<boolean>(true);
  const [blockSecrets, setBlockSecrets] = useState<boolean>(true);
  const [blockDependencies, setBlockDependencies] = useState<boolean>(true);

  // Sample PR scenario
  const [prRiskScore, setPrRiskScore] = useState<number>(68);
  const [hasCritical, setHasCritical] = useState<boolean>(false);
  const [hasHigh, setHasHigh] = useState<boolean>(true);
  const [hasSecret, setHasSecret] = useState<boolean>(false);
  const [hasDepCve, setHasDepCve] = useState<boolean>(false);

  // Evaluate
  const violations: string[] = [];
  if (prRiskScore > maxRisk) {
    violations.push(`Risk score (${prRiskScore}/100) exceeds threshold (${maxRisk})`);
  }
  if (blockCritical && hasCritical) {
    violations.push("1 Critical severity finding detected");
  }
  if (blockHigh && hasHigh) {
    violations.push("1 High severity finding detected");
  }
  if (blockSecrets && hasSecret) {
    violations.push("1 plaintext secret leak detected (e.g. Stripe API Key)");
  }
  if (blockDependencies && hasDepCve) {
    violations.push("1 vulnerable dependency CVE detected");
  }

  const passed = violations.length === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0e15] p-5 sm:p-6 my-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Sliders className="h-4 w-4" />
            <span>POLICY EVALUATOR</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Merge Quality Gate Simulation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Test how declarative security policies evaluate against sample pull request findings.
          </p>
        </div>

        {/* Live Gate Status */}
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
            passed
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {passed ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400">Commit Status</div>
            <div className="text-sm font-bold font-mono">
              {passed ? "SUCCESS — MERGE ALLOWED" : "FAILURE — MERGE BLOCKED"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Policy Configuration */}
        <div className="space-y-4">
          <span className="text-xs font-mono uppercase font-semibold text-slate-400 block">
            Repository Policy (.buggers.yml)
          </span>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Max Risk Score Threshold:</span>
                <span className="font-mono text-amber-300 font-bold">{maxRisk} / 100</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="5"
                value={maxRisk}
                onChange={(e) => setMaxRisk(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <span className="text-slate-300">Block on Critical Findings</span>
              <input
                type="checkbox"
                checked={blockCritical}
                onChange={(e) => setBlockCritical(e.target.checked)}
                className="accent-amber-400 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <span className="text-slate-300">Block on High Findings</span>
              <input
                type="checkbox"
                checked={blockHigh}
                onChange={(e) => setBlockHigh(e.target.checked)}
                className="accent-amber-400 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <span className="text-slate-300">Block on Plaintext Secrets</span>
              <input
                type="checkbox"
                checked={blockSecrets}
                onChange={(e) => setBlockSecrets(e.target.checked)}
                className="accent-amber-400 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <span className="text-slate-300">Block on Vulnerable Dependencies (CVE)</span>
              <input
                type="checkbox"
                checked={blockDependencies}
                onChange={(e) => setBlockDependencies(e.target.checked)}
                className="accent-amber-400 h-4 w-4"
              />
            </label>
          </div>
        </div>

        {/* Right Column: Simulated Pull Request Context */}
        <div className="space-y-4">
          <span className="text-xs font-mono uppercase font-semibold text-slate-400 block">
            Simulated PR #142 State
          </span>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">PR Evaluated Risk Score:</span>
                <span className="font-mono text-white font-bold">{prRiskScore} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="2"
                value={prRiskScore}
                onChange={(e) => setPrRiskScore(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <span className="text-slate-300">Contains Critical Vulnerability</span>
              <input
                type="checkbox"
                checked={hasCritical}
                onChange={(e) => setHasCritical(e.target.checked)}
                className="accent-rose-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <span className="text-slate-300">Contains High Vulnerability</span>
              <input
                type="checkbox"
                checked={hasHigh}
                onChange={(e) => setHasHigh(e.target.checked)}
                className="accent-orange-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <span className="text-slate-300">Contains Leaked API Secret</span>
              <input
                type="checkbox"
                checked={hasSecret}
                onChange={(e) => setHasSecret(e.target.checked)}
                className="accent-rose-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <span className="text-slate-300">Contains Outdated Manifest (CVE)</span>
              <input
                type="checkbox"
                checked={hasDepCve}
                onChange={(e) => setHasDepCve(e.target.checked)}
                className="accent-amber-500 h-4 w-4"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      <div
        className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${
          passed
            ? "bg-emerald-500/[0.05] border-emerald-500/20 text-emerald-300"
            : "bg-rose-500/[0.05] border-rose-500/20 text-rose-300"
        }`}
      >
        <div className="font-bold flex items-center gap-1.5">
          {passed ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Quality Gate Passed: PR meets all repository thresholds.</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <span>Quality Gate Blocked: {violations.length} violation(s) detected.</span>
            </>
          )}
        </div>
        {!passed && (
          <ul className="list-disc list-inside text-slate-300 text-[11px] pt-1 space-y-0.5">
            {violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
