import { describe, it, expect } from "vitest";
import {
  analyzeCodebaseFile,
  analyzeSyntaxErrors,
  analyzeFormattingErrors,
  analyzeLogicalErrors,
  analyzeRuntimeErrors,
  analyzeTypeValidationErrors,
  analyzeSecurityErrors,
  analyzeApiIntegrationErrors,
  analyzeDatabaseErrors,
  analyzePerformanceErrors,
  analyzeConcurrencyErrors,
  analyzeBuildConfigErrors,
  analyzeMaintainabilityErrors,
  summarizeFindings,
} from "./codebaseAnalyzer.server";
import { traceCrossFileTaint } from "./crossFileTracer.server";

describe("12-Class Codebase Analyzer Engine", () => {
  // ── 1. Syntax Errors ──────────────────────────────────────────────
  describe("Category 1: Syntax Errors", () => {
    it("flags invalid JSON syntax with exact error position", () => {
      const invalidJson = '{\n  "name": "buggers",\n  "version": 1.0,\n}';
      const findings = analyzeSyntaxErrors({ path: "package.json", content: invalidJson, language: "json" });
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0]?.rule_id).toBe("syntax_invalid_json");
      expect(findings[0]?.category).toBe("syntax");
    });

    it("passes valid JSON without false positives", () => {
      const validJson = '{\n  "name": "buggers",\n  "version": "1.0.0"\n}';
      const findings = analyzeSyntaxErrors({ path: "config.json", content: validJson, language: "json" });
      expect(findings.length).toBe(0);
    });

    it("detects unmatched closing delimiters in source code", () => {
      const code = `function calculate() {\n  return (5 + 10));\n}`;
      const findings = analyzeSyntaxErrors({ path: "src/calc.ts", content: code, language: "typescript" });
      expect(findings.length).toBe(1);
      expect(findings[0]?.title).toContain("Unmatched Delimiter");
      expect(findings[0]?.line_number).toBe(2);
    });

    it("detects unclosed opening delimiters at file end", () => {
      const code = `function open() {\n  if (true) {\n    console.log("unclosed");\n`;
      const findings = analyzeSyntaxErrors({ path: "src/open.js", content: code, language: "javascript" });
      expect(findings.length).toBe(1);
      expect(findings[0]?.title).toContain("Unclosed Delimiter");
    });
  });

  // ── 2. Formatting & Indentation Errors ─────────────────────────────
  describe("Category 2: Indentation and Formatting Errors", () => {
    it("detects mixed tabs and spaces in Python indentation", () => {
      const pythonCode = "def test():\n\t    x = 1\n    return x\n";
      const findings = analyzeFormattingErrors({ path: "app/main.py", content: pythonCode, language: "python" });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("format_python_mixed_tabs");
      expect(findings[0]?.category).toBe("formatting");
    });

    it("passes clean 4-space indented Python code", () => {
      const cleanPython = "def test():\n    x = 1\n    return x\n";
      const findings = analyzeFormattingErrors({ path: "app/main.py", content: cleanPython, language: "python" });
      expect(findings.length).toBe(0);
    });
  });

  // ── 3. Logical Errors ─────────────────────────────────────────────
  describe("Category 3: Logical Errors", () => {
    it("detects tautological self-comparisons", () => {
      const code = "if (userId === userId) {\n  proceed();\n}";
      const findings = analyzeLogicalErrors({ path: "src/auth.ts", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("logic_self_comparison");
      expect(findings[0]?.line_number).toBe(1);
    });

    it("detects accidental variable assignment in if conditions", () => {
      const code = "if (status = 'active') {\n  run();\n}";
      const findings = analyzeLogicalErrors({ path: "src/service.js", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("logic_assignment_in_conditional");
    });

    it("detects off-by-one array length loops", () => {
      const code = "for (let i = 0; i <= items.length; i++) {\n  process(items[i]);\n}";
      const findings = analyzeLogicalErrors({ path: "src/loop.ts", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("logic_off_by_one_array_bound");
    });

    it("detects contradictory range conditions (x > 10 && x < 5)", () => {
      const code = "if (count > 10 && count < 5) {\n  unreachable();\n}";
      const findings = analyzeLogicalErrors({ path: "src/range.ts", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("logic_contradictory_range");
    });
  });

  // ── 4. Runtime Errors ─────────────────────────────────────────────
  describe("Category 4: Runtime Errors", () => {
    it("detects unhandled JSON.parse outside try/catch", () => {
      const code = "function parseInput(raw) {\n  const data = JSON.parse(raw);\n  return data;\n}";
      const findings = analyzeRuntimeErrors({ path: "src/parser.ts", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("runtime_unhandled_json_parse");
    });

    it("does not flag JSON.parse when wrapped in try/catch", () => {
      const code = "try {\n  const data = JSON.parse(raw);\n} catch (e) {\n  console.error(e);\n}";
      const findings = analyzeRuntimeErrors({ path: "src/safeParser.ts", content: code });
      expect(findings.length).toBe(0);
    });

    it("detects unawaited async callbacks inside forEach", () => {
      const code = "users.forEach(async (u) => {\n  await db.save(u);\n});";
      const findings = analyzeRuntimeErrors({ path: "src/asyncLoop.ts", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("runtime_async_foreach");
    });
  });

  // ── 5. Type and Validation Errors ─────────────────────────────────
  describe("Category 5: Type and Validation Errors", () => {
    it("detects unsafe 'as any' casts", () => {
      const code = "const result = (response as any).profile.id;";
      const findings = analyzeTypeValidationErrors({ path: "src/client.ts", content: code, language: "typescript" });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("types_unsafe_any_cast");
    });

    it("detects unreasoned @ts-ignore suppressions", () => {
      const code = "// @ts-ignore\nconst invalid = missingFunction();";
      const findings = analyzeTypeValidationErrors({ path: "src/app.ts", content: code, language: "typescript" });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("types_ts_ignore_suppression");
    });
  });

  // ── 6. Security Vulnerabilities ───────────────────────────────────
  describe("Category 6: Security Vulnerabilities", () => {
    it("detects path traversal via request query concatenation", () => {
      const code = 'router.get("/download", (req, res) => {\n  const data = fs.readFileSync("./uploads/" + req.query.file);\n  res.send(data);\n});';
      const findings = analyzeSecurityErrors({ path: "src/routes/file.js", content: code });
      expect(findings.length).toBeGreaterThan(0);
      expect(findings.some((f) => f.rule_id.includes("path_traversal"))).toBe(true);
    });

    it("detects command injection in child_process.exec", () => {
      const code = 'exec("ping -c 1 " + req.body.ip, callback);';
      const findings = analyzeSecurityErrors({ path: "src/api/network.ts", content: code });
      expect(findings.some((f) => f.rule_id.includes("command_injection"))).toBe(true);
    });
  });

  // ── 7. API and Integration Errors ─────────────────────────────────
  describe("Category 7: API and Integration Errors", () => {
    it("detects fetch() without AbortSignal or timeout", () => {
      const code = 'async function getData() {\n  const res = await fetch("https://api.external.com/data");\n  return res.json();\n}';
      const findings = analyzeApiIntegrationErrors({ path: "src/api/client.ts", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("api_missing_request_timeout");
    });
  });

  // ── 8. Database Errors ────────────────────────────────────────────
  describe("Category 8: Database Errors", () => {
    it("flags financial mutation without transaction wrap", () => {
      const code = 'await db.query("UPDATE accounts SET balance = balance - 100 WHERE id = 1");';
      const findings = analyzeDatabaseErrors({ path: "src/services/billing.ts", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("db_unwrapped_balance_mutation");
    });
  });

  // ── 9. Performance Errors ─────────────────────────────────────────
  describe("Category 9: Performance Errors", () => {
    it("detects blocking synchronous I/O in route handlers", () => {
      const code = 'router.get("/config", (req, res) => {\n  const content = fs.readFileSync("/etc/app.conf", "utf-8");\n  res.send(content);\n});';
      const findings = analyzePerformanceErrors({ path: "src/routes/config.js", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("perf_sync_io_in_handler");
    });
  });

  // ── 10. Concurrency Errors ────────────────────────────────────────
  describe("Category 10: Concurrency Errors", () => {
    it("detects shared mutable module state mutated in route handler", () => {
      const code = "let requestCounter = 0;\nrouter.get('/stat', (req, res) => {\n  requestCounter++;\n  res.json({ count: requestCounter });\n});";
      const findings = analyzeConcurrencyErrors({ path: "src/routes/stats.js", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("concurrency_shared_mutable_state");
    });
  });

  // ── 11. Build & Configuration Errors ──────────────────────────────
  describe("Category 11: Build and Configuration Errors", () => {
    it("flags committed production environment file (.env.production)", () => {
      const findings = analyzeBuildConfigErrors({ path: ".env.production", content: "PORT=3000\nSECRET=12345" });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("build_committed_env_file");
    });

    it("flags hardcoded production debug flag", () => {
      const code = 'const config = {\n  DEBUG_MODE: true,\n};';
      const findings = analyzeBuildConfigErrors({ path: "src/config.js", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("build_debug_mode_enabled");
    });
  });

  // ── 12. Maintainability & Testing Errors ───────────────────────────
  describe("Category 12: Testing and Maintainability Issues", () => {
    it("detects empty test cases that lack assertions", () => {
      const code = 'describe("User", () => {\n  it("should authenticate", () => {});\n});';
      const findings = analyzeMaintainabilityErrors({ path: "src/user.test.ts", content: code });
      expect(findings.length).toBe(1);
      expect(findings[0]?.rule_id).toBe("maintain_empty_test_case");
    });
  });

  // ── Cross-File Taint Tracing ──────────────────────────────────────
  describe("Cross-File Import & Taint Tracing", () => {
    it("traces unvalidated request parameters across modules to database sink", () => {
      const files = [
        {
          path: "src/services/dbHelper.js",
          content: "export function runRawQuery(param) {\n  return db.query(`SELECT * FROM users WHERE id = ${param}`);\n}",
        },
        {
          path: "src/routes/userRoute.js",
          content: 'import { runRawQuery } from "../services/dbHelper.js";\nrouter.get("/:id", (req, res) => {\n  runRawQuery(req.params.id);\n});',
        },
      ];

      const crossFindings = traceCrossFileTaint(files);
      expect(crossFindings.length).toBe(1);
      expect(crossFindings[0]?.rule_id).toBe("dataflow_cross_module_taint");
      expect(crossFindings[0]?.title).toContain("Cross-File Data Flow");
    });
  });

  // ── Unified Aggregator & Summary ──────────────────────────────────
  describe("Unified File Analyzer & Summary", () => {
    it("aggregates findings and categorizes by severity and confirmed status", () => {
      const sampleCode = `
        let activeSessions = 0;
        router.post("/calc", (req, res) => {
          activeSessions++;
          if (x === x) console.log("noop");
          const val = JSON.parse(req.body.data);
          eval(req.body.code);
        });
      `;
      const findings = analyzeCodebaseFile({ path: "src/routes/calc.js", content: sampleCode });
      expect(findings.length).toBeGreaterThan(0);

      const summary = summarizeFindings(findings);
      expect(summary.totalFindings).toBe(findings.length);
      expect(summary.confirmedBugs + summary.suspectedIssues).toBe(findings.length);
    });
  });
});
