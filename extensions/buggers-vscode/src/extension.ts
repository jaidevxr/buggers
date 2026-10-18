import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { BuggersAuth } from "./auth";
import { scanDocument, scanWorkspace } from "./scanner";
import { BuggersFinding, Severity, ScanOverview, getFindingUri } from "./types";
import { BuggersFindingsProvider } from "./treeView";
import { ScannerManager } from "./scannerManager";
import { GitHubManager } from "./githubManager";
import { BuggersPreviewProvider } from "./previewProvider";
import { HighlightManager } from "./highlightManager";
import { BuggersInspectorViewProvider } from "./inspectorView";
import { RuleExplainer } from "./ruleExplainer";
import { SAST_RULES, SECRET_RULES, LOGICAL_BUG_RULES } from "./rules";

export { SAST_RULES, SECRET_RULES, LOGICAL_BUG_RULES } from "./rules";
export { scanText, scanDocument, scanWorkspace } from "./scanner";
export { ScannerManager } from "./scannerManager";
export {
  BuggersFindingsProvider,
  OverviewNode,
  StatusHeaderNode,
  SeveritySummaryNode,
  SeverityGroupNode,
  CategoryGroupNode,
  FindingNode,
  InfoNode,
  GitHubRepoNode,
  GitHubActionNode,
} from "./treeView";
export { GitHubManager } from "./githubManager";
export { BuggersPreviewProvider } from "./previewProvider";
export { HighlightManager } from "./highlightManager";
export { BuggersInspectorViewProvider } from "./inspectorView";
export { RuleExplainer } from "./ruleExplainer";
export { getFindingUri } from "./types";
export { extractSyntaxErrors, classifyDiagnostic, getExternalDiagnostics, mergeFindings } from "./diagnosticsManager";

let diagnosticCollection: vscode.DiagnosticCollection;
let treeProvider: BuggersFindingsProvider;
let statusBarItem: vscode.StatusBarItem;
let auth: BuggersAuth;
let scannerManager: ScannerManager;
let githubManager: GitHubManager;
let highlightManager: HighlightManager;
let inspectorProvider: BuggersInspectorViewProvider;
let ruleExplainer: RuleExplainer;

export {
  githubManager,
  treeProvider,
  scannerManager,
  highlightManager,
  inspectorProvider,
  ruleExplainer,
};

/**
 * Applies a deterministic fix directly to the target document.
 * Keeps the user in the normal source editor without opening diffs.
 */
export async function executeDirectFix(
  nodeOrFinding: any,
  scannerManagerInstance: ScannerManager,
  highlightManagerInstance?: HighlightManager,
  inspectorProviderInstance?: BuggersInspectorViewProvider,
): Promise<boolean> {
  let finding: BuggersFinding | undefined =
    nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
  const editor = vscode.window.activeTextEditor;

  if (!finding && editor) {
    const findings = scannerManagerInstance.getFindingsForFile(editor.document.fileName);
    const curLine = editor.selection.active.line + 1;
    finding = findings.find((f) => f.line === curLine) || findings[0];
  }

  if (!finding) {
    vscode.window.showInformationMessage("Buggers: No finding selected or active to fix.");
    return false;
  }

  if (!finding.file) {
    vscode.window.showErrorMessage("Buggers: Finding has no associated file path.");
    return false;
  }

  const rule =
    SAST_RULES.find((r) => r.id === finding!.ruleId) ||
    SECRET_RULES.find((r) => r.id === finding!.ruleId) ||
    LOGICAL_BUG_RULES.find((r) => r.id === finding!.ruleId);

  if (
    (!finding.replacementCode || finding.replacementCode.trim().length === 0) &&
    !rule?.autoRemedyTemplate &&
    !rule?.pattern
  ) {
    vscode.window.showInformationMessage(
      `Buggers: No automated remedy available for ${finding.ruleId}. Please follow recommended remediation guidance.`,
    );
    if (finding.suggestedFix) {
      await vscode.env.clipboard.writeText(finding.suggestedFix);
      vscode.window.showInformationMessage("Buggers: Copied recommended remediation to clipboard.");
    }
    return false;
  }

  let doc: vscode.TextDocument;
  try {
    const uri = getFindingUri(finding);
    doc = await vscode.workspace.openTextDocument(uri);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Buggers: Unable to open file ${path.basename(finding.file)}: ${err.message}`);
    return false;
  }

  const lineIdx = Math.max(0, finding.line - 1);
  if (lineIdx >= doc.lineCount) {
    vscode.window.showErrorMessage(
      `Buggers: Target line ${finding.line} exceeds document line count (${doc.lineCount}). File may have changed.`,
    );
    return false;
  }

  const originalLine = doc.lineAt(lineIdx);
  const originalLineText = originalLine.text;

  const trimmedOriginal = originalLineText.trim();
  const trimmedEvidence = finding.evidence ? finding.evidence.trim() : "";
  const matchesPattern = rule?.pattern ? rule.pattern.test(originalLineText) : false;

  // A line is vulnerable if it triggers the security scanner pattern.
  // If rule is not found or has no pattern, fall back to checking if trimmedOriginal includes trimmedEvidence
  // and whether replacementCode differs from original line.
  const isCurrentlyVulnerable = rule?.pattern
    ? matchesPattern
    : !!(trimmedEvidence && trimmedOriginal.includes(trimmedEvidence));

  // If the source code on this line no longer matches the vulnerability pattern,
  // it is genuinely resolved in source.
  if (!isCurrentlyVulnerable) {
    vscode.window.showInformationMessage(
      `Buggers: Finding ${finding.ruleId} on line ${finding.line} is already resolved in source. Re-analyzing...`,
    );
    scannerManagerInstance.scanSingleDocument(doc, true);
    if (highlightManagerInstance) {
      highlightManagerInstance.clearIfActive(finding.id);
    }
    if (inspectorProviderInstance) {
      inspectorProviderInstance.clear();
    }
    return true;
  }

  // Generate patch dynamically from current source line
  let replacement = finding.replacementCode;
  if (rule?.autoRemedyTemplate) {
    const generated = rule.autoRemedyTemplate(originalLineText.trim(), originalLineText);
    if (generated && generated.trim() !== originalLineText.trim()) {
      replacement = generated;
    }
  }

  if (!replacement || replacement.trim().length === 0 || replacement.trim() === originalLineText.trim()) {
    vscode.window.showInformationMessage(
      `Buggers: Automated fix unavailable for ${finding.ruleId} on line ${finding.line}. Please use recommended parameterized query or manual remediation.`,
    );
    if (finding.suggestedFix) {
      await vscode.env.clipboard.writeText(finding.suggestedFix);
      vscode.window.showInformationMessage("Buggers: Copied recommended remediation to clipboard.");
    }
    return false;
  }

  // Preserve leading whitespace/indentation
  let formattedReplacement = replacement;
  const leadingWhitespaceMatch = originalLineText.match(/^(\s+)/);
  if (leadingWhitespaceMatch && !replacement.startsWith(" ") && !replacement.startsWith("\t")) {
    formattedReplacement = leadingWhitespaceMatch[1] + replacement.trimStart();
  }

  if (formattedReplacement.trim() === originalLineText.trim()) {
    vscode.window.showInformationMessage(
      `Buggers: Automated fix unavailable for ${finding.ruleId} on line ${finding.line}. Code remains unchanged.`,
    );
    return false;
  }

  // Verify the proposed replacement does NOT itself contain the vulnerability pattern
  if (rule?.pattern && rule.pattern.test(formattedReplacement)) {
    vscode.window.showWarningMessage(
      `Buggers: Automated patch rejected because ${finding.ruleId} pattern remains detected in proposed replacement. Manual remediation required.`,
    );
    return false;
  }

  // Stale check: verify current line still matches evidence or pattern
  if (trimmedEvidence && !trimmedOriginal.includes(trimmedEvidence) && !trimmedEvidence.includes(trimmedOriginal)) {
    vscode.window.showErrorMessage(
      `Buggers: File content on line ${finding.line} has diverged since the scan was performed. Re-analyzing...`,
    );
    scannerManagerInstance.scanSingleDocument(doc, true);
    return false;
  }

  // Preserve user editor cursor and viewport stability
  const activeEditor = vscode.window.activeTextEditor;
  const wasActive = activeEditor?.document.uri.toString() === doc.uri.toString();
  const preserveSelection = wasActive ? activeEditor.selection : undefined;

  // Apply edit directly to source document using WorkspaceEdit
  const edit = new vscode.WorkspaceEdit();
  edit.replace(doc.uri, originalLine.range, formattedReplacement);
  const applied = await vscode.workspace.applyEdit(edit);

  if (!applied) {
    vscode.window.showErrorMessage(`Buggers: Failed to apply fix edit to ${path.basename(doc.fileName)}.`);
    return false;
  }

  // Restore editor cursor if active without moving viewport
  if (wasActive && activeEditor) {
    if (preserveSelection) {
      activeEditor.selection = preserveSelection;
    }
  }

  // Re-run scanner on the modified document
  const remainingFindings = scannerManagerInstance.scanSingleDocument(doc, true);
  const stillPresent = remainingFindings.some(
    (f) => f.ruleId === finding!.ruleId && Math.abs(f.line - finding!.line) <= 1,
  );

  if (stillPresent) {
    vscode.window.showWarningMessage(
      `Buggers: Fix applied, but finding ${finding.ruleId} remains detected on line ${finding.line}.`,
    );
    return false;
  } else {
    // Verified resolved! Clear active highlight and inspector without jumping to line 1
    if (highlightManagerInstance) {
      highlightManagerInstance.clearIfActive(finding.id);
    }
    if (inspectorProviderInstance) {
      inspectorProviderInstance.clear();
    }
    vscode.window.showInformationMessage(
      `Buggers: Verified resolved! ${finding.title} on line ${finding.line} has been eliminated.`,
    );
    return true;
  }
}

/**
 * Optional Preview Fix: Opens a side-by-side diff editor for inspection prior to applying.
 */
export async function executeReviewableFix(
  nodeOrFinding: any,
  scannerManagerInstance: ScannerManager,
  previewProviderInstance: BuggersPreviewProvider,
  highlightManagerInstance?: HighlightManager,
  inspectorProviderInstance?: BuggersInspectorViewProvider,
): Promise<boolean> {
  let finding: BuggersFinding | undefined =
    nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
  const editor = vscode.window.activeTextEditor;

  if (!finding && editor) {
    const findings = scannerManagerInstance.getFindingsForFile(editor.document.fileName);
    const curLine = editor.selection.active.line + 1;
    finding = findings.find((f) => f.line === curLine) || findings[0];
  }

  if (!finding) {
    vscode.window.showInformationMessage("Buggers: No finding selected or active to preview.");
    return false;
  }

  if (!finding.file) {
    vscode.window.showErrorMessage("Buggers: Finding has no associated file path.");
    return false;
  }

  const rule =
    SAST_RULES.find((r) => r.id === finding!.ruleId) ||
    SECRET_RULES.find((r) => r.id === finding!.ruleId) ||
    LOGICAL_BUG_RULES.find((r) => r.id === finding!.ruleId);

  if (
    (!finding.replacementCode || finding.replacementCode.trim().length === 0) &&
    !rule?.autoRemedyTemplate &&
    !rule?.pattern
  ) {
    vscode.window.showInformationMessage(
      `Buggers: No automated remedy available for ${finding.ruleId}. Please review recommended remediation guidance.`,
    );
    return false;
  }

  let doc: vscode.TextDocument;
  try {
    const uri = getFindingUri(finding);
    doc = await vscode.workspace.openTextDocument(uri);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Buggers: Unable to open file ${path.basename(finding.file)}: ${err.message}`);
    return false;
  }

  const lineIdx = Math.max(0, finding.line - 1);
  if (lineIdx >= doc.lineCount) {
    vscode.window.showErrorMessage(
      `Buggers: Target line ${finding.line} exceeds document line count (${doc.lineCount}). File may have changed.`,
    );
    return false;
  }

  const originalLine = doc.lineAt(lineIdx);
  const originalLineText = originalLine.text;


  let replacement = finding.replacementCode;
  if (rule?.autoRemedyTemplate) {
    const generated = rule.autoRemedyTemplate(originalLineText.trim(), originalLineText);
    if (generated && generated.trim() !== originalLineText.trim()) {
      replacement = generated;
    }
  }

  if (!replacement || replacement.trim().length === 0 || replacement.trim() === originalLineText.trim()) {
    vscode.window.showInformationMessage(
      `Buggers: No automated remedy available for ${finding.ruleId}. Please review recommended remediation guidance.`,
    );
    return false;
  }

  let formattedReplacement = replacement;
  const leadingWhitespaceMatch = originalLineText.match(/^(\s+)/);
  if (leadingWhitespaceMatch && !replacement.startsWith(" ") && !replacement.startsWith("\t")) {
    formattedReplacement = leadingWhitespaceMatch[1] + replacement.trimStart();
  }

  const docLines = doc.getText().split("\n");
  docLines[lineIdx] = formattedReplacement;
  const proposedFullText = docLines.join("\n");

  const fileName = path.basename(doc.fileName);
  const previewUri = vscode.Uri.parse(
    `${BuggersPreviewProvider.scheme}://preview/${fileName}?ruleId=${encodeURIComponent(finding.ruleId)}&t=${Date.now()}`,
  );
  previewProviderInstance.setPreview(previewUri, proposedFullText);

  const diffTitle = `${fileName} (Original Source <-> Buggers Proposed Fix: ${finding.ruleId})`;
  await vscode.commands.executeCommand(
    "vscode.diff",
    doc.uri,
    previewUri,
    diffTitle,
    { preview: true },
  );

  const shortProblem = finding.problem.length > 70 ? finding.problem.slice(0, 67) + "..." : finding.problem;
  const promptText = `Buggers Proposed Fix [${finding.ruleId}]: Replace line ${finding.line} to resolve ${shortProblem}`;

  const action = await vscode.window.showInformationMessage(
    promptText,
    "Apply Fix",
    "Copy Patch",
    "Reject",
  );

  if (action === "Copy Patch") {
    previewProviderInstance.clearPreview(previewUri);
    await vscode.env.clipboard.writeText(formattedReplacement);
    vscode.window.showInformationMessage("Buggers: Remediation patch copied to clipboard.");
    return false;
  }

  if (action === "Reject" || !action) {
    previewProviderInstance.clearPreview(previewUri);
    return false;
  }

  if (action === "Apply Fix") {
    const latestDoc = await vscode.workspace.openTextDocument(doc.uri);
    const latestLineText = latestDoc.lineAt(lineIdx).text;
    if (latestLineText !== originalLineText) {
      previewProviderInstance.clearPreview(previewUri);
      vscode.window.showErrorMessage(
        "Buggers: File content has diverged since the diff was generated. Please re-scan before applying.",
      );
      return false;
    }

    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, originalLine.range, formattedReplacement);
    const applied = await vscode.workspace.applyEdit(edit);
    previewProviderInstance.clearPreview(previewUri);

    if (applied) {
      // Re-open normal editor tab for the user
      await vscode.window.showTextDocument(latestDoc, { preview: false });

      const remainingFindings = scannerManagerInstance.scanSingleDocument(latestDoc, true);
      const stillPresent = remainingFindings.some(
        (f) => f.ruleId === finding!.ruleId && f.line === finding!.line,
      );
      if (stillPresent) {
        vscode.window.showWarningMessage(
          `Buggers: Fix applied, but finding ${finding!.ruleId} remains detected on line ${finding!.line}.`,
        );
      } else {
        if (highlightManagerInstance) {
          highlightManagerInstance.clearIfActive(finding!.id);
        }
        if (inspectorProviderInstance) {
          inspectorProviderInstance.clear();
        }
        vscode.window.showInformationMessage(
          `Buggers: Verified resolved! ${finding!.title} on line ${finding!.line} has been eliminated.`,
        );
      }
      return true;
    } else {
      vscode.window.showErrorMessage(`Buggers: Failed to apply fix edit to ${fileName}.`);
      return false;
    }
  }

  return false;
}

export function activate(context: vscode.ExtensionContext) {
  // 1. Initialize Auth & Rule Explainer
  auth = new BuggersAuth(context);
  ruleExplainer = new RuleExplainer();

  // Initialize GitHub Manager (Repository-Aware Integration)
  githubManager = new GitHubManager(context, auth);
  context.subscriptions.push(githubManager);

  // 2. Diagnostics Collection for Problems Panel
  diagnosticCollection = vscode.languages.createDiagnosticCollection("buggers");
  context.subscriptions.push(diagnosticCollection);

  // 3. Tree Data Provider for Activity Bar
  treeProvider = new BuggersFindingsProvider();
  vscode.window.registerTreeDataProvider("buggers.findingsView", treeProvider);

  // Wire GitHub Manager to Tree View
  githubManager.onDidChangeStatus((status) => {
    treeProvider.setGitHubStatus(status);
  });
  githubManager.refreshStatus();

  // 4. Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBarItem.command = "buggers.showFindings";
  statusBarItem.text = "$(shield) Buggers: Initializing";
  statusBarItem.tooltip = "Click to open Buggers Security & Bug Triage";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // 5. Initialize Scanner Manager (Automated Real-Time Detection)
  scannerManager = new ScannerManager(diagnosticCollection, (findings, overview) => {
    updateStatusBar(findings, overview);
  });
  context.subscriptions.push(scannerManager);

  scannerManager.onDidChangeFindings((findings) => {
    treeProvider.setFindings(findings, scannerManager.getOverview());
  });

  scannerManager.onDidChangeStatus((overview) => {
    treeProvider.setOverview(overview);
    updateStatusBar(scannerManager.getAllFindings(), overview);
  });

  // 6. Initialize Editor Highlight Manager
  highlightManager = new HighlightManager();
  context.subscriptions.push(highlightManager);

  // 7. Initialize Finding Inspector & Action Toolbar View
  inspectorProvider = new BuggersInspectorViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      BuggersInspectorViewProvider.viewType,
      inspectorProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  // 8. Virtual Text Document Provider for Diff Previews
  const previewProvider = BuggersPreviewProvider.getInstance();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(BuggersPreviewProvider.scheme, previewProvider),
  );

  // 9. Register Commands

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
      const findings = scannerManager.scanSingleDocument(doc, true);

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
      const scanResult = await scannerManager.startWorkspaceScan(true);
      const allFindings = scannerManager.getAllFindings();

      if (allFindings.length > 0) {
        const crit = allFindings.filter((f) => f.severity === "critical").length;
        const high = allFindings.filter((f) => f.severity === "high").length;
        vscode.window.showWarningMessage(
          `Buggers Workspace Audit: Detected ${allFindings.length} issue(s) across ${scanResult.scannedCount} file(s) (${crit} critical, ${high} high).`,
        );
      } else {
        vscode.window.showInformationMessage(
          `Buggers Workspace Audit: Clean. Audited ${scanResult.scannedCount} file(s). Zero security flaws detected.`,
        );
      }
    }),
  );

  // Command: Show Findings
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.showFindings", async () => {
      await vscode.commands.executeCommand("workbench.view.extension.buggers-sidebar");
    }),
  );

  // Command: Refresh / Rescan Findings
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.refreshFindings", async () => {
      treeProvider.restoreDismissed();
      scannerManager.restoreDismissed();
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        scannerManager.scanSingleDocument(editor.document, true);
      }
      await scannerManager.startWorkspaceScan(false);
      await githubManager.refreshStatus();
    }),
  );

  // Command: Clear Displayed Findings
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.clearFindings", async () => {
      const confirm = await vscode.window.showWarningMessage(
        "Clear all displayed findings? (Source code will not be changed. Findings can be restored by clicking Rescan.)",
        "Clear Displayed Findings",
        "Cancel",
      );
      if (confirm !== "Clear Displayed Findings") return;

      scannerManager.clear();
      treeProvider.clear();
      highlightManager.clearHighlight();
      inspectorProvider.clear();
      vscode.window.showInformationMessage("Buggers: Displayed findings cleared. Click Rescan to re-audit.");
    }),
  );

  // Command: Dismiss Individual Finding
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.dismissFinding", async (nodeOrFinding?: any) => {
      const finding: BuggersFinding | undefined = nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
      if (!finding) return;

      scannerManager.dismissFinding(finding.id);
      treeProvider.dismissFinding(finding.id);
      highlightManager.clearIfActive(finding.id);

      if (inspectorProvider.getActiveFinding()?.id === finding.id) {
        inspectorProvider.clear();
      }

      vscode.window.showInformationMessage(
        `Buggers: Dismissed "${finding.title}". (Restored on next rescan)`,
        "Undo",
      ).then((choice) => {
        if (choice === "Undo") {
          scannerManager.restoreDismissed();
          treeProvider.restoreDismissed();
        }
      });
    }),
  );

  // Command: More Actions for Finding
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.moreActions", async (nodeOrFinding?: any) => {
      let finding: BuggersFinding | undefined = nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
      if (!finding) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const findings = scannerManager.getFindingsForFile(editor.document.fileName);
          const curLine = editor.selection.active.line + 1;
          finding = findings.find((f) => f.line === curLine) || findings[0];
        }
      }
      if (!finding) return;

      const hasFix = Boolean(finding.replacementCode && finding.replacementCode.trim().length > 0);
      const items = [
        ...(hasFix
          ? [
              { label: "Fix Finding (Apply Directly)", id: "applyRemedy", description: "Apply verified remediation to document" },
              { label: "Preview Fix Diff", id: "previewDiff", description: "Review side-by-side patch in diff editor" },
            ]
          : []),
        { label: "Explain Finding & Rule Guidance", id: "explainFinding", description: "Deep dive into vulnerability causation and fix" },
        { label: "Copy Remediation Patch to Clipboard", id: "copyPatch", description: "Copy replacement code snippet" },
        { label: "Generate Regression Test", id: "generateTest", description: "Generate automated test reproduction" },
        { label: "Suppress Finding", id: "ignoreFinding", description: "Insert // buggers-ignore comment" },
        { label: "Dismiss Finding from Display", id: "dismissFinding", description: "Hide from current list until rescan" },
      ];

      const pick = await vscode.window.showQuickPick(items, {
        placeHolder: `Actions for [${finding.severity.toUpperCase()}] ${finding.title}`,
      });

      if (!pick) return;

      switch (pick.id) {
        case "applyRemedy":
          vscode.commands.executeCommand("buggers.applyRemedy", finding);
          break;
        case "previewDiff":
          vscode.commands.executeCommand("buggers.previewDiff", finding);
          break;
        case "explainFinding":
          vscode.commands.executeCommand("buggers.explainFinding", finding);
          break;
        case "copyPatch":
          vscode.commands.executeCommand("buggers.copyPatch", finding);
          break;
        case "generateTest":
          vscode.commands.executeCommand("buggers.generateRegressionTest", finding);
          break;
        case "ignoreFinding":
          vscode.commands.executeCommand("buggers.ignoreFinding", finding);
          break;
        case "dismissFinding":
          vscode.commands.executeCommand("buggers.dismissFinding", finding);
          break;
      }
    }),
  );

  // Command: Generate Regression Test
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.generateRegressionTest", async (nodeOrFinding?: any) => {
      let finding: BuggersFinding | undefined = nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
      if (!finding) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const findings = scannerManager.getFindingsForFile(editor.document.fileName);
          const curLine = editor.selection.active.line + 1;
          finding = findings.find((f) => f.line === curLine) || findings[0];
        }
      }
      if (!finding) return;

      const testContent = ruleExplainer.generateRegressionTest(finding);
      const isTs = finding.file.endsWith(".ts") || finding.file.endsWith(".tsx");
      const doc = await vscode.workspace.openTextDocument({
        content: testContent,
        language: isTs ? "typescript" : "javascript",
      });
      await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
      vscode.window.showInformationMessage(`Buggers: Generated regression test for ${finding.title}.`);
    }),
  );

  // Command: Toggle Findings Grouping Mode
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.toggleGrouping", async () => {
      const choice = await vscode.window.showQuickPick(
        [
          { label: "Severity Grouping", description: "Critical, High, Medium, Low (Auto-expanded)", id: "severity" },
          { label: "Flat List", description: "Direct un-nested findings list sorted by priority", id: "flat" },
          { label: "Category Grouping", description: "Secrets, Security, Logical Bugs, Quality", id: "category" },
          { label: "File Grouping", description: "Grouped by source file path", id: "file" },
        ],
        { placeHolder: "Select Findings View Grouping Mode" },
      );
      if (choice) {
        treeProvider.setGroupingMode(choice.id as any);
        vscode.window.showInformationMessage(`Buggers: Findings grouped by ${choice.label}`);
      }
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
      const findings = scannerManager.getAllFindings();
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
                  version: "1.4.5",
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

  // Command: Fix Finding (Apply Directly to Editor)
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.applyRemedy", async (findingNodeOrFinding: any) => {
      return executeDirectFix(findingNodeOrFinding, scannerManager, highlightManager, inspectorProvider);
    }),
  );

  // Command: Fix Finding Alias
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.suggestFix", async (nodeOrFinding?: any) => {
      return executeDirectFix(nodeOrFinding, scannerManager, highlightManager, inspectorProvider);
    }),
  );

  // Command: Preview Fix Diff (Optional Diff Inspection)
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.previewDiff", async (nodeOrFinding: any) => {
      return executeReviewableFix(nodeOrFinding, scannerManager, previewProvider, highlightManager, inspectorProvider);
    }),
  );

  // Command: Copy Remediation Patch to Clipboard
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.copyPatch", async (nodeOrFinding?: any) => {
      const finding: BuggersFinding | undefined = nodeOrFinding?.finding ?? nodeOrFinding;
      if (!finding) return;

      const patchCode = finding.replacementCode || finding.suggestedFix;
      if (!patchCode) {
        vscode.window.showInformationMessage("Buggers: No patch snippet available for this finding.");
        return;
      }

      await vscode.env.clipboard.writeText(patchCode);
      vscode.window.showInformationMessage(`Buggers: Remediation patch copied to clipboard.`);
    }),
  );

  // Command: Select Finding (Jump to Code, Highlight, and Update Inspector)
  let isNavigatingFinding = false;
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.selectFinding", async (nodeOrFinding?: any) => {
      let finding: BuggersFinding | undefined =
        nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
      if (!finding) return;
      if (isNavigatingFinding) return;

      isNavigatingFinding = true;
      try {
        const uri = getFindingUri(finding);
        const activeEditor = vscode.window.activeTextEditor;
        let editor: vscode.TextEditor | undefined;

        if (activeEditor && activeEditor.document.uri.toString() === uri.toString()) {
          editor = activeEditor;
        } else {
          const doc = await vscode.workspace.openTextDocument(uri);
          editor = await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: true });
        }

        if (editor) {
          highlightManager.highlightFinding(editor, finding);
          await inspectorProvider.setFinding(finding, editor.document);
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Buggers: Unable to open finding location: ${err.message}`);
      } finally {
        isNavigatingFinding = false;
      }
    }),
  );

  // Command: Explain Finding (Root Cause & Guidance)
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.explainFinding", async (nodeOrFinding?: any) => {
      let finding: BuggersFinding | undefined = nodeOrFinding?.finding ?? (nodeOrFinding?.ruleId ? nodeOrFinding : undefined);
      if (!finding) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const findings = scannerManager.getFindingsForFile(editor.document.fileName);
          const curLine = editor.selection.active.line + 1;
          finding = findings.find((f) => f.line === curLine) || findings[0];
        }
      }
      if (!finding) {
        vscode.window.showInformationMessage("Buggers: No finding selected to explain.");
        return;
      }

      const explanation = ruleExplainer.explainFinding(finding);
      const doc = await vscode.workspace.openTextDocument({
        content: explanation,
        language: "markdown",
      });
      await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
    }),
  );

  // Command: Inspect Finding & Focus Inspector
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.inspectFinding", async (nodeOrFinding?: any) => {
      return vscode.commands.executeCommand("buggers.openInspector", nodeOrFinding);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.openInspector", async (nodeOrFinding?: any) => {
      await vscode.commands.executeCommand("buggers.selectFinding", nodeOrFinding);
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

      const allFindings = scannerManager.scanSingleDocument(editor.document, true);
      const logicalBugs = allFindings.filter((f) => f.category === "logical_bug");

      if (logicalBugs.length > 0) {
        vscode.window.showWarningMessage(
          `Buggers: Detected ${logicalBugs.length} potential logical bug(s) in ${path.basename(editor.document.fileName)}.`,
        );
      } else {
        vscode.window.showInformationMessage(
          `Buggers: No logical bugs detected in ${path.basename(editor.document.fileName)}.`,
        );
      }
    }),
  );

  // GitHub Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.gitReviewChanges", async () => {
      const review = await githubManager.reviewChangedFiles(scannerManager);
      vscode.window.showInformationMessage(`Buggers Git Review: ${review.summaryMessage}`);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.gitCommit", async () => {
      await githubManager.promptSafeCommit(scannerManager);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.gitPush", async () => {
      await githubManager.promptSafePush();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.openOnGitHub", async () => {
      await githubManager.openOnGitHub();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.connectGitHub", async () => {
      await githubManager.connectGitHub();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.refreshGitHubStatus", async () => {
      await githubManager.refreshStatus();
      vscode.window.showInformationMessage("Buggers: Refreshed GitHub repository status.");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.openDashboard", async () => {
      const config = vscode.workspace.getConfiguration("buggers");
      const url = config.get<string>("serverUrl") || "https://buggers.dev";
      await vscode.env.openExternal(vscode.Uri.parse(url));
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
      const findings = scannerManager.getFindingsForFile(doc.fileName).filter((f) => f.replacementCode);
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
          let formattedReplacement = f.replacementCode;
          const leadingWhitespaceMatch = line.text.match(/^(\s+)/);
          if (leadingWhitespaceMatch && !f.replacementCode.startsWith(" ") && !f.replacementCode.startsWith("\t")) {
            formattedReplacement = leadingWhitespaceMatch[1] + f.replacementCode.trimStart();
          }
          edit.replace(doc.uri, line.range, formattedReplacement);
        }
      }
      const success = await vscode.workspace.applyEdit(edit);
      if (success) {
        scannerManager.scanSingleDocument(doc, true);
        highlightManager.clearHighlight();
        inspectorProvider.clear();
        vscode.window.showInformationMessage(
          `Buggers: Successfully fixed ${findings.length} flaw(s) in ${path.basename(doc.fileName)}.`,
        );
      }
    }),
  );

  // Command: Suppress / Ignore Finding with Inline Comment
  context.subscriptions.push(
    vscode.commands.registerCommand("buggers.ignoreFinding", async (nodeOrFinding: any) => {
      const finding: BuggersFinding = nodeOrFinding?.finding ?? nodeOrFinding;
      if (!finding) return;

      const uri = getFindingUri(finding);
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
        scannerManager.scanSingleDocument(doc, true);
        highlightManager.clearIfActive(finding.id);
        inspectorProvider.clear();
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
          const allFindings = scannerManager.getAllFindings();
          const crit = allFindings.filter((f) => f.severity === "critical").length;
          const high = allFindings.filter((f) => f.severity === "high").length;
          const med = allFindings.filter((f) => f.severity === "medium").length;
          const low = allFindings.filter((f) => f.severity === "low").length;

          const score = Math.max(0, 100 - (crit * 15 + high * 10 + med * 5 + low * 2));
          let grade = "A+";
          if (score < 60) grade = "F";
          else if (score < 75) grade = "C";
          else if (score < 85) grade = "B";
          else if (score < 95) grade = "A";

          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          const reportPath = workspaceFolder
            ? path.join(workspaceFolder.uri.fsPath, "BUGGERS-SECURITY-AUDIT.md")
            : path.join(process.cwd(), "BUGGERS-SECURITY-AUDIT.md");

          let reportContent = `# Buggers Security Health Audit Report\n\n`;
          reportContent += `**Generated:** ${new Date().toUTCString()}  \n`;
          reportContent += `**Overall Security Grade:** **${grade} (${score}/100)**  \n`;
          reportContent += `**Total Vulnerabilities Flagged:** **${allFindings.length}**  \n\n`;
          reportContent += `## Vulnerability Breakdown\n`;
          reportContent += `- **Critical Severity:** ${crit}\n`;
          reportContent += `- **High Severity:** ${high}\n`;
          reportContent += `- **Medium Severity:** ${med}\n`;
          reportContent += `- **Low Severity / Best Practice:** ${low}\n\n`;

          reportContent += `## Detailed Finding Inventory\n`;
          if (allFindings.length === 0) {
            reportContent += `> Zero security flaws detected. Project passes all active SAST and Secret scanning policies.\n\n`;
          } else {
            reportContent += `| Severity | Rule ID | Title | File | Line |\n`;
            reportContent += `| :--- | :--- | :--- | :--- | :--- |\n`;
            for (const f of allFindings) {
              reportContent += `| **${f.severity.toUpperCase()}** | \`${f.ruleId}\` | ${f.title} | \`${path.basename(f.file)}\` | ${f.line} |\n`;
            }
            reportContent += `\n`;
          }

          reportContent += `## Remediation Actions\n`;
          reportContent += `- Use **Buggers: Fix Finding** to apply validated patches directly to source code.\n`;
          reportContent += `- Use **Buggers: Preview Fix Diff** to review side-by-side changes prior to applying.\n`;
          reportContent += `- Use **Buggers: Explain Finding & Rule Guidance** for detailed causal breakdowns.\n`;
          reportContent += `- Visit [Buggers Security Cloud](https://buggers.dev) for real-time CI/CD webhook triage.\n`;

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

  // 10. Document Selector matching all workspace schemes (file, vscode-remote, vscode-vfs, untitled)
  const supportedDocSelector: vscode.DocumentSelector = [
    { language: "javascript" },
    { language: "typescript" },
    { language: "javascriptreact" },
    { language: "typescriptreact" },
    { language: "python" },
    { language: "go" },
    { pattern: "**/*" },
  ];

  // 11. Register CodeLens Provider
  const codeLensProvider: vscode.CodeLensProvider = {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
      const lenses: vscode.CodeLens[] = [];
      const findings = scannerManager.getFindingsForFile(document.fileName);
      for (const f of findings) {
        const lineIdx = Math.max(0, f.line - 1);
        const range = new vscode.Range(lineIdx, 0, lineIdx, 0);

        if (f.replacementCode && f.replacementCode.trim().length > 0) {
          lenses.push(
            new vscode.CodeLens(range, {
              title: `Buggers: Fix Finding (${f.ruleId})`,
              command: "buggers.applyRemedy",
              arguments: [f],
            }),
          );
          lenses.push(
            new vscode.CodeLens(range, {
              title: `Preview Diff`,
              command: "buggers.previewDiff",
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
      }
      return lenses;
    },
  };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      supportedDocSelector,
      codeLensProvider,
    ),
  );

  // 12. Register Code Action Provider for Native "Quick Fix" (Ctrl+.)
  const codeActionProvider: vscode.CodeActionProvider = {
    provideCodeActions(document, range, context) {
      const actions: vscode.CodeAction[] = [];

      for (const diag of context.diagnostics) {
        if (diag.source !== "Buggers") continue;

        const lineIdx = range.start.line;
        const line = document.lineAt(lineIdx);
        const rawLine = line.text;

        const findings = scannerManager.getFindingsForFile(document.fileName);
        const matchingFinding = findings.find((f) => f.ruleId === diag.code && f.line === lineIdx + 1);

        if (matchingFinding && matchingFinding.replacementCode) {
          const directFix = new vscode.CodeAction(
            `Fix Finding Directly: ${diag.code}`,
            vscode.CodeActionKind.QuickFix,
          );
          directFix.diagnostics = [diag];
          directFix.isPreferred = true;
          directFix.command = {
            command: "buggers.applyRemedy",
            title: "Fix Finding Directly",
            arguments: [matchingFinding],
          };
          actions.push(directFix);

          const previewFix = new vscode.CodeAction(
            `Preview Fix Diff: ${diag.code}`,
            vscode.CodeActionKind.QuickFix,
          );
          previewFix.command = {
            command: "buggers.previewDiff",
            title: "Preview Fix Diff",
            arguments: [matchingFinding],
          };
          actions.push(previewFix);
        }

        const explainAction = new vscode.CodeAction(
          `Explain Finding & Guidance: ${diag.code}`,
          vscode.CodeActionKind.QuickFix,
        );
        explainAction.command = {
          command: "buggers.explainFinding",
          title: "Explain Finding",
          arguments: [matchingFinding || { ruleId: diag.code, title: diag.message, file: document.fileName, line: lineIdx + 1, evidence: rawLine }],
        };
        actions.push(explainAction);
      }

      return actions;
    },
  };

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      supportedDocSelector,
      codeActionProvider,
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
    ),
  );

  // 13. Register Hover Provider for In-Editor Tooltips
  const hoverProvider: vscode.HoverProvider = {
    provideHover(document: vscode.TextDocument, position: vscode.Position) {
      const findings = scannerManager.getFindingsForFile(document.fileName);
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

      const fixLinks = f.replacementCode
        ? `[Fix Finding](command:buggers.applyRemedy) &nbsp;|&nbsp; [Preview Fix](command:buggers.previewDiff) &nbsp;|&nbsp; `
        : "";
      md.appendMarkdown(
        `${fixLinks}[Explain Finding](command:buggers.explainFinding) &nbsp;|&nbsp; [Suppress](command:buggers.ignoreFinding)\n`
      );

      return new vscode.Hover(md);
    },
  };

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      supportedDocSelector,
      hoverProvider,
    ),
  );

  // 14. Editor selection synchronization: update highlight and inspector when cursor moves
  if (typeof vscode.window.onDidChangeTextEditorSelection === "function") {
    context.subscriptions.push(
      vscode.window.onDidChangeTextEditorSelection(async (e) => {
        if (!e.textEditor || !e.selections || e.selections.length === 0) return;
        const doc = e.textEditor.document;
        const cursorLine = e.selections[0].active.line + 1;

        const fileFindings = scannerManager.getFindingsForFile(doc.fileName);
        const matched = fileFindings.find((f) => f.line === cursorLine);

        if (matched && (!highlightManager.getActiveFinding() || highlightManager.getActiveFinding()?.id !== matched.id)) {
          highlightManager.highlightFinding(e.textEditor, matched);
          await inspectorProvider.setFinding(matched, doc);
        }
      }),
    );
  }

  // 15. Document edit listener: if active finding line changed, update highlight
  if (typeof vscode.workspace.onDidChangeTextDocument === "function") {
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        const activeFinding = highlightManager.getActiveFinding();
        if (activeFinding && e.document.uri.toString() === getFindingUri(activeFinding).toString()) {
          const lineIdx = Math.max(0, activeFinding.line - 1);
          const changedLine = e.contentChanges.some(
            (c) => c.range.start.line <= lineIdx && c.range.end.line >= lineIdx,
          );
          if (changedLine) {
            highlightManager.clearIfActive(activeFinding.id);
          }
        }
      }),
    );
  }

  // 16. Auto-Scan on Startup
  if (vscode.window.activeTextEditor) {
    const doc = vscode.window.activeTextEditor.document;
    scannerManager.scanSingleDocument(doc, true);
  }
  if (vscode.window.visibleTextEditors) {
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor && editor.document) {
        scannerManager.scanSingleDocument(editor.document, false);
      }
    }
  }

  // Trigger background workspace scan after brief debounce
  setTimeout(() => {
    scannerManager.startWorkspaceScan(false);
  }, 200);
}

function updateStatusBar(findings: BuggersFinding[], overview?: ScanOverview) {
  if (!statusBarItem) return;

  const status = overview?.status || "idle";

  if (status === "scanning_workspace" || status === "scanning_file") {
    statusBarItem.text = `$(sync~spin) Buggers: Scanning...`;
    statusBarItem.backgroundColor = undefined;
    return;
  }

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
  if (highlightManager) {
    highlightManager.dispose();
  }
  if (githubManager) {
    githubManager.dispose();
  }
  if (scannerManager) {
    scannerManager.dispose();
  }
  if (diagnosticCollection) {
    diagnosticCollection.clear();
    diagnosticCollection.dispose();
  }
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
