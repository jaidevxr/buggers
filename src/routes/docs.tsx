import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  FileCode2,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  KeyRound,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Buggers" },
      {
        name: "description",
        content:
          "Comprehensive guide to Buggers: GitHub App setup, AST deterministic triage, risk scoring algorithms, configuration files, and API reference.",
      },
      { property: "og:title", content: "Documentation — Buggers" },
      {
        property: "og:description",
        content:
          "AI-assisted code review and bug triage documentation, integration tutorials, and reference manual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocsPage,
});

type DocSection = {
  id: string;
  title: string;
  category: string;
  badge?: string;
};

const DOC_SECTIONS: DocSection[] = [
  { id: "quickstart", title: "Quickstart Guide", category: "Getting Started", badge: "2 min" },
  { id: "github-setup", title: "GitHub App & Permissions", category: "Getting Started" },
  { id: "triage-pipeline", title: "How Triage Works", category: "Core Concepts" },
  { id: "risk-scoring", title: "Risk Scoring (P95 Rate)", category: "Core Concepts" },
  { id: "configuration", title: "Repository Config (.buggers.yml)", category: "Customization" },
  { id: "security-privacy", title: "Security & Zero Retention", category: "Compliance", badge: "SOC2" },
  { id: "ci-cd-actions", title: "GitHub Actions Integration", category: "CI / CD" },
  { id: "api-reference", title: "REST & Webhook API", category: "Reference" },
];

export function DocsPage() {
  const [activeSection, setActiveSection] = useState("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const filteredSections = DOC_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[#0a0c10] text-slate-100 antialiased selection:bg-white/20">
      {/* Floating Pill Header */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <div className="flex items-center gap-6 rounded-full bg-black/75 backdrop-blur-md px-6 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-white/10 text-xs font-medium text-slate-200">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold text-white transition-opacity hover:opacity-85"
          >
            <BugMark className="h-5 w-5 text-white fill-white" />
            <span className="tracking-tight text-sm font-bold text-white">Buggers</span>
          </Link>

          <nav className="flex items-center gap-5 text-slate-300 font-medium">
            <Link to="/" className="transition-colors duration-200 hover:text-white">
              Home
            </Link>
            <Link to="/how-it-works" className="transition-colors duration-200 hover:text-white">
              How it works
            </Link>
            <Link to="/docs" className="text-white font-semibold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Docs</span>
            </Link>
          </nav>

          <Link
            to="/auth"
            className="rounded-full bg-white text-black px-5 py-1.5 text-xs font-semibold hover:bg-slate-200 transition-all duration-200 shadow-xs active:scale-[0.985]"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Docs Breadcrumbs and Header */}
        <div className="mb-8 pb-6 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>OFFICIAL DOCUMENTATION · BUGGERS v3.4</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Developer Documentation
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl">
              Learn how to connect your GitHub repositories, automate AI regression triage, and configure custom review thresholds.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, flags, API..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        {/* Two-Column Docs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Navigation */}
          <aside className="lg:col-span-3 sticky top-28 space-y-6">
            <div className="rounded-2xl bg-black/60 border border-white/10 p-3 backdrop-blur-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                Navigation
              </div>
              <nav className="space-y-1">
                {filteredSections.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 text-left ${
                      activeSection === item.id
                        ? "bg-white/10 text-white border border-white/15 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Support Callout */}
            <div className="rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-4 text-xs space-y-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span>Enterprise Ready</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Need dedicated VPC deployment, SOC2 compliance reports, or custom LLM fine-tuning?
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium text-[11px]"
              >
                <span>Talk to engineering</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="lg:col-span-9 space-y-12">
            {/* 1. Quickstart Guide */}
            {(activeSection === "quickstart" || !searchQuery) && (
              <section id="quickstart" className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <Zap className="h-5 w-5 text-amber-400" />
                    <span>2-Minute Quickstart</span>
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Step 1 of 3</span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Buggers connects directly to your GitHub organization via GitHub App webhooks. When a pull request opens or synchronizes, our deterministic engine inspects your git diff against your historical fault lines.
                </p>

                {/* 3 Step Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2">
                    <div className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-xs font-bold border border-amber-500/30">
                      1
                    </div>
                    <div className="font-semibold text-white text-sm">Sign in with GitHub</div>
                    <p className="text-xs text-slate-400">
                      Authenticate with your GitHub account using read-only repository metadata scopes.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2">
                    <div className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-xs font-bold border border-amber-500/30">
                      2
                    </div>
                    <div className="font-semibold text-white text-sm">Select Repositories</div>
                    <p className="text-xs text-slate-400">
                      Toggle the repositories you wish Buggers to monitor. Buggers installs a webhook listener.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2">
                    <div className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-xs font-bold border border-amber-500/30">
                      3
                    </div>
                    <div className="font-semibold text-white text-sm">Open Any Pull Request</div>
                    <p className="text-xs text-slate-400">
                      Receive instant inline triage, regression risk scores, and ready-to-commit fix diffs.
                    </p>
                  </div>
                </div>

                {/* Example CLI snippet */}
                <div className="rounded-2xl bg-black/80 border border-white/10 overflow-hidden">
                  <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Optional: Buggers CLI local triage</span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard("npx @buggers/cli triage --pr 184", "cli-quickstart")
                      }
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedSnippet === "cli-quickstart" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedSnippet === "cli-quickstart" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-amber-200/90 overflow-x-auto leading-relaxed">
                    <code>
                      {"# Run triage locally on your current working branch\n"}
                      {"npx @buggers/cli analyze --target origin/main\n\n"}
                      {"# Result: 0 regressions found · P95 confidence: 99.4%"}
                    </code>
                  </pre>
                </div>
              </section>
            )}

            {/* 2. GitHub App & Permissions */}
            {(activeSection === "github-setup" || !searchQuery) && (
              <section id="github-setup" className="space-y-6 pt-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <FolderGit2 className="h-5 w-5 text-amber-400" />
                    <span>GitHub App & Permissions</span>
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Security</span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Buggers strictly abides by the principle of least privilege. We require only the minimum scopes necessary to analyze pull request diffs and publish check runs.
                </p>

                {/* Scopes Table */}
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 border-b border-white/10 text-slate-300 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Permission</th>
                        <th className="py-3 px-4">Access Level</th>
                        <th className="py-3 px-4">Why It's Needed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-400 font-mono text-[11px]">
                      <tr>
                        <td className="py-3 px-4 text-white font-medium">Pull requests</td>
                        <td className="py-3 px-4 text-amber-400">Read & write</td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          To read the unified diff and publish inline review comments with suggested remediations.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-medium">Checks / Commit status</td>
                        <td className="py-3 px-4 text-amber-400">Read & write</td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          To post status checks (e.g. "Buggers: Risk Score 82 — High Risk") directly on GitHub PRs.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white font-medium">Contents</td>
                        <td className="py-3 px-4 text-emerald-400">Read-only</td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          To read changed files in the commit tree for AST verification.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 3. Triage Pipeline */}
            {(activeSection === "triage-pipeline" || !searchQuery) && (
              <section id="triage-pipeline" className="space-y-6 pt-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <Cpu className="h-5 w-5 text-amber-400" />
                    <span>How Triage Works</span>
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Architecture</span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Unlike traditional linters that spam pull requests with stylistic nitpicks, Buggers runs a multi-stage triage pipeline designed to uncover actual runtime bugs:
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                      01
                    </span>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-white">AST Diff Decomposition</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        The raw patch is parsed into an abstract syntax tree. Formatting, comments, and whitespace changes are filtered out, isolating pure logical mutations.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                      02
                    </span>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-white">Historical Churn Cross-Reference</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Buggers correlates modified functions with your repository's historical git commit churn and rollback logs to identify error-prone hot zones.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                      03
                    </span>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-white">Multi-Model AI Hypothesis Testing</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Each mutation is evaluated against known concurrency, financial, race condition, and boundary edge cases. Remediation code is generated only when confidence exceeds 90%.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 4. Configuration File (.buggers.yml) */}
            {(activeSection === "configuration" || !searchQuery) && (
              <section id="configuration" className="space-y-6 pt-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <FileCode2 className="h-5 w-5 text-amber-400" />
                    <span>Repository Configuration (.buggers.yml)</span>
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Customization</span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Place a <code className="text-amber-300 font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">.buggers.yml</code> in the root of your repository to configure risk thresholds, ignored directories, and custom notification rules:
                </p>

                {/* YML Snippet */}
                <div className="rounded-2xl bg-black/80 border border-white/10 overflow-hidden">
                  <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>.buggers.yml</span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `version: 1\nrisk:\n  threshold: 75\n  fail_on_critical: true\n\nignore:\n  paths:\n    - "docs/**"\n    - "**/*.spec.ts"\n    - "vendor/**"\n\nreviews:\n  inline_comments: true\n  summary_table: true`,
                          "yml-snippet"
                        )
                      }
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedSnippet === "yml-snippet" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedSnippet === "yml-snippet" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                    <code>
{`version: 1

risk:
  threshold: 75           # Flag PRs with risk score >= 75 as HIGH
  fail_on_critical: true  # Block merge on critical financial or race conditions

ignore:
  paths:
    - "docs/**"
    - "**/*.spec.ts"
    - "vendor/**"

reviews:
  inline_comments: true   # Post verified remediations directly on lines
  summary_table: true     # Post triage matrix in PR overview comment`}
                    </code>
                  </pre>
                </div>
              </section>
            )}

            {/* 5. Security & Zero Data Retention */}
            {(activeSection === "security-privacy" || !searchQuery) && (
              <section id="security-privacy" className="space-y-6 pt-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span>Security & Zero Retention Policy</span>
                  </h2>
                  <span className="text-xs font-mono text-emerald-400">SOC2 Verified</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-400" />
                      <span>Zero Code Retention</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your source code is never written to disk or used to train public machine learning models. Analysis happens ephemerally in isolated secure enclaves and is flushed immediately upon completion.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-emerald-400" />
                      <span>End-to-End Encryption</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      All communication between GitHub, Buggers edge workers, and inference nodes is encrypted in transit using TLS 1.3 with automated certificate rotation.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-white/10 bg-black py-10 px-4 sm:px-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-white font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-slate-500 text-[11px]">&copy; 2026 Buggers, Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-white transition-colors duration-200">
              Home
            </Link>
            <Link to="/how-it-works" className="hover:text-white transition-colors duration-200">
              How it works
            </Link>
            <Link to="/auth" className="hover:text-white transition-colors duration-200">
              Sign In
            </Link>
            <span className="text-emerald-400 font-mono text-[11px]">All Systems Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
