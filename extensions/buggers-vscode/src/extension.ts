import * as vscode from "vscode";
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
      await vscode.commands.executeCommand("buggers.findingsView.focus");
    }),
  );

  // Command: Refresh Findings
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.refreshFindings", async () => {
      await vscode.commands.executeCommand("buggers.analyzeFile");
    }),
  );

  // Command: Clear Findings
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.clearFindings", () => {
      diagnosticCollection.clear();
      treeProvider.clear();
      statusBarItem.text = "$(shield) Buggers: Clean";
      vscode.window.showInformationMessage("Buggers: Diagnostics and findings cleared.");
    }),
  );

  // Command: Open Dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.openDashboard", async () => {
      const config = vscode.workspace.getConfiguration("buggers");
      const url = config.get<string>("serverUrl") || "https://buggers.vercel.app";
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }),
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
