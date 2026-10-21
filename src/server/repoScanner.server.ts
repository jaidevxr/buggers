/**
 * Whole-Repository Codebase Discovery & Multi-Layer Static Analysis Engine
 *
 * Implements Phases 2, 3, and 5 of the Buggers Full Repository Analysis:
 * - Tree-based discovery via GitHub Git Trees API (recursive)
 * - Safe exclusion handling (binaries, vendored, minified, generated)
 * - Transparent inventory tracking (scanned, skipped, unsupported, failed)
 * - Language-aware AST/regex SAST scanning across entire files with exact line numbers
 * - Multi-layer security rules (Injection, SSRF, Deserialization, XSS, Traversal, Crypto, Secrets)
 * - Cross-file taint / source-to-sink heuristic tracing
 * - Code quality and reliability checks (resource leaks, unhandled promises)
 * - Verifiable, zero-hallucination finding generation
 */

import { githubJson } from "@/server/github.server";
import { SAST_RULES } from "@/server/sastScanner.server";
import { SECRET_RULES, maskSecret } from "@/server/secretScanner.server";
import { scanDependencyFile } from "@/server/dependencyScanner.server";
import { logStructured } from "@/server/logger.server";
import { analyzeCodebaseFile } from "@/server/codebaseAnalyzer.server";
import { traceCrossFileTaint } from "@/server/crossFileTracer.server";

export interface GitTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url?: string;
}

export interface GitTreeResponse {
  sha: string;
  url: string;
  tree: GitTreeItem[];
  truncated: boolean;
}

export interface InventoryMetrics {
  totalFilesDiscovered: number;
  scannedFiles: number;
  skippedFiles: number;
  unsupportedFiles: number;
  failedFiles: number;
  skippedPaths: Array<{ path: string; reason: string }>;
  languagesDetected: Record<string, number>;
}

export interface ScannedFileContent {
  path: string;
  content: string;
  size: number;
  language: string;
  sha: string;
}

export interface UnifiedRepositoryFinding {
  id: string;
  file_path: string;
  line_number: number | null;
  line_end?: number | null;
  title: string;
  description: string;
  why_it_matters?: string | null;
  evidence?: string | null;
  suggested_fix?: string | null;
  severity: "critical" | "high" | "medium" | "low";
  category: "security" | "quality";
  confidence: number;
  source: "sast" | "secrets" | "dependencies" | "dataflow" | "quality" | "history";
  rule_id: string;
  is_historical?: boolean;
  introduced_commit?: string | null;
  fixed_commit?: string | null;
}

// ─── File Classification and Exclusions ─────────────────────────────

const MAX_FILE_SIZE_BYTES = 300 * 1024; // 300 KB max content size per file
const MAX_TOTAL_FILES_TO_SCAN = 250; // Bounded concurrency limit for whole-repo scans

const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "svg", "pdf", "zip", "tar", "gz", "tgz",
  "7z", "rar", "exe", "dll", "so", "dylib", "wasm", "ttf", "woff", "woff2", "eot",
  "mp3", "mp4", "mov", "avi", "webm", "bin", "iso", "pyc", "class", "jar", "o", "obj",
]);

const EXCLUDED_DIR_PATTERNS = [
  /(?:^|\/)\.git\//,
  /(?:^|\/)node_modules\//,
  /(?:^|\/)dist\//,
  /(?:^|\/)build\//,
  /(?:^|\/)\.next\//,
  /(?:^|\/)\.turbo\//,
  /(?:^|\/)coverage\//,
  /(?:^|\/)vendor\//,
  /(?:^|\/)\.venv\//,
  /(?:^|\/)__pycache__\//,
  /(?:^|\/)\.cache\//,
  /(?:^|\/)\.output\//,
  /(?:^|\/)\.vercel\//,
];

const MINIFIED_PATTERNS = [
  /\.min\.(?:js|css)$/i,
  /\.bundle\.(?:js|css)$/i,
  /\.map$/i,
];

export function detectLanguage(filepath: string): string {
  const ext = filepath.split(".").pop()?.toLowerCase() ?? "";
  const filename = filepath.split("/").pop()?.toLowerCase() ?? "";

  if (filename === "dockerfile" || filename.startsWith("dockerfile.")) return "dockerfile";
  if (filename === "makefile" || filename === "gnumakefile") return "makefile";

  switch (ext) {
    case "ts":
    case "tsx":
    case "mts":
    case "cts":
      return "typescript";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "py":
    case "pyw":
      return "python";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "java":
      return "java";
    case "kt":
    case "kts":
      return "kotlin";
    case "swift":
      return "swift";
    case "c":
    case "h":
      return "c";
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
      return "cpp";
    case "cs":
      return "csharp";
    case "rb":
      return "ruby";
    case "php":
      return "php";
    case "sh":
    case "bash":
    case "zsh":
      return "shell";
    case "json":
      return "json";
    case "yaml":
    case "yml":
      return "yaml";
    case "toml":
      return "toml";
    case "sql":
      return "sql";
    case "md":
    case "markdown":
      return "markdown";
    case "html":
    case "htm":
      return "html";
    case "css":
    case "scss":
    case "less":
      return "css";
    default:
      return "text";
  }
}

export function shouldExcludeFile(path: string, size?: number): { exclude: boolean; reason?: string } {
  // Check generated lockfiles
  const filename = path.split("/").pop()?.toLowerCase() ?? "";
  if (
    filename === "package-lock.json" ||
    filename === "yarn.lock" ||
    filename === "pnpm-lock.yaml" ||
    filename === "cargo.lock" ||
    filename === "gemfile.lock" ||
    filename === "poetry.lock"
  ) {
    return { exclude: true, reason: "Generated package lockfile" };
  }

  // Check directory exclusions
  for (const pattern of EXCLUDED_DIR_PATTERNS) {
    if (pattern.test(path)) {
      return { exclude: true, reason: "Vendored/build directory" };
    }
  }

  // Check minified files
  for (const pattern of MINIFIED_PATTERNS) {
    if (pattern.test(path)) {
      return { exclude: true, reason: "Minified/source-map file" };
    }
  }

  // Check binary extensions
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (BINARY_EXTENSIONS.has(ext)) {
    return { exclude: true, reason: "Binary or media asset" };
  }

  // Check file size threshold
  if (size != null && size > MAX_FILE_SIZE_BYTES) {
    return { exclude: true, reason: `File size exceeds ${(MAX_FILE_SIZE_BYTES / 1024).toFixed(0)}KB limit` };
  }

  return { exclude: false };
}

// ─── Repository Inventory Discovery ─────────────────────────────────

export async function discoverRepositoryInventory(
  userId: string,
  repoFullName: string,
  branch: string,
  targetPath?: string,
): Promise<{ eligibleBlobs: GitTreeItem[]; metrics: InventoryMetrics; truncated: boolean }> {
  const treeResp = await githubJson<GitTreeResponse>(
    userId,
    `/repos/${repoFullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );

  const tree = treeResp?.tree ?? [];
  const metrics: InventoryMetrics = {
    totalFilesDiscovered: 0,
    scannedFiles: 0,
    skippedFiles: 0,
    unsupportedFiles: 0,
    failedFiles: 0,
    skippedPaths: [],
    languagesDetected: {},
  };

  const eligibleBlobs: GitTreeItem[] = [];
  const cleanTarget = targetPath ? targetPath.replace(/^\/+/, "") : "";

  for (const item of tree) {
    if (item.type !== "blob") continue;

    if (cleanTarget) {
      const isExact = item.path === cleanTarget;
      const isInDir = item.path.startsWith(cleanTarget.endsWith("/") ? cleanTarget : cleanTarget + "/");
      if (!isExact && !isInDir) continue;
    }

    metrics.totalFilesDiscovered++;

    const filter = shouldExcludeFile(item.path, item.size);
    if (filter.exclude) {
      metrics.skippedFiles++;
      if (metrics.skippedPaths.length < 50) {
        metrics.skippedPaths.push({ path: item.path, reason: filter.reason ?? "Excluded" });
      }
      continue;
    }

    const lang = detectLanguage(item.path);
    metrics.languagesDetected[lang] = (metrics.languagesDetected[lang] ?? 0) + 1;

    eligibleBlobs.push(item);
  }

  // Prioritize security-relevant files (configs, auth, routes, server, handlers)
  eligibleBlobs.sort((a, b) => {
    const isHighPri = (p: string) =>
      /(package\.json|docker|auth|security|route|server|controller|api|config)/i.test(p);
    const scoreA = isHighPri(a.path) ? 1 : 0;
    const scoreB = isHighPri(b.path) ? 1 : 0;
    return scoreB - scoreA;
  });

  return { eligibleBlobs, metrics, truncated: Boolean(treeResp?.truncated) };
}

// ─── Safe Batch File Fetcher ────────────────────────────────────────

export async function fetchFileContents(
  userId: string,
  repoFullName: string,
  blobs: GitTreeItem[],
  maxConcurrency = 5,
): Promise<ScannedFileContent[]> {
  const results: ScannedFileContent[] = [];
  const targetBlobs = blobs.slice(0, MAX_TOTAL_FILES_TO_SCAN);

  for (let i = 0; i < targetBlobs.length; i += maxConcurrency) {
    const chunk = targetBlobs.slice(i, i + maxConcurrency);
    const promises = chunk.map(async (blob) => {
      try {
        const fileData = await githubJson<{
          content?: string;
          encoding?: string;
          size?: number;
        }>(userId, `/repos/${repoFullName}/contents/${encodeURIComponent(blob.path)}?ref=${blob.sha}`);

        if (!fileData?.content) return null;

        const decoded =
          fileData.encoding === "base64"
            ? Buffer.from(fileData.content, "base64").toString("utf-8")
            : fileData.content;

        return {
          path: blob.path,
          content: decoded,
          size: fileData.size ?? decoded.length,
          language: detectLanguage(blob.path),
          sha: blob.sha,
        };
      } catch (err) {
        logStructured("warn", `Failed to fetch repository file: ${blob.path}`, {
          path: blob.path,
          error: err instanceof Error ? err.message : String(err),
        });
        return null;
      }
    });

    const settled = await Promise.all(promises);
    for (const item of settled) {
      if (item) results.push(item);
    }
  }

  return results;
}

// ─── Eval Static Argument Analyzer ──────────────────────────────────

/**
 * Evaluates whether an argument expression passed to eval() is dynamic vs a compile-time string constant.
 *
 * Safe constant formats recognized:
 * - Single-quoted strings: '...' with escaped characters allowed (e.g. 'hello "world"', 'escaped \' quote')
 * - Double-quoted strings: "..." with escaped characters allowed (e.g. "console.log('hi')", "escaped \" quote")
 * - Template literals without interpolation: `...` with NO ${...} expressions
 *
 * Limitations of this heuristic:
 * - Constant string concatenation (e.g. "a" + "b") is conservative and treated as dynamic.
 * - Multi-line eval expressions where arguments span multiple lines are evaluated based on opening line tokens.
 * - This zero-dependency heuristic avoids bundling the heavy TypeScript compiler (8MB+) into serverless runtimes.
 */
export function isDynamicEvalArgument(argText: string): boolean {
  const trimmed = argText.trim();
  if (!trimmed) return false;

  // Single-quoted string literal: '...' with escaped quotes allowed
  const isSingleQuoted = /^'([^'\\]|\\.)*'$/.test(trimmed);
  if (isSingleQuoted) return false;

  // Double-quoted string literal: "..." with escaped quotes allowed
  const isDoubleQuoted = /^"([^"\\]|\\.)*"$/.test(trimmed);
  if (isDoubleQuoted) return false;

  // Template literal WITHOUT interpolation: `...` where $ is not followed by {
  const isSafeTemplateLiteral = /^`([^`\\$]|\\[\s\S]|\$(?!\{))*`$/.test(trimmed);
  if (isSafeTemplateLiteral) return false;

  // Any other argument (variable, property access, concatenation, template with ${...}) is dynamic
  return true;
}

export function hasDynamicEvalExecution(lineText: string): boolean {
  const evalRegex = /\beval\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = evalRegex.exec(lineText)) !== null) {
    const startParenIdx = evalRegex.lastIndex - 1;
    let depth = 1;
    let inString: null | '"' | "'" | "`" = null;
    let isEscaped = false;
    let endParenIdx = -1;

    for (let i = startParenIdx + 1; i < lineText.length; i++) {
      const ch = lineText[i]!;

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (ch === "\\") {
        isEscaped = true;
        continue;
      }

      if (inString !== null) {
        if (ch === inString) {
          inString = null;
        }
        continue;
      }

      if (ch === '"' || ch === "'" || ch === "`") {
        inString = ch;
        continue;
      }

      if (ch === "(") {
        depth++;
      } else if (ch === ")") {
        depth--;
        if (depth === 0) {
          endParenIdx = i;
          break;
        }
      }
    }

    if (endParenIdx !== -1) {
      const arg = lineText.slice(startParenIdx + 1, endParenIdx);
      if (isDynamicEvalArgument(arg)) {
        return true;
      }
    } else {
      // If closing parenthesis is on a subsequent line, check if the argument begins with a non-string token
      const remaining = lineText.slice(startParenIdx + 1).trim();
      if (remaining && !/^["'`]/.test(remaining)) {
        return true;
      }
    }
  }

  return false;
}

// ─── Multi-Layer Security & Code Quality Analyzer ───────────────────

export function analyzeWholeCodebaseFiles(
  files: ScannedFileContent[],
): UnifiedRepositoryFinding[] {
  const findings: UnifiedRepositoryFinding[] = [];
  const seenSignatures = new Set<string>();

  const addFinding = (f: UnifiedRepositoryFinding) => {
    const normalizedRule = f.rule_id.replace(/^sec_/, "");
    const sig = `${f.file_path}:${f.line_number ?? 0}:${normalizedRule}`;
    if (seenSignatures.has(sig)) return;
    seenSignatures.add(sig);
    findings.push(f);
  };

  for (const file of files) {
    const lines = file.content.split("\n");
    const isTestFile = /\.(test|spec)\.[a-z]+$|__tests__|fixtures|mocks/i.test(file.path);

    // ── Layer B1: Secrets Scanning ─────────────────────────────────
    for (let idx = 0; idx < lines.length; idx++) {
      const lineText = lines[idx] ?? "";
      if (!lineText.trim()) continue;

      for (const rule of SECRET_RULES) {
        rule.pattern.lastIndex = 0;
        const match = rule.pattern.exec(lineText);
        if (match && match[0]) {
          const rawSecret = match[0];
          // Skip placeholder strings
          if (/xxxx|your[-_]?key|dummy|placeholder/i.test(rawSecret)) continue;

          addFinding({
            id: `sec-${file.path}-${idx + 1}-${rule.id}`,
            file_path: file.path,
            line_number: idx + 1,
            title: `Exposed Credential: ${rule.name}`,
            description: rule.description,
            why_it_matters: "Hardcoded credentials in the repository enable unauthorized access to external cloud providers and APIs.",
            evidence: lineText.replace(rawSecret, maskSecret(rawSecret)).trim(),
            suggested_fix: rule.recommendation,
            severity: "critical",
            category: "security",
            confidence: 0.98,
            source: "secrets",
            rule_id: rule.id,
          });
          break;
        }
      }
    }

    // ── Layer B2: SAST Scanning (Language-Aware Patterns) ───────────
    for (let idx = 0; idx < lines.length; idx++) {
      const lineText = lines[idx] ?? "";
      if (!lineText.trim()) continue;

      for (const rule of SAST_RULES) {
        if (isTestFile && rule.severity === "medium") continue;

        rule.pattern.lastIndex = 0;
        const match = rule.pattern.exec(lineText);
        if (match && match[0]) {
          addFinding({
            id: `sast-${file.path}-${idx + 1}-${rule.id}`,
            file_path: file.path,
            line_number: idx + 1,
            title: `SAST: ${rule.name}`,
            description: rule.description,
            why_it_matters: rule.whyItMatters,
            evidence: lineText.trim(),
            suggested_fix: rule.suggestedFixTemplate(match[0]),
            severity: rule.severity,
            category: "security",
            confidence: isTestFile ? 0.7 : 0.92,
            source: "sast",
            rule_id: rule.id,
          });
          break;
        }
      }
    }

    // ── Layer B3: Dependency Vulnerabilities (SCA) ──────────────────
    if (file.path.endsWith("package.json") || /requirements.*\.txt$/i.test(file.path)) {
      const depFindings = scanDependencyFile(file.content, file.path);
      for (const df of depFindings) {
        addFinding({
          id: `dep-${file.path}-${df.line}-${df.cve}`,
          file_path: file.path,
          line_number: df.line,
          title: df.title,
          description: df.problem,
          why_it_matters: df.why_it_matters,
          evidence: df.evidence,
          suggested_fix: df.suggested_fix,
          severity: df.severity,
          category: "security",
          confidence: 0.95,
          source: "dependencies",
          rule_id: df.cve,
        });
      }
    }

    // ── Layer C: Cross-File Data Flow & Dangerous Deserialization ───
    for (let idx = 0; idx < lines.length; idx++) {
      const lineText = lines[idx] ?? "";

      // Unsafe deserialization (e.g. serialize-javascript, eval, pickle.loads)
      if (/(?:unserialize|pickle\.loads|yaml\.load\([^,)]*\)|node-serialize\.unserialize)\s*\(/i.test(lineText)) {
        addFinding({
          id: `flow-deserial-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Insecure Object Deserialization",
          description: "Deserializing untrusted data without type/schema constraints can permit Remote Code Execution.",
          why_it_matters: "Attackers can construct gadget chains within serialized payloads to execute arbitrary server-side code.",
          evidence: lineText.trim(),
          suggested_fix: "Use safe JSON serialization (JSON.parse / json.loads) or yaml.safe_load instead of arbitrary object deserialization.",
          severity: "critical",
          category: "security",
          confidence: 0.88,
          source: "dataflow",
          rule_id: "insecure_deserialization",
        });
      }

      // Dangerous dynamic code execution
      if (hasDynamicEvalExecution(lineText) && !isTestFile) {
        addFinding({
          id: `eval-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Dynamic Code Execution via eval()",
          description: "Direct invocation of eval() with variable inputs is an extreme code execution risk.",
          why_it_matters: "Any user-supplied value reaching eval() immediately compromises the runtime process.",
          evidence: lineText.trim(),
          suggested_fix: "Refactor to use static mapping dictionaries or dedicated parsers instead of dynamic eval().",
          severity: "critical",
          category: "security",
          confidence: 0.95,
          source: "sast",
          rule_id: "dynamic_eval_execution",
        });
      }

      // ── Layer D: Code Quality & Resource Reliability ─────────────
      // Infinite loop hazard (e.g. while(true) without break or sleep)
      if (/\bwhile\s*\(\s*(?:true|1)\s*\)\s*\{(?:[^{}]*)\}/i.test(lineText) && !lineText.includes("break")) {
        addFinding({
          id: `qual-loop-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Potential Unbounded Infinite Loop",
          description: "Detected while(true) loop without an immediate exit or break condition.",
          why_it_matters: "Can lead to 100% CPU thread starvation and Denial of Service (DoS) under unexpected input.",
          evidence: lineText.trim(),
          suggested_fix: "Ensure all loop branches have explicit break conditions, iteration limits, or timeout guards.",
          severity: "medium",
          category: "quality",
          confidence: 0.8,
          source: "quality",
          rule_id: "unbounded_loop_dos",
        });
      }
    }

    // ── Layer E: 12-Class Modular Codebase Analyzer ─────────────────
    const multiClassFindings = analyzeCodebaseFile({
      path: file.path,
      content: file.content,
      language: file.language,
    });
    for (const mcf of multiClassFindings) {
      addFinding({
        id: mcf.id,
        file_path: mcf.file_path,
        line_number: mcf.line_number,
        title: mcf.title,
        description: mcf.explanation,
        why_it_matters: mcf.actual_behavior,
        evidence: mcf.evidence,
        suggested_fix: mcf.suggested_fix,
        severity: mcf.severity,
        category: mcf.category === "security" ? "security" : "quality",
        confidence: mcf.confidence,
        source: mcf.category === "security" ? "sast" : "quality",
        rule_id: mcf.rule_id,
      });
    }
  }

  // ── Layer F: Cross-File Import & Taint Tracing ────────────────────
  const crossModuleFindings = traceCrossFileTaint(
    files.map((f) => ({ path: f.path, content: f.content })),
  );
  for (const cmf of crossModuleFindings) {
    addFinding({
      id: cmf.id,
      file_path: cmf.file_path,
      line_number: cmf.line_number,
      title: cmf.title,
      description: cmf.explanation,
      why_it_matters: cmf.actual_behavior,
      evidence: cmf.evidence,
      suggested_fix: cmf.suggested_fix,
      severity: cmf.severity,
      category: "security",
      confidence: cmf.confidence,
      source: "dataflow",
      rule_id: cmf.rule_id,
    });
  }

  return findings;
}
