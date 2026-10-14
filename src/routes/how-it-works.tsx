import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileCode,
  ShieldAlert,
  Sparkles,
  Zap,
  Activity,
  Terminal,
  Cpu,
  Layers,
  GitPullRequest,
  Check,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works – Buggers" },
      {
        name: "description",
        content:
          "See how Buggers ingests pull requests, detects regression risks using churn history, and suggests verified fixes.",
      },
      { property: "og:title", content: "How It Works – Buggers" },
      {
        property: "og:description",
        content:
          "End-to-end pull request triage powered by repository history and grounded AI models.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorksPage,
});

interface PipelineStep {
  step: string;
  title: string;
  shortDesc: string;
  badge: string;
  badgeColor: string;
  codeFile: string;
  payloadTitle: string;
  lines: Array<{ prefix: string; text: string; highlight?: boolean }>;
  detailHeader: string;
  detailBody: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    step: "STEP 01",
    title: "Instant Webhook Ingest",
    shortDesc: "HMAC SHA-256 verified event routing from GitHub App in <180ms.",
    badge: "180ms · HMAC Validated",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    codeFile: "api/webhooks/github.ts",
    payloadTitle: "Payload Verification & Token Decryption",
    lines: [
      { prefix: "01", text: "POST /api/webhooks/github HTTP/1.1" },
      { prefix: "02", text: "X-Hub-Signature-256: sha256=9b72a... (HMAC Verified)", highlight: true },
      { prefix: "03", text: 'X-GitHub-Event: pull_request {"action": "opened", "number": 184}' },
      { prefix: "04", text: "AES-256-GCM Decrypt: APP_USER_CONNECTION_KEY_SECRET -> GitHub App Octokit" },
      { prefix: "05", text: "Locking Postgres PR analysis lease: status=processing, ttl=300s" },
    ],
    detailHeader: "Zero-Latency Event Handling",
    detailBody: "Webhooks are verified against GitHub HMAC signatures before hitting background queues. Repository credentials are encrypted at rest using AES-256-GCM and decrypted exclusively in-memory.",
  },
  {
    step: "STEP 02",
    title: "Historical Churn Context",
    shortDesc: "Correlates modified files with 90-day defect commits and hotspot frequency.",
    badge: "Hotspot Engine · 14 Regressions",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    codeFile: "src/engine/churn-analyzer.ts",
    payloadTitle: "Module Volatility & Revert Analysis",
    lines: [
      { prefix: "12", text: "Analyzing Git commit graph: src/services/paymentValidator.ts" },
      { prefix: "13", text: "-> Total commits in 90d: 38 | Past defect reverts: 14", highlight: true },
      { prefix: "14", text: "-> Author entropy: 3.42 bits (4 active contributors)" },
      { prefix: "15", text: "-> Hotspot status: HIGH_VOLATILITY (Top 2% of repository)" },
      { prefix: "16", text: "Churn factor weight: 0.35 * normalized_defect_ratio" },
    ],
    detailHeader: "Context-Aware Risk Prediction",
    detailBody: "Unlike standard linters that treat every file equally, Buggers extracts commit histories, identifying volatile hotspots that historically caused production rollbacks.",
  },
  {
    step: "STEP 03",
    title: "Multi-Signal Risk Scoring",
    shortDesc: "Calculates deterministic score (0-100) using Risk Model 1.1.0 specifications.",
    badge: "Risk Score 82/100 · HIGH",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    codeFile: "src/engine/risk-model.ts",
    payloadTitle: "Deterministic Risk Model 1.1.0 Calculation",
    lines: [
      { prefix: "31", text: "Coverage Delta: -8.4% (Tests deleted in test/payment.test.ts)" },
      { prefix: "32", text: "Complexity Delta: +14 Cyclomatic (nested condition blocks)", highlight: true },
      { prefix: "33", text: "SAST Vulnerability: 1 High (CWE-208 Timing Attack / Inverted Guard)" },
      { prefix: "34", text: "Formula: S = clamp(25*del_cov + 15*del_cpx + 30*churn + 30*sast)" },
      { prefix: "35", text: "Result: Risk Score 82/100 -> Severity Level: HIGH", highlight: true },
    ],
    detailHeader: "Mathematical Risk Precision",
    detailBody: "Deterministic scoring produces consistent, reproducible quality gates. Pull requests exceeding the team's risk threshold automatically receive targeted inspection.",
  },
  {
    step: "STEP 04",
    title: "AST-Grounded Remediation",
    shortDesc: "Verifies line numbers against git diff hunks before posting GitHub comments.",
    badge: "Zero Hallucination Verified",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    codeFile: "src/engine/remediation.ts",
    payloadTitle: "AST Citation Verification & GitHub Check Run",
    lines: [
      { prefix: "48", text: "Candidate finding: Inverted boolean guard in payment capture" },
      { prefix: "49", text: "Diff Verification: Verified hunk lines 42-44 exist in PR diff", highlight: true },
      { prefix: "50", text: "AST AST-SAST-004 Walker: Match confirmed on AST Node Identifier" },
      { prefix: "51", text: "GitHub Check Run: Completed with ACTION_REQUIRED advisory" },
      { prefix: "52", text: "Inline PR Comment posted: Suggested fix formatted as git patch", highlight: true },
    ],
    detailHeader: "Strict Anti-Hallucination Pipeline",
    detailBody: "AI comments are strictly validated: if an AI suggestion references a line number that was not modified in the diff, the finding is discarded. Zero false alarms.",
  },
];

export function HowItWorksPage() {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const activeStep = PIPELINE_STEPS[activeStepIdx]!;

  return (
    <div className="min-h-screen w-full bg-[#08090a] text-neutral-200 antialiased overflow-x-hidden selection:bg-white/20 flex flex-col justify-between">
      {/* Main Content Hero */}
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-12 max-w-[1240px] mx-auto flex-1 w-full space-y-20">
        
        {/* Title Header with Linear editorial spacing */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/[0.08] px-3.5 py-1 text-xs font-mono text-[#8a8f98]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="uppercase text-[10px] tracking-widest text-neutral-300">Deterministic Release Intelligence</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[1.08]">
            How Buggers Protects Your Release Pipeline
          </h1>

          <p className="text-base sm:text-lg text-[#8a8f98] leading-relaxed max-w-2xl mx-auto font-normal">
            From the second a pull request is opened to automated remediation comments, here is how Buggers reads code diffs and repository history together.
          </p>
        </div>

        {/* 4-Step Interactive Linear Pipeline Selector */}
        <div className="border-y border-white/[0.08] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 py-3">
          {PIPELINE_STEPS.map((s, idx) => {
            const isCurrent = activeStepIdx === idx;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStepIdx(idx)}
                className={`p-6 sm:p-7 text-left space-y-3 transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? "bg-white/[0.04] text-white"
                    : "text-[#8a8f98] hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] tracking-widest uppercase font-semibold ${
                      isCurrent ? "text-white" : "text-neutral-500"
                    }`}
                  >
                    {s.step}
                  </span>
                  {isCurrent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">{s.title}</h3>
                </div>

                <p className="text-xs text-[#8a8f98] leading-relaxed font-normal">
                  {s.shortDesc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Interactive Dynamic Stage Inspector Preview (Linear Open Hairline with Feathered Edge) */}
        <section className="relative border-y border-white/[0.08] bg-[#090a0d] shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden linear-preview-fade-bottom">
          {/* Subtle top edge lighting flare */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Header Bar */}
          <div className="border-b border-white/[0.08] px-6 sm:px-8 py-4 bg-[#0c0d10] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-neutral-400 font-semibold">{activeStep.step}</span>
              <span className="text-neutral-600">/</span>
              <span className="font-mono text-sm text-white font-medium">{activeStep.title}</span>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold ${activeStep.badgeColor}`}>
                {activeStep.badge}
              </span>
              <span className="text-neutral-500 hidden sm:inline-block">PR #184: payment-service</span>
            </div>
          </div>

          {/* Interactive Inspection Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
            {/* Left Column: Live Terminal / Execution Log */}
            <div className="lg:col-span-7 p-6 sm:p-8 font-mono text-xs leading-relaxed space-y-4 bg-[#07080a] border-b lg:border-b-0 lg:border-r border-white/[0.08]">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="text-neutral-300">{activeStep.codeFile}</span>
                </div>
                <span>Nitro Serverless Execution</span>
              </div>

              <div className="space-y-1.5 py-2">
                {activeStep.lines.map((l, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 py-1 px-2 rounded ${
                      l.highlight ? "bg-white/[0.06] text-white font-semibold" : "text-neutral-400"
                    }`}
                  >
                    <span className="text-neutral-600 select-none text-[10px] w-6 shrink-0">{l.prefix}</span>
                    <span className="whitespace-pre-wrap">{l.text}</span>
                  </div>
                ))}
              </div>

              {/* Verified Status Tag */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2 text-emerald-400 text-xs font-mono">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Deterministic pipeline assertion satisfied (0 ms jitter)</span>
              </div>
            </div>

            {/* Right Column: Architectural Detail & Deep Dive */}
            <div className="lg:col-span-5 p-6 sm:p-8 space-y-6 bg-[#090a0d] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
                    STAGE SPECIFICATION
                  </span>
                  <h3 className="text-xl font-medium text-white tracking-tight">
                    {activeStep.detailHeader}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[#8a8f98] leading-relaxed font-normal">
                  {activeStep.detailBody}
                </p>

                <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs font-mono text-neutral-400">
                  <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                    <span>Execution Isolation</span>
                    <span className="text-white">Edge V8 Isolates</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                    <span>Data Privacy</span>
                    <span className="text-white">Zero Token Retention</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Re-entrancy Guard</span>
                    <span className="text-emerald-400 font-semibold">Active · SHA-256 Lock</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStepIdx((prev) => (prev + 1) % PIPELINE_STEPS.length)}
                  className="text-xs font-mono text-white hover:text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Advance Pipeline Stage</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] font-mono text-neutral-500">
                  Step {activeStepIdx + 1} of {PIPELINE_STEPS.length}
                </span>
              </div>
            </div>
          </div>

          {/* Linear bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none z-10" />
        </section>

        {/* Bottom CTA Banner (Clean Linear Hairline) */}
        <section className="border-t border-white/[0.08] pt-16 pb-8 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-white leading-tight">
              Ready to review pull requests with ease?
            </h2>
            <p className="text-xs sm:text-sm text-[#8a8f98] leading-relaxed font-normal">
              Connect your repository once. Buggers runs automatically on your next pull request with deterministic release intelligence.
            </p>
          </div>

          <div className="flex justify-center items-center gap-4">
            <Link
              to="/auth"
              preload="intent"
              className="rounded-full bg-white text-black px-7 py-2.5 text-xs sm:text-sm font-semibold hover:bg-neutral-200 transition-all duration-150 active:scale-[0.985] flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Get Started with GitHub</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/docs"
              className="rounded-full border border-white/[0.12] bg-white/[0.02] text-neutral-300 hover:text-white hover:border-white/25 px-6 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer"
            >
              Explore Full Specs
            </Link>
          </div>
        </section>
      </main>

      {/* Footer - Linear Matte Black */}
      <footer className="border-t border-white/[0.08] bg-[#08090a] py-8 px-4 sm:px-6 text-xs text-[#8a8f98] mt-auto">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-neutral-300 font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-neutral-600 text-[11px]">&copy; 2026 Buggers, Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-[#8a8f98]">
            <Link to="/" className="hover:text-white transition-colors duration-150">Home</Link>
            <Link to="/about" className="hover:text-white transition-colors duration-150">About</Link>
            <Link to="/docs" className="hover:text-white transition-colors duration-150">Docs</Link>
            <Link to="/auth" className="hover:text-white transition-colors duration-150">Sign In</Link>
            <span className="text-neutral-500 font-mono text-[11px]">All Systems Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

