const assert = require("assert");
const Module = require("module");
const path = require("path");

// ============================================================================
// Comprehensive Mock VS Code Environment for Standalone Extension Testing
// ============================================================================

const registeredCommands = new Map();
const diagnosticsStorage = new Map();
let currentStatusBarItem = null;
let currentTreeDataProvider = null;
let saveDocumentListeners = [];
let mockConfig = {
  serverUrl: "https://buggers.dev",
  autoAnalyzeOnSave: true,
  minimumSeverity: "low",
  "ai.provider": "openai",
  "ai.model": "gpt-4o-mini",
  "ai.customEndpoint": "",
  "ai.timeoutMs": 30000,
};

const mockSecrets = new Map();
const mockSecretsManager = {
  get: async (key) => mockSecrets.get(key),
  store: async (key, val) => {
    mockSecrets.set(key, val);
  },
  delete: async (key) => {
    mockSecrets.delete(key);
  },
};

const mockContext = {
  subscriptions: [],
  secrets: mockSecretsManager,
};

let activeEditorMock = null;
let executedCommands = [];
let infoMessages = [];
let warningMessages = [];
let errorMessages = [];

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "vscode") {
    return {
      window: {
        get activeTextEditor() {
          return activeEditorMock;
        },
        showInformationMessage: async (msg, ...items) => {
          infoMessages.push(msg);
          return items[0];
        },
        showWarningMessage: async (msg, ...items) => {
          warningMessages.push(msg);
          return items[0];
        },
        showErrorMessage: async (msg, ...items) => {
          errorMessages.push(msg);
          return items[0];
        },
        showInputBox: async (opts) => {
          return opts.testInput || "mock-input";
        },
        showQuickPick: async (items) => {
          return items[0];
        },
        createStatusBarItem: (alignment, priority) => {
          currentStatusBarItem = {
            alignment,
            priority,
            text: "",
            tooltip: "",
            command: "",
            backgroundColor: undefined,
            show: () => {},
            dispose: () => {
              currentStatusBarItem = null;
            },
          };
          return currentStatusBarItem;
        },
        registerTreeDataProvider: (viewId, provider) => {
          currentTreeDataProvider = provider;
        },
        createTerminal: (name) => ({
          show: () => {},
          sendText: (text) => {},
        }),
        createWebviewPanel: (viewType, title, showOptions, options) => ({
          webview: {
            html: "",
            onDidReceiveMessage: () => ({ dispose: () => {} }),
            postMessage: async () => true,
          },
          reveal: () => {},
          dispose: () => {},
        }),
        createTextEditorDecorationType: () => ({ dispose: () => {} }),
        visibleTextEditors: [],
        showTextDocument: async (doc) => ({
          document: doc,
          selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 }, active: { line: 0 } },
          revealRange: () => {},
          setDecorations: () => {},
          edit: async (cb) => {
            cb({ replace: () => {} });
            return true;
          },
        }),
        withProgress: async (opts, task) => {
          const progressReports = [];
          return await task({
            report: (val) => progressReports.push(val),
          });
        },
      },
      workspace: {
        registerTextDocumentContentProvider: () => ({ dispose: () => {} }),
        getConfiguration: (section) => ({
          get: (key, defaultValue) => {
            const fullKey = section ? `${section}.${key}` : key;
            if (mockConfig[fullKey] !== undefined) return mockConfig[fullKey];
            if (mockConfig[key] !== undefined) return mockConfig[key];
            return defaultValue;
          },
          update: async (key, val) => {
            mockConfig[key] = val;
          },
        }),
        asRelativePath: (uri) => {
          const p = typeof uri === "string" ? uri : (uri.fsPath || uri.path);
          return path.basename(p);
        },
        findFiles: async (include, exclude, maxResults) => {
          return [];
        },
        openTextDocument: async (uriOrOpts) => {
          if (typeof uriOrOpts === "object" && uriOrOpts.content) {
            return {
              fileName: "untitled:preview",
              getText: () => uriOrOpts.content,
              lineAt: () => ({ range: {}, text: "" }),
            };
          }
          const p = typeof uriOrOpts === "string" ? uriOrOpts : (uriOrOpts.fsPath || uriOrOpts.path);
          return {
            fileName: p,
            getText: () => "",
            lineAt: () => ({ range: {}, text: "" }),
          };
        },
        getWorkspaceFolder: (uri) => ({ uri: { fsPath: "/workspace" } }),
        applyEdit: async (edit) => true,
        onDidSaveTextDocument: (callback) => {
          saveDocumentListeners.push(callback);
          return {
            dispose: () => {
              saveDocumentListeners = saveDocumentListeners.filter((l) => l !== callback);
            },
          };
        },
      },
      languages: {
        createDiagnosticCollection: (name) => {
          const collection = {
            name,
            set: (uri, diags) => {
              const key = uri.fsPath || uri.path || uri.toString();
              diagnosticsStorage.set(key, diags);
            },
            get: (uri) => {
              const key = uri.fsPath || uri.path || uri.toString();
              return diagnosticsStorage.get(key) || [];
            },
            clear: () => {
              diagnosticsStorage.clear();
            },
            dispose: () => {
              diagnosticsStorage.clear();
            },
          };
          return collection;
        },
        registerCodeActionsProvider: () => ({ dispose: () => {} }),
        registerCodeLensProvider: () => ({ dispose: () => {} }),
        registerHoverProvider: () => ({ dispose: () => {} }),
      },
      CodeLens: class {
        constructor(range, command) {
          this.range = range;
          this.command = command;
        }
      },
      Hover: class {
        constructor(contents, range) {
          this.contents = contents;
          this.range = range;
        }
      },
      ViewColumn: { One: 1, Two: 2, Beside: -2 },
      OverviewRulerLane: { Right: 4 },
      TextEditorRevealType: { Default: 0, InCenter: 1, InCenterIfOutsideViewport: 2, AtTop: 3 },
      CodeActionKind: { QuickFix: "QuickFix" },
      CodeAction: class {
        constructor(title, kind) {
          this.title = title;
          this.kind = kind;
        }
      },
      WorkspaceEdit: class {
        replace() {}
        insert() {}
      },
      StatusBarAlignment: { Left: 1, Right: 2 },
      DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
      Diagnostic: class {
        constructor(range, message, severity) {
          this.range = range;
          this.message = message;
          this.severity = severity;
        }
      },
      Range: class {
        constructor(start, end) {
          this.start = start;
          this.end = end;
        }
      },
      Position: class {
        constructor(line, char) {
          this.line = line;
          this.character = char;
        }
      },
      MarkdownString: class {
        constructor(value) {
          this.value = value;
        }
        appendMarkdown(val) {
          this.value = (this.value || "") + val;
        }
      },
      ThemeIcon: class {
        constructor(id, color) {
          this.id = id;
          this.color = color;
        }
      },
      ThemeColor: class {
        constructor(id) {
          this.id = id;
        }
      },
      TreeItem: class {
        constructor(label, collapsibleState) {
          this.label = label;
          this.collapsibleState = collapsibleState;
        }
      },
      TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
      EventEmitter: class {
        constructor() {
          this.listeners = [];
        }
        event(cb) {
          this.listeners.push(cb);
        }
        fire(data) {
          for (const cb of this.listeners) cb(data);
        }
      },
      commands: {
        registerCommand: (commandId, handler) => {
          registeredCommands.set(commandId, handler);
          return {
            dispose: () => {
              registeredCommands.delete(commandId);
            },
          };
        },
        executeCommand: async (commandId, ...args) => {
          executedCommands.push({ commandId, args });
          const handler = registeredCommands.get(commandId);
          if (handler) {
            return await handler(...args);
          }
          return undefined;
        },
      },
      Uri: {
        file: (p) => ({ fsPath: p, path: p, toString: () => `file://${p}` }),
        parse: (s) => ({ fsPath: s, path: s, toString: () => s }),
      },
      ProgressLocation: {
        Notification: 15,
      },
      env: {
        openExternal: async (uri) => true,
      },
    };
  }
  return originalLoad.apply(this, arguments);
};

// ============================================================================
// Load Compiled Extension Bundle
// ============================================================================
console.log("Loading compiled Buggers extension from dist/extension.js...");
const ext = require("../dist/extension.js");
const { SAST_RULES, SECRET_RULES, LOGICAL_BUG_RULES, scanText, scanDocument, activate, deactivate } = ext;

console.log("\n========================================================");
console.log("BUGGERS VS CODE EXTENSION — PRODUCTION VERIFICATION TEST");
console.log("========================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

(async () => {
  // --------------------------------------------------------------------------
  // Suite 1: Rule Registry Integrity & Coverage
  // --------------------------------------------------------------------------
  console.log("--- Suite 1: Rule Registry Integrity & Coverage ---");

  runTest("SAST Security Rules count and integrity (23 rules covering all 21 categories)", () => {
    assert.ok(SAST_RULES.length >= 23, `Expected at least 23 SAST rules, found ${SAST_RULES.length}`);
    const requiredRules = [
      "sql_injection",
      "command_injection",
      "path_traversal",
      "weak_cryptography",
      "insecure_randomness",
      "cross_site_scripting",
      "unsafe_redirect",
      "disabled_tls",
      "insecure_http",
      "dynamic_code_execution",
      "sensitive_logging",
      "insecure_file_permissions",
      "unsafe_temp_files",
      "weak_comparisons",
      "unsafe_regex",
      "insecure_cookies",
      "error_disclosure",
      "unsafe_file_deletion",
      "prototype_pollution",
      "missing_async_error_handling",
      "timing_attack",
      "insecure_cors",
      "ssrf",
    ];

    for (const ruleId of requiredRules) {
      const found = SAST_RULES.find((r) => r.id === ruleId);
      assert.ok(found, `Missing required SAST rule: ${ruleId}`);
      assert.ok(found.pattern instanceof RegExp, `${ruleId} pattern must be a RegExp`);
      assert.ok(found.name && found.name.length > 0, `${ruleId} must have descriptive name`);
      assert.ok(found.whyItMatters && found.whyItMatters.length > 0, `${ruleId} must explain root cause/risk`);
      assert.ok(typeof found.suggestedFixTemplate === "function", `${ruleId} must provide fix template`);
    }
  });

  runTest("Secret Rules count and integrity (7 rules)", () => {
    assert.ok(SECRET_RULES.length >= 7, `Expected at least 7 Secret rules, found ${SECRET_RULES.length}`);
    const requiredSecrets = [
      "aws_access_key",
      "github_pat",
      "openai_api_key",
      "stripe_secret_key",
      "private_key",
      "db_connection_uri",
      "generic_api_secret",
    ];
    for (const ruleId of requiredSecrets) {
      const found = SECRET_RULES.find((r) => r.id === ruleId);
      assert.ok(found, `Missing expected Secret rule: ${ruleId}`);
      assert.ok(found.pattern instanceof RegExp, `${ruleId} pattern must be RegExp`);
    }
  });

  runTest("Logical Bug Rules count and integrity (5 rules)", () => {
    assert.ok(LOGICAL_BUG_RULES.length >= 5, `Expected at least 5 Logical Bug rules, found ${LOGICAL_BUG_RULES.length}`);
    const requiredBugs = [
      "bug_accidental_assignment_in_condition",
      "bug_tautological_condition",
      "bug_nan_comparison",
      "bug_off_by_one_index",
      "bug_unreachable_code",
    ];
    for (const ruleId of requiredBugs) {
      const found = LOGICAL_BUG_RULES.find((r) => r.id === ruleId);
      assert.ok(found, `Missing expected Logical Bug rule: ${ruleId}`);
      assert.strictEqual(found.category, "logical_bug");
    }
  });

  // --------------------------------------------------------------------------
  // Suite 2: Detection Accuracy for All 21 Categories
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 2: Detection Coverage for All 21 Security Categories ---");

  runTest("1. SQL Injection (CWE-89)", () => {
    const code = 'const query = `SELECT * FROM users WHERE id = ${req.query.id}`;';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "sql_injection");
  });

  runTest("2. Command Injection (CWE-78)", () => {
    const code = 'exec(`ping -c 1 ${host}`);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "command_injection");
  });

  runTest("3. Path Traversal (CWE-22)", () => {
    const code = 'fs.readFile(path.join("/uploads", req.query.file));';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "path_traversal");
  });

  runTest("4. Weak Cryptography (CWE-327)", () => {
    const code = 'const cipher = crypto.createCipher("des", key);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "weak_cryptography");
  });

  runTest("5. Insecure Randomness (CWE-338)", () => {
    const code = 'const token = Math.random().toString(36).substring(2);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "insecure_randomness");
  });

  runTest("6. Cross-Site Scripting (CWE-79)", () => {
    const code = 'element.innerHTML = userInput;';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "cross_site_scripting");
  });

  runTest("7. Unsafe Redirect (CWE-601)", () => {
    const code = 'res.redirect(req.query.target);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "unsafe_redirect");
  });

  runTest("8. Disabled TLS Verification (CWE-295)", () => {
    const code = 'process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "disabled_tls");
  });

  runTest("9. Insecure HTTP (CWE-319)", () => {
    const code = 'const api = "http://internal-api.corp/auth";';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "insecure_http");
  });

  runTest("10. Dynamic Code Execution (CWE-95)", () => {
    const code = 'eval(userInput);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "dynamic_code_execution");
  });

  runTest("11. Sensitive Data Logging (CWE-532)", () => {
    const code = 'console.log("User auth details:", password);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "sensitive_logging");
  });

  runTest("12. Insecure File Permissions (CWE-732)", () => {
    const code = 'fs.chmodSync(secretFile, 0o777);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "insecure_file_permissions");
  });

  runTest("13. Unsafe Temporary Files (CWE-377)", () => {
    const code = 'const tempPath = "/tmp/cache-" + Date.now();';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "unsafe_temp_files");
  });

  runTest("14. Weak Comparison (CWE-697)", () => {
    const code = 'if (userToken == secretToken) {';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "weak_comparisons");
  });

  runTest("15. Unsafe Regular Expression / ReDoS (CWE-1333)", () => {
    const code = 'const re = new RegExp("(a+)+$");';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "unsafe_regex");
  });

  runTest("16. Insecure Cookies (CWE-614)", () => {
    const code = 'res.cookie("session_id", sid, { httpOnly: false });';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "insecure_cookies");
  });

  runTest("17. Error Information Disclosure (CWE-209)", () => {
    const code = 'res.status(500).send(err.stack);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "error_disclosure");
  });

  runTest("18. Unsafe File Deletion (CWE-73)", () => {
    const code = 'fs.unlinkSync(req.query.targetFile);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "unsafe_file_deletion");
  });

  runTest("19. Prototype Pollution Risk (CWE-1321)", () => {
    const code = 'targetObj[key] = val; // Object.__proto__ assignment';
    const f = scanText('target["__proto__"] = val;', "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "prototype_pollution");
  });

  runTest("20. Missing Async Error Handling (CWE-703)", () => {
    const code = 'fs.promises.readFile(path).then((data) => process(data));';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "missing_async_error_handling");
  });

  runTest("21. Side-Channel Timing Attack (CWE-208)", () => {
    const code = 'if (signature === expectedSig) { verify(); }';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "timing_attack");
  });

  runTest("22. Insecure CORS Configuration (CWE-942)", () => {
    const code = 'cors({ origin: "*", credentials: true });';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "insecure_cors");
  });

  runTest("23. Server-Side Request Forgery / SSRF (CWE-918)", () => {
    const code = 'await fetch(req.query.url);';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "ssrf");
  });

  // --------------------------------------------------------------------------
  // Suite 3: Logical Bug Detection
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 3: Deterministic Logical Bug Detection ---");

  runTest("Detects accidental assignment in if-condition", () => {
    const code = 'if (isAdmin = true) { allow(); }';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "bug_accidental_assignment_in_condition");
    assert.strictEqual(f[0].category, "logical_bug");
  });

  runTest("Detects tautological self-comparison", () => {
    const code = 'if (user.id === user.id) { return; }';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "bug_tautological_condition");
  });

  runTest("Detects invalid NaN comparison (x === NaN)", () => {
    const code = 'if (score === NaN) { handle(); }';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "bug_nan_comparison");
  });

  runTest("Detects off-by-one boundary indexing in loop condition", () => {
    const code = 'for (let i = 0; i <= items.length; i++) {';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "bug_off_by_one_index");
  });

  runTest("Detects unreachable dead code after return", () => {
    const code = 'return result;\nconst deadCode = true;';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].ruleId, "bug_unreachable_code");
  });

  // --------------------------------------------------------------------------
  // Suite 4: End-to-End Multi-Category Vulnerability Sample File
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 4: Comprehensive Multi-Category Vulnerability File ---");

  runTest("Reference fixture 'test/fixtures/vulnerable-sample.js' triggers all categories", () => {
    const fs = require("fs");
    const fixturePath = path.join(__dirname, "fixtures", "vulnerable-sample.js");
    const code = fs.readFileSync(fixturePath, "utf8");
    const findings = scanText(code, "fixtures/vulnerable-sample.js");
    console.log(`    ℹ Detected ${findings.length} findings in reference fixture`);
    assert.ok(findings.length >= 28, `Expected at least 28 findings, got ${findings.length}`);
    const ruleIds = new Set(findings.map((f) => f.ruleId));
    assert.ok(ruleIds.has("sql_injection"));
    assert.ok(ruleIds.has("command_injection"));
    assert.ok(ruleIds.has("path_traversal"));
    assert.ok(ruleIds.has("weak_cryptography"));
    assert.ok(ruleIds.has("insecure_randomness"));
    assert.ok(ruleIds.has("cross_site_scripting"));
    assert.ok(ruleIds.has("unsafe_redirect"));
    assert.ok(ruleIds.has("disabled_tls"));
    assert.ok(ruleIds.has("insecure_http"));
    assert.ok(ruleIds.has("dynamic_code_execution"));
    assert.ok(ruleIds.has("sensitive_logging"));
    assert.ok(ruleIds.has("insecure_file_permissions"));
    assert.ok(ruleIds.has("unsafe_temp_files"));
    assert.ok(ruleIds.has("weak_comparisons"));
    assert.ok(ruleIds.has("unsafe_regex"));
    assert.ok(ruleIds.has("insecure_cookies"));
    assert.ok(ruleIds.has("error_disclosure"));
    assert.ok(ruleIds.has("unsafe_file_deletion"));
    assert.ok(ruleIds.has("prototype_pollution"));
    assert.ok(ruleIds.has("missing_async_error_handling"));
    assert.ok(ruleIds.has("timing_attack"));
    assert.ok(ruleIds.has("insecure_cors"));
    assert.ok(ruleIds.has("ssrf"));
    assert.ok(ruleIds.has("aws_access_key"));
    assert.ok(ruleIds.has("github_pat"));
    assert.ok(ruleIds.has("bug_accidental_assignment_in_condition"));
    assert.ok(ruleIds.has("bug_tautological_condition"));
    assert.ok(ruleIds.has("bug_nan_comparison"));
    assert.ok(ruleIds.has("bug_off_by_one_index"));
    assert.ok(ruleIds.has("bug_unreachable_code"));
  });

  // --------------------------------------------------------------------------
  // Suite 5: False Positive Rejection Verification
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 5: False Positive Rejection ---");

  runTest("Clean production patterns produce ZERO false positives", () => {
    const safeCode = `
      // Safe SQL with parameterization
      await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

      // Safe child process execution with execFile
      execFile("ping", ["-c", "1", host], callback);

      // Safe crypto randomness
      const secureBytes = crypto.randomBytes(32);

      // Safe DOM manipulation
      element.textContent = "Safe Text";

      // Safe file permissions (restricted read/write)
      fs.chmodSync(configPath, 0o600);

      // Safe strict comparisons
      if (a === b) { proceed(); }

      // Safe cookies
      res.cookie("auth", sid, { httpOnly: true, secure: true, sameSite: "strict" });

      // Safe timing comparison
      crypto.timingSafeEqual(bufA, bufB);

      // Safe CORS explicit whitelist
      cors({ origin: ["https://buggers.dev"] });
    `;

    const findings = scanText(safeCode, "src/safe.ts");
    assert.strictEqual(findings.length, 0, `Clean code triggered ${findings.length} false positives: ${findings.map(f => f.ruleId).join(", ")}`);
  });

  // --------------------------------------------------------------------------
  // Suite 6: Regression Test Generation
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 6: Regression Test Generation ---");

  runTest("Findings attach regression test templates", () => {
    const code = 'const query = `SELECT * FROM users WHERE id = ${req.query.id}`;';
    const f = scanText(code, "test.js");
    assert.strictEqual(f.length, 1);
    assert.ok(f[0].regressionTest, "Finding must have regressionTest template attached");
    assert.ok(f[0].regressionTest.includes("test("), "Regression test must contain test assertion block");
  });

  // --------------------------------------------------------------------------
  // Suite 7: Extension Commands & AI Lifecycle Registration
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 7: Extension Commands & AI Lifecycle Registration ---");

  runTest("Extension activates and registers all new AI and debugging commands", () => {
    activate(mockContext);

    const expectedNewCommands = [
      "buggers.explainFinding",
      "buggers.suggestFix",
      "buggers.debugSelection",
      "buggers.generateRegressionTest",
      "buggers.findLogicalBugs",
      "buggers.configureAiProvider",
      "buggers.clearAiCredentials",
    ];

    for (const cmdId of expectedNewCommands) {
      assert.ok(registeredCommands.has(cmdId), `Command ${cmdId} must be registered`);
    }
  });

  await runAsyncTest("Command 'buggers.explainFinding' runs without error", async () => {
    const handler = registeredCommands.get("buggers.explainFinding");
    assert.ok(handler);
    await handler({
      ruleId: "sql_injection",
      title: "SQL Injection",
      severity: "critical",
      file: "test.js",
      line: 1,
      problem: "Dynamic query interpolation",
      whyItMatters: "Exfiltrates DB data",
      evidence: "SELECT * FROM users",
      suggestedFix: "Use parameterized query",
    });
  });

  await runAsyncTest("Command 'buggers.generateRegressionTest' creates test buffer", async () => {
    const handler = registeredCommands.get("buggers.generateRegressionTest");
    assert.ok(handler);
    await handler({
      ruleId: "command_injection",
      title: "Command Injection",
      severity: "critical",
      file: "test.js",
      line: 5,
      problem: "Shell command execution",
      whyItMatters: "RCE privilege escalation",
      evidence: "exec(cmd)",
      suggestedFix: "execFile()",
      regressionTest: "test('rejects shell metachars', () => {})",
    });
  });

  // --------------------------------------------------------------------------
  // Suite 8: Extension Deactivation Cleanup
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 8: Extension Deactivation Cleanup ---");

  runTest("Deactivates cleanly without error", () => {
    deactivate();
    assert.strictEqual(diagnosticsStorage.size, 0, "Diagnostic storage cleared on deactivate");
    assert.strictEqual(currentStatusBarItem, null, "Status bar item disposed");
  });

  // --------------------------------------------------------------------------
  // Final Results
  // --------------------------------------------------------------------------
  console.log("\n========================================================");
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100% GREEN)`);
  console.log("========================================================\n");
})();
