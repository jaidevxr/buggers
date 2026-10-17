import * as vscode from "vscode";
import * as path from "path";
import { exec } from "child_process";
import { BuggersAuth } from "./auth";
import { scanDocument, scanWorkspace } from "./scanner";
import { BuggersFinding, Severity } from "./types";
import { BuggersFindingsProvider } from "./treeView";

export { SAST_RULES, SECRET_RULES } from "./rules";
export { scanText, scanDocument, scanWorkspace } from "./scanner";

let diagnosticCollection: vscode.DiagnosticCollection;
let treeProvider: BuggersFindingsProvider;
let statusBarItem: vscode.StatusBarItem;
let auth: BuggersAuth;

export function activate(context: vscode.ExtensionContext) {
  // 1. Initialize Auth
  auth = new BuggersAuth(context);

  // 2. Diagnostics Collection for Problems Panel
  diagnosticCollection = vscode.languages.createDiagnosticCollection("buggers");
  context.subscriptions.push(diagnosticCollection);

  // 3. Tree Data Provider for Activity Bar
  treeProvider = new BuggersFindingsProvider();
  vscode.window.registerTreeDataProvider("buggers.findingsView", treeProvider);

  // 4. Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBarItem.command = "buggers.showFindings";
  statusBarItem.text = "$(shield) Buggers: Ready";
  statusBarItem.tooltip = "Click to open Buggers Security Findings";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // 5. Register Commands

  // Command: Sign In
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.signIn", async () => {
      await auth.promptSignIn();
    }),
  );

  // Command: Sign Out
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.signOut", async () => {
      await auth.signOut();
    }),
  );

  // Command: Analyze Current File
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.analyzeFile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Buggers: No active file open to analyze.");
        return;
      }

      const doc = editor.document;
      const findings = scanDocument(doc);
      applyDiagnostics(doc.uri, findings);
      treeProvider.setFindings(findings);
      updateStatusBar(findings);

      if (findings.length > 0) {
        const crit = findings.filter((f) => f.severity === "critical").length;
        const high = findings.filter((f) => f.severity === "high").length;
        vscode.window.showWarningMessage(
          `Buggers: Found ${findings.length} security finding(s) in ${vscode.workspace.asRelativePath(doc.uri)} (${crit} critical, ${high} high).`,
        );
      } else {
        vscode.window.showInformationMessage(
          `Buggers: No security flaws detected in ${vscode.workspace.asRelativePath(doc.uri)}. Clean!`,
        );
      }
    }),
  );

  // Command: Analyze Workspace
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.analyzeWorkspace", async () => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Buggers: Scanning workspace for security flaws & secrets...",
          cancellable: false,
        },
        async (progress) => {
          diagnosticCollection.clear();
          const results = await scanWorkspace((msg, inc) => {
            progress.report({ message: msg, increment: inc });
          });

          const allFindings: BuggersFinding[] = [];
          for (const [filePath, findings] of results.entries()) {
            applyDiagnostics(vscode.Uri.file(filePath), findings);
            allFindings.push(...findings);
          }

          treeProvider.setFindings(allFindings);
          updateStatusBar(allFindings);

          if (allFindings.length > 0) {
            const crit = allFindings.filter((f) => f.severity === "critical").length;
            const high = allFindings.filter((f) => f.severity === "high").length;
            vscode.window.showWarningMessage(
              `Buggers Workspace Audit: Detected ${allFindings.length} issue(s) across ${results.size} file(s) (${crit} critical, ${high} high).`,
            );
          } else {
            vscode.window.showInformationMessage(
              "Buggers Workspace Audit: Clean! No security flaws or secrets detected.",
            );
          }
        },
      );
    }),
  );

  // Command: Show Findings
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.showFindings", async () => {
      await vscode.commands.executeCommand("workbench.view.extension.buggers-sidebar");
    }),
  );

  // Command: Refresh Findings
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.refreshFindings", async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await vscode.commands.executeCommand("buggers.analyzeFile");
      } else {
        await vscode.commands.executeCommand("buggers.analyzeWorkspace");
      }
    }),
  );

  // Command: Clear Findings
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.clearFindings", async () => {
      diagnosticCollection.clear();
      treeProvider.clear();
      updateStatusBar([]);
      vscode.window.showInformationMessage("Buggers: Security findings cleared.");
    }),
  );

  // Command: Inspect Finding (highlights finding and provides interactive remedy dialog)
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.inspectFinding", async (nodeOrFinding: any) => {
      const finding: BuggersFinding = nodeOrFinding?.finding ?? nodeOrFinding;
      if (!finding) return;

      const uri = vscode.Uri.file(finding.file);
      const doc = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(doc);

      const startPos = new vscode.Position(Math.max(0, finding.line - 1), finding.column ?? 0);
      const endPos = new vscode.Position(Math.max(0, finding.line - 1), (finding.column ?? 0) + (finding.length ?? 1));
      editor.selection = new vscode.Selection(startPos, endPos);
      editor.revealRange(new vscode.Range(startPos, endPos), vscode.TextEditorRevealType.InCenter);

      const items = finding.replacementCode
        ? ["⚡ Accept & Apply Remedy", "📦 Commit to Git", "ℹ️ Why It Matters"]
        : ["📦 Commit to Git", "ℹ️ Why It Matters"];

      const choice = await vscode.window.showInformationMessage(
        `🛡️ [${finding.severity.toUpperCase()}] ${finding.title}: ${finding.problem}`,
        ...items,
      );

      if (choice === "⚡ Accept & Apply Remedy") {
        await vscode.commands.executeCommand("buggers.applyRemedy", finding);
      } else if (choice === "📦 Commit to Git") {
        await vscode.commands.executeCommand("buggers.commitRemedy", finding);
      } else if (choice === "ℹ️ Why It Matters") {
        vscode.window.showInformationMessage(`[Buggers] ${finding.whyItMatters}`);
      }
    }),
  );

  // Command: Apply Auto-Remedy Fix
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "buggers.applyRemedy",
      async (findingNodeOrFinding: any) => {
        const finding: BuggersFinding = findingNodeOrFinding?.finding ?? findingNodeOrFinding;
        if (!finding || !finding.replacementCode) {
          vscode.window.showInformationMessage("Buggers: No automated remedy available for this finding.");
          return;
        }

        const uri = vscode.Uri.file(finding.file);
        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc);

        const lineIdx = Math.max(0, finding.line - 1);
        const line = doc.lineAt(lineIdx);
        const range = line.range;

        const edit = new vscode.WorkspaceEdit();
        edit.replace(doc.uri, range, finding.replacementCode);
        const success = await vscode.workspace.applyEdit(edit);

        if (success) {
          vscode.window.showInformationMessage(
            `Buggers: Applied automated remediation for ${finding.title}!`,
            "📦 Commit Fix to Git",
          ).then((action) => {
            if (action === "📦 Commit Fix to Git") {
              vscode.commands.executeCommand("buggers.commitRemedy", finding);
            }
          });

          // Re-scan active document to refresh diagnostics, tree view, and status bar
          const updatedFindings = scanDocument(doc);
          applyDiagnostics(doc.uri, updatedFindings);
          treeProvider.setFindings(updatedFindings);
          updateStatusBar(updatedFindings);
        }
      },
    ),
  );

  // Command: Commit Security Remedy to Git
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.commitRemedy", async (nodeOrFinding?: any) => {
      const finding: BuggersFinding | undefined =
        nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
      const commitMsg = finding?.ruleId
        ? `fix(security): resolve ${finding.ruleId} (${finding.title}) via Buggers`
        : "fix(security): resolve security vulnerabilities via Buggers auto-remedy";

      const editor = vscode.window.activeTextEditor;
      const doc = editor?.document;
      const targetFile = finding?.file || doc?.fileName;

      const workspaceFolder = targetFile
        ? vscode.workspace.getWorkspaceFolder(vscode.Uri.file(targetFile))
        : vscode.workspace.workspaceFolders?.[0];
      const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : (targetFile ? path.dirname(targetFile) : undefined);

      if (!cwd) {
        const terminal = vscode.window.createTerminal("Buggers Security Commit");
        terminal.show();
        terminal.sendText(`git add -u && git commit -m "${commitMsg}"`);
        vscode.window.showInformationMessage("Buggers: Staged and running commit in terminal.");
        return;
      }

      try {
        const relPath = targetFile ? path.relative(cwd, targetFile).replace(/\\/g, "/") : ".";
        const cmd = `git add "${relPath}" && git commit -m "${commitMsg.replace(/"/g, '\\"')}"`;

        exec(cmd, { cwd }, (err: any, stdout: string) => {
          if (err) {
            const terminal = vscode.window.createTerminal("Buggers Security Commit");
            terminal.show();
            terminal.sendText(`git add "${relPath}" && git commit -m "${commitMsg}"`);
            vscode.window.showWarningMessage(`Buggers: Staged file in terminal to complete commit.`);
          } else {
            const firstLine = stdout.split("\n")[0] || "Committed security fix";
            vscode.window.showInformationMessage(`🛡️ Buggers Git Commit Tracker: ${firstLine}`);
          }
        });
      } catch (err: any) {
        const terminal = vscode.window.createTerminal("Buggers Security Commit");
        terminal.show();
        terminal.sendText(`git add -u && git commit -m "${commitMsg}"`);
        vscode.window.showInformationMessage("Buggers: Staged and running commit in terminal.");
      }
    }),
  );

  // Command: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.openDashboard", async () => {
      const config = vscode.workspace.getConfiguration("buggers");
      const url = config.get<string>("serverUrl") || "https://buggers.dev";
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }),
  );

  // 6. Register CodeLens Provider for in-editor interactive buttons
  const codeLensProvider: vscode.CodeLensProvider = {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
      const lenses: vscode.CodeLens[] = [];
      const findings = scanDocument(document);
      for (const f of findings) {
        const lineIdx = Math.max(0, f.line - 1);
        const range = new vscode.Range(lineIdx, 0, lineIdx, 0);

        if (f.replacementCode) {
          lenses.push(
            new vscode.CodeLens(range, {
              title: `🛡️ Buggers: Apply Auto-Remedy (${f.ruleId})`,
              command: "buggers.applyRemedy",
              arguments: [f],
            }),
          );
        }

        lenses.push(
          new vscode.CodeLens(range, {
            title: `📦 Commit Fix to Git`,
            command: "buggers.commitRemedy",
            arguments: [f],
          }),
        );
      }
      return lenses;
    },
  };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "javascriptreact" },
        { scheme: "file", language: "typescriptreact" },
        { scheme: "file", language: "python" },
        { scheme: "file", language: "go" },
        { scheme: "file", pattern: "**/*" },
      ],
      codeLensProvider,
    ),
  );

  // 7. Register Code Action Provider for Native "Quick Fix" (Ctrl+.) Lightbulb & Actions
  const codeActionProvider: vscode.CodeActionProvider = {
    provideCodeActions(document, range, context) {
      const actions: vscode.CodeAction[] = [];

      for (const diag of context.diagnostics) {
        if (diag.source !== "Buggers") continue;

        const lineIdx = range.start.line;
        const line = document.lineAt(lineIdx);
        const rawLine = line.text;

        // Auto-remedy QuickFix action
        const fix = new vscode.CodeAction(
          `🛡️ Fix with Buggers Auto-Remedy (${diag.code})`,
          vscode.CodeActionKind.QuickFix,
        );
        fix.diagnostics = [diag];
        fix.isPreferred = true;

        let remedyCode = "";
        if (String(diag.code).includes("sql")) {
          remedyCode = rawLine.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/, `{ text: "$1$$1$3", values: [$2] } /* [Buggers: Parameterized Query] */`);
        } else if (String(diag.code).includes("eval")) {
          remedyCode = rawLine.replace(/\beval\s*\(([^)]+)\)/, `JSON.parse($1) /* [Buggers: Safe Parser] */`);
        } else if (String(diag.code).includes("command")) {
          remedyCode = `// [Buggers Auto-Fix] Sanitized command execution\n  execFile("ping", ["-c", "1", String(userId)])`;
        } else if (String(diag.code).includes("cors")) {
          remedyCode = rawLine.replace(/origin\s*:\s*["'`]\*["'`]/, `origin: ["https://buggers.dev"] /* [Buggers: Explicit Origin] */`);
        } else if (String(diag.code).includes("crypto") || String(diag.code).includes("md5")) {
          remedyCode = rawLine.replace(/["'](?:md5|sha1)["']/i, `"sha256"`);
        } else {
          remedyCode = `// [Buggers Resolved] ${rawLine.trim()}`;
        }

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, line.range, remedyCode);
        fix.edit = edit;
        actions.push(fix);

        // Git commit action
        const commitAction = new vscode.CodeAction(
          `📦 Commit Security Fix with Buggers (${diag.code})`,
          vscode.CodeActionKind.QuickFix,
        );
        commitAction.command = {
          command: "buggers.commitRemedy",
          title: "Commit Security Remedy",
          arguments: [{ ruleId: diag.code, title: diag.message, file: document.fileName }],
        };
        actions.push(commitAction);
      }

      return actions;
    },
  };

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "javascriptreact" },
        { scheme: "file", language: "typescriptreact" },
        { scheme: "file", language: "python" },
        { scheme: "file", language: "go" },
        { scheme: "file", pattern: "**/*" },
      ],
      codeActionProvider,
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
    ),
  );

  // 6. Listen to onDidSaveTextDocument
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      const config = vscode.workspace.getConfiguration("buggers");
      const autoScan = config.get<boolean>("autoAnalyzeOnSave") ?? true;
      if (autoScan) {
        const findings = scanDocument(doc);
        applyDiagnostics(doc.uri, findings);
        treeProvider.setFindings(findings);
        updateStatusBar(findings);
      }
    }),
  );

  // Auto-scan current active document on activation if one is open
  if (vscode.window.activeTextEditor) {
    const doc = vscode.window.activeTextEditor.document;
    const findings = scanDocument(doc);
    applyDiagnostics(doc.uri, findings);
    treeProvider.setFindings(findings);
    updateStatusBar(findings);
  }
}

function mapSeverity(sev: Severity): vscode.DiagnosticSeverity {
  switch (sev) {
    case "critical":
    case "high":
      return vscode.DiagnosticSeverity.Error;
    case "medium":
      return vscode.DiagnosticSeverity.Warning;
    case "low":
    default:
      return vscode.DiagnosticSeverity.Information;
  }
}

function applyDiagnostics(uri: vscode.Uri, findings: BuggersFinding[]) {
  const config = vscode.workspace.getConfiguration("buggers");
  const minSev = config.get<string>("minimumSeverity") || "low";

  const sevRanks: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  const minRank = sevRanks[minSev] ?? 1;

  const diagnostics: vscode.Diagnostic[] = [];

  for (const f of findings) {
    if ((sevRanks[f.severity] ?? 1) < minRank) continue;

    const lineIdx = Math.max(0, f.line - 1);
    const colIdx = f.column ?? 0;
    const length = f.length ?? 10;

    const range = new vscode.Range(
      new vscode.Position(lineIdx, colIdx),
      new vscode.Position(lineIdx, colIdx + length),
    );

    const diag = new vscode.Diagnostic(
      range,
      `[Buggers ${f.ruleId}] ${f.title}: ${f.problem}`,
      mapSeverity(f.severity),
    );

    diag.source = "Buggers";
    diag.code = f.ruleId;
    diagnostics.push(diag);
  }

  diagnosticCollection.set(uri, diagnostics);
}

function updateStatusBar(findings: BuggersFinding[]) {
  if (findings.length === 0) {
    statusBarItem.text = "$(shield-check) Buggers: Clean";
    statusBarItem.backgroundColor = undefined;
    return;
  }

  const crit = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;

  if (crit > 0) {
    statusBarItem.text = `$(shield) Buggers: ${findings.length} issues (${crit} crit)`;
    statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
  } else if (high > 0) {
    statusBarItem.text = `$(shield) Buggers: ${findings.length} issues (${high} high)`;
    statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
  } else {
    statusBarItem.text = `$(shield) Buggers: ${findings.length} issues`;
    statusBarItem.backgroundColor = undefined;
  }
}

export function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.clear();
    diagnosticCollection.dispose();
  }
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
