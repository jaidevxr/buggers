/**
 * Buggers Multi-Class Static & Semantic Code Analysis Engine
 *
 * Implements comprehensive analysis across 12 distinct error dimensions:
 * 1. Syntax errors
 * 2. Indentation & formatting errors
 * 3. Logical errors
 * 4. Runtime errors
 * 5. Type and validation errors
 * 6. Security vulnerabilities (OWASP, Secrets, SAST)
 * 7. API and integration errors
 * 8. Database errors
 * 9. Performance errors
 * 10. Concurrency and distributed-system errors
 * 11. Build and configuration errors
 * 12. Testing and maintainability issues
 *
 * All findings are deterministic, evidence-grounded, deduplicated, and
 * classified by severity (critical, high, medium, low) and confidence (0.0 to 1.0).
 */

import { detectLanguage } from "@/server/repoScanner.server";
import { SAST_RULES } from "@/server/sastScanner.server";
import { SECRET_RULES, maskSecret } from "@/server/secretScanner.server";

export type CodebaseErrorCategory =
  | "syntax"
  | "formatting"
  | "logic"
  | "runtime"
  | "types_validation"
  | "security"
  | "api_integration"
  | "database"
  | "performance"
  | "concurrency"
  | "build_config"
  | "maintainability";

export interface CodebaseFinding {
  id: string;
  file_path: string;
  line_number: number | null;
  line_end?: number | null;
  title: string;
  category: CodebaseErrorCategory;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  evidence: string;
  explanation: string;
  expected_behavior: string;
  actual_behavior: string;
  reproduction_steps?: string;
  suggested_fix: string;
  rule_id: string;
  is_confirmed: boolean; // Confirmed defect vs suspected heuristic
}

export interface AnalyzeFileInput {
  path: string;
  content: string;
  language?: string;
}

export interface AnalysisSummary {
  totalFindings: number;
  byCategory: Record<CodebaseErrorCategory, number>;
  bySeverity: Record<"critical" | "high" | "medium" | "low", number>;
  confirmedBugs: number;
  suspectedIssues: number;
}

// ─── 1. Syntax Analysis ─────────────────────────────────────────────

export function analyzeSyntaxErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");
  const lang = file.language || detectLanguage(file.path);

  // JSON syntax check
  if (lang === "json" || file.path.endsWith(".json")) {
    try {
      JSON.parse(file.content);
    } catch (e: any) {
      const match = e.message.match(/position (\d+)/i);
      let lineNum = 1;
      if (match && match[1]) {
        const pos = parseInt(match[1], 10);
        lineNum = file.content.slice(0, pos).split("\n").length;
      }
      findings.push({
        id: `syntax-json-${file.path}-${lineNum}`,
        file_path: file.path,
        line_number: lineNum,
        title: "Invalid JSON Syntax",
        category: "syntax",
        severity: "critical",
        confidence: 1.0,
        evidence: lines[lineNum - 1]?.trim() || file.content.slice(0, 100),
        explanation: `JSON parser failed with error: ${e.message}`,
        expected_behavior: "Valid RFC 8259 JSON format with double-quoted strings and no trailing commas.",
        actual_behavior: `Syntax parse error: ${e.message}`,
        reproduction_steps: `Run JSON.parse() on ${file.path}.`,
        suggested_fix: "Fix malformed JSON syntax, remove trailing commas, and ensure all keys are enclosed in double quotes.",
        rule_id: "syntax_invalid_json",
        is_confirmed: true,
      });
    }
  }

  // Bracket and Delimiter Parity check (C-style languages, Python, Rust, Go)
  if (["typescript", "javascript", "python", "go", "rust", "c", "cpp", "java"].includes(lang)) {
    const stack: Array<{ char: string; line: number; col: number }> = [];
    const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
    const closers: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

    let inString: null | '"' | "'" | "`" = null;
    let isEscaped = false;
    let inLineComment = false;
    let inBlockComment = false;

    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const line = lines[lIdx]!;
      inLineComment = false;

      for (let cIdx = 0; cIdx < line.length; cIdx++) {
        const ch = line[cIdx]!;
        const nextCh = line[cIdx + 1];

        if (isEscaped) {
          isEscaped = false;
          continue;
        }

        if (ch === "\\") {
          isEscaped = true;
          continue;
        }

        if (!inString && !inBlockComment && ch === "/" && nextCh === "/") {
          inLineComment = true;
          break; // Rest of line is comment
        }
        if (!inString && !inBlockComment && ch === "#" && ["python", "shell", "yaml"].includes(lang)) {
          inLineComment = true;
          break;
        }

        if (!inString && !inLineComment && ch === "/" && nextCh === "*") {
          inBlockComment = true;
          cIdx++;
          continue;
        }
        if (inBlockComment && ch === "*" && nextCh === "/") {
          inBlockComment = false;
          cIdx++;
          continue;
        }

        if (inLineComment || inBlockComment) continue;

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

        if (pairs[ch]) {
          stack.push({ char: ch, line: lIdx + 1, col: cIdx + 1 });
        } else if (closers[ch]) {
          const expected = closers[ch];
          const last = stack.pop();
          if (!last || last.char !== expected) {
            findings.push({
              id: `syntax-delimiter-${file.path}-${lIdx + 1}`,
              file_path: file.path,
              line_number: lIdx + 1,
              title: `Unmatched Delimiter '${ch}'`,
              category: "syntax",
              severity: "critical",
              confidence: 0.95,
              evidence: line.trim(),
              explanation: last
                ? `Found closing '${ch}' matching opening '${last.char}' from line ${last.line}.`
                : `Encountered unexpected closing delimiter '${ch}' without a matching opening delimiter.`,
              expected_behavior: "All opening delimiters must be properly paired with their corresponding closing delimiters.",
              actual_behavior: `Unmatched delimiter encountered at column ${cIdx + 1}.`,
              suggested_fix: `Verify opening and closing brackets and ensure every '${last?.char || ch}' has a balanced pair.`,
              rule_id: "syntax_unmatched_delimiter",
              is_confirmed: true,
            });
            return findings;
          }
        }
      }
    }

    if (stack.length > 0 && findings.length === 0) {
      const unclosed = stack[stack.length - 1]!;
      findings.push({
        id: `syntax-unclosed-delimiter-${file.path}-${unclosed.line}`,
        file_path: file.path,
        line_number: unclosed.line,
        title: `Unclosed Delimiter '${unclosed.char}'`,
        category: "syntax",
        severity: "critical",
        confidence: 0.95,
        evidence: lines[unclosed.line - 1]?.trim() || "",
        explanation: `Opening delimiter '${unclosed.char}' on line ${unclosed.line} is never closed in this file.`,
        expected_behavior: `Every opening '${unclosed.char}' must have a matching closing pair.`,
        actual_behavior: "File ends with unclosed bracket/brace stack.",
        suggested_fix: `Add matching closing delimiter for '${unclosed.char}'.`,
        rule_id: "syntax_unclosed_delimiter",
        is_confirmed: true,
      });
    }
  }

  return findings;
}

// ─── 2. Indentation & Formatting Analysis ───────────────────────────

export function analyzeFormattingErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");
  const lang = file.language || detectLanguage(file.path);

  if (lang === "python" || file.path.endsWith(".py")) {
    let hasTabs = false;
    let hasSpaces = false;

    lines.forEach((line, idx) => {
      const match = line.match(/^([ \t]+)/);
      if (match && match[1]) {
        const indent = match[1];
        if (indent.includes("\t") && indent.includes(" ")) {
          findings.push({
            id: `format-py-mixed-${file.path}-${idx + 1}`,
            file_path: file.path,
            line_number: idx + 1,
            title: "Mixed Tabs and Spaces in Python Indentation",
            category: "formatting",
            severity: "high",
            confidence: 1.0,
            evidence: line.slice(0, 30),
            explanation: "Python PEP 8 strictly prohibits mixing tabs and spaces for indentation; raises TabError in Python 3.",
            expected_behavior: "Consistent 4-space indentation across all Python blocks.",
            actual_behavior: "Line indentation mixes tab (\\t) and space ( ) characters.",
            suggested_fix: "Convert all indentation tabs to 4 spaces.",
            rule_id: "format_python_mixed_tabs",
            is_confirmed: true,
          });
        }
        if (indent.includes("\t")) hasTabs = true;
        if (indent.includes("  ")) hasSpaces = true;
      }
    });

    if (hasTabs && hasSpaces && findings.length === 0) {
      findings.push({
        id: `format-py-inconsistent-${file.path}-1`,
        file_path: file.path,
        line_number: 1,
        title: "Inconsistent File Indentation (Tabs vs Spaces)",
        category: "formatting",
        severity: "medium",
        confidence: 0.9,
        evidence: file.path,
        explanation: "File contains a mixture of tab-indented and space-indented code lines across blocks.",
        expected_behavior: "File should consistently use spaces for indentation.",
        actual_behavior: "File alternates between tab characters and spaces.",
        suggested_fix: "Standardize file to 4 spaces per indentation level.",
        rule_id: "format_inconsistent_indentation",
        is_confirmed: false,
      });
    }
  }

  return findings;
}

// ─── 3. Logical Errors ──────────────────────────────────────────────

export function analyzeLogicalErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // 3.1 Tautological / self-comparison (e.g. x === x, x == x, x != x)
    const selfCompare = trimmed.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(===|!==|==|!=)\s*\1\b/);
    if (selfCompare && !trimmed.startsWith("//") && !trimmed.startsWith("#")) {
      const varName = selfCompare[1];
      const op = selfCompare[2];
      findings.push({
        id: `logic-tautology-${file.path}-${idx + 1}`,
        file_path: file.path,
        line_number: idx + 1,
        title: `Tautological Comparison: '${varName} ${op} ${varName}'`,
        category: "logic",
        severity: "high",
        confidence: 0.95,
        evidence: trimmed,
        explanation: `Comparing identifier '${varName}' to itself is redundant and always evaluates to a constant boolean.`,
        expected_behavior: "Comparisons should evaluate distinct operands or validate against expected boundary values.",
        actual_behavior: `Expression '${varName} ${op} ${varName}' always evaluates to ${op?.startsWith("=") ? "true" : "false"}.`,
        suggested_fix: `Replace self-comparison with appropriate target variable or remove redundant conditional.`,
        rule_id: "logic_self_comparison",
        is_confirmed: true,
      });
    }

    // 3.2 Accidental assignment inside conditional: if (x = 5)
    const assignInIf = trimmed.match(/\bif\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^=][^;)]*)\)/);
    if (assignInIf && !assignInIf[2]?.startsWith("==") && !trimmed.includes("===")) {
      findings.push({
        id: `logic-assign-in-if-${file.path}-${idx + 1}`,
        file_path: file.path,
        line_number: idx + 1,
        title: "Accidental Variable Assignment in 'if' Condition",
        category: "logic",
        severity: "high",
        confidence: 0.9,
        evidence: trimmed,
        explanation: "Assignment operator '=' used inside condition instead of comparison operator '===' or '=='.",
        expected_behavior: "Conditional expression should compare values, not overwrite variables.",
        actual_behavior: `Assigns value to '${assignInIf[1]}' and evaluates truthiness of assigned value.`,
        suggested_fix: `Replace single '=' with '===' to test equality.`,
        rule_id: "logic_assignment_in_conditional",
        is_confirmed: true,
      });
    }

    // 3.3 Off-by-one boundary comparison: for (let i = 0; i <= array.length; i++)
    const offByOne = trimmed.match(/\bfor\s*\([^;]*;\s*([a-zA-Z0-9_$]+)\s*<=\s*([a-zA-Z0-9_$.]+)\.length\s*;/);
    if (offByOne) {
      findings.push({
        id: `logic-off-by-one-${file.path}-${idx + 1}`,
        file_path: file.path,
        line_number: idx + 1,
        title: "Potential Off-By-One Array Boundary Error ('<= .length')",
        category: "logic",
        severity: "medium",
        confidence: 0.85,
        evidence: trimmed,
        explanation: "Loop condition checks '<= array.length', which attempts to access index equal to array.length, causing undefined access.",
        expected_behavior: "Loop should terminate at '< array.length' since arrays are 0-indexed.",
        actual_behavior: "Final iteration indexes beyond array bounds.",
        suggested_fix: `Change '<=' to '<' in loop condition: '${offByOne[1]} < ${offByOne[2]}.length'.`,
        rule_id: "logic_off_by_one_array_bound",
        is_confirmed: false,
      });
    }

    // 3.4 Reversed range contradiction: x > 10 && x < 5
    const reversedRange = trimmed.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*>\s*(\d+)\s*&&\s*\1\s*<\s*(\d+)/);
    if (reversedRange) {
      const lower = parseInt(reversedRange[2]!, 10);
      const upper = parseInt(reversedRange[3]!, 10);
      if (lower >= upper) {
        findings.push({
          id: `logic-contradictory-range-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: `Contradictory Range Condition: '${reversedRange[1]} > ${lower} && ${reversedRange[1]} < ${upper}'`,
          category: "logic",
          severity: "high",
          confidence: 0.95,
          evidence: trimmed,
          explanation: `Logical AND between mutually exclusive conditions can never evaluate to true.`,
          expected_behavior: "Range condition should test a valid interval or use logical OR ('||').",
          actual_behavior: "Condition always evaluates to false, making the branch unreachable.",
          suggested_fix: "Check the comparison operators or replace '&&' with '||' if matching values outside interval.",
          rule_id: "logic_contradictory_range",
          is_confirmed: true,
        });
      }
    }
  });

  return findings;
}

// ─── 4. Runtime Errors ──────────────────────────────────────────────

export function analyzeRuntimeErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // 4.1 Unhandled JSON.parse outside of try-catch
    if (/JSON\.parse\s*\(/.test(trimmed) && !trimmed.startsWith("//") && !trimmed.startsWith("*")) {
      // Check if surrounding 5 lines contain try/catch
      const start = Math.max(0, idx - 4);
      const end = Math.min(lines.length, idx + 4);
      const windowText = lines.slice(start, end).join("\n");
      if (!windowText.includes("try") && !windowText.includes("catch")) {
        findings.push({
          id: `runtime-unhandled-json-parse-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Unhandled JSON.parse() May Throw Uncaught SyntaxError",
          category: "runtime",
          severity: "medium",
          confidence: 0.8,
          evidence: trimmed,
          explanation: "JSON.parse() throws an unhandled SyntaxError when parsing malformed or empty payloads, which crashes the process if unhandled.",
          expected_behavior: "JSON deserialization of external inputs should be wrapped in a try/catch block.",
          actual_behavior: "Uncaught exception bubbles up and can terminate server request worker.",
          suggested_fix: "Wrap JSON.parse() in a try/catch block or use a safe parser helper.",
          rule_id: "runtime_unhandled_json_parse",
          is_confirmed: false,
        });
      }
    }

    // 4.2 Deep unsafe property dereferencing on unverified objects (e.g. req.body.data.user.id)
    const deepAccess = trimmed.match(/\b(req|request|ctx)\.(?:body|query|params)\.[a-zA-Z0-9_$]+\.[a-zA-Z0-9_$]+\.[a-zA-Z0-9_$]+/);
    if (deepAccess && !trimmed.includes("?.") && !trimmed.includes("typeof") && !trimmed.includes("if (")) {
      findings.push({
        id: `runtime-unsafe-property-access-${file.path}-${idx + 1}`,
        file_path: file.path,
        line_number: idx + 1,
        title: "Unsafe Deep Property Access Without Optional Chaining",
        category: "runtime",
        severity: "medium",
        confidence: 0.75,
        evidence: trimmed,
        explanation: "Dereferencing nested properties on untrusted request payloads without optional chaining (?.) causes 'TypeError: Cannot read properties of undefined'.",
        expected_behavior: "Deep property access should use optional chaining (e.g. req.body?.data?.user?.id) or prior validation.",
        actual_behavior: "Throws TypeError if any intermediate property is omitted by caller.",
        suggested_fix: "Use optional chaining (?.) or validate payload schema with Zod/Joi.",
        rule_id: "runtime_unsafe_deep_access",
        is_confirmed: false,
      });
    }

    // 4.3 Floating unawaited Promise in async loop
    if (/\.forEach\s*\(\s*async\s*\(/i.test(trimmed)) {
      findings.push({
        id: `runtime-floating-promise-foreach-${file.path}-${idx + 1}`,
        file_path: file.path,
        line_number: idx + 1,
        title: "Unawaited Async Callback in Array.prototype.forEach()",
        category: "runtime",
        severity: "high",
        confidence: 0.9,
        evidence: trimmed,
        explanation: "Array.forEach() does not await async callbacks. Promises execute concurrently without awaiting completion, leading to race conditions and unhandled errors.",
        expected_behavior: "Async iterations should be awaited sequentially with 'for...of' or concurrently with 'Promise.all(arr.map(...))'.",
        actual_behavior: "Parent function returns before array iterations finish execution.",
        suggested_fix: "Replace '.forEach(async ...)' with 'for (const item of items)' or 'await Promise.all(items.map(async ...))'.",
        rule_id: "runtime_async_foreach",
        is_confirmed: true,
      });
    }
  });

  return findings;
}

// ─── 5. Type and Validation Errors ──────────────────────────────────

export function analyzeTypeValidationErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");
  const lang = file.language || detectLanguage(file.path);

  if (["typescript", "javascript"].includes(lang)) {
    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // 5.1 Unsafe type assertion: as any
      if (/\bas\s+any\b/.test(trimmed) && !trimmed.startsWith("//") && !file.path.includes(".test.")) {
        findings.push({
          id: `types-unsafe-any-cast-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Unsafe Type Assertion ('as any')",
          category: "types_validation",
          severity: "low",
          confidence: 0.85,
          evidence: trimmed,
          explanation: "Casting values to 'any' completely disables TypeScript type checking and masks potential type mismatches.",
          expected_behavior: "Code should use specific interfaces, generics, or 'unknown' with type narrowing guards.",
          actual_behavior: "Compiler cannot catch invalid property accesses or signature changes.",
          suggested_fix: "Replace 'as any' with a concrete interface or 'unknown' combined with runtime validation.",
          rule_id: "types_unsafe_any_cast",
          is_confirmed: false,
        });
      }

      // 5.2 Suppressed compiler checks: @ts-ignore without reason
      if (/@ts-ignore(?!\s*[:\-])/.test(trimmed)) {
        findings.push({
          id: `types-ts-ignore-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Suppressed TypeScript Diagnostic ('@ts-ignore')",
          category: "types_validation",
          severity: "low",
          confidence: 0.8,
          evidence: trimmed,
          explanation: "Bypassing type errors with @ts-ignore hides underlying API or interface incompatibilities.",
          expected_behavior: "Resolve underlying type error or use @ts-expect-error with documented rationale.",
          actual_behavior: "Type safety checks suppressed for subsequent line.",
          suggested_fix: "Fix the type mismatch or replace with '@ts-expect-error: <reason>' for expected third-party discrepancies.",
          rule_id: "types_ts_ignore_suppression",
          is_confirmed: false,
        });
      }
    });
  }

  return findings;
}

// ─── 6. Security Vulnerabilities (SAST + Secrets) ───────────────────

export function analyzeSecurityErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");
  const isTest = file.path.includes(".test.") || file.path.includes(".spec.") || file.path.includes("/fixtures/");

  // Run OWASP SAST Rules
  for (const rule of SAST_RULES) {
    if (isTest && rule.id !== "path_traversal") continue;

    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.pattern.exec(file.content)) !== null) {
      const matchIndex = match.index;
      const matchedText = match[0];
      const lineNum = file.content.slice(0, matchIndex).split("\n").length;
      const lineContent = lines[lineNum - 1]?.trim() || matchedText;

      findings.push({
        id: `sec-sast-${file.path}-${lineNum}-${rule.id}`,
        file_path: file.path,
        line_number: lineNum,
        title: rule.name,
        category: "security",
        severity: rule.severity,
        confidence: 0.95,
        evidence: lineContent,
        explanation: rule.description,
        expected_behavior: "Input parameters and security-sensitive operations must be validated and sanitized.",
        actual_behavior: `Detected vulnerable pattern: '${matchedText.slice(0, 80)}'.`,
        suggested_fix: rule.suggestedFixTemplate(matchedText),
        rule_id: `sec_${rule.id}`,
        is_confirmed: true,
      });

      if (!rule.pattern.global) break;
    }
  }

  // Run Secret Rules with Masking
  for (const rule of SECRET_RULES) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.pattern.exec(file.content)) !== null) {
      const matchIndex = match.index;
      const rawSecret = match[0];
      const lineNum = file.content.slice(0, matchIndex).split("\n").length;
      const lineContent = lines[lineNum - 1]?.trim() || "";

      // Ignore dummy RFC tokens
      if (rawSecret.includes("EXAMPLE") || rawSecret.includes("dummy") || rawSecret.includes("test-mocktoken")) {
        continue;
      }

      findings.push({
        id: `sec-secret-${file.path}-${lineNum}-${rule.id}`,
        file_path: file.path,
        line_number: lineNum,
        title: `Exposed Credential: ${rule.name}`,
        category: "security",
        severity: "critical",
        confidence: 0.98,
        evidence: lineContent.replace(rawSecret, maskSecret(rawSecret)),
        explanation: rule.description,
        expected_behavior: "Credentials must never be hardcoded into source repositories.",
        actual_behavior: `Exposed plaintext credential detected in source code: ${maskSecret(rawSecret)}`,
        reproduction_steps: `Inspect line ${lineNum} of ${file.path}.`,
        suggested_fix: rule.recommendation,
        rule_id: `sec_${rule.id}`,
        is_confirmed: true,
      });

      if (!rule.pattern.global) break;
    }
  }

  return findings;
}

// ─── 7. API and Integration Errors ──────────────────────────────────

export function analyzeApiIntegrationErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // 7.1 Missing timeout on fetch() calls
    if (/\bfetch\s*\(\s*["'`http]/i.test(trimmed) && !trimmed.includes("signal") && !trimmed.includes("timeout")) {
      // Check surrounding 3 lines for signal / AbortController
      const surrounding = lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 4)).join("\n");
      if (!surrounding.includes("signal") && !surrounding.includes("AbortController")) {
        findings.push({
          id: `api-missing-timeout-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "HTTP fetch() Without Timeout or AbortSignal",
          category: "api_integration",
          severity: "medium",
          confidence: 0.8,
          evidence: trimmed,
          explanation: "Standard fetch() requests do not have a default timeout and can hang indefinitely if the remote server becomes unresponsive.",
          expected_behavior: "Outbound HTTP requests should enforce a bounded timeout via AbortSignal.timeout(ms) or AbortController.",
          actual_behavior: "Unbounded request can exhaust runtime worker threads and connections.",
          suggested_fix: "Pass an AbortSignal timeout: 'fetch(url, { signal: AbortSignal.timeout(10000) })'.",
          rule_id: "api_missing_request_timeout",
          is_confirmed: false,
        });
      }
    }
  });

  return findings;
}

// ─── 8. Database Errors ─────────────────────────────────────────────

export function analyzeDatabaseErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // 8.1 SQL Query missing transaction on critical updates
    if (/\b(?:UPDATE|DELETE)\s+[a-zA-Z0-9_$]+[^;\n]*\bWHERE\b/i.test(trimmed) && /balance|funds|credits|quota/i.test(trimmed)) {
      const surrounding = lines.slice(Math.max(0, idx - 10), Math.min(lines.length, idx + 10)).join("\n");
      if (!/transaction|BEGIN|FOR UPDATE|LOCK/i.test(surrounding)) {
        findings.push({
          id: `db-missing-tx-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Financial/Balance Mutation Without Explicit Transaction Wrap",
          category: "database",
          severity: "high",
          confidence: 0.8,
          evidence: trimmed,
          explanation: "Financial or quota mutations executed without transactions are vulnerable to race conditions and partial write inconsistency.",
          expected_behavior: "Balance adjustments should be wrapped in an ACID transaction with appropriate isolation or SELECT FOR UPDATE.",
          actual_behavior: "Direct update without atomic transaction boundary.",
          suggested_fix: "Wrap balance updates in database transactions or atomic decrement functions.",
          rule_id: "db_unwrapped_balance_mutation",
          is_confirmed: false,
        });
      }
    }
  });

  return findings;
}

// ─── 9. Performance Errors ──────────────────────────────────────────

export function analyzePerformanceErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // 9.1 Synchronous file I/O inside potential route or server handlers
    if (/\bfs\.(?:readFileSync|writeFileSync|appendFileSync|existsSync)\s*\(/i.test(trimmed)) {
      if (file.path.includes("/routes/") || file.path.includes("/api/") || file.path.includes("/controllers/")) {
        findings.push({
          id: `perf-sync-io-in-route-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Blocking Synchronous File System I/O in Request Handler",
          category: "performance",
          severity: "medium",
          confidence: 0.85,
          evidence: trimmed,
          explanation: "Synchronous fs operations block the Node.js event loop, preventing concurrent requests from being serviced.",
          expected_behavior: "Web servers should use asynchronous fs/promises equivalents.",
          actual_behavior: "Event loop is paused during synchronous file disk read/write.",
          suggested_fix: "Use 'await fs.promises.readFile()' or asynchronous streams instead of Sync methods.",
          rule_id: "perf_sync_io_in_handler",
          is_confirmed: true,
        });
      }
    }

    // 9.2 Catastrophic ReDoS Regex Pattern: nested quantifiers like (a+)+
    if (/\/(?:[a-zA-Z0-9_\-\[\]\.\+]*\+)+\+\//.test(trimmed) || /\([a-zA-Z0-9_\-\.\*]+\)\*\+/.test(trimmed)) {
      findings.push({
        id: `perf-redos-pattern-${file.path}-${idx + 1}`,
        file_path: file.path,
        line_number: idx + 1,
        title: "Potential Regular Expression Denial of Service (ReDoS)",
        category: "performance",
        severity: "high",
        confidence: 0.85,
        evidence: trimmed,
        explanation: "Nested quantifiers in regular expressions can cause exponential backtracking on crafted input, leading to CPU exhaustion.",
        expected_behavior: "Regular expressions should avoid overlapping nested repetitions.",
        actual_behavior: "Pathological inputs trigger catastrophic backtracking.",
        suggested_fix: "Rewrite regex to eliminate nested quantifiers or validate input length beforehand.",
        rule_id: "perf_catastrophic_redos",
        is_confirmed: false,
      });
    }
  });

  return findings;
}

// ─── 10. Concurrency Errors ─────────────────────────────────────────

export function analyzeConcurrencyErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");

  if (file.path.includes("/routes/") || file.path.includes("/controllers/") || file.path.includes("/api/")) {
    let topLevelLetFound = false;
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (/^(?:let|var)\s+[a-zA-Z0-9_$]+\s*=/.test(trimmed) && idx < 30) {
        topLevelLetFound = true;
      }
      if (topLevelLetFound && /\b[a-zA-Z0-9_$]+\s*(?:\+\+|--|\+=|-=)\s*/.test(trimmed) && !trimmed.startsWith("for")) {
        findings.push({
          id: `concurrency-shared-mutable-state-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Shared Mutable Module State in Request Handler",
          category: "concurrency",
          severity: "medium",
          confidence: 0.75,
          evidence: trimmed,
          explanation: "Mutating module-scoped state across asynchronous HTTP handlers creates race conditions and cross-request state pollution.",
          expected_behavior: "Request state should be scoped to the request lifecycle or persisted to a thread-safe database.",
          actual_behavior: "Concurrent incoming requests mutate shared memory.",
          suggested_fix: "Store state in request context, session storage, or Redis/PostgreSQL.",
          rule_id: "concurrency_shared_mutable_state",
          is_confirmed: false,
        });
      }
    });
  }

  return findings;
}

// ─── 11. Build and Configuration Errors ─────────────────────────────

export function analyzeBuildConfigErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");

  // Check committed .env files
  if (file.path.endsWith(".env") || file.path.endsWith(".env.production") || file.path.endsWith(".env.local")) {
    findings.push({
      id: `build-env-file-committed-${file.path}-1`,
      file_path: file.path,
      line_number: 1,
      title: "Committed Environment Configuration File (.env)",
      category: "build_config",
      severity: "high",
      confidence: 1.0,
      evidence: file.path,
      explanation: "Committing environment files to source control risks leaking staging/production configurations and secrets.",
      expected_behavior: ".env files should be added to .gitignore and injected via deployment environments.",
      actual_behavior: "Environment file is tracked in git repository.",
      suggested_fix: "Add '.env*' to .gitignore and manage configurations via environment variables.",
      rule_id: "build_committed_env_file",
      is_confirmed: true,
    });
  }

  // Check dangerous debug flags in code
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/\b(?:DEBUG|ENABLE_DEBUG|DEBUG_MODE)\s*[:=]\s*(?:true|1|"true")\b/i.test(trimmed)) {
      findings.push({
        id: `build-debug-enabled-${file.path}-${idx + 1}`,
        file_path: file.path,
        line_number: idx + 1,
        title: "Production Debug Mode Enabled in Configuration",
        category: "build_config",
        severity: "medium",
        confidence: 0.85,
        evidence: trimmed,
        explanation: "Enabling debug modes exposes verbose stack traces, environment variables, and internal endpoints to external actors.",
        expected_behavior: "Debug flags must be dynamically disabled or default to false in non-development environments.",
        actual_behavior: "Hardcoded debug mode enabled in configuration.",
        suggested_fix: "Bind debug flags to environment check: 'DEBUG = process.env.NODE_ENV !== \"production\"'.",
        rule_id: "build_debug_mode_enabled",
        is_confirmed: false,
      });
    }
  });

  return findings;
}

// ─── 12. Testing and Maintainability Issues ─────────────────────────

export function analyzeMaintainabilityErrors(file: AnalyzeFileInput): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const lines = file.content.split("\n");

  if (file.path.includes(".test.") || file.path.includes(".spec.")) {
    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Empty test block
      if (/(?:it|test)\s*\(\s*["'`][^"'`]+["'`]\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{\s*\}\s*\)/.test(trimmed)) {
        findings.push({
          id: `maintain-empty-test-${file.path}-${idx + 1}`,
          file_path: file.path,
          line_number: idx + 1,
          title: "Empty Test Case Without Assertions",
          category: "maintainability",
          severity: "low",
          confidence: 0.95,
          evidence: trimmed,
          explanation: "Test case contains no executable code or assertions, creating a false impression of test coverage.",
          expected_behavior: "Every test must exercise code and verify output with assertions.",
          actual_behavior: "Empty test passes vacuously.",
          suggested_fix: "Implement assertions for this test case or remove it.",
          rule_id: "maintain_empty_test_case",
          is_confirmed: true,
        });
      }
    });
  }

  return findings;
}

// ─── Master Unified File Analyzer ───────────────────────────────────

export function analyzeCodebaseFile(file: AnalyzeFileInput): CodebaseFinding[] {
  const allFindings = [
    ...analyzeSyntaxErrors(file),
    ...analyzeFormattingErrors(file),
    ...analyzeLogicalErrors(file),
    ...analyzeRuntimeErrors(file),
    ...analyzeTypeValidationErrors(file),
    ...analyzeSecurityErrors(file),
    ...analyzeApiIntegrationErrors(file),
    ...analyzeDatabaseErrors(file),
    ...analyzePerformanceErrors(file),
    ...analyzeConcurrencyErrors(file),
    ...analyzeBuildConfigErrors(file),
    ...analyzeMaintainabilityErrors(file),
  ];

  // Deduplicate by file_path + line_number + rule_id
  const seen = new Set<string>();
  const uniqueFindings: CodebaseFinding[] = [];

  for (const f of allFindings) {
    const key = `${f.file_path}:${f.line_number ?? 0}:${f.rule_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueFindings.push(f);
    }
  }

  return uniqueFindings;
}

export function summarizeFindings(findings: CodebaseFinding[]): AnalysisSummary {
  const byCategory: Record<CodebaseErrorCategory, number> = {
    syntax: 0,
    formatting: 0,
    logic: 0,
    runtime: 0,
    types_validation: 0,
    security: 0,
    api_integration: 0,
    database: 0,
    performance: 0,
    concurrency: 0,
    build_config: 0,
    maintainability: 0,
  };

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  let confirmedBugs = 0;
  let suspectedIssues = 0;

  for (const f of findings) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    if (f.is_confirmed) {
      confirmedBugs++;
    } else {
      suspectedIssues++;
    }
  }

  return {
    totalFindings: findings.length,
    byCategory,
    bySeverity,
    confirmedBugs,
    suspectedIssues,
  };
}
