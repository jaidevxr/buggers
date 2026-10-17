import { useState } from "react";
import {
  Download,
  Terminal,
  ExternalLink,
  Check,
  Copy,
  GitBranch,
  ArrowRight,
  Sparkles,
  Laptop,
  FileCode,
  Wrench,
  Eye,
  Lock,
  RotateCcw,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

export function VsCodeExtensionSection() {
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedGitHook, setCopiedGitHook] = useState(false);
  const [diffViewMode, setDiffViewMode] = useState<"diff" | "remedy">("diff");
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<number>(0);

  const cliCommand = "code --install-extension buggers-vscode-1.2.0.vsix";
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

  const findingsList = [
    {
      cwe: "CWE-208",
      severity: "CRITICAL",
      title: "Timing Attack in Signature Check",
      file: "src/auth/verify.ts:42",
      vuln: "if (userProvidedToken === serverSecret) {",
      fix: "if (crypto.timingSafeEqual(userBuf, secretBuf)) {",
      explanation: "Direct string equality comparison leaks timing side-channel data on byte mismatches.",
    },
    {
      cwe: "CWE-89",
      severity: "CRITICAL",
      title: "SQL Injection in Query Interpolation",
      file: "src/db/users.ts:18",
      vuln: "const sql = `SELECT * FROM users WHERE id = '${id}'`;",
      fix: "const sql = 'SELECT * FROM users WHERE id = $1'; [id]",
      explanation: "Dynamic template string concatenation bypasses prepared statement parameterization.",
    },
    {
      cwe: "CWE-1321",
      severity: "HIGH",
      title: "Prototype Pollution in Object Merge",
      file: "src/utils/config.ts:88",
      vuln: "target[key] = source[key]; // recursive merge",
      fix: "if (key !== '__proto__' && key !== 'constructor') target[key] = ...",
      explanation: "Unvalidated object key traversal permits attacker overriding Object prototype methods.",
    },
  ];

  const triggerMockScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  const activeFinding = findingsList[selectedFinding] ?? findingsList[0]!;

  return (
    <section
      id="vscode-extension"
      className="w-full space-y-12 scroll-mt-28 border-t border-white/[0.04] pt-16 sm:pt-20 pb-20 relative overflow-hidden bg-[#000000]"
    >
      {/* Pure Pitch Black Ambient Atmosphere & Linear Dissolve Mask */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#020203] to-[#000000] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.06),_transparent_70%)] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.04),_transparent_70%)] blur-3xl pointer-events-none" />

      {/* Top & Bottom Black Gradient Fades at Section Borders (Reference Parity) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#000000] via-[#000000]/85 to-transparent z-20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#000000] via-[#000000]/90 to-transparent z-20" />

      {/* Relative Content Container */}
      <div className="relative z-10 space-y-12">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-6 border-b border-white/[0.04]">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-400/90 font-semibold px-2.5 py-0.5 rounded-full bg-[#010a05] border border-emerald-950/80 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SPECIFICATION 09 · OFFICIAL VS CODE EXTENSION
              </span>
              <span className="text-[11px] font-mono text-neutral-400 bg-white/[0.02] border border-white/[0.05] px-2 py-0.5 rounded-full">
                v1.2.0 STABLE · DIRECT INSTALL
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.08]">
              Shift left to your editor with Buggers IDE
            </h2>
          </div>
          <div className="lg:col-span-5 space-y-3">
            <p className="text-base sm:text-lg text-[#8a8f98] font-normal leading-relaxed max-w-md">
              Catch security vulnerabilities, hardcoded tokens, and logical defects before you git commit. AST diagnostics, Webview Flaw Inspector, side-by-side diff previews, and pre-commit Git hooks.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://github.com/jaidevxr/buggers/releases/tag/v1.2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400/90 hover:text-emerald-300 transition-colors group cursor-pointer"
              >
                <span>GitHub Release v1.2.0</span>
                <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
              <span className="text-neutral-700">·</span>
              <a
                href="https://github.com/jaidevxr/buggers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors group cursor-pointer"
              >
                <span>Source in /extensions/buggers-vscode</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Hero Download & Quick Action Showcase Cards with Darkest Shades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Direct VSIX Download */}
          <div className="rounded-2xl border border-emerald-950/70 bg-gradient-to-b from-[#010603] via-[#010302] to-[#000000] p-6 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] group hover:border-emerald-900/90 hover:-translate-y-1 transition-all duration-300">
            {/* Top light beam animation in darkest emerald */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-75 animate-beam-scan" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-950/20 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-950/30 transition-all duration-500" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="p-3 rounded-xl bg-[#010804] border border-emerald-950/80 text-emerald-400/90 inline-block">
                  <Download className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-mono text-emerald-400/90 font-semibold px-2.5 py-0.5 rounded-full bg-[#010a05] border border-emerald-950/90">
                  73.6 KB VSIX
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                  <span>Direct VSIX Package</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/[0.04] text-neutral-400 font-mono font-normal">v1.2.0</span>
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-2 font-normal">
                  Production binary packaged with native assets, 21 OWASP rules, 7 secret scanners, and offline AST engine. Compatible with VS Code, Cursor, Antigravity IDE, and VSCodium.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 relative z-10 pt-2">
              <a
                href="/downloads/buggers-vscode-1.2.0.vsix"
                download="buggers-vscode-1.2.0.vsix"
                className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all shadow-[0_4px_25px_rgba(255,255,255,0.12)] cursor-pointer group/btn"
              >
                <Download className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5" />
                <span>Download .VSIX (v1.2.0)</span>
              </a>
              <p className="text-[10px] text-center font-mono text-neutral-600">
                Offline AST engine · Zero telemetry tracking
              </p>
            </div>
          </div>

          {/* Card 2: Terminal 1-Click Install */}
          <div className="rounded-2xl border border-white/[0.04] bg-gradient-to-b from-[#030304] via-[#010102] to-[#000000] p-6 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-white/15 hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="p-3 rounded-xl bg-[#050505] border border-white/[0.04] text-neutral-300 inline-block">
                  <Terminal className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-mono text-neutral-400 px-2.5 py-0.5 rounded-full bg-[#050505] border border-white/[0.04]">
                  CLI Automation
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white tracking-tight">Command Line Install</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-2 font-normal">
                  Install with standard VS Code CLI flags across macOS, Linux, or Windows PowerShell without touching a web browser.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 relative z-10">
              <div className="p-3 rounded-xl bg-[#000000] border border-white/[0.04] flex items-center justify-between gap-2 font-mono text-[11px] text-neutral-300 shadow-inner group/cmd">
                <span className="truncate text-emerald-400/90">{cliCommand}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(cliCommand, "cli")}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-neutral-500 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Copy command"
                >
                  {copiedCli ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans font-semibold">
                      <Check className="h-3.5 w-3.5" /> Copied
                    </span>
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-center font-mono text-neutral-600">
                Or drag &amp; drop the .vsix into your VS Code Extensions tab
              </p>
            </div>
          </div>

          {/* Card 3: Pre-Commit Git Hook */}
          <div className="rounded-2xl border border-amber-950/70 bg-gradient-to-b from-[#060301] via-[#020100] to-[#000000] p-6 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-amber-900/90 hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="p-3 rounded-xl bg-[#0a0501] border border-amber-950/80 text-amber-400/90 inline-block">
                  <GitBranch className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-mono text-amber-400/90 px-2.5 py-0.5 rounded-full bg-[#0a0501] border border-amber-950/90">
                  Hard Block Gate
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white tracking-tight">Pre-Commit Git Guard</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mt-2 font-normal">
                  Prevent accidental git commits containing AWS secrets, private RSA keys, or SQL injection vectors right at your terminal prompt.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 relative z-10">
              <div className="p-3 rounded-xl bg-[#000000] border border-white/[0.04] flex items-center justify-between gap-2 font-mono text-[11px] text-neutral-300 shadow-inner">
                <span className="truncate text-amber-400/90">{gitHookCommand}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(gitHookCommand, "hook")}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-neutral-500 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Copy command"
                >
                  {copiedGitHook ? (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-sans font-semibold">
                      <Check className="h-3.5 w-3.5" /> Copied
                    </span>
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-center font-mono text-neutral-600">
                Writes to .git/hooks/pre-commit with zero external dependencies
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Interactive In-Editor Webview & Diff Preview Showcase */}
        {/* Linear Open Hairline with Seamless Dissolve & Black Gradient Fades */}
        {/* ============================================================== */}
        <div className="w-full border-y border-white/[0.05] bg-[#000000] relative overflow-hidden linear-preview-fade-both shadow-2xl">
          {/* Radial Center Vignette & Black Border Edge Overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#000000_100%)] pointer-events-none z-10" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000000] to-transparent z-20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#000000] to-transparent z-20" />

          {/* Editor Header Bar with Tab Switchers */}
          <div className="p-4 sm:p-5 border-b border-white/[0.04] bg-[#010102] flex flex-wrap items-center justify-between gap-4 relative z-20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-950 border border-rose-800/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-950 border border-amber-800/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-950 border border-emerald-800/80 inline-block" />
              </div>
              <span className="text-neutral-700">|</span>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <BugMark className="h-3.5 w-3.5 text-white fill-white" />
                <span className="text-white font-semibold">Buggers Flaw Inspector (Webview Simulator)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerMockScan}
                disabled={isScanning}
                className="px-3 py-1.5 rounded-lg bg-[#010a05] border border-emerald-950/80 text-emerald-400/90 hover:bg-[#021208] text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className={`h-3 w-3 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? "Running AST Scan..." : "Scan Buffer"}</span>
              </button>
              <div className="inline-flex rounded-lg bg-black p-0.5 border border-white/[0.04] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setDiffViewMode("diff")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    diffViewMode === "diff" ? "bg-white/[0.06] text-white font-semibold" : "text-neutral-500 hover:text-white"
                  }`}
                >
                  Split Diff
                </button>
                <button
                  type="button"
                  onClick={() => setDiffViewMode("remedy")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    diffViewMode === "remedy" ? "bg-white/[0.06] text-white font-semibold" : "text-neutral-500 hover:text-white"
                  }`}
                >
                  Remedy Advice
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Split Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.04] relative z-10">
            {/* Left: Findings Explorer List */}
            <div className="lg:col-span-4 p-4 sm:p-5 space-y-3 bg-[#000000]">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-500 pb-2 border-b border-white/[0.04]">
                <span>DIAGNOSTICS ({findingsList.length} FLAWS FOUND)</span>
                <span className="text-emerald-400/80">Ctrl+Shift+B</span>
              </div>

              <div className="space-y-2">
                {findingsList.map((item, idx) => (
                  <button
                    key={item.cwe}
                    type="button"
                    onClick={() => setSelectedFinding(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedFinding === idx
                        ? "bg-[#040404] border-emerald-950/70 shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                        : "bg-[#010101] border-white/[0.02] hover:bg-[#030303] hover:border-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/40 text-rose-400/90 font-semibold">
                        {item.cwe} · {item.severity}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">{item.file}</span>
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                    <div className="text-[11px] text-neutral-500 mt-1 line-clamp-1">{item.explanation}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Rich Webview Inspector / Side-by-Side Diff */}
            <div className="lg:col-span-8 p-5 sm:p-7 space-y-5 bg-[#000000] relative">
              {/* Scanline animation while scanning */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent animate-scanline z-30" />
              )}

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider block">
                    ACTIVE INSPECTION
                  </span>
                  <h4 className="text-base font-semibold text-white mt-0.5">
                    {activeFinding.title}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-neutral-500">{activeFinding.file}</span>
                  <span className="block text-[11px] text-emerald-400/90 font-mono">1-Click Auto-Fix Available</span>
                </div>
              </div>

              {diffViewMode === "diff" ? (
                /* Native Side-by-side Diff View Simulation with Darkest Shades */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Vulnerable Original in Darkest Crimson Black */}
                  <div className="rounded-xl border border-rose-950/50 bg-[#050102] p-4 space-y-2">
                    <div className="text-[11px] font-semibold text-rose-400/90 flex items-center justify-between">
                      <span>BEFORE (VULNERABLE)</span>
                      <span className="text-rose-400/80">Line 42</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#000000] border border-rose-950/40 text-rose-300/90 overflow-x-auto">
                      <code>{activeFinding.vuln}</code>
                    </div>
                    <p className="text-[11px] text-rose-400/70 leading-relaxed font-sans pt-1">
                      Fails deterministic AST check. Identified as non-constant comparison.
                    </p>
                  </div>

                  {/* Remediated Proposal in Darkest Forest Emerald Black */}
                  <div className="rounded-xl border border-emerald-950/50 bg-[#010502] p-4 space-y-2">
                    <div className="text-[11px] font-semibold text-emerald-400/90 flex items-center justify-between">
                      <span>PROPOSED REMEDY (SAFE)</span>
                      <span className="text-emerald-400/80">Patched</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#000000] border border-emerald-950/40 text-emerald-300/90 overflow-x-auto">
                      <code>{activeFinding.fix}</code>
                    </div>
                    <p className="text-[11px] text-emerald-400/70 leading-relaxed font-sans pt-1">
                      Deterministic constant-time validation. Prevents byte timing side-channel leakage.
                    </p>
                  </div>
                </div>
              ) : (
                /* Plain English Technical Remediation Advice */
                <div className="p-5 rounded-xl border border-white/[0.04] bg-[#020202] space-y-3">
                  <h5 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                    Engineering Remediation Guidance
                  </h5>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {activeFinding.explanation}
                  </p>
                  <div className="p-3 rounded-lg bg-[#000000] border border-white/[0.04] font-mono text-xs text-emerald-400/90">
                    <code>{activeFinding.fix}</code>
                  </div>
                </div>
              )}

              {/* Bottom Webview Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.04] text-xs">
                <div className="flex items-center gap-2 text-neutral-500 font-mono text-[11px]">
                  <span>Status: Diagnostic Flagged</span>
                  <span>·</span>
                  <span className="text-white">Press Enter to Apply Fix</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alert("Simulated: Applied inline patch to " + activeFinding.file)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Apply Auto-Fix
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Simulated: Generated regression test file")}
                    className="px-3.5 py-1.5 rounded-lg bg-[#050505] hover:bg-[#0a0a0a] border border-white/[0.06] text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Generate Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Architecture Matrix in Darkest Monochrome Shades */}
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 text-xs font-mono">
            <span className="text-white font-semibold uppercase tracking-wider">
              Extension Architecture &amp; Local Scanning Engines
            </span>
            <span className="text-emerald-400/90 font-mono">38/38 Production Test Suites Passing (100% Green)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.03] bg-[#010101] hover:bg-[#030303] hover:border-white/[0.08] space-y-3 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-[#010603] text-emerald-400/90 border border-emerald-950/60">
                  <Eye className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-semibold text-white">Flaw Inspector Webview</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Dedicated webview panel displaying CWE risk taxonomy, severity calibration, and side-by-side patch remediation with one-click disk edits.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.03] bg-[#010101] hover:bg-[#030303] hover:border-white/[0.08] space-y-3 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-[#040404] text-neutral-300 border border-white/[0.05]">
                  <FileCode className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-semibold text-white">Side-by-Side Diff Preview</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Inspect modified code blocks side-by-side using native VS Code diff documents before committing changes to disk.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.03] bg-[#010101] hover:bg-[#030303] hover:border-white/[0.08] space-y-3 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-[#060301] text-amber-400/90 border border-amber-950/60">
                  <Wrench className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-semibold text-white">1-Click Batch Remediation</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Apply pinpoint AST remedies individually or trigger workspace batch execution to resolve all detected vulnerabilities across your codebase simultaneously.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.03] bg-[#010101] hover:bg-[#030303] hover:border-white/[0.08] space-y-3 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-[#050108] text-purple-400/90 border border-purple-950/60">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-semibold text-white">AI Assistant with Consent Gate</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Opt-in AI debugging commands (<code className="text-white font-mono">buggers.explainFinding</code>, <code className="text-white font-mono">buggers.debugSelection</code>) with explicit user consent gates and reviewable diffs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.03] bg-[#010101] hover:bg-[#030303] hover:border-white/[0.08] space-y-3 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-[#060102] text-rose-400/90 border border-rose-950/60">
                  <Lock className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-semibold text-white">Zero Cloud Leakage</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                All 21 OWASP security scanners and logical bug rules execute strictly in-process inside your local editor instance. Confidential code never leaves your computer.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.03] bg-[#010101] hover:bg-[#030303] hover:border-white/[0.08] space-y-3 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-[#010306] text-sky-400/90 border border-sky-950/60">
                  <Laptop className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-semibold text-white">Universal IDE Ecosystem</h4>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Engineered with pure VS Code Extension APIs for seamless operation in Visual Studio Code, Cursor, Antigravity IDE, Windsurf, and VSCodium.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Command Palette Actions & Keybindings Table */}
        {/* With Black Gradient Dissolve at Border (Reference Parity) */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-neutral-400" />
              <span>Command Palette Actions &amp; Keybindings</span>
            </h3>
            <span className="text-[11px] font-mono text-neutral-500">Ctrl+Shift+P / Cmd+Shift+P</span>
          </div>

          <div className="relative overflow-hidden linear-preview-fade-bottom border-y border-white/[0.05] bg-[#000000]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#000000_100%)] pointer-events-none z-10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#000000] to-transparent z-20" />

            <div className="overflow-x-auto text-xs relative z-0">
              <table className="w-full text-left">
                <thead className="border-b border-white/[0.04] bg-[#020202] text-neutral-400 text-[11px] font-mono">
                  <tr>
                    <th className="py-3 px-4 font-medium">Command</th>
                    <th className="py-3 px-4 font-medium">Shortcut / Trigger</th>
                    <th className="py-3 px-4 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02] text-neutral-300 font-mono text-[11px]">
                  <tr className="hover:bg-white/[0.015] transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">Buggers: Scan Workspace for Vulnerabilities</td>
                    <td className="py-3 px-4 text-emerald-400/90">Ctrl+Shift+B / Cmd+Shift+B</td>
                    <td className="py-3 px-4 text-neutral-400 font-sans">Scans active workspace files and populates diagnostic problems.</td>
                  </tr>
                  <tr className="hover:bg-white/[0.015] transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">Buggers: Inspect Flaw in Webview</td>
                    <td className="py-3 px-4 text-neutral-400">Editor Context Menu</td>
                    <td className="py-3 px-4 text-neutral-400 font-sans">Opens the rich Webview panel with side-by-side diff remediation.</td>
                  </tr>
                  <tr className="hover:bg-white/[0.015] transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">Buggers: Explain Finding (AI)</td>
                    <td className="py-3 px-4 text-purple-400/90">Sidebar Action</td>
                    <td className="py-3 px-4 text-neutral-400 font-sans">Deep dive into underlying threat mechanics with consent-gated AI.</td>
                  </tr>
                  <tr className="hover:bg-white/[0.015] transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">Buggers: Generate Regression Test</td>
                    <td className="py-3 px-4 text-neutral-400">Command Palette</td>
                    <td className="py-3 px-4 text-neutral-400 font-sans">Creates runnable test suite asserting that the vulnerability stays fixed.</td>
                  </tr>
                  <tr className="hover:bg-white/[0.015] transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">Buggers: Install Pre-Commit Git Hook</td>
                    <td className="py-3 px-4 text-amber-400/90">Command Palette</td>
                    <td className="py-3 px-4 text-neutral-400 font-sans">Installs .git/hooks/pre-commit to prevent committing critical defects.</td>
                  </tr>
                  <tr className="hover:bg-white/[0.015] transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">Buggers: Apply All Auto-Fixes (Batch)</td>
                    <td className="py-3 px-4 text-neutral-400">Command Palette</td>
                    <td className="py-3 px-4 text-neutral-400 font-sans">Automatically resolves every detected vulnerability across workspace.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3-Step Manual Installation Card */}
        <div className="rounded-2xl border border-white/[0.04] bg-[#020202] p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#000000] to-transparent z-10" />

          <h3 className="text-base font-semibold text-white flex items-center gap-2 relative z-20">
            <Laptop className="h-4 w-4 text-emerald-400/90" />
            <span>Manual Installation in 3 Simple Steps</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs relative z-20">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-neutral-300">1</span>
                <span>Download .VSIX</span>
              </div>
              <p className="text-neutral-400 leading-relaxed font-sans">
                Click the <a href="/downloads/buggers-vscode-1.2.0.vsix" download className="text-emerald-400/90 underline font-medium hover:text-emerald-300">Download .VSIX (v1.2.0)</a> button above to save the package to your machine.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-neutral-300">2</span>
                <span>Install in VS Code</span>
              </div>
              <p className="text-neutral-400 leading-relaxed font-sans">
                Open VS Code, press <code className="text-white font-mono bg-black/90 border border-white/[0.04] px-1 py-0.5 rounded">Ctrl+Shift+P</code>, select <strong className="text-white">Extensions: Install from VSIX...</strong> and pick the downloaded file.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-neutral-300">3</span>
                <span>Run First Scan</span>
              </div>
              <p className="text-neutral-400 leading-relaxed font-sans">
                Press <code className="text-white font-mono bg-black/90 border border-white/[0.04] px-1 py-0.5 rounded">Ctrl+Shift+B</code> in any project to scan your files and preview instant inline remedies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
