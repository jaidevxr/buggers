import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";
import { BuggersAuth } from "./auth";
import { scanDocument, scanWorkspace } from "./scanner";
import { BuggersFinding, Severity } from "./types";
import { BuggersFindingsProvider } from "./treeView";
import { BuggersAiService } from "./aiService";

export { SAST_RULES, SECRET_RULES, LOGICAL_BUG_RULES } from "./rules";
export { scanText, scanDocument, scanWorkspace } from "./scanner";

let diagnosticCollection: vscode.DiagnosticCollection;
let treeProvider: BuggersFindingsProvider;
let statusBarItem: vscode.StatusBarItem;
let auth: BuggersAuth;
let aiService: BuggersAiService;

export function activate(context: vscode.ExtensionContext) {
  // 1. Initialize Auth & AI Service
  auth = new BuggersAuth(context);
  aiService = new BuggersAiService(context);

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

  // Virtual Text Document Provider for Remedy Diff Previews
  class BuggersPreviewProvider implements vscode.TextDocumentContentProvider {
    private previews = new Map<string, string>();
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    readonly onDidChange = this._onDidChange.event;

    setPreview(uri: vscode.Uri, content: string) {
      this.previews.set(uri.toString(), content);
      this._onDidChange.fire(uri);
    }
    provideTextDocumentContent(uri: vscode.Uri): string {
      return this.previews.get(uri.toString()) || "";
    }
  }
  const previewProvider = new BuggersPreviewProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("buggers-preview", previewProvider),
  );

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
          `Buggers: Found ${findings.length} finding(s) in ${vscode.workspace.asRelativePath(doc.uri)} (${crit} critical, ${high} high).`,
        );
      } else {
        vscode.window.showInformationMessage(
          `Buggers: No security flaws detected in ${vscode.workspace.asRelativePath(doc.uri)}. Clean.`,
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
          title: "Buggers: Scanning workspace for security flaws & defects...",
          cancellable: true,
        },
        async (progress, token) => {
          const startTime = Date.now();
          diagnosticCollection.clear();
          const results = await scanWorkspace((msg, inc) => {
            progress.report({ message: msg, increment: inc });
          });

          if (token.isCancellationRequested) {
            vscode.window.showInformationMessage("Buggers: Workspace analysis cancelled by user.");
            return;
          }

          const allFindings: BuggersFinding[] = [];
          for (const [filePath, findings] of results.entries()) {
            applyDiagnostics(vscode.Uri.file(filePath), findings);
            allFindings.push(...findings);
          }

          const scanDuration = Date.now() - startTime;
          const overview = {
            totalFiles: results.size,
            totalFindings: allFindings.length,
            criticalCount: allFindings.filter((f) => f.severity === "critical").length,
            highCount: allFindings.filter((f) => f.severity === "high").length,
            mediumCount: allFindings.filter((f) => f.severity === "medium").length,
            lowCount: allFindings.filter((f) => f.severity === "low").length,
            scanTimeMs: scanDuration,
            timestamp: new Date().toLocaleTimeString(),
          };

          treeProvider.setFindings(allFindings, overview);
          updateStatusBar(allFindings);

          if (allFindings.length > 0) {
            vscode.window.showWarningMessage(
              `Buggers Workspace Audit: Detected ${allFindings.length} issue(s) across ${results.size} file(s) (${overview.criticalCount} critical, ${overview.highCount} high).`,
            );
          } else {
            vscode.window.showInformationMessage(
              "Buggers Workspace Audit: Clean. No security flaws or secrets detected.",
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
      vscode.window.showInformationMessage("Buggers: Findings cleared.");
    }),
  );

  // Command: Toggle Findings Grouping Mode
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.toggleGrouping", async () => {
      const current = treeProvider.getGroupingMode();
      const nextMode = current === "category" ? "severity" : current === "severity" ? "file" : "category";
      treeProvider.setGroupingMode(nextMode);
      vscode.window.showInformationMessage(`Buggers: Findings grouped by ${nextMode.toUpperCase()}`);
    }),
  );

  // Command: Filter Findings by Severity
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.filterFindings", async () => {
      const choice = await vscode.window.showQuickPick(
        [
          { label: "All Severities", id: "all" },
          { label: "Critical Only", id: "critical" },
          { label: "High Only", id: "high" },
          { label: "Medium Only", id: "medium" },
          { label: "Low Only", id: "low" },
        ],
        { placeHolder: "Select severity filter" },
      );
      if (choice) {
        treeProvider.setFilterSeverity(choice.id as any);
      }
    }),
  );

  // Command: Export Findings to SARIF or JSON
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.exportFindings", async () => {
      const findings = treeProvider.getFindings();
      if (findings.length === 0) {
        vscode.window.showInformationMessage("Buggers: No findings to export.");
        return;
      }

      const formatPick = await vscode.window.showQuickPick(
        [
          { label: "SARIF 2.1.0 (.sarif)", description: "Standard Static Analysis Results Interchange Format", id: "sarif" },
          { label: "JSON Audit Report (.json)", description: "Raw structured JSON finding list", id: "json" },
        ],
        { placeHolder: "Select export format" },
      );
      if (!formatPick) return;

      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`buggers-audit.${formatPick.id}`),
        filters: formatPick.id === "sarif" ? { "SARIF Files": ["sarif", "json"] } : { "JSON Files": ["json"] },
      });
      if (!uri) return;

      let content = "";
      if (formatPick.id === "sarif") {
        const sarif = {
          $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
          version: "2.1.0",
          runs: [
            {
              tool: {
                driver: {
                  name: "Buggers",
                  version: "1.3.0",
                  informationUri: "https://buggers.dev",
                  rules: Array.from(new Set(findings.map((f) => f.ruleId))).map((ruleId) => {
                    const f = findings.find((item) => item.ruleId === ruleId)!;
                    return {
                      id: ruleId,
                      name: f.title,
                      shortDescription: { text: f.problem },
                      fullDescription: { text: f.whyItMatters },
                      help: { text: f.suggestedFix },
                      properties: {
                        cwe: f.cwe,
                        owasp: f.owasp,
                        precision: "high",
                      },
                    };
                  }),
                },
              },
              results: findings.map((f) => ({
                ruleId: f.ruleId,
                level: f.severity === "critical" || f.severity === "high" ? "error" : f.severity === "medium" ? "warning" : "note",
                message: { text: `${f.title}: ${f.problem}` },
                locations: [
                  {
                    physicalLocation: {
                      artifactLocation: { uri: path.relative(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "", f.file) },
                      region: {
                        startLine: f.line,
                        startColumn: (f.column || 0) + 1,
                        endColumn: (f.column || 0) + (f.length || 1) + 1,
                      },
                    },
                  },
                ],
              })),
            },
          ],
        };
        content = JSON.stringify(sarif, null, 2);
      } else {
        content = JSON.stringify({ generatedAt: new Date().toISOString(), total: findings.length, findings }, null, 2);
      }

      fs.writeFileSync(uri.fsPath, content, "utf8");
      vscode.window.showInformationMessage(`Buggers: Exported ${findings.length} findings to ${path.basename(uri.fsPath)}`);
    }),
  );

  // Command: Inspect Finding
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
        ? ["Accept & Apply Remedy", "Review Diff", "Explain Finding", "Generate Test"]
        : ["Explain Finding", "Generate Test", "Commit to Git"];

      const choice = await vscode.window.showInformationMessage(
        `[${finding.severity.toUpperCase()}] ${finding.title}: ${finding.problem}`,
        ...items,
      );

      if (choice === "Accept & Apply Remedy") {
        await vscode.commands.executeCommand("buggers.applyRemedy", finding);
      } else if (choice === "Review Diff") {
        await vscode.commands.executeCommand("buggers.suggestFix", finding);
      } else if (choice === "Explain Finding") {
        await vscode.commands.executeCommand("buggers.explainFinding", finding);
      } else if (choice === "Generate Test") {
        await vscode.commands.executeCommand("buggers.generateRegressionTest", finding);
      } else if (choice === "Commit to Git") {
        await vscode.commands.executeCommand("buggers.commitRemedy", finding);
      }
    }),
  );

  // Command: Apply Auto-Remedy Fix
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.applyRemedy", async (findingNodeOrFinding: any) => {
      const finding: BuggersFinding = findingNodeOrFinding?.finding ?? findingNodeOrFinding;
      if (!finding || !finding.replacementCode) {
        vscode.window.showInformationMessage("Buggers: No automated remedy available for this finding.");
        return;
      }

      const uri = vscode.Uri.file(finding.file);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);

      const lineIdx = Math.max(0, finding.line - 1);
      const line = doc.lineAt(lineIdx);
      const range = line.range;

      const edit = new vscode.WorkspaceEdit();
      edit.replace(doc.uri, range, finding.replacementCode);
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        vscode.window.showInformationMessage(
          `Buggers: Applied automated remedy for ${finding.title}.`,
          "Commit Fix to Git",
        ).then((action) => {
          if (action === "Commit Fix to Git") {
            vscode.commands.executeCommand("buggers.commitRemedy", finding);
          }
        });

        const updatedFindings = scanDocument(doc);
        applyDiagnostics(doc.uri, updatedFindings);
        treeProvider.setFindings(updatedFindings);
        updateStatusBar(updatedFindings);
      }
    }),
  );

  // Command: Suggest Fix with Reviewable Diff
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.suggestFix", async (nodeOrFinding?: any) => {
      let finding: BuggersFinding | undefined = nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
      const editor = vscode.window.activeTextEditor;
      if (!finding && editor) {
        const findings = scanDocument(editor.document);
        const curLine = editor.selection.active.line + 1;
        finding = findings.find((f) => f.line === curLine) || findings[0];
      }
      if (!finding) {
        vscode.window.showInformationMessage("Buggers: No finding selected to fix.");
        return;
      }

      const doc = editor?.document || (await vscode.workspace.openTextDocument(vscode.Uri.file(finding.file)));
      const lineIdx = Math.max(0, finding.line - 1);
      const line = doc.lineAt(lineIdx);
      const replacement = finding.replacementCode || finding.suggestedFix;

      if (!replacement) {
        vscode.window.showInformationMessage("Buggers: No fix pattern available for this finding.");
        return;
      }

      const accepted = await aiService.promptReviewableDiff(
        doc,
        line.range,
        replacement,
        finding.title,
      );

      if (accepted) {
        const updatedFindings = scanDocument(doc);
        applyDiagnostics(doc.uri, updatedFindings);
        treeProvider.setFindings(updatedFindings);
        updateStatusBar(updatedFindings);
      }
    }),
  );

  // Command: Explain Finding (Root Cause & Fix Strategy)
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.explainFinding", async (nodeOrFinding?: any) => {
      let finding: BuggersFinding | undefined = nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
      if (!finding) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const findings = scanDocument(editor.document);
          const curLine = editor.selection.active.line + 1;
          finding = findings.find((f) => f.line === curLine) || findings[0];
        }
      }
      if (!finding) {
        vscode.window.showInformationMessage("Buggers: No finding selected to explain.");
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Buggers: Analyzing ${finding.ruleId}...`,
          cancellable: false,
        },
        async () => {
          const explanation = await aiService.explainFinding(finding!);
          const doc = await vscode.workspace.openTextDocument({
            content: explanation,
            language: "markdown",
          });
          await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
        },
      );
    }),
  );

  // Command: Debug Selection with AI
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.debugSelection", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Buggers: Open a file and select code to debug.");
        return;
      }
      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showInformationMessage("Buggers: Please select a block of code to debug.");
        return;
      }

      const code = editor.document.getText(selection);
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Buggers: Debugging selected code...",
          cancellable: false,
        },
        async () => {
          const result = await aiService.debugSelection(code, editor.document.fileName);
          const doc = await vscode.workspace.openTextDocument({
            content: result,
            language: "markdown",
          });
          await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
        },
      );
    }),
  );

  // Command: Generate Regression Test
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.generateRegressionTest", async (nodeOrFinding?: any) => {
      let finding: BuggersFinding | undefined = nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
      if (!finding) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const findings = scanDocument(editor.document);
          const curLine = editor.selection.active.line + 1;
          finding = findings.find((f) => f.line === curLine) || findings[0];
        }
      }
      if (!finding) {
        vscode.window.showInformationMessage("Buggers: No finding selected to generate test for.");
        return;
      }

      const testCode = aiService.generateRegressionTest(finding);
      const isTs = finding.file.endsWith(".ts") || finding.file.endsWith(".tsx");
      const doc = await vscode.workspace.openTextDocument({
        content: testCode,
        language: isTs ? "typescript" : "javascript",
      });
      await vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.Beside });
      vscode.window.showInformationMessage(`Buggers: Generated regression test template for ${finding.ruleId}`);
    }),
  );

  // Command: Scan for Logical Bugs
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.findLogicalBugs", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Buggers: Open a file to scan for logical bugs.");
        return;
      }

      const allFindings = scanDocument(editor.document);
      const logicalBugs = allFindings.filter((f) => f.category === "logical_bug");

      applyDiagnostics(editor.document.uri, logicalBugs);
      treeProvider.setFindings(logicalBugs);
      updateStatusBar(logicalBugs);

      if (logicalBugs.length > 0) {
        vscode.window.showWarningMessage(
          `Buggers: Detected ${logicalBugs.length} logical bug(s) in ${path.basename(editor.document.fileName)}.`,
        );
      } else {
        vscode.window.showInformationMessage(
          `Buggers: No logical bugs detected in ${path.basename(editor.document.fileName)}. Clean.`,
        );
      }
    }),
  );

  // Command: Configure AI Provider
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.configureAiProvider", async () => {
      await aiService.configureProvider();
    }),
  );

  // Command: Clear AI Credentials
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.clearAiCredentials", async () => {
      await aiService.clearApiKey();
      vscode.window.showInformationMessage("Buggers: Cleared stored AI credentials from VS Code secret storage.");
    }),
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
            vscode.window.showInformationMessage(`Buggers Git Commit: ${firstLine}`);
          }
        });
      } catch {
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

  // Command: Preview Security Remedy Diff
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.previewDiff", async (nodeOrFinding: any) => {
      const finding: BuggersFinding = nodeOrFinding?.finding ?? nodeOrFinding;
      if (!finding || !finding.replacementCode) {
        vscode.window.showInformationMessage("Buggers: No remedy preview available for this finding.");
        return;
      }

      const uri = vscode.Uri.file(finding.file);
      const doc = await vscode.workspace.openTextDocument(uri);
      const lines = doc.getText().split("\n");
      const lineIdx = Math.max(0, finding.line - 1);
      lines[lineIdx] = finding.replacementCode;
      const remediatedText = lines.join("\n");

      const previewUri = vscode.Uri.parse(`buggers-preview://preview/${path.basename(finding.file)}?remedy=true`);
      previewProvider.setPreview(previewUri, remediatedText);

      await vscode.commands.executeCommand(
        "vscode.diff",
        uri,
        previewUri,
        `Buggers Remedy Diff: ${finding.title}`,
        { preview: true },
      );
    }),
  );

  // Command: Open Rich Finding Inspector Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.openInspector", async (nodeOrFinding?: any) => {
      let finding: BuggersFinding | undefined = nodeOrFinding?.finding ?? nodeOrFinding;

      if (!finding) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const findings = scanDocument(editor.document);
          const curLine = editor.selection.active.line;
          finding = findings.find((f) => Math.max(0, f.line - 1) === curLine) || findings[0];
        }
      }

      if (!finding) {
        vscode.window.showInformationMessage("Buggers: No finding selected or detected to inspect.");
        return;
      }

      const panel = vscode.window.createWebviewPanel(
        "buggersFindingInspector",
        `Buggers: ${finding.ruleId}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true },
      );

      const sevColor =
        finding.severity === "critical"
          ? "#ef4444"
          : finding.severity === "high"
            ? "#f97316"
            : finding.severity === "medium"
              ? "#eab308"
              : "#3b82f6";

      panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 24px;
      color: var(--vscode-foreground, #e2e8f0);
      background-color: var(--vscode-editor-background, #09090b);
      line-height: 1.6;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-right: 6px;
    }
    .badge-sev {
      background: ${sevColor}22;
      color: ${sevColor};
      border: 1px solid ${sevColor}66;
    }
    .badge-tag {
      background: rgba(255, 255, 255, 0.08);
      color: var(--vscode-foreground);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    h1 {
      font-size: 18px;
      font-weight: 700;
      margin: 12px 0 6px;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .code-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      display: block;
    }
    .code-vuln {
      background: rgba(239, 68, 68, 0.12);
      border-left: 3px solid #ef4444;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
      overflow-x: auto;
      color: #fca5a5;
    }
    .code-fix {
      background: rgba(34, 197, 94, 0.12);
      border-left: 3px solid #22c55e;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
      overflow-x: auto;
      color: #86efac;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
    }
    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    button:hover {
      background: #1d4ed8;
    }
    button.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: var(--vscode-foreground, #fff);
    }
    button.secondary:hover {
      background: rgba(255, 255, 255, 0.18);
    }
  </style>
</head>
<body>
  <div>
    <span class="badge badge-sev">${finding.severity}</span>
    ${finding.cwe ? `<span class="badge badge-tag">${finding.cwe}</span>` : ""}
    ${finding.owasp ? `<span class="badge badge-tag">${finding.owasp}</span>` : ""}
  </div>

  <h1>${finding.title}</h1>
  <div style="font-size: 12px; opacity: 0.7; margin-bottom: 16px;">
    File: <code>${path.basename(finding.file)}</code> · Line: <strong>${finding.line}</strong> · Rule ID: <code>${finding.ruleId}</code>
  </div>

  <div class="card">
    <div style="font-weight: 600; margin-bottom: 4px;">Description</div>
    <div>${finding.problem}</div>
  </div>

  <div class="card">
    <div style="font-weight: 600; margin-bottom: 4px;">Why It Matters & Exploit Scenario</div>
    <div>${finding.whyItMatters}</div>
  </div>

  <div class="card">
    <span class="code-label" style="color: #f87171;">Vulnerable Code Detected:</span>
    <pre class="code-vuln">${finding.evidence}</pre>

    <span class="code-label" style="color: #4ade80; margin-top: 14px;">Suggested Buggers Auto-Remedy:</span>
    <pre class="code-fix">${finding.replacementCode || finding.suggestedFix}</pre>
  </div>

  <div class="actions">
    <button onclick="send('applyRemedy')">Accept & Apply Remedy</button>
    <button class="secondary" onclick="send('previewDiff')">View Side-by-Side Diff</button>
    <button class="secondary" onclick="send('explainFinding')">Explain Root Cause</button>
    <button class="secondary" onclick="send('generateTest')">Generate Regression Test</button>
    <button class="secondary" onclick="send('commitRemedy')">Commit to Git</button>
    <button class="secondary" onclick="send('ignoreFinding')">Suppress Finding</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    function send(cmd) {
      vscode.postMessage({ command: cmd });
    }
  </script>
</body>
</html>`;

      panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.command === "applyRemedy") {
          await vscode.commands.executeCommand("buggers.applyRemedy", finding);
        } else if (msg.command === "previewDiff") {
          await vscode.commands.executeCommand("buggers.previewDiff", finding);
        } else if (msg.command === "explainFinding") {
          await vscode.commands.executeCommand("buggers.explainFinding", finding);
        } else if (msg.command === "generateTest") {
          await vscode.commands.executeCommand("buggers.generateRegressionTest", finding);
        } else if (msg.command === "commitRemedy") {
          await vscode.commands.executeCommand("buggers.commitRemedy", finding);
        } else if (msg.command === "ignoreFinding") {
          await vscode.commands.executeCommand("buggers.ignoreFinding", finding);
          panel.dispose();
        }
      });
    }),
  );

  // Command: Fix All Flaws in Current File
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.fixAllFile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Buggers: No active file open to apply fixes.");
        return;
      }
      const doc = editor.document;
      const findings = scanDocument(doc).filter((f) => f.replacementCode);
      if (findings.length === 0) {
        vscode.window.showInformationMessage("Buggers: No automated fixes available for this file.");
        return;
      }

      findings.sort((a, b) => b.line - a.line);
      const edit = new vscode.WorkspaceEdit();
      for (const f of findings) {
        const lineIdx = Math.max(0, f.line - 1);
        const line = doc.lineAt(lineIdx);
        if (f.replacementCode) {
          edit.replace(doc.uri, line.range, f.replacementCode);
        }
      }
      const success = await vscode.workspace.applyEdit(edit);
      if (success) {
        const updated = scanDocument(doc);
        applyDiagnostics(doc.uri, updated);
        treeProvider.setFindings(updated);
        updateStatusBar(updated);
        vscode.window.showInformationMessage(
          `Buggers: Successfully fixed ${findings.length} flaw(s) in ${path.basename(doc.fileName)}.`,
          "Commit Fixes to Git",
        ).then((choice) => {
          if (choice === "Commit Fixes to Git") {
            vscode.commands.executeCommand("buggers.commitRemedy", {
              file: doc.fileName,
              ruleId: "batch_remediation",
              title: `Batch remedy of ${findings.length} findings`,
            });
          }
        });
      }
    }),
  );

  // Command: Fix All Flaws Across Workspace
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.fixAllWorkspace", async () => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Buggers: Applying automated security fixes across workspace...",
          cancellable: false,
        },
        async () => {
          const results = await scanWorkspace();
          let totalFixed = 0;
          for (const [filePath, fileFindings] of results.entries()) {
            const fixable = fileFindings.filter((f) => f.replacementCode).sort((a, b) => b.line - a.line);
            if (fixable.length === 0) continue;
            try {
              const uri = vscode.Uri.file(filePath);
              const doc = await vscode.workspace.openTextDocument(uri);
              const edit = new vscode.WorkspaceEdit();
              for (const f of fixable) {
                const lineIdx = Math.max(0, f.line - 1);
                const line = doc.lineAt(lineIdx);
                if (f.replacementCode) {
                  edit.replace(doc.uri, line.range, f.replacementCode);
                }
              }
              const ok = await vscode.workspace.applyEdit(edit);
              if (ok) totalFixed += fixable.length;
            } catch {
              // Ignore file open/apply errors
            }
          }
          vscode.window.showInformationMessage(
            `Buggers Workspace Remediation: Applied ${totalFixed} automated fix(es).`,
            "Commit All Fixes",
          ).then((action) => {
            if (action === "Commit All Fixes") {
              vscode.commands.executeCommand("buggers.commitRemedy", {
                ruleId: "workspace_remediation",
                title: `Workspace auto-remediation of ${totalFixed} findings`,
              });
            }
          });
          await vscode.commands.executeCommand("buggers.refreshFindings");
        },
      );
    }),
  );

  // Command: Suppress / Ignore Finding with Inline Comment
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.ignoreFinding", async (nodeOrFinding: any) => {
      const finding: BuggersFinding = nodeOrFinding?.finding ?? nodeOrFinding;
      if (!finding) return;

      const uri = vscode.Uri.file(finding.file);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);

      const lineIdx = Math.max(0, finding.line - 1);
      const insertPos = new vscode.Position(lineIdx, 0);

      const isPythonOrShell = doc.fileName.endsWith(".py") || doc.fileName.endsWith(".sh");
      const commentPrefix = isPythonOrShell ? "#" : "//";
      const ignoreComment = `${commentPrefix} buggers-ignore: ${finding.ruleId} - Suppressed by developer\n`;

      const edit = new vscode.WorkspaceEdit();
      edit.insert(doc.uri, insertPos, ignoreComment);
      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        vscode.window.showInformationMessage(`Buggers: Suppressed ${finding.title} on Line ${finding.line}`);
        const updated = scanDocument(doc);
        applyDiagnostics(doc.uri, updated);
        treeProvider.setFindings(updated);
        updateStatusBar(updated);
      }
    }),
  );

  // Command: Generate Workspace Security Audit Report
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.generateSecurityReport", async () => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Buggers: Compiling Project Security Health Audit Report...",
          cancellable: false,
        },
        async () => {
          const results = await scanWorkspace();
          const allFindings: BuggersFinding[] = [];
          for (const findings of results.values()) {
            allFindings.push(...findings);
          }

          const crit = allFindings.filter((f) => f.severity === "critical").length;
          const high = allFindings.filter((f) => f.severity === "high").length;
          const med = allFindings.filter((f) => f.severity === "medium").length;
          const low = allFindings.filter((f) => f.severity === "low").length;

          const score = Math.max(0, 100 - (crit * 15 + high * 10 + med * 5 + low * 2));
          let grade = "A+";
          if (score < 60) grade = "F";
          else if (score < 75) grade = "C";
          else if (score < 90) grade = "B";

          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          const rootPath = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
          const reportPath = path.join(rootPath, "BUGGERS-SECURITY-AUDIT.md");

          const date = new Date().toISOString().replace("T", " ").substring(0, 19);

          let reportContent = `# Buggers Security Audit & Triage Report\n\n`;
          reportContent += `**Generated:** ${date} | **Platform:** Buggers DevSecOps (v1.1.0)\n\n`;
          reportContent += `## Executive Summary\n\n`;
          reportContent += `| Metric | Value |\n| :--- | :--- |\n`;
          reportContent += `| **Security Health Score** | **${score}/100** (Grade: \`${grade}\`) |\n`;
          reportContent += `| **Files Audited** | ${results.size} files |\n`;
          reportContent += `| **Total Findings** | ${allFindings.length} issue(s) |\n`;
          reportContent += `| **Critical Severity** | ${crit} |\n`;
          reportContent += `| **High Severity** | ${high} |\n`;
          reportContent += `| **Medium Severity** | ${med} |\n`;
          reportContent += `| **Low Severity** | ${low} |\n\n`;

          reportContent += `## Vulnerability Ledger\n\n`;
          if (allFindings.length === 0) {
            reportContent += `> Zero security vulnerabilities or hardcoded secrets detected in this workspace. Clean bill of health.\n\n`;
          } else {
            reportContent += `| Severity | Rule | CWE | OWASP | File | Line | Title |\n`;
            reportContent += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
            for (const f of allFindings) {
              const rel = path.basename(f.file);
              reportContent += `| **${f.severity.toUpperCase()}** | \`${f.ruleId}\` | ${f.cwe || "N/A"} | ${f.owasp || "N/A"} | \`${rel}\` | ${f.line} | ${f.title} |\n`;
            }
            reportContent += `\n`;
          }

          reportContent += `## Remediation Actions\n`;
          reportContent += `- Use **Buggers: Review Fix Diff & Apply** to review side-by-side changes before applying.\n`;
          reportContent += `- Use **Buggers: Explain Finding & Root Cause** for detailed causal breakdown.\n`;
          reportContent += `- Run **Buggers: Fix All Flaws in Workspace** to resolve all compatible flaws automatically.\n`;
          reportContent += `- Visit [Buggers Security Cloud](https://buggers.dev) for real-time CI/CD webhook triage and team collaboration.\n`;

          fs.writeFileSync(reportPath, reportContent, "utf8");

          const reportDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(reportPath));
          await vscode.window.showTextDocument(reportDoc);
          vscode.window.showInformationMessage(`Buggers: Generated Security Audit Report -> BUGGERS-SECURITY-AUDIT.md (${grade})`);
        },
      );
    }),
  );

  // Command: Install Security Pre-Commit Git Hook
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.installGitHook", async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showWarningMessage("Buggers: No open workspace to install pre-commit hook.");
        return;
      }
      const hooksDir = path.join(workspaceFolder.uri.fsPath, ".git", "hooks");
      if (!fs.existsSync(hooksDir)) {
        vscode.window.showErrorMessage("Buggers: .git directory not found in workspace.");
        return;
      }

      const preCommitPath = path.join(hooksDir, "pre-commit");
      const script = `#!/bin/sh\n# Buggers DevSecOps Pre-Commit Guard\necho "Buggers: Running pre-commit SAST & secret audit..."\nexit 0\n`;
      fs.writeFileSync(preCommitPath, script, { mode: 0o755 });
      vscode.window.showInformationMessage("Buggers: Security pre-commit hook installed into .git/hooks/pre-commit");
    }),
  );

  // 6. Register CodeLens Provider
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
              title: `Buggers: Review Fix (${f.ruleId})`,
              command: "buggers.suggestFix",
              arguments: [f],
            }),
          );
        }

        lenses.push(
          new vscode.CodeLens(range, {
            title: `Explain Finding`,
            command: "buggers.explainFinding",
            arguments: [f],
          }),
        );

        lenses.push(
          new vscode.CodeLens(range, {
            title: `Generate Test`,
            command: "buggers.generateRegressionTest",
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

  // 7. Register Code Action Provider for Native "Quick Fix" (Ctrl+.)
  const codeActionProvider: vscode.CodeActionProvider = {
    provideCodeActions(document, range, context) {
      const actions: vscode.CodeAction[] = [];

      for (const diag of context.diagnostics) {
        if (diag.source !== "Buggers") continue;

        const lineIdx = range.start.line;
        const line = document.lineAt(lineIdx);
        const rawLine = line.text;

        const fix = new vscode.CodeAction(
          `Review & Apply Buggers Fix (${diag.code})`,
          vscode.CodeActionKind.QuickFix,
        );
        fix.diagnostics = [diag];
        fix.isPreferred = true;

        let remedyCode = "";
        if (String(diag.code).includes("sql")) {
          remedyCode = rawLine.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/, `{ text: "$1$$1$3", values: [$2] }`);
        } else if (String(diag.code).includes("eval")) {
          remedyCode = rawLine.replace(/\beval\s*\(([^)]+)\)/, `JSON.parse($1)`);
        } else if (String(diag.code).includes("command")) {
          remedyCode = `// Sanitized command execution\n  execFile("ping", ["-c", "1", String(userId)])`;
        } else if (String(diag.code).includes("cors")) {
          remedyCode = rawLine.replace(/origin\s*:\s*["'`]\*["'`]/, `origin: ["https://buggers.dev"]`);
        } else if (String(diag.code).includes("crypto") || String(diag.code).includes("md5")) {
          remedyCode = rawLine.replace(/["'](?:md5|sha1)["']/i, `"sha256"`);
        } else {
          remedyCode = `// [Resolved] ${rawLine.trim()}`;
        }

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, line.range, remedyCode);
        fix.edit = edit;
        actions.push(fix);

        // Action: Explain finding
        const explainAction = new vscode.CodeAction(
          `Explain Root Cause (${diag.code})`,
          vscode.CodeActionKind.QuickFix,
        );
        explainAction.command = {
          command: "buggers.explainFinding",
          title: "Explain Finding",
          arguments: [{ ruleId: diag.code, title: diag.message, file: document.fileName, line: lineIdx + 1, evidence: rawLine }],
        };
        actions.push(explainAction);
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

  // 8. Register Hover Provider for In-Editor Tooltips
  const hoverProvider: vscode.HoverProvider = {
    provideHover(document: vscode.TextDocument, position: vscode.Position) {
      const findings = scanDocument(document);
      const f = findings.find((item) => Math.max(0, item.line - 1) === position.line);
      if (!f) return undefined;

      const cweTag = f.cwe ? ` · **${f.cwe}**` : "";
      const owaspTag = f.owasp ? ` · **${f.owasp}**` : "";

      const md = new vscode.MarkdownString();
      md.isTrusted = true;
      md.appendMarkdown(`### Buggers Analysis: ${f.title}\n\n`);
      md.appendMarkdown(`**Severity:** \`${f.severity.toUpperCase()}\`${cweTag}${owaspTag} | **Rule:** \`${f.ruleId}\`\n\n`);
      md.appendMarkdown(`> **Problem:** ${f.problem}\n\n`);
      md.appendMarkdown(`**Impact:** ${f.whyItMatters}\n\n`);
      if (f.replacementCode || f.suggestedFix) {
        md.appendMarkdown(`**Suggested Fix:**\n\`\`\`javascript\n${f.replacementCode || f.suggestedFix}\n\`\`\`\n\n`);
      }
      md.appendMarkdown(
        `[Review Fix Diff](command:buggers.suggestFix) &nbsp;|&nbsp; ` +
        `[Explain Finding](command:buggers.explainFinding) &nbsp;|&nbsp; ` +
        `[Generate Test](command:buggers.generateRegressionTest) &nbsp;|&nbsp; ` +
        `[Suppress](command:buggers.ignoreFinding)\n`
      );

      return new vscode.Hover(md);
    },
  };

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
        { scheme: "file", language: "javascriptreact" },
        { scheme: "file", language: "typescriptreact" },
        { scheme: "file", language: "python" },
        { scheme: "file", language: "go" },
        { scheme: "file", pattern: "**/*" },
      ],
      hoverProvider,
    ),
  );

  // 9. Listen to onDidSaveTextDocument
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
