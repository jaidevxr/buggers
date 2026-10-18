import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { BuggersFinding } from "./types";
import { SAST_RULES, SECRET_RULES, LOGICAL_BUG_RULES, getShortTitle } from "./rules";

function maskSecret(secret: string): string {
  if (secret.length <= 6) return "******";
  return secret.slice(0, 4) + "*".repeat(Math.min(16, secret.length - 6)) + secret.slice(-2);
}

/**
 * Scan a single text content and return Buggers findings with precise line numbers
 */
export function scanText(content: string, filePath: string): BuggersFinding[] {
  const findings: BuggersFinding[] = [];
  const lines = content.split("\n");
  const isMock = /mock|fixture|sample|\.example|test/i.test(filePath);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    if (!rawLine) continue;
    const lineNumber = lineIdx + 1;

    const prevLine = lineIdx > 0 ? lines[lineIdx - 1] : "";
    const hasIgnore = rawLine.includes("buggers-ignore") || prevLine.includes("buggers-ignore");
    if (hasIgnore) continue;

    // 1. Check Secret Rules
    for (const rule of SECRET_RULES) {
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(rawLine);
      if (match && match[0]) {
        const rawSecret = match[0];
        if (!isMock && /example|dummy|placeholder|your_key|test_token/i.test(rawSecret)) {
          continue;
        }

        const masked = maskSecret(rawSecret);
        const evidenceSnippet = rawLine.replace(rawSecret, masked).trim();
        const col = match.index;

        const fixSnippet = rule.suggestedFixTemplate(rawSecret);
        const autoFixCode = rule.autoRemedyTemplate ? rule.autoRemedyTemplate(rawSecret, rawLine) : undefined;

        findings.push({
          id: `${rule.id}-${filePath}-${lineNumber}`,
          file: filePath,
          line: lineNumber,
          column: col,
          length: rawSecret.length,
          title: getShortTitle(rule.id, rule.name),
          severity: rule.severity,
          category: rule.category,
          cwe: rule.cwe,
          owasp: rule.owasp,
          confidence: isMock ? 0.8 : 0.99,
          ruleId: rule.id,
          problem: rule.description,
          whyItMatters: rule.whyItMatters,
          evidence: evidenceSnippet,
          suggestedFix: fixSnippet,
          replacementCode: autoFixCode,
          replacementRange: {
            startLine: lineNumber,
            startCol: 0,
            endLine: lineNumber,
            endCol: rawLine.length,
          },
          regressionTest: rule.regressionTestTemplate ? rule.regressionTestTemplate(rawSecret, rawLine) : undefined,
        });
      }
    }

    // 2. Check SAST Security Rules
    for (const rule of SAST_RULES) {
      if (rule.id === "missing_async_error_handling" && (rawLine.includes(".catch") || rawLine.includes("await"))) {
        continue;
      }
      if (rule.id === "unsafe_redirect" && /\b(?:isAllowed|isWhitelisted|isValid|whitelist|validate|isSafe)[a-zA-Z0-9_]*\s*\(/i.test(rawLine)) {
        continue;
      }
      if (rule.id === "ssrf" && (rawLine.includes("sanitizeUrl") || /\b(?:isWhitelisted|isAllowed|isValid|whitelist|isSafe|isInternalIp|checkUrl)[a-zA-Z0-9_]*\s*\(/i.test(rawLine))) {
        continue;
      }
      if (rule.id === "prototype_pollution" && /\b(?:key|prop|property)\s*!==\s*["']__proto__["']/i.test(rawLine)) {
        continue;
      }
      if (rule.id === "zip_slip_traversal" && (rawLine.includes("path.basename") || rawLine.includes("safeDest") || /\bincludes\s*\(\s*["']\.\.["']\s*\)/.test(rawLine))) {
        continue;
      }

      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(rawLine);
      if (match && match[0]) {
        const matchedSnippet = match[0];
        const col = match.index;

        let autoFixCode = rule.autoRemedyTemplate ? rule.autoRemedyTemplate(matchedSnippet, rawLine) : undefined;
        if (autoFixCode !== undefined && autoFixCode.trim() === rawLine.trim()) {
          autoFixCode = undefined;
        }

        findings.push({
          id: `${rule.id}-${filePath}-${lineNumber}`,
          file: filePath,
          line: lineNumber,
          column: col,
          length: matchedSnippet.length,
          title: getShortTitle(rule.id, rule.name),
          severity: rule.severity,
          category: rule.category,
          cwe: rule.cwe,
          owasp: rule.owasp,
          confidence: isMock ? 0.75 : 0.95,
          ruleId: rule.id,
          problem: rule.description,
          whyItMatters: rule.whyItMatters,
          evidence: rawLine.trim(),
          suggestedFix: rule.suggestedFixTemplate(matchedSnippet),
          replacementCode: autoFixCode,
          replacementRange: {
            startLine: lineNumber,
            startCol: 0,
            endLine: lineNumber,
            endCol: rawLine.length,
          },
          regressionTest: rule.regressionTestTemplate ? rule.regressionTestTemplate(matchedSnippet, rawLine) : undefined,
        });
      }
    }

    // 3. Check Deterministic Logical Bug Rules
    for (const rule of LOGICAL_BUG_RULES) {
      if (rule.id === "bug_unhandled_promise_rejection" && (rawLine.includes(".catch") || rawLine.includes("await"))) {
        continue;
      }

      if (rule.id === "bug_unreachable_code") {
        const trimmed = rawLine.trim();
        if (
          lineIdx > 0 &&
          trimmed.length > 0 &&
          !trimmed.startsWith("//") &&
          !trimmed.startsWith("/*") &&
          !trimmed.startsWith("*") &&
          !trimmed.startsWith("}") &&
          !trimmed.startsWith("case ") &&
          !trimmed.startsWith("default:")
        ) {
          const prevTrimmed = lines[lineIdx - 1].trim();
          if (/^return\s+[^;]+;\s*$/.test(prevTrimmed) || /^return;\s*$/.test(prevTrimmed)) {
            findings.push({
              id: `${rule.id}-${filePath}-${lineNumber}`,
              file: filePath,
              line: lineNumber,
              column: 0,
              length: rawLine.length,
              title: getShortTitle(rule.id, rule.name),
              severity: rule.severity,
              category: rule.category,
              cwe: rule.cwe,
              confidence: 0.9,
              ruleId: rule.id,
              problem: rule.description,
              whyItMatters: rule.whyItMatters,
              evidence: rawLine.trim(),
              suggestedFix: rule.suggestedFixTemplate(rawLine),
              regressionTest: rule.regressionTestTemplate ? rule.regressionTestTemplate(rawLine, rawLine) : undefined,
            });
            continue;
          }
        }
      }

      if (rule.id === "bug_null_undefined_dereference") {
        rule.pattern.lastIndex = 0;
        let match = rule.pattern.exec(rawLine);
        if (!match && lineIdx > 0) {
          const prevTrimmed = lines[lineIdx - 1].trim();
          const prevMatch = prevTrimmed.match(/^if\s*\(\s*!([a-zA-Z0-9_]+)\s*\)\s*\{?$/);
          if (prevMatch) {
            const varName = prevMatch[1];
            const derefRegex = new RegExp(`\\b${varName}\\.[a-zA-Z0-9_]+`);
            const dMatch = derefRegex.exec(rawLine);
            if (dMatch) {
              findings.push({
                id: `${rule.id}-${filePath}-${lineNumber}`,
                file: filePath,
                line: lineNumber,
                column: dMatch.index,
                length: dMatch[0].length,
                title: getShortTitle(rule.id, rule.name),
                severity: rule.severity,
                category: rule.category,
                cwe: rule.cwe,
                confidence: 0.95,
                ruleId: rule.id,
                problem: rule.description,
                whyItMatters: rule.whyItMatters,
                evidence: rawLine.trim(),
                suggestedFix: rule.suggestedFixTemplate(dMatch[0]),
                regressionTest: rule.regressionTestTemplate ? rule.regressionTestTemplate(dMatch[0], rawLine) : undefined,
              });
              continue;
            }
          }
        }
      }

      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(rawLine);
      if (match && match[0]) {
        const matchedSnippet = match[0];
        const col = match.index;

        let autoFixCode = rule.autoRemedyTemplate ? rule.autoRemedyTemplate(matchedSnippet, rawLine) : undefined;
        if (autoFixCode !== undefined && autoFixCode.trim() === rawLine.trim()) {
          autoFixCode = undefined;
        }

        findings.push({
          id: `${rule.id}-${filePath}-${lineNumber}`,
          file: filePath,
          line: lineNumber,
          column: col,
          length: matchedSnippet.length,
          title: getShortTitle(rule.id, rule.name),
          severity: rule.severity,
          category: rule.category,
          cwe: rule.cwe,
          confidence: 0.9,
          ruleId: rule.id,
          problem: rule.description,
          whyItMatters: rule.whyItMatters,
          evidence: rawLine.trim(),
          suggestedFix: rule.suggestedFixTemplate(matchedSnippet),
          replacementCode: autoFixCode,
          replacementRange: {
            startLine: lineNumber,
            startCol: 0,
            endLine: lineNumber,
            endCol: rawLine.length,
          },
          regressionTest: rule.regressionTestTemplate ? rule.regressionTestTemplate(matchedSnippet, rawLine) : undefined,
        });
      }
    }
  }

  return findings;
}

/**
 * Scan a VS Code TextDocument
 */
export function scanDocument(document: vscode.TextDocument): BuggersFinding[] {
  const allowedExtensions = [
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".py", ".go", ".rs", ".java", ".php", ".rb",
    ".json", ".yaml", ".yml", ".env", ".sql", ".sh",
  ];

  const ext = path.extname(document.fileName).toLowerCase();
  if (ext && !allowedExtensions.includes(ext) && !document.fileName.includes(".env")) {
    return [];
  }

  return scanText(document.getText(), document.fileName);
}

export interface WorkspaceScanResult {
  results: Map<string, BuggersFinding[]>;
  totalFiles: number;
  scannedCount: number;
  skippedCount: number;
  durationMs: number;
}

/**
 * Scan the entire workspace, respecting ignore boundaries, file size limits, and cancellation
 */
export async function scanWorkspace(
  progress?: (message: string, increment: number) => void,
  token?: vscode.CancellationToken,
  onFileScanned?: (filePath: string, findings: BuggersFinding[]) => void,
): Promise<WorkspaceScanResult> {
  const startTime = Date.now();
  const results = new Map<string, BuggersFinding[]>();

  const files = await vscode.workspace.findFiles(
    "**/*.{ts,tsx,js,jsx,mjs,cjs,py,go,rs,java,php,rb,json,yaml,yml,env,sql,sh}",
    "**/{node_modules,.git,dist,out,.output,.nitro,.vercel,.next,build,coverage,package-lock.json,yarn.lock,pnpm-lock.yaml}/**",
    2000,
  );

  const total = files.length;
  if (total === 0) {
    return {
      results,
      totalFiles: 0,
      scannedCount: 0,
      skippedCount: 0,
      durationMs: Date.now() - startTime,
    };
  }

  let processed = 0;
  let skipped = 0;

  for (const fileUri of files) {
    if (token?.isCancellationRequested) {
      break;
    }

    try {
      const fsPath = fileUri.fsPath;
      if (fs.existsSync(fsPath)) {
        const stats = fs.statSync(fsPath);
        // Skip files larger than 1MB
        if (stats.size > 1024 * 1024) {
          skipped++;
          processed++;
          continue;
        }
      }

      const doc = await vscode.workspace.openTextDocument(fileUri);
      const findings = scanDocument(doc);
      if (findings.length > 0) {
        results.set(fileUri.fsPath, findings);
      }
      if (onFileScanned) {
        onFileScanned(fileUri.fsPath, findings);
      }
    } catch {
      skipped++;
    }

    processed++;
    if (progress && total > 0) {
      progress(`Scanning ${path.basename(fileUri.fsPath)} (${processed}/${total})`, (1 / total) * 100);
    }

    // Yield every 5 files to avoid blocking VS Code extension host thread
    if (processed % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return {
    results,
    totalFiles: total,
    scannedCount: processed - skipped,
    skippedCount: skipped,
    durationMs: Date.now() - startTime,
  };
}

