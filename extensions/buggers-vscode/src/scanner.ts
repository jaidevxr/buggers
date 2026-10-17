import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { BuggersFinding } from "./types";
import { SAST_RULES, SECRET_RULES } from "./rules";

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

    // 1. Check Secret Rules
    for (const rule of SECRET_RULES) {
      if (hasIgnore) continue;
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(rawLine);
      if (match && match[0]) {
        const rawSecret = match[0];
        if (/example|dummy|placeholder|your_key|test_token/i.test(rawSecret)) {
          continue;
        }

        const masked = maskSecret(rawSecret);
        const evidenceSnippet = rawLine.replace(rawSecret, masked).trim();
        const col = match.index;

        const fixSnippet = rule.suggestedFixTemplate(rawSecret);
        const autoFixCode = rawLine.replace(rawSecret, fixSnippet);

        findings.push({
          id: `${rule.id}-${filePath}-${lineNumber}`,
          file: filePath,
          line: lineNumber,
          column: col,
          length: rawSecret.length,
          title: `Exposed Secret: ${rule.name}`,
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
        });
      }
    }

    // 2. Check SAST Rules
    for (const rule of SAST_RULES) {
      if (hasIgnore) continue;
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(rawLine);
      if (match && match[0]) {
        const matchedSnippet = match[0];
        const col = match.index;

        const autoFixCode = rule.autoRemedyTemplate ? rule.autoRemedyTemplate(matchedSnippet, rawLine) : undefined;

        findings.push({
          id: `${rule.id}-${filePath}-${lineNumber}`,
          file: filePath,
          line: lineNumber,
          column: col,
          length: matchedSnippet.length,
          title: `SAST Flaw: ${rule.name}`,
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
  // Only scan text languages (skip binary / image / media)
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

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  "dist",
  "out",
  ".output",
  ".nitro",
  ".vercel",
  ".next",
  "build",
  "coverage",
]);

/**
 * Scan the entire workspace, respecting ignore boundaries
 */
export async function scanWorkspace(
  progress?: (message: string, increment: number) => void,
): Promise<Map<string, BuggersFinding[]>> {
  const results = new Map<string, BuggersFinding[]>();

  // Find all code files in workspace
  const files = await vscode.workspace.findFiles(
    "**/*.{ts,tsx,js,jsx,mjs,cjs,py,go,rs,java,php,rb,json,yaml,yml,env,sql,sh}",
    "**/{node_modules,.git,dist,out,.output,.nitro,.vercel,.next,build,coverage}/**",
    1000,
  );

  const total = files.length;
  if (total === 0) return results;

  let processed = 0;
  for (const fileUri of files) {
    try {
      const doc = await vscode.workspace.openTextDocument(fileUri);
      const findings = scanDocument(doc);
      if (findings.length > 0) {
        results.set(fileUri.fsPath, findings);
      }
    } catch {
      // Ignored if file cannot be read
    }

    processed++;
    if (progress && total > 0) {
      progress(`Scanning ${path.basename(fileUri.fsPath)} (${processed}/${total})`, (1 / total) * 100);
    }
  }

  return results;
}
