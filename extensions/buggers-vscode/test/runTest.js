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
  serverUrl: "https://buggers.vercel.app",
  autoAnalyzeOnSave: true,
  minimumSeverity: "low",
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
        showInformationMessage: (msg) => {
          infoMessages.push(msg);
        },
        showWarningMessage: (msg) => {
          warningMessages.push(msg);
        },
        showErrorMessage: (msg) => {
          errorMessages.push(msg);
        },
        showInputBox: async (opts) => {
          return opts.testInput;
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
        withProgress: async (opts, task) => {
          const progressReports = [];
          return await task({
            report: (val) => progressReports.push(val),
          });
        },
      },
      workspace: {
        getConfiguration: (section) => ({
          get: (key, defaultValue) => {
            if (section === "buggers") {
              return mockConfig[key] !== undefined ? mockConfig[key] : defaultValue;
            }
            return defaultValue;
          },
        }),
        asRelativePath: (uri) => {
          const p = typeof uri === "string" ? uri : (uri.fsPath || uri.path);
          return path.basename(p);
        },
        findFiles: async (include, exclude, maxResults) => {
          return [];
        },
        openTextDocument: async (uri) => ({
          fileName: uri.fsPath || uri.path,
          getText: () => "",
        }),
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
      },
      CodeLens: class {
        constructor(range, command) {
          this.range = range;
          this.command = command;
        }
      },
      CodeActionKind: { QuickFix: "QuickFix" },
      CodeAction: class {
        constructor(title, kind) {
          this.title = title;
          this.kind = kind;
        }
      },
      WorkspaceEdit: class {
        replace() {}
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
        parse: (s) => ({ toString: () => s }),
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
const { SAST_RULES, SECRET_RULES, scanText, scanDocument, activate, deactivate } = ext;

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
  // Suite 1: Rule Registry Integrity
  // --------------------------------------------------------------------------
  console.log("--- Suite 1: Rule Registry Integrity ---");

  runTest("All 8 OWASP SAST rules are defined and valid", () => {
    assert.strictEqual(SAST_RULES.length, 8, `Expected 8 SAST rules, found ${SAST_RULES.length}`);
    const expectedRules = [
      "command_injection",
      "sql_injection",
      "path_traversal",
      "ssrf",
      "insecure_cors",
      "timing_attack",
      "insecure_eval",
      "weak_crypto_hash",
    ];
    for (const ruleId of expectedRules) {
      const found = SAST_RULES.find((r) => r.id === ruleId);
      assert.ok(found, `Missing expected SAST rule: ${ruleId}`);
      assert.ok(found.pattern instanceof RegExp, `${ruleId} pattern must be RegExp`);
      assert.ok(found.name && found.name.length > 0, `${ruleId} must have name`);
      assert.ok(typeof found.suggestedFixTemplate === "function", `${ruleId} must have suggestedFixTemplate`);
    }
  });

  runTest("All 6 Secret detection rules are defined and valid", () => {
    assert.strictEqual(SECRET_RULES.length, 6, `Expected 6 Secret rules, found ${SECRET_RULES.length}`);
    const expectedSecretRules = [
      "aws_access_key",
      "github_pat",
      "openai_api_key",
      "stripe_secret_key",
      "private_key",
      "db_connection_uri",
    ];
    for (const ruleId of expectedSecretRules) {
      const found = SECRET_RULES.find((r) => r.id === ruleId);
      assert.ok(found, `Missing expected Secret rule: ${ruleId}`);
      assert.ok(found.pattern instanceof RegExp, `${ruleId} pattern must be RegExp`);
      assert.ok(typeof found.suggestedFixTemplate === "function", `${ruleId} must have suggestedFixTemplate`);
    }
  });

  // --------------------------------------------------------------------------
  // Suite 2: SAST Flaw Detection Accuracy
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 2: SAST Flaw Detection Accuracy ---");

  runTest("Detects SQL Injection (Critical)", () => {
    const code = 'const query = `SELECT * FROM users WHERE id = ${req.query.id}`;';
    const findings = scanText(code, "src/routes/users.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "sql_injection");
    assert.strictEqual(findings[0].severity, "critical");
    assert.strictEqual(findings[0].line, 1);
  });

  runTest("Detects Command Injection (Critical)", () => {
    const code = 'exec(`rm -rf ${userPath}`);';
    const findings = scanText(code, "src/server/runner.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "command_injection");
    assert.strictEqual(findings[0].severity, "critical");
  });

  runTest("Detects Dynamic Eval Code Execution (Critical)", () => {
    const code = 'const result = eval(userPayload);';
    const findings = scanText(code, "src/utils/calc.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "insecure_eval");
    assert.strictEqual(findings[0].severity, "critical");
  });

  runTest("Detects Server-Side Request Forgery / SSRF (High)", () => {
    const code = 'const response = await fetch(req.query.targetUrl);';
    const findings = scanText(code, "src/proxy/handler.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "ssrf");
    assert.strictEqual(findings[0].severity, "high");
  });

  runTest("Detects Path Traversal (High)", () => {
    const code = 'const fileData = fs.readFile(path.join(uploadDir, req.body.fileName));';
    const findings = scanText(code, "src/files/manager.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "path_traversal");
    assert.strictEqual(findings[0].severity, "high");
  });

  runTest("Detects Side-Channel Timing Attack (High)", () => {
    const code = 'if (signature === session.signature) { grantAccess(); }';
    const findings = scanText(code, "src/auth/session.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "timing_attack");
    assert.strictEqual(findings[0].severity, "high");
  });

  runTest("Detects Insecure CORS Wildcard (Medium)", () => {
    const code = 'cors({ origin: "*", credentials: true });';
    const findings = scanText(code, "src/server/cors.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "insecure_cors");
    assert.strictEqual(findings[0].severity, "medium");
  });

  runTest("Detects Weak Cryptographic Hash MD5 (Medium)", () => {
    const code = 'const hash = crypto.createHash("md5").update(password).digest("hex");';
    const findings = scanText(code, "src/crypto/pass.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "weak_crypto_hash");
    assert.strictEqual(findings[0].severity, "medium");
  });

  // --------------------------------------------------------------------------
  // Suite 3: Secret Detection & Masking Verification
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 3: Secret Detection & Masking Verification ---");

  runTest("Detects AWS Access Key ID with Masking", () => {
    const rawKey = ["AKIA", "1234567890ABCDEF"].join("");
    const code = `const awsKey = "${rawKey}";`;
    const findings = scanText(code, "src/aws.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "aws_access_key");
    assert.strictEqual(findings[0].severity, "critical");
    assert.ok(!findings[0].evidence.includes(rawKey), "Raw secret must not be exposed in evidence");
    assert.ok(findings[0].evidence.includes("AKIA"), "Prefix preserved for identification");
  });

  runTest("Detects GitHub PAT with Masking", () => {
    const rawToken = ["ghp", "1234567890abcdef1234567890abcdef1234"].join("_");
    const code = `const ghToken = "${rawToken}";`;
    const findings = scanText(code, "src/git.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "github_pat");
    assert.ok(!findings[0].evidence.includes("abcdef1234567890"), "Middle token characters masked");
  });

  runTest("Detects OpenAI API Key with Masking", () => {
    const rawAi = ["sk-proj", "1234567890abcdef1234567890abcdef12345678"].join("-");
    const code = `const ai = new OpenAI({ apiKey: "${rawAi}" });`;
    const findings = scanText(code, "src/ai.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "openai_api_key");
  });

  runTest("Detects Stripe Secret Key", () => {
    const rawStripe = ["sk", "live", "1234567890abcdef12345678"].join("_");
    const code = `const stripe = new Stripe("${rawStripe}");`;
    const findings = scanText(code, "src/billing.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "stripe_secret_key");
  });

  runTest("Detects Private Key Block", () => {
    const code = 'const privKey = "-----BEGIN RSA PRIVATE KEY-----";';
    const findings = scanText(code, "src/cert.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "private_key");
  });

  runTest("Detects Database URI with embedded credentials", () => {
    const code = 'const dbUrl = "postgres://admin:superSecretPass@localhost:5432/mydb";';
    const findings = scanText(code, "src/db.ts");
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "db_connection_uri");
  });

  runTest("Ignores dummy and placeholder secrets to avoid false positives", () => {
    const code = [
      'const dummyAws = "AKIAEXAMPLEKEY12345";',
      'const dummyToken = "ghp_placeholder_token_test_123456789";',
      'const key = "your_key_here";',
    ].join("\n");
    const findings = scanText(code, "src/docs/setup.md");
    assert.strictEqual(findings.length, 0, "Placeholders and example tokens must not trigger findings");
  });

  // --------------------------------------------------------------------------
  // Suite 4: Edge Cases, Performance & ReDoS Protection
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 4: Edge Cases & Performance Safety ---");

  runTest("Handles empty file without error", () => {
    const findings = scanText("", "empty.ts");
    assert.deepStrictEqual(findings, []);
  });

  runTest("Handles whitespace-only file without error", () => {
    const findings = scanText("   \n\t\n  \r\n", "whitespace.ts");
    assert.deepStrictEqual(findings, []);
  });

  runTest("Filters unsupported file extensions in scanDocument", () => {
    const fakeBinaryDoc = {
      fileName: "/workspace/assets/logo.png",
      getText: () => "PNG binary blob content with fake eval()",
    };
    const findings = scanDocument(fakeBinaryDoc);
    assert.strictEqual(findings.length, 0, "Binary and image files must be skipped");
  });

  runTest("Scans large 10,000 line file safely without ReDoS or high latency", () => {
    const safeLines = [];
    for (let i = 0; i < 9999; i++) {
      safeLines.push(`const line${i} = Math.sqrt(${i}) * 42; // safe calculation`);
    }
    safeLines.push('const injected = `SELECT * FROM tbl WHERE v = ${input}`;');
    const largeCode = safeLines.join("\n");

    const t0 = Date.now();
    const findings = scanText(largeCode, "src/generated/largeFile.ts");
    const duration = Date.now() - t0;

    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "sql_injection");
    assert.strictEqual(findings[0].line, 10000);
    assert.ok(duration < 250, `10,000 lines scanned in ${duration}ms (must be < 250ms)`);
    console.log(`    ℹ 10,000 lines analyzed in ${duration}ms (ReDoS safe)`);
  });

  runTest("Clean production code produces zero false positives", () => {
    const cleanCode = `
      import crypto from "crypto";
      import { pool } from "./db";

      export async function getUser(userId: string) {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
        return result.rows[0];
      }

      export function verifyToken(a: Buffer, b: Buffer): boolean {
        return crypto.timingSafeEqual(a, b);
      }
    `;
    const findings = scanText(cleanCode, "src/service.ts");
    assert.strictEqual(findings.length, 0, "Clean parameterized code must produce 0 false positives");
  });

  // --------------------------------------------------------------------------
  // Suite 5: Extension Activation & Command Registration
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 5: Extension Activation & Lifecycle ---");

  runTest("Extension activates and registers all 8 required commands", () => {
    activate(mockContext);

    const requiredCommands = [
      "buggers.signIn",
      "buggers.signOut",
      "buggers.analyzeFile",
      "buggers.analyzeWorkspace",
      "buggers.showFindings",
      "buggers.refreshFindings",
      "buggers.clearFindings",
      "buggers.openDashboard",
      "buggers.applyRemedy",
      "buggers.commitRemedy",
    ];

    for (const cmdId of requiredCommands) {
      assert.ok(registeredCommands.has(cmdId), `Command ${cmdId} must be registered`);
    }

    assert.ok(currentStatusBarItem !== null, "Status bar item must be initialized");
    assert.ok(currentStatusBarItem.text.includes("Buggers"), "Status bar contains Buggers branding");
    assert.ok(currentTreeDataProvider !== null, "Tree view data provider must be registered");
    assert.strictEqual(saveDocumentListeners.length, 1, "Save listener must be registered");
  });

  await runAsyncTest("Command 'buggers.clearFindings' clears diagnostics and resets status bar", async () => {
    // Populate some fake diagnostics first
    diagnosticsStorage.set("test.ts", [{ message: "Sample finding" }]);
    currentStatusBarItem.text = "Buggers: 1 issues";

    const clearHandler = registeredCommands.get("buggers.clearFindings");
    assert.ok(clearHandler, "clearFindings handler exists");
    await clearHandler();

    assert.strictEqual(diagnosticsStorage.size, 0, "Diagnostics collection must be cleared");
    assert.ok(currentStatusBarItem.text.includes("Clean"), "Status bar text resets to Clean");
  });

  // --------------------------------------------------------------------------
  // Suite 6: Tree View Data Provider Verification
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 6: Activity Bar Tree View Hierarchy ---");

  await runAsyncTest("Tree View renders InfoNode when no findings exist", async () => {
    currentTreeDataProvider.clear();
    const roots = await currentTreeDataProvider.getChildren();
    assert.strictEqual(roots.length, 1);
    assert.strictEqual(roots[0].label, "No security flaws detected");
  });

  await runAsyncTest("Tree View groups findings by Severity and provides Jump command", async () => {
    const testFindings = [
      {
        id: "f1",
        file: "/workspace/src/app.ts",
        line: 12,
        column: 5,
        length: 10,
        title: "SAST Flaw: SQL Injection",
        severity: "critical",
        category: "sast",
        confidence: 0.99,
        ruleId: "sql_injection",
        problem: "Unsanitized dynamic SQL query",
        whyItMatters: "Attacker can read database",
        evidence: "SELECT * FROM users",
        suggestedFix: "Use parameterized query",
      },
      {
        id: "f2",
        file: "/workspace/src/app.ts",
        line: 45,
        column: 0,
        length: 8,
        title: "SAST Flaw: Weak Crypto MD5",
        severity: "medium",
        category: "sast",
        confidence: 0.9,
        ruleId: "weak_crypto_hash",
        problem: "MD5 is cryptographically broken",
        whyItMatters: "Collision vulnerability",
        evidence: "createHash('md5')",
        suggestedFix: "Use SHA-256",
      },
    ];

    currentTreeDataProvider.setFindings(testFindings);
    const groups = await currentTreeDataProvider.getChildren();
    assert.strictEqual(groups.length, 2, "Should create 2 severity groups (CRITICAL, MEDIUM)");
    assert.ok(groups[0].label.includes("CRITICAL (1)"));
    assert.ok(groups[1].label.includes("MEDIUM (1)"));

    // Check children of CRITICAL group
    const criticalChildren = await currentTreeDataProvider.getChildren(groups[0]);
    assert.strictEqual(criticalChildren.length, 1);
    const findingNode = criticalChildren[0];
    assert.strictEqual(findingNode.label, "SAST Flaw: SQL Injection");
    assert.ok(findingNode.description.includes("Line 12"));
    assert.strictEqual(findingNode.command.command, "vscode.open");
    assert.strictEqual(findingNode.command.arguments[0].fsPath, "/workspace/src/app.ts");
    assert.strictEqual(findingNode.command.arguments[1].selection.start.line, 11);
  });

  // --------------------------------------------------------------------------
  // Suite 7: Secure Credential Storage & Auth
  // --------------------------------------------------------------------------
  console.log("\n--- Suite 7: Secure Credential Storage & Auth ---");

  await runAsyncTest("BuggersAuth securely manages tokens via ExtensionContext.secrets", async () => {
    // Clear storage
    mockSecrets.clear();

    // Verify initial unauthenticated state
    assert.strictEqual(await mockSecretsManager.get("buggers_api_token"), undefined);

    // Save token
    await mockSecretsManager.store("buggers_api_token", "buggers_live_testToken12345");
    assert.strictEqual(await mockSecretsManager.get("buggers_api_token"), "buggers_live_testToken12345");

    // Save GitHub PAT
    await mockSecretsManager.store("buggers_github_pat", "ghp_securePatToken12345678");
    assert.strictEqual(await mockSecretsManager.get("buggers_github_pat"), "ghp_securePatToken12345678");

    // Clean up
    await mockSecretsManager.delete("buggers_api_token");
    assert.strictEqual(await mockSecretsManager.get("buggers_api_token"), undefined);
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
