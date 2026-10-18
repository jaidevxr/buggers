import * as vscode from "vscode";
import { BuggersFinding, Severity } from "./types";

/**
 * Manages editor decorations for selected Buggers security findings.
 * Provides exact-expression highlighting, line-level background styling,
 * gutter indicators, and clean lifecycle management.
 */
export class HighlightManager {
  private expressionDecorationTypes: Map<Severity, vscode.TextEditorDecorationType> = new Map();
  private lineDecorationType: vscode.TextEditorDecorationType;
  private activeFinding: BuggersFinding | null = null;
  private activeEditorUri: string | null = null;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    // 1. Create expression decoration types for each severity
    this.expressionDecorationTypes.set(
      "critical",
      vscode.window.createTextEditorDecorationType({
        backgroundColor: "rgba(239, 68, 68, 0.22)",
        border: "1px solid rgba(239, 68, 68, 0.7)",
        borderRadius: "3px",
        overviewRulerColor: new vscode.ThemeColor("errorForeground"),
        overviewRulerLane: vscode.OverviewRulerLane.Full,
      }),
    );

    this.expressionDecorationTypes.set(
      "high",
      vscode.window.createTextEditorDecorationType({
        backgroundColor: "rgba(249, 115, 22, 0.22)",
        border: "1px solid rgba(249, 115, 22, 0.7)",
        borderRadius: "3px",
        overviewRulerColor: new vscode.ThemeColor("problemsWarningIcon.foreground"),
        overviewRulerLane: vscode.OverviewRulerLane.Right,
      }),
    );

    this.expressionDecorationTypes.set(
      "medium",
      vscode.window.createTextEditorDecorationType({
        backgroundColor: "rgba(234, 179, 8, 0.20)",
        border: "1px dashed rgba(234, 179, 8, 0.7)",
        borderRadius: "3px",
        overviewRulerColor: new vscode.ThemeColor("problemsWarningIcon.foreground"),
        overviewRulerLane: vscode.OverviewRulerLane.Center,
      }),
    );

    this.expressionDecorationTypes.set(
      "low",
      vscode.window.createTextEditorDecorationType({
        backgroundColor: "rgba(59, 130, 246, 0.18)",
        border: "1px dotted rgba(59, 130, 246, 0.6)",
        borderRadius: "3px",
        overviewRulerColor: new vscode.ThemeColor("problemsInfoIcon.foreground"),
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }),
    );

    // 2. Create whole-line subtle background highlight
    this.lineDecorationType = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
    });

    // 3. Track active editor switches to re-apply decoration if needed
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.activeFinding && this.activeEditorUri === editor.document.uri.toString()) {
          this.applyDecorationsToEditor(editor, this.activeFinding);
        }
      }),
    );
  }

  /**
   * Highlights a finding in the specified text editor and scrolls it into view.
   * If column and length are provided, highlights the exact problematic expression.
   * Otherwise falls back safely to whole-line highlighting.
   */
  public highlightFinding(editor: vscode.TextEditor, finding: BuggersFinding): void {
    this.clearHighlight();

    this.activeFinding = finding;
    this.activeEditorUri = editor.document.uri.toString();

    const lineIdx = Math.max(0, finding.line - 1);
    if (lineIdx >= editor.document.lineCount) {
      return;
    }

    this.applyDecorationsToEditor(editor, finding);

    // Reveal range in center of viewport
    const revealRange = this.computeFindingRange(editor.document, finding);
    editor.revealRange(revealRange, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }

  /**
   * Calculates the exact range for a finding.
   */
  public computeFindingRange(doc: vscode.TextDocument, finding: BuggersFinding): vscode.Range {
    const lineIdx = Math.max(0, finding.line - 1);
    if (lineIdx >= doc.lineCount) {
      return new vscode.Range(0, 0, 0, 0);
    }

    const line = doc.lineAt(lineIdx);
    const lineLen = line.text.length;

    if (
      finding.column !== undefined &&
      finding.length !== undefined &&
      finding.length > 0 &&
      finding.column < lineLen
    ) {
      const startCol = Math.max(0, finding.column);
      const endCol = Math.min(lineLen, startCol + finding.length);
      return new vscode.Range(lineIdx, startCol, lineIdx, endCol);
    }

    // Line-level fallback: highlight the trimmed line or full line
    const firstNonWs = line.firstNonWhitespaceCharacterIndex;
    return new vscode.Range(lineIdx, firstNonWs, lineIdx, lineLen);
  }

  private applyDecorationsToEditor(editor: vscode.TextEditor, finding: BuggersFinding): void {
    const lineIdx = Math.max(0, finding.line - 1);
    if (lineIdx >= editor.document.lineCount) return;

    const line = editor.document.lineAt(lineIdx);
    const lineRange = line.range;

    // Apply whole-line background
    editor.setDecorations(this.lineDecorationType, [lineRange]);

    // Apply exact expression highlight if column and length exist
    const exprRange = this.computeFindingRange(editor.document, finding);
    const decorationType =
      this.expressionDecorationTypes.get(finding.severity) ||
      this.expressionDecorationTypes.get("medium")!;

    editor.setDecorations(decorationType, [exprRange]);
  }

  /**
   * Clears highlights from all visible editors and resets active finding state.
   */
  public clearHighlight(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      for (const decType of this.expressionDecorationTypes.values()) {
        editor.setDecorations(decType, []);
      }
      editor.setDecorations(this.lineDecorationType, []);
    }
    this.activeFinding = null;
    this.activeEditorUri = null;
  }

  /**
   * Clears highlight if the specified finding is currently active.
   */
  public clearIfActive(findingId: string): void {
    if (this.activeFinding && this.activeFinding.id === findingId) {
      this.clearHighlight();
    }
  }

  public getActiveFinding(): BuggersFinding | null {
    return this.activeFinding;
  }

  public isFindingActive(findingId: string): boolean {
    return this.activeFinding !== null && this.activeFinding.id === findingId;
  }

  public dispose(): void {
    this.clearHighlight();
    for (const dec of this.expressionDecorationTypes.values()) {
      dec.dispose();
    }
    this.lineDecorationType.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
