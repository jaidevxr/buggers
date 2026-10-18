import * as vscode from "vscode";
import * as path from "path";
import { BuggersFinding } from "./types";

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export class BuggersInspectorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "buggers.inspectorView";
  private _view?: vscode.WebviewView;
  private currentFinding: BuggersFinding | null = null;
  private currentExcerpt: { lines: { number: number; text: string; isTarget: boolean }[]; highlightRange?: { start: number; end: number } } | null = null;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (!this.currentFinding) return;

      switch (data.action) {
        case "fix":
          await vscode.commands.executeCommand("buggers.applyRemedy", this.currentFinding);
          break;
        case "previewFix":
          await vscode.commands.executeCommand("buggers.previewDiff", this.currentFinding);
          break;
        case "explain":
          await vscode.commands.executeCommand("buggers.explainFinding", this.currentFinding);
          break;
        case "copyPatch":
          await vscode.commands.executeCommand("buggers.copyPatch", this.currentFinding);
          break;
        case "openSource":
          await vscode.commands.executeCommand("buggers.selectFinding", this.currentFinding);
          break;
        case "generateTest":
          await vscode.commands.executeCommand("buggers.generateRegressionTest", this.currentFinding);
          break;
        case "suppress":
          await vscode.commands.executeCommand("buggers.ignoreFinding", this.currentFinding);
          break;
        case "dismiss":
          await vscode.commands.executeCommand("buggers.dismissFinding", this.currentFinding);
          this.clear();
          break;
      }
    });

    if (this.currentFinding) {
      this.sendStateToWebview();
    }
  }

  /**
   * Updates the inspector with the selected finding and extracts relevant surrounding code context.
   */
  public async setFinding(finding: BuggersFinding, doc?: vscode.TextDocument): Promise<void> {
    this.currentFinding = finding;

    // Extract surrounding source lines from the actual document
    if (doc) {
      const lineIdx = Math.max(0, finding.line - 1);
      const startLine = Math.max(0, lineIdx - 2);
      const endLine = Math.min(doc.lineCount - 1, lineIdx + 2);

      const lines: { number: number; text: string; isTarget: boolean }[] = [];
      for (let i = startLine; i <= endLine; i++) {
        lines.push({
          number: i + 1,
          text: doc.lineAt(i).text,
          isTarget: i === lineIdx,
        });
      }

      let highlightRange: { start: number; end: number } | undefined;
      if (finding.column !== undefined && finding.length !== undefined && finding.length > 0) {
        highlightRange = {
          start: finding.column,
          end: finding.column + finding.length,
        };
      }

      this.currentExcerpt = { lines, highlightRange };
    } else {
      this.currentExcerpt = null;
    }

    if (this._view) {
      if (!this._view.visible && typeof this._view.show === "function") {
        this._view.show(true);
      }
      this.sendStateToWebview();
    }
  }

  public clear(): void {
    this.currentFinding = null;
    this.currentExcerpt = null;
    if (this._view) {
      this.sendStateToWebview();
    }
  }

  public getActiveFinding(): BuggersFinding | null {
    return this.currentFinding;
  }

  private sendStateToWebview(): void {
    if (!this._view) return;

    this._view.webview.postMessage({
      type: "updateFinding",
      finding: this.currentFinding
        ? {
            id: this.currentFinding.id,
            ruleId: this.currentFinding.ruleId,
            title: this.currentFinding.title,
            severity: this.currentFinding.severity,
            category: this.currentFinding.category,
            sourceType: this.currentFinding.sourceType,
            confidence: this.currentFinding.confidence,
            source: this.currentFinding.source,
            cwe: this.currentFinding.cwe,
            owasp: this.currentFinding.owasp,
            problem: this.currentFinding.problem,
            whyItMatters: this.currentFinding.whyItMatters,
            evidence: this.currentFinding.evidence,
            replacementCode: this.currentFinding.replacementCode,
            suggestedFix: this.currentFinding.suggestedFix,
            hasFix: Boolean(
              this.currentFinding.replacementCode &&
              this.currentFinding.replacementCode.trim().length > 0,
            ),
            file: path.basename(this.currentFinding.file),
            fullPath: this.currentFinding.file,
            line: this.currentFinding.line,
            column: this.currentFinding.column,
          }
        : null,
      excerpt: this.currentExcerpt,
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      font-size: var(--vscode-font-size, 12px);
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background, var(--vscode-editor-background));
      margin: 0;
      padding: 10px;
      box-sizing: border-box;
      line-height: 1.45;
    }
    .empty-state {
      padding: 20px 10px;
      text-align: center;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }
    .header {
      margin-bottom: 8px;
    }
    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      align-items: center;
      margin-bottom: 6px;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-critical { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); }
    .badge-high { background: rgba(249, 115, 22, 0.2); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.4); }
    .badge-medium { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.4); }
    .badge-low { background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.4); }
    .badge-fix { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.4); }
    .badge-manual { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.4); }
    .badge-tag {
      background: var(--vscode-badge-background, rgba(255, 255, 255, 0.08));
      color: var(--vscode-badge-foreground, inherit);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .title {
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: var(--vscode-foreground);
    }
    .loc-bar {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--vscode-descriptionForeground);
      margin: 10px 0 4px 0;
    }
    .desc-box {
      background: var(--vscode-editor-inactiveSelectionBackground, rgba(255, 255, 255, 0.03));
      border: 1px solid var(--vscode-panel-border, rgba(255, 255, 255, 0.08));
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 8px;
      font-size: 11.5px;
    }
    .code-box {
      background: var(--vscode-textCodeBlock-background, #111827);
      border: 1px solid var(--vscode-panel-border, rgba(255, 255, 255, 0.1));
      border-radius: 4px;
      padding: 6px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      overflow-x: auto;
      margin-bottom: 8px;
      white-space: pre;
    }
    .code-line {
      display: flex;
    }
    .line-num {
      width: 28px;
      user-select: none;
      color: var(--vscode-editorLineNumber-foreground, #6b7280);
      text-align: right;
      padding-right: 8px;
      flex-shrink: 0;
    }
    .line-text {
      flex-grow: 1;
    }
    .target-line {
      background: rgba(239, 68, 68, 0.12);
    }
    .vuln-mark {
      background: rgba(239, 68, 68, 0.35);
      border-bottom: 2px solid #ef4444;
      border-radius: 2px;
    }
    .fix-box {
      border-left: 3px solid #22c55e;
      background: rgba(34, 197, 94, 0.08);
      color: #86efac;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--vscode-panel-border, rgba(255, 255, 255, 0.08));
    }
    button {
      background: var(--vscode-button-background, #2563eb);
      color: var(--vscode-button-foreground, #ffffff);
      border: none;
      border-radius: 3px;
      padding: 5px 9px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    button:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground, #1d4ed8);
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground, rgba(255, 255, 255, 0.08));
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
      border: 1px solid var(--vscode-panel-border, rgba(255, 255, 255, 0.12));
    }
    button.secondary:hover:not(:disabled) {
      background: var(--vscode-button-secondaryHoverBackground, rgba(255, 255, 255, 0.14));
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div id="content">
    <div class="empty-state">
      Select a finding from the Security & Triage Findings list above to inspect code evidence and remediation actions.
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const content = document.getElementById('content');

    function escapeHtml(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'updateFinding') {
        const finding = msg.finding;
        const excerpt = msg.excerpt;

        if (!finding) {
          content.innerHTML = '<div class="empty-state">Select a finding from the Security & Triage Findings list above to inspect code evidence and remediation actions.</div>';
          return;
        }

        const sevClass = 'badge-' + (finding.severity || 'medium');
        let badgesHtml = '<span class="badge ' + sevClass + '">' + escapeHtml(finding.severity) + '</span>';
        if (finding.hasFix) {
          badgesHtml += '<span class="badge badge-fix">Fix Available</span>';
        } else {
          badgesHtml += '<span class="badge badge-manual">Manual Fix Required</span>';
        }
        if (finding.category) {
          badgesHtml += '<span class="badge badge-tag">' + escapeHtml(finding.category.toUpperCase().replace('_', ' ')) + '</span>';
        }
        if (finding.sourceType) {
          badgesHtml += '<span class="badge badge-tag">' + escapeHtml(finding.sourceType.toUpperCase()) + '</span>';
        }
        if (finding.cwe) {
          badgesHtml += '<span class="badge badge-tag">' + escapeHtml(finding.cwe) + '</span>';
        }
        if (finding.owasp) {
          badgesHtml += '<span class="badge badge-tag">' + escapeHtml(finding.owasp) + '</span>';
        }
        if (finding.confidence) {
          const confText = typeof finding.confidence === 'number' ? Math.round(finding.confidence * 100) + '%' : finding.confidence;
          badgesHtml += '<span class="badge badge-tag">CONFIDENCE: ' + escapeHtml(String(confText).toUpperCase()) + '</span>';
        }

        let excerptHtml = '';
        if (excerpt && excerpt.lines && excerpt.lines.length > 0) {
          excerptHtml = '<div class="section-title">Source Code Context</div><div class="code-box">';
          excerpt.lines.forEach((l) => {
            const lineClass = l.isTarget ? 'code-line target-line' : 'code-line';
            let formattedText = escapeHtml(l.text);

            if (l.isTarget && excerpt.highlightRange) {
              const start = Math.max(0, excerpt.highlightRange.start);
              const end = Math.min(l.text.length, excerpt.highlightRange.end);
              if (start < end && end <= l.text.length) {
                const before = escapeHtml(l.text.slice(0, start));
                const marked = '<mark class="vuln-mark">' + escapeHtml(l.text.slice(start, end)) + '</mark>';
                const after = escapeHtml(l.text.slice(end));
                formattedText = before + marked + after;
              }
            }

            excerptHtml += '<div class="' + lineClass + '"><span class="line-num">' + l.number + '</span><span class="line-text">' + formattedText + '</span></div>';
          });
          excerptHtml += '</div>';
        } else {
          excerptHtml = '<div class="section-title">Code Evidence</div><div class="code-box">' + escapeHtml(finding.evidence) + '</div>';
        }

        const fixSnippet = finding.replacementCode || finding.suggestedFix || '';
        const fixDisabled = !finding.hasFix ? 'disabled' : '';
        const fixButtonText = finding.hasFix ? 'Fix Finding' : 'Manual Fix Required';

        const html = [
          '<div class="header">',
          '  <div class="badge-row">' + badgesHtml + '</div>',
          '  <div class="title">' + escapeHtml(finding.title) + '</div>',
          '  <div class="loc-bar"><code>' + escapeHtml(finding.file) + '</code> : line <strong>' + finding.line + '</strong> (' + escapeHtml(finding.ruleId) + ')</div>',
          '</div>',
          '<div class="section-title">Problem & Security Impact</div>',
          '<div class="desc-box">',
          '  <div>' + escapeHtml(finding.problem) + '</div>',
          '  <div style="margin-top: 6px; color: var(--vscode-descriptionForeground); font-size: 11px;">' + escapeHtml(finding.whyItMatters) + '</div>',
          '</div>',
          excerptHtml,
          '<div class="section-title">Recommended Remediation</div>',
          '<div class="code-box fix-box">' + escapeHtml(fixSnippet) + '</div>',
          '<div class="toolbar">',
          '  <button data-action="fix" ' + fixDisabled + ' title="' + (finding.hasFix ? 'Apply verified patch directly to file' : 'Automatic fix unavailable. Review manual remediation guidance.') + '">' + fixButtonText + '</button>',
          '  <button class="secondary" data-action="previewFix" ' + fixDisabled + ' title="Inspect side-by-side diff">Preview Fix</button>',
          '  <button class="secondary" data-action="explain" title="View full rule explanation">Explain</button>',
          '  <button class="secondary" data-action="copyPatch" title="Copy remediation snippet to clipboard">Copy Patch</button>',
          '  <button class="secondary" data-action="openSource" title="Jump to source code">Open Source</button>',
          '  <button class="secondary" data-action="generateTest" title="Generate automated regression test">Generate Test</button>',
          '  <button class="secondary" data-action="suppress" title="Insert // buggers-ignore comment">Suppress</button>',
          '  <button class="secondary" data-action="dismiss" title="Dismiss from list until next scan">Dismiss</button>',
          '</div>'
        ].join('\\n');

        content.innerHTML = html;
      }
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn || btn.disabled) return;
      const action = btn.getAttribute('data-action');
      if (action) {
        vscode.postMessage({ action });
      }
    });
  </script>
</body>
</html>`;
  }
}
