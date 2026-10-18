import * as vscode from "vscode";
import * as path from "path";
import * as vm from "vm";
import { BuggersFinding, DiagnosticCategory, DiagnosticSourceType, Severity } from "./types";

let tsModule: typeof import("typescript") | null = null;
try {
  tsModule = require("typescript");
} catch {
  tsModule = null;
}

/**
 * Classifies an external VS Code Diagnostic (from LSP, compiler, or linter) into the unified Buggers findings model.
 */
export function classifyDiagnostic(
  diag: vscode.Diagnostic,
  document: vscode.TextDocument,
): BuggersFinding {
  const source = (diag.source || "").toLowerCase();
  const rawCode = diag.code !== undefined ? String(typeof diag.code === "object" ? diag.code.value : diag.code) : "";
  const msg = diag.message || "";
  const lowerMsg = msg.toLowerCase();

  let category: DiagnosticCategory = "quality";
  let sourceType: DiagnosticSourceType = "lsp";
  let severity: Severity = "low";
  let whyItMatters = "Code diagnostics alert developers to potential runtime bugs, type mismatches, and syntax violations.";
  let suggestedFix = "Review the affected code and update it to conform with language rules.";

  // 1. Lint Diagnostics
  if (
    source.includes("eslint") ||
    source.includes("tslint") ||
    source.includes("flake8") ||
    source.includes("pylint") ||
    source.includes("biome") ||
    source.includes("stylelint") ||
    source.includes("clippy")
  ) {
    category = "lint";
    sourceType = "linter";
    whyItMatters = "Lint rules enforce consistency, style conventions, and guard against common anti-patterns.";
    suggestedFix = `Address the ${source} rule '${rawCode || "lint"}' or use an automated fix if available.`;
  }
  // 2. Syntax / Parser Errors
  else if (
    /^(?:1005|1003|1109|1128|1144|1160|1161|1434|1435)$/.test(rawCode) ||
    /syntax\s*error|unexpected\s*(?:token|identifier|end|string)|expected\s*['"`;\}\]\)]|parsing\s*error|malformed\s*(?:string|template)|declaration\s*expected/i.test(lowerMsg)
  ) {
    category = "syntax";
    sourceType = source ? "compiler" : "compiler";
    whyItMatters = "Syntax errors prevent code from compiling or executing, leading to immediate runtime parse failures.";
    suggestedFix = "Correct syntax constructs, close open brackets/braces/quotes, or provide required punctuation.";
  }
  // 3. Type Errors
  else if (
    /^(?:2322|2345|2741|2739|2740|2352|2559|2339|2416|2367)$/.test(rawCode) ||
    /type\s*['"][^'"]+['"]\s*is\s*not\s*assignable|incompatible\s*types?|type\s*mismatch|property\s*['"][^'"]+['"]\s*does\s*not\s*exist|missing\s*required\s*property/i.test(lowerMsg)
  ) {
    category = "type";
    sourceType = "compiler";
    whyItMatters = "Type errors indicate values that violate expected structural contracts, leading to undefined behavior or crashes.";
    suggestedFix = "Ensure passed arguments, object shapes, and variable assignments match declared types.";
  }
  // 4. Semantic Errors
  else if (
    /^(?:2304|2552|2584|7027|2554|2555|2307|2306|2769)$/.test(rawCode) ||
    /cannot\s*find\s*name|undefined\s*variable|unreachable\s*code|unresolved\s*import|expected\s*\d+\s*arguments/i.test(lowerMsg)
  ) {
    category = "semantic";
    sourceType = "compiler";
    whyItMatters = "Semantic errors indicate referenced symbols, imports, or parameters that cannot be resolved in the current scope.";
    suggestedFix = "Import or declare the missing identifier, verify argument counts, or fix variable scope.";
  }
  // 5. General Language Server diagnostics
  else if (source === "ts" || source === "typescript" || source === "pylance" || source === "gopls" || source === "rust-analyzer") {
    category = "type";
    sourceType = "compiler";
    whyItMatters = "Compiler diagnostics guarantee that code satisfies static analysis and language type constraints.";
  }

  // Map VS Code DiagnosticSeverity
  if (diag.severity === vscode.DiagnosticSeverity.Error) {
    severity = category === "syntax" ? "critical" : "high";
  } else if (diag.severity === vscode.DiagnosticSeverity.Warning) {
    severity = "medium";
  } else {
    severity = "low";
  }

  const startLine = diag.range.start.line;
  const startCol = diag.range.start.character;
  const endLine = diag.range.end.line;
  const endCol = diag.range.end.character;

  let evidence = "";
  if (startLine < document.lineCount) {
    evidence = document.lineAt(startLine).text;
  }

  const ruleId = rawCode ? `${source ? source + ":" : ""}${rawCode}` : `${source || "compiler"}:${category}`;
  const title = `[${category.toUpperCase()}] ${msg.length > 70 ? msg.slice(0, 67) + "..." : msg}`;

  const related = diag.relatedInformation?.map((rel) => ({
    message: rel.message,
    file: rel.location.uri.fsPath,
    line: rel.location.range.start.line + 1,
  }));

  const length = Math.max(1, endLine === startLine ? endCol - startCol : evidence.length - startCol);

  return {
    id: `diag-${source || "lsp"}-${rawCode || category}-${path.basename(document.fileName)}-${startLine + 1}-${startCol}`,
    file: document.fileName,
    line: startLine + 1,
    column: startCol,
    endLine: endLine + 1,
    endColumn: endCol,
    length,
    title,
    severity,
    category,
    confidence: "high",
    ruleId,
    sourceType,
    source: diag.source || "Compiler",
    problem: msg,
    whyItMatters,
    evidence,
    suggestedFix,
    relatedInformation: related,
  };
}

/**
 * Extracts real syntax errors using the native TypeScript parser or Node.js vm compiler.
 * This runs offline with zero network and without relying on brittle regexes.
 */
export function extractSyntaxErrors(document: vscode.TextDocument): BuggersFinding[] {
  const ext = path.extname(document.fileName).toLowerCase();
  const isJsOrTs = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"].includes(ext);

  if (!isJsOrTs) {
    // For other languages, Buggers does not invent fake syntax rules; it relies honestly on installed tooling.
    return [];
  }

  const text = document.getText();
  const findings: BuggersFinding[] = [];

  // 1. Use TypeScript AST parser if available
  if (tsModule) {
    try {
      const sourceFile = tsModule.createSourceFile(
        document.fileName,
        text,
        tsModule.ScriptTarget.Latest,
        true,
        ext.includes("jsx") || ext.includes("tsx") ? tsModule.ScriptKind.TSX : tsModule.ScriptKind.TS,
      );

      const parseDiags = (sourceFile as any).parseDiagnostics || [];
      for (const d of parseDiags) {
        const pos = d.start ?? 0;
        const len = d.length ?? 1;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
        const msg = typeof d.messageText === "string" ? d.messageText : d.messageText.messageText;

        const lineText = line < document.lineCount ? document.lineAt(line).text : "";

        findings.push({
          id: `syntax-ts-${d.code}-${path.basename(document.fileName)}-${line + 1}-${character}`,
          file: document.fileName,
          line: line + 1,
          column: character,
          endLine: line + 1,
          endColumn: character + len,
          length: len,
          title: `[SYNTAX] Syntax Error: ${msg}`,
          severity: "critical",
          category: "syntax",
          confidence: "high",
          ruleId: `TS${d.code}`,
          sourceType: "compiler",
          source: "TypeScript Parser",
          problem: msg,
          whyItMatters: "Syntax errors prevent code execution and cause immediate compilation failure.",
          evidence: lineText,
          suggestedFix: "Fix invalid syntax token or missing closing construct.",
        });
      }

      if (findings.length > 0) {
        return findings;
      }
    } catch {
      // Fallback to vm.Script below
    }
  }

  // 2. Fallback: Node.js vm.Script compilation check for JavaScript files
  if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
    try {
      new vm.Script(text, { filename: document.fileName });
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        const stack = err.stack || "";
        const match = stack.match(/:(\d+)(?::(\d+))?/);
        const line = match ? parseInt(match[1], 10) : 1;
        const col = match && match[2] ? parseInt(match[2], 10) : 0;
        const lineIdx = Math.max(0, line - 1);
        const lineText = lineIdx < document.lineCount ? document.lineAt(lineIdx).text : "";

        findings.push({
          id: `syntax-vm-SyntaxError-${path.basename(document.fileName)}-${line}-${col}`,
          file: document.fileName,
          line,
          column: col,
          length: Math.max(1, lineText.length - col),
          title: `[SYNTAX] ${err.message}`,
          severity: "critical",
          category: "syntax",
          confidence: "high",
          ruleId: "JS_SYNTAX_ERROR",
          sourceType: "compiler",
          source: "V8 Compiler",
          problem: err.message,
          whyItMatters: "Syntax error prevents script compilation and execution.",
          evidence: lineText,
          suggestedFix: "Correct syntax error on specified line.",
        });
      }
    }
  }

  return findings;
}

/**
 * Ingests active VS Code diagnostics for a document, filtering out Buggers' own diagnostics to prevent duplication.
 */
export function getExternalDiagnostics(document: vscode.TextDocument): BuggersFinding[] {
  if (!vscode.languages || !vscode.languages.getDiagnostics) {
    return [];
  }

  const diags = vscode.languages.getDiagnostics(document.uri);
  const results: BuggersFinding[] = [];

  for (const d of diags) {
    // CRITICAL: Do NOT duplicate Buggers' own published diagnostics
    if (d.source === "Buggers") {
      continue;
    }
    results.push(classifyDiagnostic(d, document));
  }

  return results;
}

/**
 * Merges security findings, compiler syntax diagnostics, and language server diagnostics into a unified findings list.
 * Deduplicates overlapping findings on identical file, line, and rule.
 */
export function mergeFindings(
  securityFindings: BuggersFinding[],
  syntaxFindings: BuggersFinding[],
  externalFindings: BuggersFinding[],
): BuggersFinding[] {
  const unified: BuggersFinding[] = [...securityFindings];
  const seenKeys = new Set<string>();

  for (const f of securityFindings) {
    seenKeys.add(`${f.file}:${f.line}:${f.ruleId}`);
  }

  for (const f of syntaxFindings) {
    const key = `${f.file}:${f.line}:${f.ruleId}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      unified.push(f);
    }
  }

  for (const f of externalFindings) {
    const key = `${f.file}:${f.line}:${f.ruleId}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      unified.push(f);
    }
  }

  return unified;
}
