import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  FileCode,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Search,
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
          "Documentation for Buggers: GitHub App setup, AST triage pipeline, risk scoring, and repository configuration.",
      },
      { property: "og:title", content: "Documentation — Buggers" },
      {
        property: "og:description",
        content:
          "AI-assisted code review and bug triage documentation, integration guide, and repository configuration reference.",
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
};

const DOC_SECTIONS: DocSection[] = [
  { id: "quickstart", title: "Quickstart Guide", category: "Getting Started" },
  { id: "github-setup", title: "GitHub App & Permissions", category: "Getting Started" },
  { id: "triage-pipeline", title: "How Triage Works", category: "Core Concepts" },
  { id: "risk-scoring", title: "Risk Scoring (0–100)", category: "Core Concepts" },
  { id: "configuration", title: "Repository Config (.buggers.yml)", category: "Configuration" },
  { id: "ci-cd-actions", title: "GitHub Actions Integration", category: "CI / CD" },
  { id: "api-reference", title: "Webhook Payloads", category: "Reference" },
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
    <div className="min-h-screen w-full bg-[#0a0c10] text-slate-100 antialiased selection:bg-white/20 flex flex-col justify-between">
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

      {/* Main Container - flex-1 pushes footer to the bottom */}
      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Docs Header */}
        <div className="mb-8 pb-6 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>BUGGERS DOCUMENTATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Documentation
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Learn how Buggers connects to your repositories, analyzes pull request diffs, and triages bugs.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        {/* Two-Column Layout - flex-1 ensures it fills available space */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
          {/* Left Sidebar */}
          <aside className="lg:col-span-4 sticky top-28 space-y-4">
            <div className="rounded-2xl bg-[#11141e] border border-white/10 p-3 shadow-lg">
              <div className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
                Topics
              </div>
              <nav className="space-y-1">
                {filteredSections.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 text-left cursor-pointer ${
                      activeSection === item.id
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.category}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right Main Content - consistent min-height prevents layout shifts when switching topics */}
          <main className="lg:col-span-8 space-y-8 min-h-[600px] flex flex-col">
            {/* Quickstart */}
            {activeSection === "quickstart" && (
              <div className="rounded-3xl border border-white/10 bg-[#11141e] p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Zap className="h-4 w-4" />
                  <span>GETTING STARTED</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Quickstart Guide</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Buggers connects directly to your GitHub account to analyze pull requests as they are opened.
                </p>

                <div className="space-y-3 font-sans">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-mono font-bold text-amber-300">
                      1
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">Authenticate with GitHub</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Sign in through the Auth page with GitHub OAuth, Google, or your email.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-mono font-bold text-amber-300">
                      2
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">Select Your Repositories</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        In the Repositories tab, choose which repositories you want Buggers to monitor.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-mono font-bold text-amber-300">
                      3
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">Review Triage Results</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Whenever a PR is opened or updated, check runs publish risk scores and inline remediations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-black border border-white/10 overflow-hidden font-mono text-xs">
                  <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-slate-400 text-[11px]">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-amber-400" />
                      <span>Local Analysis Command</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("npx @buggers/cli analyze", "quickstart-cli")}
                      className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedSnippet === "quickstart-cli" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedSnippet === "quickstart-cli" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-amber-200/90 leading-relaxed">
                    <code>npx @buggers/cli analyze --target origin/main</code>
                  </pre>
                </div>
              </div>
            )}

            {/* GitHub Setup */}
            {activeSection === "github-setup" && (
              <div className="rounded-3xl border border-white/10 bg-[#11141e] p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <FolderGit2 className="h-4 w-4" />
                  <span>PERMISSIONS</span>
                </div>
                <h2 className="text-2xl font-bold text-white">GitHub App & Permissions</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Buggers requests only the minimal scopes required to analyze code diffs and post check runs:
                </p>

                <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10 text-slate-300 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Scope</th>
                        <th className="py-2.5 px-4">Level</th>
                        <th className="py-2.5 px-4">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-400 font-mono text-[11px]">
                      <tr>
                        <td className="py-3 px-4 text-white">Pull requests</td>
                        <td className="py-3 px-4 text-amber-400">Read & write</td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          To read unified diffs and publish inline fix suggestions.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white">Checks</td>
                        <td className="py-3 px-4 text-amber-400">Read & write</td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          To post status checks with overall P95 risk scores.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-white">Contents</td>
                        <td className="py-3 px-4 text-emerald-400">Read-only</td>
                        <td className="py-3 px-4 font-sans text-slate-300">
                          To inspect changed file AST nodes.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* How Triage Works */}
            {activeSection === "triage-pipeline" && (
              <div className="rounded-3xl border border-white/10 bg-[#11141e] p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Cpu className="h-4 w-4" />
                  <span>ARCHITECTURE</span>
                </div>
                <h2 className="text-2xl font-bold text-white">How Triage Works</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Our pipeline evaluates code changes in four deterministic stages:
                </p>

                <div className="space-y-3 font-sans text-xs">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="font-mono text-amber-400 text-[10px] uppercase font-bold">
                      Stage 1 · Webhook Diff Parsing
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Decomposes unified patches into syntax nodes, stripping out purely cosmetic changes.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="font-mono text-amber-400 text-[10px] uppercase font-bold">
                      Stage 2 · Churn Cross-Reference
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Correlates changed functions with past commit history and rollbacks in that specific module.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="font-mono text-amber-400 text-[10px] uppercase font-bold">
                      Stage 3 · Risk Scoring
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Scores regression probability from 0 to 100 based on test coverage delta and complexity.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="font-mono text-amber-400 text-[10px] uppercase font-bold">
                      Stage 4 · Grounded Remediation
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Generates fix suggestions citing exact diff line numbers without phantom citations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Scoring */}
            {activeSection === "risk-scoring" && (
              <div className="rounded-3xl border border-white/10 bg-[#11141e] p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Sparkles className="h-4 w-4" />
                  <span>SCORING</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Risk Scoring (0–100)</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Every pull request receives a normalized 0–100 risk score based on three categorical bands:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                    <span className="text-rose-400 font-bold">Critical / High (75–100)</span>
                    <p className="font-sans text-[11px] text-slate-300">
                      Unwrapped database transactions, silent partial overwrites, or broken auth checks.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                    <span className="text-amber-400 font-bold">Medium (40–74)</span>
                    <p className="font-sans text-[11px] text-slate-300">
                      Untested boundary inputs, missing error fallback branches, or signature shifts.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                    <span className="text-emerald-400 font-bold">Low (0–39)</span>
                    <p className="font-sans text-[11px] text-slate-300">
                      Documentation updates, localized utility changes with comprehensive test coverage.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Repository Config */}
            {activeSection === "configuration" && (
              <div className="rounded-3xl border border-white/10 bg-[#11141e] p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <FileCode className="h-4 w-4" />
                  <span>CONFIGURATION</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Repository Config (.buggers.yml)</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Place a <code className="text-amber-300 bg-white/5 px-1.5 py-0.5 rounded font-mono">.buggers.yml</code> in your repository root to configure thresholds:
                </p>

                <div className="rounded-2xl bg-black border border-white/10 overflow-hidden font-mono text-xs">
                  <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-slate-400 text-[11px]">
                    <span>.buggers.yml</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `version: 1\nrisk:\n  threshold: 75\n  fail_on_critical: true\nignore:\n  paths:\n    - "docs/**"\n    - "**/*.spec.ts"`,
                          "yml-copy"
                        )
                      }
                      className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedSnippet === "yml-copy" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedSnippet === "yml-copy" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-slate-300 leading-relaxed">
{`version: 1
risk:
  threshold: 75           # Score >= 75 flags as High
  fail_on_critical: true  # Block merge on critical findings
ignore:
  paths:
    - "docs/**"
    - "**/*.spec.ts"`}
                  </pre>
                </div>
              </div>
            )}

            {/* GitHub Actions */}
            {activeSection === "ci-cd-actions" && (
              <div className="rounded-3xl border border-white/10 bg-[#11141e] p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <GitBranch className="h-4 w-4" />
                  <span>CI / CD</span>
                </div>
                <h2 className="text-2xl font-bold text-white">GitHub Actions Integration</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  You can also invoke Buggers as a step inside your existing GitHub Actions workflow:
                </p>

                <div className="rounded-2xl bg-black border border-white/10 overflow-hidden font-mono text-xs">
                  <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-slate-400 text-[11px]">
                    <span>.github/workflows/buggers.yml</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `name: Buggers Triage\non:\n  pull_request:\n    types: [opened, synchronize]\njobs:\n  triage:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npx @buggers/cli analyze`,
                          "actions-copy"
                        )
                      }
                      className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedSnippet === "actions-copy" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedSnippet === "actions-copy" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-slate-300 leading-relaxed">
{`name: Buggers Triage
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx @buggers/cli analyze`}
                  </pre>
                </div>
              </div>
            )}

            {/* Webhook Payloads */}
            {activeSection === "api-reference" && (
              <div className="rounded-3xl border border-white/10 bg-[#11141e] p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                  <Code2 className="h-4 w-4" />
                  <span>WEBHOOKS</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Webhook Payloads</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Buggers receives GitHub webhook payloads signed with HMAC-SHA256 headers:
                </p>

                <div className="rounded-2xl bg-black border border-white/10 p-4 font-mono text-xs text-slate-300 space-y-2">
                  <div className="text-[11px] text-slate-500">Headers:</div>
                  <div className="text-amber-300">X-GitHub-Event: pull_request</div>
                  <div className="text-amber-300">X-Hub-Signature-256: sha256=...</div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer - Pinned to bottom */}
      <footer className="border-t border-white/10 bg-black py-10 px-4 sm:px-6 text-xs text-slate-500 mt-auto">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
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
