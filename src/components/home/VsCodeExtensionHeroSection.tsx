import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Download,
  Terminal,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  FileCode,
  GitBranch,
  Laptop,
} from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

export function VsCodeExtensionHeroSection() {
  const [copied, setCopied] = useState(false);
  const cliCommand = "code --install-extension buggers-vscode-1.2.0.vsix";

  const handleCopy = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section className="relative w-full border-t border-white/[0.04] pt-20 pb-20 overflow-hidden bg-[#000000]">
      {/* Deep Black Fade Gradients & Ambient Studio Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#020203] to-[#000000] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.06),_transparent_70%)] blur-3xl pointer-events-none" />
      
      {/* Black Gradient Fades at Top and Bottom Borders */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#000000] via-[#000000]/85 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#000000] via-[#000000]/90 to-transparent z-10" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Split Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-4 border-b border-white/[0.04]">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-950/80 bg-[#010a05] px-3.5 py-1 text-[11px] font-mono tracking-wider text-emerald-400/90 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.08)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="uppercase font-semibold">Official Extension · v1.2.0 Stable</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              Debug, remediate, and secure <br />
              <span className="font-serif italic font-normal text-white">directly</span> in your IDE
            </h2>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <p className="text-sm sm:text-base text-[#8a8f98] font-normal leading-relaxed">
              Don't wait for remote CI queues. The Buggers VS Code extension scans modified files in real time, displays side-by-side diff previews in an interactive Webview Flaw Inspector, and intercepts vulnerable git commits.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <Link
                to="/docs"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400/90 hover:text-emerald-300 transition-colors group cursor-pointer"
              >
                <span>Read technical extension specification</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Quick Install Card in Darkest Emerald Black */}
          <div className="lg:col-span-5 rounded-2xl border border-emerald-950/70 bg-gradient-to-b from-[#010603] via-[#010302] to-[#000000] p-7 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-[0_12px_45px_rgba(0,0,0,0.8)] group hover:border-emerald-900/90 transition-all duration-300">
            {/* Top beam animation */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-80 animate-beam-scan" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-950/20 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-950/30 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#010804] border border-emerald-950/80 text-white">
                    <BugMark className="h-5 w-5 text-white fill-white" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-semibold text-white block">Buggers for VS Code</span>
                    <span className="text-[10px] font-mono text-emerald-400/90">Release 1.2.0 · Standalone VSIX</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400/90 font-semibold px-2 py-0.5 rounded-full bg-[#010a05] border border-emerald-950/90">
                  73.6 KB
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Package includes offline AST scanner, 21 OWASP vulnerability categories, 7 credential regex formats, 5 logical bug detectors, and consent-gated AI assistant.
              </p>

              {/* Terminal Quick Copy */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-neutral-500">1-Click Terminal Command</span>
                <div className="p-3 rounded-xl bg-[#000000] border border-white/[0.04] flex items-center justify-between gap-2 font-mono text-[11px] text-neutral-300 shadow-inner">
                  <span className="truncate text-emerald-400/90">{cliCommand}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-white/[0.06] text-neutral-500 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Copy command"
                  >
                    {copied ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans font-semibold">
                        <Check className="h-3.5 w-3.5" /> Copied
                      </span>
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Download Button */}
            <div className="space-y-2 relative z-10 pt-2">
              <a
                href="/downloads/buggers-vscode-1.2.0.vsix"
                download="buggers-vscode-1.2.0.vsix"
                className="w-full py-3 px-5 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all shadow-[0_4px_25px_rgba(255,255,255,0.12)] cursor-pointer group/btn"
              >
                <Download className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5" />
                <span>Download Extension .VSIX (v1.2.0)</span>
              </a>
              <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-neutral-600 pt-1">
                <span>VS Code</span>
                <span>·</span>
                <span>Cursor</span>
                <span>·</span>
                <span>Antigravity IDE</span>
                <span>·</span>
                <span>VSCodium</span>
              </div>
            </div>
          </div>

          {/* Right: Interactive Editor & Webview Preview Mockup in Darkest Pitch Black */}
          <div className="lg:col-span-7 rounded-2xl border border-white/[0.04] bg-[#000000] overflow-hidden flex flex-col justify-between shadow-2xl relative">
            {/* Top Editor Tab Bar */}
            <div className="p-3.5 border-b border-white/[0.04] bg-[#010102] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-950 border border-rose-800/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-950 border border-amber-800/80 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-950 border border-emerald-800/80 inline-block" />
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300 text-[11px] bg-white/[0.03] px-2.5 py-1 rounded border border-white/[0.04]">
                  <FileCode className="h-3 w-3 text-emerald-400/90" />
                  <span>auth-handler.ts</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 ml-1 inline-block" />
                </div>
              </div>
              <span className="text-[10px] text-emerald-400/90 uppercase tracking-wider font-semibold">
                ● Live Local Diagnostics Active
              </span>
            </div>

            {/* Split Editor Body Preview */}
            <div className="p-5 sm:p-6 font-mono text-xs space-y-4 bg-[#000000] relative">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#000000] to-transparent z-10" />

              {/* Simulated Code Lens Banner */}
              <div className="flex items-center gap-3 text-[11px] text-neutral-400 pl-2 border-l-2 border-emerald-500/80 bg-[#010804] py-1.5 rounded-r">
                <span className="text-emerald-400/90 font-semibold">Buggers CodeLens:</span>
                <span className="text-white">1 Critical Flaw Detected (CWE-208 Timing Attack)</span>
                <span className="text-neutral-600">·</span>
                <span className="text-emerald-400/80 underline cursor-pointer">Inspect in Webview</span>
                <span className="text-neutral-600">·</span>
                <span className="text-white underline cursor-pointer">1-Click Auto-Fix</span>
              </div>

              {/* Code Snippet with Diff Highlighting in Darkest Shades */}
              <div className="space-y-1 text-[11px] leading-relaxed overflow-x-auto bg-[#020202] p-4 rounded-xl border border-white/[0.03]">
                <div className="text-neutral-600">// Validate signature token with constant-time equality</div>
                <div className="text-neutral-400">export function verifyToken(clientToken: string): boolean &#123;</div>
                <div className="text-rose-300/90 bg-[#060102] px-2 py-0.5 rounded border-l-2 border-rose-950 flex items-center justify-between">
                  <span>-  return clientToken === process.env.API_SECRET;</span>
                  <span className="text-[10px] text-rose-400/80 uppercase font-mono">CWE-208</span>
                </div>
                <div className="text-emerald-300/90 bg-[#010603] px-2 py-0.5 rounded border-l-2 border-emerald-950 flex items-center justify-between">
                  <span>+  return crypto.timingSafeEqual(Buffer.from(clientToken), secretBuf);</span>
                  <span className="text-[10px] text-emerald-400/80 uppercase font-mono">Safe Auto-Fix</span>
                </div>
                <div className="text-neutral-400">&#125;</div>
              </div>

              {/* Bottom Feature Pill Tags in Darkest Shades */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-center font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#010101] border border-white/[0.03] text-neutral-300">
                  <span className="text-emerald-400/90 font-semibold block">0 Cloud Leak</span>
                  <span className="text-[10px] text-neutral-600">Local AST AST</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#010101] border border-white/[0.03] text-neutral-300">
                  <span className="text-white font-semibold block">21 Categories</span>
                  <span className="text-[10px] text-neutral-600">OWASP Top 10</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#010101] border border-white/[0.03] text-neutral-300">
                  <span className="text-amber-400/90 font-semibold block">Pre-Commit</span>
                  <span className="text-[10px] text-neutral-600">Git Hook Shield</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#010101] border border-white/[0.03] text-neutral-300">
                  <span className="text-purple-400/90 font-semibold block">AI Fix Diffs</span>
                  <span className="text-[10px] text-neutral-600">Consent Gated</span>
                </div>
              </div>
            </div>

            {/* Bottom Sub-bar */}
            <div className="p-3 border-t border-white/[0.04] bg-[#010102] flex items-center justify-between text-[11px] font-mono text-neutral-500 px-5 relative z-20">
              <span>Ready in Visual Studio Code Extensions</span>
              <a
                href="/downloads/buggers-vscode-1.2.0.vsix"
                download="buggers-vscode-1.2.0.vsix"
                className="text-emerald-400/90 hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold"
              >
                <span>Download v1.2.0</span>
                <Download className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
