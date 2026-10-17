import { useState } from "react";
import {
  Download,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  GitBranch,
  ArrowRight,
  Sparkles,
  Laptop,
  Layers,
  FileCode,
  Wrench,
  Eye,
  Lock,
} from "lucide-react";
import { CodeBlock } from "@/components/docs/DocsComponents";

export function VsCodeExtensionSection() {
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedGitHook, setCopiedGitHook] = useState(false);

  const cliCommand = "code --install-extension buggers-vscode-1.1.0.vsix";
  const gitHookCommand = "npx buggers install-hook";

  const handleCopy = (text: string, type: "cli" | "hook") => {
    navigator.clipboard.writeText(text);
    if (type === "cli") {
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    } else {
      setCopiedGitHook(true);
      setTimeout(() => setCopiedGitHook(false), 2000);
    }
  };

  return (
    <section
      id="vscode-extension"
      className="w-full space-y-10 scroll-mt-28 border-t border-white/[0.08] pt-14 sm:pt-16"
    >
      {/* Section Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-4 border-b border-white/[0.06]">
        <div className="lg:col-span-7">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              OFFICIAL EXTENSION · v1.1.0 STABLE
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
            Buggers for VS Code &amp; IDEs
          </h2>
        </div>
        <div className="lg:col-span-5 space-y-2">
          <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
            Shift-left security directly into your local editor. Real-time AST vulnerability scanning, interactive Flaw Inspector Webview, side-by-side split diff remediation, and automated pre-commit Git hooks.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="https://github.com/jaidevxr/buggers/releases/tag/v1.1.0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors group cursor-pointer"
            >
              <span>GitHub Release v1.1.0</span>
              <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <span className="text-neutral-600">·</span>
            <a
              href="https://github.com/jaidevxr/buggers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors group cursor-pointer"
            >
              <span>Repository Source</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Hero Download & Quick Action Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Direct VSIX Download */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-[#0d0f12] to-[#08080a] p-6 flex flex-col justify-between space-y-5 relative overflow-hidden shadow-[0_10px_40px_rgba(16,185,129,0.06)] group hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 inline-block">
                <Download className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                50.2 KB VSIX
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight">Direct VSIX Download</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                Download the standalone production package ready for 1-click installation in VS Code, Cursor, Antigravity IDE, or VSCodium.
              </p>
            </div>
          </div>

          <div className="space-y-2 relative z-10 pt-2">
            <a
              href="/downloads/buggers-vscode-1.1.0.vsix"
              download="buggers-vscode-1.1.0.vsix"
              className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download .VSIX (v1.1.0)</span>
            </a>
            <p className="text-[10px] text-center font-mono text-neutral-500">
              SHA-256 verified · Fully offline capable
            </p>
          </div>
        </div>

        {/* Card 2: Terminal 1-Click Install */}
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111317] via-[#0b0c0e] to-[#070708] p-6 flex flex-col justify-between space-y-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 inline-block">
                <Terminal className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                CLI Command
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight">Command Line Install</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                Install directly into your terminal or automation scripts with standard Visual Studio Code CLI tooling.
              </p>
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="p-2.5 rounded-xl bg-black/80 border border-white/[0.08] flex items-center justify-between gap-2 font-mono text-[11px] text-neutral-300">
              <span className="truncate">{cliCommand}</span>
              <button
                type="button"
                onClick={() => handleCopy(cliCommand, "cli")}
                className="p-1.5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Copy command"
              >
                {copiedCli ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-center font-mono text-neutral-500">
              Works across macOS, Linux, and Windows PowerShell
            </p>
          </div>
        </div>

        {/* Card 3: Pre-Commit Git Hook */}
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111317] via-[#0b0c0e] to-[#070708] p-6 flex flex-col justify-between space-y-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 inline-block">
                <GitBranch className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-mono text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                Pre-Commit Guard
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight">Pre-Commit Git Hook</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                Intercept staged commits locally to prevent leaking credentials, AWS keys, or SQL injections into Git history.
              </p>
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <div className="p-2.5 rounded-xl bg-black/80 border border-white/[0.08] flex items-center justify-between gap-2 font-mono text-[11px] text-neutral-300">
              <span className="truncate">Buggers: Install Pre-Commit Git Hook</span>
              <span className="text-[10px] text-neutral-500 font-sans shrink-0">In VS Code</span>
            </div>
            <p className="text-[10px] text-center font-mono text-neutral-500">
              Writes to .git/hooks/pre-commit automatically
            </p>
          </div>
        </div>
      </div>

      {/* Feature Architecture Matrix */}
      <div className="w-full border-y border-white/[0.08] py-8 space-y-8">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono">
          <span className="text-white font-semibold uppercase tracking-wider">
            Engine Capabilities &amp; In-Editor Modules
          </span>
          <span className="text-neutral-400 font-mono">29/29 Test Suites Passing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0d10] space-y-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Eye className="h-4 w-4" />
              </span>
              <h4 className="text-sm font-semibold text-white">Flaw Inspector Webview</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Click any highlighted finding to launch a dedicated webview sidebar displaying CWE risk classification, severity scoring, and plain-English remediation advice.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0d10] space-y-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-white/10 text-neutral-200 border border-white/20">
                <FileCode className="h-4 w-4" />
              </span>
              <h4 className="text-sm font-semibold text-white">Side-by-Side Diff Preview</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Compare original vulnerable code against proposed fixes side-by-side using native VS Code diff views before making any disk edits.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0d10] space-y-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Wrench className="h-4 w-4" />
              </span>
              <h4 className="text-sm font-semibold text-white">1-Click Batch Remediation</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Apply individual remedies or trigger a batch workspace fix to resolve all detected vulnerabilities across your codebase simultaneously.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0d10] space-y-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <h4 className="text-sm font-semibold text-white">CodeLens &amp; Hover Insights</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Non-intrusive annotations appear directly above affected functions with one-click actions: Inspect Flaw, Apply Fix, or Dismiss.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0d10] space-y-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Lock className="h-4 w-4" />
              </span>
              <h4 className="text-sm font-semibold text-white">Zero Cloud Leakage</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              AST parsing and pattern matching run completely local in your IDE process. Your confidential code never leaves your workstation during local scans.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0d10] space-y-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Laptop className="h-4 w-4" />
              </span>
              <h4 className="text-sm font-semibold text-white">Universal IDE Support</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Engineered with pure VS Code Extension APIs for 100% compatibility across VS Code, Cursor, Antigravity IDE, Windsurf, and VSCodium.
            </p>
          </div>
        </div>
      </div>

      {/* Command Palette Reference Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white flex items-center gap-2">
            <Terminal className="h-4 w-4 text-neutral-300" />
            <span>Command Palette Actions &amp; Keybindings</span>
          </h3>
          <span className="text-[11px] font-mono text-neutral-500">Ctrl+Shift+P / Cmd+Shift+P</span>
        </div>

        <div className="overflow-x-auto text-xs border-y border-white/[0.08]">
          <table className="w-full text-left">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-neutral-400 text-[11px] font-mono">
              <tr>
                <th className="py-3 px-4 font-medium">Command</th>
                <th className="py-3 px-4 font-medium">Shortcut</th>
                <th className="py-3 px-4 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-neutral-300 font-mono text-[11px]">
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 text-white font-semibold">Buggers: Scan Workspace for Vulnerabilities</td>
                <td className="py-3 px-4 text-emerald-400">Ctrl+Shift+B / Cmd+Shift+B</td>
                <td className="py-3 px-4 text-neutral-400 font-sans">Scans active workspace files and populates diagnostic problems.</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 text-white font-semibold">Buggers: Inspect Flaw in Webview</td>
                <td className="py-3 px-4 text-neutral-400">Context Menu</td>
                <td className="py-3 px-4 text-neutral-400 font-sans">Opens the rich Webview panel with side-by-side diff remediation.</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 text-white font-semibold">Buggers: Apply All Auto-Fixes (Batch)</td>
                <td className="py-3 px-4 text-neutral-400">Command Palette</td>
                <td className="py-3 px-4 text-neutral-400 font-sans">Automatically resolves every detected vulnerability across workspace.</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 text-white font-semibold">Buggers: Install Pre-Commit Git Hook</td>
                <td className="py-3 px-4 text-neutral-400">Command Palette</td>
                <td className="py-3 px-4 text-neutral-400 font-sans">Installs .git/hooks/pre-commit to prevent committing critical defects.</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 text-white font-semibold">Buggers: Clear Diagnostics</td>
                <td className="py-3 px-4 text-neutral-400">Command Palette</td>
                <td className="py-3 px-4 text-neutral-400 font-sans">Resets diagnostic problem markers and cleans up webview state.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Installation Instructions */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Laptop className="h-4 w-4 text-emerald-400" />
          <span>Manual Installation in 3 Simple Steps</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-mono">1</span>
              <span>Download .VSIX</span>
            </div>
            <p className="text-neutral-400 leading-relaxed font-sans">
              Click the <a href="/downloads/buggers-vscode-1.1.0.vsix" download className="text-white underline">Download .VSIX (v1.1.0)</a> button above to save the package to your machine.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-mono">2</span>
              <span>Install in VS Code</span>
            </div>
            <p className="text-neutral-400 leading-relaxed font-sans">
              Open VS Code, press <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">Ctrl+Shift+P</code>, select <strong className="text-white">Extensions: Install from VSIX...</strong> and pick the downloaded file.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-mono">3</span>
              <span>Run First Scan</span>
            </div>
            <p className="text-neutral-400 leading-relaxed font-sans">
              Press <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">Ctrl+Shift+B</code> in any project to scan your files and preview instant inline remedies.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
