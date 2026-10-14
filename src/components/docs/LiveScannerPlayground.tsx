import { useState } from "react";
import { Shield, Lock, AlertTriangle, Check, Copy, Terminal, Sparkles, RefreshCw } from "lucide-react";
import { SECRET_RULES, SAST_RULES } from "@/lib/scanner-rules";

interface SampleSnippet {
  id: string;
  name: string;
  category: "Secret Leak" | "OWASP SAST" | "Clean Verified";
  code: string;
}

const SAMPLE_SNIPPETS: SampleSnippet[] = [
  {
    id: "sample-aws",
    name: "AWS Key + Raw SQL (High Risk)",
    category: "Secret Leak",
    code: `// src/server/storage.ts
import AWS from "aws-sdk";

export async function uploadAsset(req, res) {
  const s3 = new AWS.S3({
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  });
  
  // Vulnerable raw query interpolation:
  const query = "SELECT * FROM assets WHERE user_id = '" + req.query.id + "'";
  return db.query(query);
}`,
  },
  {
    id: "sample-github-exec",
    name: "GitHub PAT + Command Injection",
    category: "OWASP SAST",
    code: `// src/server/git.ts
const { exec } = require("child_process");

export function fetchBranch(token: string, branchName: string) {
  const ghToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyzAB";
  
  // Vulnerable shell interpolation (Command Injection):
  exec("git clone https://" + ghToken + "@github.com/org/repo.git -b " + branchName, (err) => {
    if (err) console.error(err);
  });
}`,
  },
  {
    id: "sample-clean",
    name: "Clean Hardened Patch (Zero Findings)",
    category: "Clean Verified",
    code: `// src/server/auth.ts
import { timingSafeEqual } from "crypto";

export async function verifySignature(userToken: string, expectedHash: string) {
  const userBuf = Buffer.from(userToken);
  const hashBuf = Buffer.from(expectedHash);
  
  // Constant-time comparison:
  if (userBuf.length === hashBuf.length && timingSafeEqual(userBuf, hashBuf)) {
    // Parameterized SQL query:
    return db.query("SELECT id, email FROM users WHERE token = $1", [userToken]);
  }
  return null;
}`,
  },
];

export function LiveScannerPlayground() {
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>("sample-aws");
  const [customCode, setCustomCode] = useState<string>(SAMPLE_SNIPPETS[0]!.code);
  const [copiedRegex, setCopiedRegex] = useState<string | null>(null);

  const handleSelectSnippet = (snippet: SampleSnippet) => {
    setSelectedSnippetId(snippet.id);
    setCustomCode(snippet.code);
  };

  // Run in-browser detection using genuine Buggers rules
  const detectedSecrets = SECRET_RULES.flatMap((rule) => {
    const matches: { ruleName: string; match: string; line: number; rec: string }[] = [];
    const lines = customCode.split("\n");
    lines.forEach((line, lineIdx) => {
      // Create fresh regex instance to avoid stateful /g index bugs
      const rx = new RegExp(rule.pattern.source, rule.pattern.flags);
      const m = rx.exec(line);
      if (m && m[0]) {
        matches.push({
          ruleName: rule.name,
          match: m[0],
          line: lineIdx + 1,
          rec: rule.recommendation,
        });
      }
    });
    return matches;
  });

  const detectedSast = SAST_RULES.flatMap((rule) => {
    const matches: { ruleName: string; severity: string; match: string; line: number; why: string }[] = [];
    const lines = customCode.split("\n");
    lines.forEach((line, lineIdx) => {
      const rx = new RegExp(rule.pattern.source, rule.pattern.flags);
      const m = rx.exec(line);
      if (m && m[0]) {
        matches.push({
          ruleName: rule.name,
          severity: rule.severity,
          match: m[0],
          line: lineIdx + 1,
          why: rule.whyItMatters,
        });
      }
    });
    return matches;
  });

  const totalFindings = detectedSecrets.length + detectedSast.length;

  const copyRegexToClipboard = (source: string, id: string) => {
    navigator.clipboard.writeText(source);
    setCopiedRegex(id);
    setTimeout(() => setCopiedRegex(null), 2000);
  };

  return (
    <div className="w-full space-y-8">
      {/* Interactive Playground Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-rose-400" />
          <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
            Interactive In-Process Scanner Testbed
          </span>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_SNIPPETS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectSnippet(s)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                selectedSnippetId === s.id
                  ? "bg-white text-black font-semibold"
                  : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Detection Results Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Code Input & Editor Window */}
        <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#07080a] overflow-hidden shadow-2xl">
          <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono text-neutral-400">
            <span className="text-neutral-300">diff --git a/test.ts b/test.ts</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500">Live Regex Evaluation</span>
              <button
                type="button"
                onClick={() => setCustomCode(SAMPLE_SNIPPETS.find((s) => s.id === selectedSnippetId)?.code || "")}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                title="Reset sample code"
              >
                <RefreshCw className="h-2.5 w-2.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <textarea
              value={customCode}
              onChange={(e) => {
                setCustomCode(e.target.value);
                setSelectedSnippetId("custom");
              }}
              rows={12}
              spellCheck={false}
              className="w-full bg-transparent font-mono text-xs text-neutral-200 leading-relaxed focus:outline-none resize-none selection:bg-rose-500/30"
              placeholder="Paste custom diff code here to test against in-process scanners..."
            />
          </div>
        </div>

        {/* Right: Live Findings Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
              Scanner Output
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                totalFindings === 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
              }`}
            >
              {totalFindings === 0 ? "PASSED — 0 FLAWS" : `${totalFindings} FINDINGS DETECTED`}
            </span>
          </div>

          <div className="space-y-3">
            {totalFindings === 0 && (
              <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <Check className="h-4 w-4" />
                  <span>Verified Clean Patch</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Zero plaintext credentials or OWASP Top 10 injection vulnerabilities were detected. This diff passes deterministic pre-execution gates with zero token spend.
                </p>
              </div>
            )}

            {/* Detected Secrets */}
            {detectedSecrets.map((s, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    <span>{s.ruleName}</span>
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400">Line {s.line}</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-300 bg-black/50 p-2 rounded border border-white/[0.04] truncate">
                  Matched: <span className="text-amber-300 font-bold">{s.match}</span>
                </div>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  {s.rec}
                </p>
              </div>
            ))}

            {/* Detected SAST Findings */}
            {detectedSast.map((s, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.04] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{s.ruleName}</span>
                  </span>
                  <span className="font-mono text-[10px] uppercase text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">
                    {s.severity}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-300 bg-black/50 p-2 rounded border border-white/[0.04] truncate">
                  Line {s.line}: <span className="text-rose-300 font-bold">{s.match}</span>
                </div>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  {s.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Authoritative Verified Scanner Specifications Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/[0.08]">
        {/* 8 Secret Rules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              <span>Plaintext Secret Patterns (8 Rules)</span>
            </h4>
            <span className="text-[10px] font-mono text-neutral-500">In-Process Regex</span>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] divide-y divide-white/[0.04] text-xs font-mono">
            {SECRET_RULES.map((rule) => (
              <div key={rule.id} className="p-3.5 space-y-1.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{rule.name}</span>
                  <button
                    type="button"
                    onClick={() => copyRegexToClipboard(rule.pattern.source, rule.id)}
                    className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 font-sans"
                    title="Copy regex pattern"
                  >
                    {copiedRegex === rule.id ? (
                      <span className="text-emerald-400">Copied</span>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-amber-300/80 bg-black/40 px-2 py-1 rounded truncate border border-white/[0.02]">
                  {rule.pattern.source}
                </div>
                <p className="text-[11px] text-neutral-400 font-sans leading-normal">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 7 SAST Rules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-rose-400" />
              <span>OWASP Top 10 SAST Scanners (7 Rules)</span>
            </h4>
            <span className="text-[10px] font-mono text-neutral-500">Zero Token Inference</span>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] divide-y divide-white/[0.04] text-xs font-mono">
            {SAST_RULES.map((rule) => (
              <div key={rule.id} className="p-3.5 space-y-1.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{rule.name}</span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                      rule.severity === "critical"
                        ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                        : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                    }`}
                  >
                    {rule.severity}
                  </span>
                </div>
                <div className="text-[11px] text-rose-300/80 bg-black/40 px-2 py-1 rounded truncate border border-white/[0.02]">
                  {rule.pattern.source}
                </div>
                <p className="text-[11px] text-neutral-400 font-sans leading-normal">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
