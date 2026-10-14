import { useState } from "react";
import { Check, Clock, ChevronRight, Activity, ArrowRight } from "lucide-react";

interface StageInfo {
  id: string;
  name: string;
  phase: string;
  description: string;
  keyOutputs: string[];
  latency: string;
}

const STAGES: StageInfo[] = [
  {
    id: "queued",
    name: "1. Queued & Ingested",
    phase: "Ingestion",
    description: "Webhook event or UI request is ingested, idempotency checked per SHA, and queued in Supabase.",
    keyOutputs: ["Initial analysis record", "Pending GitHub status check", "5-minute lease initialized"],
    latency: "< 50ms",
  },
  {
    id: "fetching_pr",
    name: "2. Fetching PR Metadata",
    phase: "GitHub REST",
    description: "Queries GitHub Pulls API to extract title, body, author, base branch, head branch, and head commit SHA.",
    keyOutputs: ["PR metadata stored", "Author & branch references resolved"],
    latency: "100–300ms",
  },
  {
    id: "fetching_commits",
    name: "3. Fetching PR Commits",
    phase: "GitHub REST",
    description: "Retrieves list of commits on the pull request branch to measure commit velocity.",
    keyOutputs: ["Commit count signal input", "Conventional commit pattern detection"],
    latency: "150–400ms",
  },
  {
    id: "fetching_files",
    name: "4. Fetching Changed Files",
    phase: "GitHub REST",
    description: "Downloads file list and unified patches (diff hunks) for all modified files.",
    keyOutputs: ["Additions / deletions counts", "Raw diff hunks for syntax & scanner inspection"],
    latency: "200–500ms",
  },
  {
    id: "historical_analysis",
    name: "5. Historical 90-Day Churn",
    phase: "Repository Intelligence",
    description: "Inspects the last 90 days of commit history for modified files on the base branch to evaluate past defect density.",
    keyOutputs: ["Historical commit count", "Defect-associated commit ratio", "File inception age"],
    latency: "400–900ms",
  },
  {
    id: "ai_review",
    name: "6. Multi-Provider AI Review",
    phase: "AI Orchestration",
    description: "Prioritizes high-churn files, checks diff cache, delimits untrusted author text, and invokes LLM.",
    keyOutputs: ["Candidate defect findings", "Token usage & estimated cost tracking"],
    latency: "1.4–4.0s",
  },
  {
    id: "validating_findings",
    name: "7. AST Hunk & Scanner Validation",
    phase: "Deterministic Verification",
    description: "Mathematically verifies AI citations against diff hunks. Runs Secret, SAST, and Dependency scanners.",
    keyOutputs: ["Zero phantom line citations", "Plaintext secret findings", "OWASP SAST findings"],
    latency: "80–200ms",
  },
  {
    id: "risk_calculation",
    name: "8. Deterministic Risk Scoring",
    phase: "Mathematical Engine",
    description: "Passes 8 observed signals into risk engine (model 1.1.0). Atomically replaces findings in Postgres via RPC.",
    keyOutputs: ["Normalized 0–100 score", "Categorical risk level", "Confidence percentage", "Stored findings"],
    latency: "120–250ms",
  },
  {
    id: "completed",
    name: "9. Status & Review Dispatch",
    phase: "Finalization",
    description: "Evaluates Merge Quality Gate, posts GitHub commit status check, publishes inline PR review, and alerts Slack/Discord.",
    keyOutputs: ["Final commit status check", "Inline review comments", "Real-time webhook alert"],
    latency: "300–800ms",
  },
];

export function PipelineStageVisualizer() {
  const [selectedStage, setSelectedStage] = useState<string>("historical_analysis");

  const current = STAGES.find((s) => s.id === selectedStage) ?? STAGES[0]!;

  return (
    <div className="w-full space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
            <Activity className="h-4 w-4" />
            <span>EXECUTION RUNTIME SPECIFICATION</span>
          </div>
          <h3 className="text-xl font-medium text-white mt-1">
            9-Stage Deterministic Analysis Pipeline
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select any stage in the sequence to inspect its internal logic, latency profile, and persisted outputs.
          </p>
        </div>
        <span className="text-xs font-mono text-neutral-500">
          Typical End-to-End: ~3.5–6.0s
        </span>
      </div>

      {/* Stage Flow Stepper Indicator */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 p-2 rounded-xl bg-[#07080a] border border-white/[0.08]">
        {STAGES.map((stage, idx) => {
          const isSelected = stage.id === selectedStage;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setSelectedStage(stage.id)}
              className={`p-2.5 rounded-lg text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
              }`}
            >
              <div className="text-[10px] font-mono leading-none">{idx + 1}</div>
              <div className="text-[10px] truncate font-sans mt-1">
                {stage.id.replace("_", " ")}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Detail Window */}
      <div className="p-6 rounded-xl bg-[#0c0d10] border border-white/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-white">{current.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {current.phase}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Clock className="h-3.5 w-3.5 text-neutral-500" />
            <span>Execution Latency: {current.latency}</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
          {current.description}
        </p>

        <div>
          <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-neutral-400 block mb-2">
            Persisted Outputs &amp; Telemetry
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {current.keyOutputs.map((out, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-3 rounded-lg bg-black/40 border border-white/[0.04] text-xs text-neutral-300 font-sans"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{out}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
