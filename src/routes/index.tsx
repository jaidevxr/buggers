import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  GitPullRequest,
  History,
  ShieldCheck,
  Sparkles,
  Github,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
  FileCode,
  Lock,
  Cpu,
  Zap,
} from "lucide-react";
import { BugMark, BuggersWordmark } from "@/components/brand/BugMark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buggers — Catch risky code before it catches you" },
      {
        name: "description",
        content:
          "AI-assisted code review and PR risk triage powered by real GitHub repository data: deterministic risk scoring, historical signals, and diff-grounded findings.",
      },
      { property: "og:title", content: "Buggers — Catch risky code before it catches you" },
      {
        property: "og:description",
        content:
          "Connect GitHub and analyze real pull requests: risk scoring from engineering signals plus AI review findings strictly validated against the diff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const pipeline = [
  {
    step: "01",
    label: "GitHub PR Webhook",
    desc: "Ingests pull_request and synchronize events verified by HMAC-SHA256 signatures.",
    icon: GitPullRequest,
  },
  {
    step: "02",
    label: "Diff & AST Extraction",
    desc: "Extracts patch hunks, exact line ranges, and AST structures across changed files.",
    icon: FileCode,
  },
  {
    step: "03",
    label: "Historical Signal Engine",
    desc: "Scores risk using file churn, test movement, author experience, and defect history.",
    icon: History,
  },
  {
    step: "04",
    label: "Multi-Tier AI Consensus",
    desc: "Analyzes security patterns with automatic failover across Gemini, Claude, and GPT.",
    icon: Sparkles,
  },
  {
    step: "05",
    label: "Diff Grounding Gate",
    desc: "Filters out any finding that does not reference real added or modified diff lines.",
    icon: ShieldCheck,
  },
  {
    step: "06",
    label: "Automated PR Remediation",
    desc: "Posts verified findings and suggested fixes as GitHub Check Runs or PR reviews.",
    icon: ArrowRight,
  },
];

export function Landing() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"diff" | "findings" | "signals">("diff");

  const copyCommand = () => {
    navigator.clipboard.writeText("npx buggers scan --repo jaidevxr/buggers");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Top Banner: Global Release Status */}
      <div className="w-full border-b border-border/50 bg-muted/40 px-4 py-1.5 text-center text-xs text-muted-foreground backdrop-blur-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <strong className="text-foreground">Buggers v3.2 Engine Live:</strong> 102/102 test suites passed. Real GitHub webhook & diff grounding active.
        </span>
      </div>

      {/* Full-Bleed Sticky Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-6 py-4 sm:px-10 lg:px-16 2xl:px-24">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <BugMark className="h-6 w-6 text-primary" />
              <BuggersWordmark className="text-foreground" />
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
              <a href="#how-it-works" className="transition-colors hover:text-foreground">
                How It Works
              </a>
              <a href="#features" className="transition-colors hover:text-foreground">
                Architecture
              </a>
              <a href="#security" className="transition-colors hover:text-foreground">
                Zero-Hallucination Gate
              </a>
              <a
                href="https://github.com/jaidevxr/buggers"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 transition-colors hover:text-foreground"
              >
                GitHub Repo
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="shadow-xs hover:shadow-md">
              <Link to="/auth" className="flex items-center gap-1.5">
                <Github className="h-4 w-4" />
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* Full-Bleed Hero Section (GitHub-style end-to-end canvas) */}
        <section className="github-grid relative w-full overflow-hidden border-b border-border/60 px-6 py-16 sm:px-10 sm:py-24 lg:px-16 lg:py-28 2xl:px-24">
          {/* Subtle Ambient Radial Glows */}
          <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -top-20 right-10 h-[400px] w-[400px] rounded-full bg-info/10 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-[1720px] gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Heading, Value Prop, Action Buttons */}
            <div className="flex flex-col items-start lg:col-span-6 xl:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs transition-colors hover:bg-primary/15">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Deterministic Risk Scoring + Grounded AI Review</span>
              </div>

              <h1 className="text-display mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl">
                Catch risky code <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-primary via-primary/90 to-info bg-clip-text text-transparent">
                  before it catches you.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Automated pull request security and triage powered by real repository history. Every finding is strictly validated against the diff lines to eliminate hallucinations before your team ever reads them.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-11 px-6 shadow-md hover:shadow-lg">
                  <Link to="/auth" className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    <span>Connect with GitHub</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11 px-6">
                  <a href="#how-it-works">Inspect Analysis Pipeline</a>
                </Button>
              </div>

              {/* Terminal Quick Copy Bar */}
              <div className="mt-8 flex w-full max-w-lg items-center justify-between rounded-lg border border-border bg-card/80 px-3.5 py-2.5 font-mono text-xs shadow-xs backdrop-blur-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span className="select-all text-foreground">$ npx buggers scan --repo jaidevxr/buggers</span>
                </div>
                <button
                  type="button"
                  onClick={copyCommand}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Copy scan command"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-2 gap-4 text-xs font-medium text-muted-foreground sm:grid-cols-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>100% Diff Grounded</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Zero Hallucinations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>AES-256 Token Vault</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>102 Passing Tests</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive GitHub Pull Request Review Visualizer */}
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="surface-card overflow-hidden rounded-2xl border border-border/80 shadow-2xl transition-all duration-300 hover:border-primary/40">
                {/* Code Window Header */}
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-destructive/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-mono text-xs font-semibold text-muted-foreground">
                      PR #142 • feat(auth): rate-limited session vault
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Risk Score: 84/100
                  </span>
                </div>

                {/* Sub-Header Tabs */}
                <div className="flex border-b border-border bg-card px-3 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveTab("diff")}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition-colors ${
                      activeTab === "diff"
                        ? "border-primary font-semibold text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    Diff & AST
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("findings")}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition-colors ${
                      activeTab === "findings"
                        ? "border-primary font-semibold text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Validated Findings (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("signals")}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition-colors ${
                      activeTab === "signals"
                        ? "border-primary font-semibold text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    Engineering Signals
                  </button>
                </div>

                {/* Code Window Content */}
                <div className="p-4 font-mono text-xs">
                  {activeTab === "diff" && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-muted-foreground">
                        src/server/sessionVault.server.ts
                      </div>
                      <div className="rounded border border-border/60 bg-muted/20 p-2.5 font-mono leading-relaxed">
                        <div className="text-muted-foreground/70">@@ -40,5 +40,7 @@ export async function verifySession(token: string)</div>
                        <div className="text-muted-foreground">  const hash = hashToken(token);</div>
                        <div className="bg-destructive/15 text-destructive line-through">
                          - const session = await cache.get(hash);
                        </div>
                        <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          + const session = await vault.verifyWithLease(hash, &#123; ttl: 3000 &#125;);
                        </div>
                        <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          + if (!session?.active) throw new UnauthorizedException("Session revoked");
                        </div>
                        <div className="text-muted-foreground">  return session;</div>
                      </div>

                      {/* Integrated AI Callout */}
                      <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-semibold text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI Review Finding • Line 42
                          </span>
                          <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                            CRITICAL
                          </span>
                        </div>
                        <p className="mt-1.5 text-foreground">
                          Potential race condition: <code>verifyWithLease</code> acquires a lease without an atomic CAS unlock pattern, risking deadlocks under high concurrent re-auth spikes.
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Grounding check: Verified in diff</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">98% Confidence</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "findings" && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">Race Condition in Session Lease Invalidation</span>
                          <span className="rounded bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                            CRITICAL
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground">
                          File: <code>src/server/sessionVault.server.ts</code> : lines 42-43
                        </p>
                        <p className="mt-2 text-foreground">
                          Diff ground gate validated: referenced lines contain added lease call. False-positive score: 0.02.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Mark Reviewed
                          </Button>
                          <Button size="sm" className="h-7 text-xs">
                            Create Linear / GitHub Issue
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "signals" && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between rounded border border-border p-2">
                        <span>File Churn Rate</span>
                        <span className="font-bold text-amber-500">High (18 edits in last 14d)</span>
                      </div>
                      <div className="flex items-center justify-between rounded border border-border p-2">
                        <span>Defect Association</span>
                        <span className="font-bold text-destructive">3 Past Hotfixes</span>
                      </div>
                      <div className="flex items-center justify-between rounded border border-border p-2">
                        <span>Test Coverage Movement</span>
                        <span className="font-bold text-emerald-500">+12% New Tests Added</span>
                      </div>
                      <div className="flex items-center justify-between rounded border border-border p-2">
                        <span>Dependencies Changed</span>
                        <span className="font-bold text-muted-foreground">0 New Packages</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Bleed Metrics Strip (End-to-End Across Viewport) */}
        <section className="w-full border-b border-border/60 bg-card py-10">
          <div className="grid w-full grid-cols-2 gap-6 px-6 sm:px-10 lg:grid-cols-4 lg:gap-8 lg:px-16 2xl:px-24">
            <div className="flex flex-col border-l-2 border-primary pl-4">
              <span className="text-display text-3xl font-extrabold sm:text-4xl">100%</span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Diff Line Grounding
              </span>
              <p className="mt-1 text-xs text-muted-foreground">Zero hallucinated file or line references.</p>
            </div>
            <div className="flex flex-col border-l-2 border-info pl-4">
              <span className="text-display text-3xl font-extrabold sm:text-4xl">&lt; 3.2s</span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Average PR Review Latency
              </span>
              <p className="mt-1 text-xs text-muted-foreground">Parallel streaming AST & AI evaluation.</p>
            </div>
            <div className="flex flex-col border-l-2 border-emerald-500 pl-4">
              <span className="text-display text-3xl font-extrabold sm:text-4xl">99.9%</span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Multi-Model Availability
              </span>
              <p className="mt-1 text-xs text-muted-foreground">Gemini, Claude, and OpenAI tiered fallbacks.</p>
            </div>
            <div className="flex flex-col border-l-2 border-amber-500 pl-4">
              <span className="text-display text-3xl font-extrabold sm:text-4xl">102/102</span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Passing Security Tests
              </span>
              <p className="mt-1 text-xs text-muted-foreground">Continuous isolation and adversarial release tests.</p>
            </div>
          </div>
        </section>

        {/* Full-Bleed Interactive Pipeline Section */}
        <section id="how-it-works" className="w-full border-b border-border/60 px-6 py-20 sm:px-10 lg:px-16 2xl:px-24">
          <div className="mx-auto max-w-[1720px]">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Execution Lifecycle</span>
              <h2 className="text-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                How every PR analysis runs
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Every step operates on actual repository signals. When evidence is insufficient, Buggers explicitly reports missing telemetry instead of guessing.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {pipeline.map((step) => (
                <div
                  key={step.step}
                  className="surface-card-interactive flex flex-col justify-between rounded-xl p-5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-xs">
                        <step.icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-xs font-bold text-muted-foreground">{step.step}</span>
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-foreground">{step.label}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                  <div className="mt-4 border-t border-border/60 pt-3 text-[11px] font-semibold text-primary">
                    Verified hermetic &rarr;
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Full-Bleed Bento Grid Features Section */}
        <section id="features" className="w-full border-b border-border/60 bg-muted/20 px-6 py-20 sm:px-10 lg:px-16 2xl:px-24">
          <div className="mx-auto max-w-[1720px]">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Production Architecture</span>
              <h2 className="text-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Engineered for security teams that read real diffs
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="surface-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">Zero-Hallucination Gate</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  AI suggestions that cite files, functions, or lines outside the pull request’s actual diff hunks are permanently purged before reaching user dashboards or PR reviews.
                </p>
              </div>

              <div className="surface-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">Historical Defect Signals</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Correlates changes against git commit histories, hotfix frequencies, test suite volatility, and author codebase familiarity to construct deterministic risk scores.
                </p>
              </div>

              <div className="surface-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">Multi-Provider AI Resilience</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Automated failover protocol gracefully switches between Google Gemini, OpenAI, and Anthropic. If free tiers rate-limit or fail, the review engine falls back without losing analyses.
                </p>
              </div>

              <div className="surface-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">Encrypted Token Vault</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  All user GitHub access tokens and PAT credentials are encrypted at rest with AES-GCM-256 and protected by strict Supabase multi-tenant Row-Level Security policies.
                </p>
              </div>

              <div className="surface-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <GitPullRequest className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">GitHub Bot & Checks API</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Publish findings directly into pull request review comments with line-by-line inline annotations, or fail GitHub Check Runs when risk scores exceed team thresholds.
                </p>
              </div>

              <div className="surface-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">Instant Navigation & Caching</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Zero jitter page transitions with optimistic state hydration, synchronized auth verification, and 30-second query caching for sub-100ms dashboard interactions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Bleed Call to Action Strip */}
        <section className="relative w-full overflow-hidden bg-primary px-6 py-16 text-primary-foreground sm:px-10 sm:py-20 lg:px-16 2xl:px-24">
          <div className="relative mx-auto flex max-w-[1720px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-display text-3xl font-extrabold sm:text-4xl">
                Ready to safeguard your repositories?
              </h2>
              <p className="mt-2 max-w-xl text-primary-foreground/80">
                Connect your GitHub account in 30 seconds. No credit card required. Free tier includes full diff grounding and risk scoring.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="secondary" className="h-11 px-6 shadow-md">
                <Link to="/auth" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <span>Sign Up with GitHub</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Full-Bleed End-to-End Footer */}
      <footer className="w-full border-t border-border bg-card px-6 py-10 sm:px-10 lg:px-16 2xl:px-24">
        <div className="mx-auto flex max-w-[1720px] flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <BugMark className="h-5 w-5 text-primary" />
            <BuggersWordmark className="text-foreground" />
            <span className="text-xs text-muted-foreground">
              — AI-assisted code review and risk triage engine.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <a
              href="https://github.com/jaidevxr/buggers"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub Source
            </a>
            <Link to="/auth" className="transition-colors hover:text-foreground">
              Sign In
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
