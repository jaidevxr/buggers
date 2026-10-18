import * as vscode from "vscode";
import * as path from "path";
import { BuggersFinding, ScanOverview, ScanStatus } from "./types";
import { scanDocument, scanWorkspace, WorkspaceScanResult } from "./scanner";
import { extractSyntaxErrors, getExternalDiagnostics, mergeFindings } from "./diagnosticsManager";

export class ScannerManager implements vscode.Disposable {
  private findingsByFile = new Map<string, BuggersFinding[]>();
  private status: ScanStatus = "initializing";
  private statusMessage = "Initializing scanner...";
  private scannedFilesCount = 0;
  private skippedFilesCount = 0;
  private totalFilesDiscovered = 0;
  private lastScanDurationMs = 0;
  private lastScanTimestamp = "";
  private errorMessage = "";
  private dismissedIds = new Set<string>();

  private workspaceTokenSource: vscode.CancellationTokenSource | null = null;
  private fileDebounceTimers = new Map<string, NodeJS.Timeout>();
  private fileTokenSources = new Map<string, vscode.CancellationTokenSource>();

  private _onDidChangeFindings = new vscode.EventEmitter<BuggersFinding[]>();
  readonly onDidChangeFindings = this._onDidChangeFindings.event;

  private _onDidChangeStatus = new vscode.EventEmitter<ScanOverview>();
  readonly onDidChangeStatus = this._onDidChangeStatus.event;

  private disposables: vscode.Disposable[] = [];

  constructor(
    private diagnosticCollection: vscode.DiagnosticCollection,
    private onStatusBarUpdate: (findings: BuggersFinding[], overview: ScanOverview) => void,
  ) {
    this.registerListeners();
  }

  public isSupportedScheme(scheme: string): boolean {
    return scheme === "file" || scheme === "untitled" || scheme === "vscode-remote" || scheme === "vscode-vfs";
  }

  private registerListeners() {
    // 1. Active Text Editor Change: scan immediately when user focuses a file
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && editor.document) {
          this.scanSingleDocument(editor.document, false);
        }
      }),
    );

    // 2. Visible Editors Change: scan all visible files
    if (vscode.window.onDidChangeVisibleTextEditors) {
      this.disposables.push(
        vscode.window.onDidChangeVisibleTextEditors((editors) => {
          for (const editor of editors) {
            if (editor && editor.document) {
              this.scanSingleDocument(editor.document, false);
            }
          }
        }),
      );
    }

    // 3. Document Text Change: debounced live scanning as user types (supports unsaved buffers and remote/Codespaces)
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const doc = event.document;
        if (!this.isSupportedScheme(doc.uri.scheme)) return;

        const filePath = doc.fileName;
        const existingTimer = this.fileDebounceTimers.get(filePath);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
          this.fileDebounceTimers.delete(filePath);
          this.scanSingleDocument(doc, false);
        }, 300);

        this.fileDebounceTimers.set(filePath, timer);
      }),
    );

    // 4. Document Opened: scan as soon as document is opened
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (this.isSupportedScheme(doc.uri.scheme)) {
          this.scanSingleDocument(doc, false);
        }
      }),
    );

    // 5. Document Saved: scan immediately
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (this.isSupportedScheme(doc.uri.scheme)) {
          this.scanSingleDocument(doc, true);
        }
      }),
    );

    // 6. File Deletions: clean up store & diagnostics
    this.disposables.push(
      vscode.workspace.onDidDeleteFiles((e) => {
        for (const fileUri of e.files) {
          this.removeFileFindings(fileUri.fsPath);
          this.diagnosticCollection.delete(fileUri);
        }
        this.emitUpdates();
      }),
    );

    // 7. File Renames: update findings file paths
    this.disposables.push(
      vscode.workspace.onDidRenameFiles((e) => {
        for (const file of e.files) {
          const oldPath = file.oldUri.fsPath;
          const newPath = file.newUri.fsPath;
          const oldFindings = this.findingsByFile.get(oldPath);
          if (oldFindings) {
            this.findingsByFile.delete(oldPath);
            this.diagnosticCollection.delete(file.oldUri);
            const remapped = oldFindings.map((f) => ({ ...f, file: newPath }));
            this.findingsByFile.set(newPath, remapped);
            this.applyFileDiagnostics(file.newUri, remapped);
          }
        }
        this.emitUpdates();
      }),
    );

    // 8. Workspace Folders Changed: trigger re-discovery
    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        this.startWorkspaceScan(false);
      }),
    );

    // 9. External Language Server & Compiler Diagnostics Change: live synchronization
    if (vscode.languages && vscode.languages.onDidChangeDiagnostics) {
      this.disposables.push(
        vscode.languages.onDidChangeDiagnostics((e) => {
          for (const uri of e.uris) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.uri.toString() === uri.toString()) {
              this.syncExternalDiagnostics(activeEditor.document);
            }
          }
        }),
      );
    }
  }

  /**
   * Sync active language server / compiler diagnostics without re-running full regex scanner
   */
  public syncExternalDiagnostics(document: vscode.TextDocument) {
    const filePath = document.fileName;
    const current = this.findingsByFile.get(filePath) || [];
    // Keep existing Buggers rule findings
    const internal = current.filter((f) => f.sourceType === "buggers_rule" || !f.sourceType);
    const syntaxFindings = extractSyntaxErrors(document);
    const external = getExternalDiagnostics(document);
    const merged = mergeFindings(internal, syntaxFindings, external);
    this.findingsByFile.set(filePath, merged);
    this.emitUpdatesDebounced();
  }

  /**
   * Scan an individual document, update diagnostics and store
   */
  public scanSingleDocument(document: vscode.TextDocument, forceEmit = true): BuggersFinding[] {
    const filePath = document.fileName;

    // Cancel any previous in-flight scan for this file
    const prevCts = this.fileTokenSources.get(filePath);
    if (prevCts) {
      prevCts.cancel();
      prevCts.dispose();
      this.fileTokenSources.delete(filePath);
    }

    const cts = new vscode.CancellationTokenSource();
    this.fileTokenSources.set(filePath, cts);

    try {
      const securityAndLogicFindings = scanDocument(document);
      if (cts.token.isCancellationRequested) {
        return [];
      }

      const syntaxFindings = extractSyntaxErrors(document);
      const externalDiagnostics = getExternalDiagnostics(document);
      const findings = mergeFindings(securityAndLogicFindings, syntaxFindings, externalDiagnostics);

      this.findingsByFile.set(filePath, findings);
      this.applyFileDiagnostics(document.uri, findings);

      if (this.status === "initializing" || this.status === "idle") {
        this.status = "scan_complete";
        this.statusMessage = "Scan complete";
      }

      if (forceEmit) {
        this.emitUpdates();
      } else {
        this.emitUpdatesDebounced();
      }

      return findings;
    } catch (err: any) {
      this.errorMessage = err?.message || "File scan error";
      return [];
    } finally {
      this.fileTokenSources.delete(filePath);
      cts.dispose();
    }
  }

  /**
   * Kick off full workspace scan (background or notification progress)
   */
  public async startWorkspaceScan(showNotification = false): Promise<WorkspaceScanResult> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      this.status = "no_workspace";
      this.statusMessage = "No workspace folder open";
      this.emitUpdates();
      return {
        results: new Map(),
        totalFiles: 0,
        scannedCount: 0,
        skippedCount: 0,
        durationMs: 0,
      };
    }

    // Cancel running workspace scan if one is active
    if (this.workspaceTokenSource) {
      this.workspaceTokenSource.cancel();
      this.workspaceTokenSource.dispose();
      this.workspaceTokenSource = null;
    }

    // Clear dismissed findings on rescan
    this.dismissedIds.clear();

    const cts = new vscode.CancellationTokenSource();
    this.workspaceTokenSource = cts;
    this.status = "scanning_workspace";
    this.statusMessage = "Scanning workspace files...";
    this.emitUpdates();

    const runScan = async (progressCallback?: (msg: string, inc: number) => void) => {
      try {
        const scanResult = await scanWorkspace(
          (msg, inc) => {
            this.statusMessage = msg;
            if (progressCallback) progressCallback(msg, inc);
          },
          cts.token,
          (scannedPath, findings) => {
            // Stream results live as files are parsed
            this.findingsByFile.set(scannedPath, findings);
            this.applyFileDiagnostics(vscode.Uri.file(scannedPath), findings);
            this.emitUpdatesDebounced();
          },
        );

        if (cts.token.isCancellationRequested) {
          this.status = "scan_cancelled";
          this.statusMessage = "Scan cancelled by user";
          this.emitUpdates();
          return scanResult;
        }

        this.totalFilesDiscovered = scanResult.totalFiles;
        this.scannedFilesCount = scanResult.scannedCount;
        this.skippedFilesCount = scanResult.skippedCount;
        this.lastScanDurationMs = scanResult.durationMs;
        this.lastScanTimestamp = new Date().toLocaleTimeString();

        if (scanResult.totalFiles === 0) {
          this.status = "no_supported_files";
          this.statusMessage = "No supported source files found";
        } else {
          this.status = "scan_complete";
          this.statusMessage = "Scan complete";
        }

        this.emitUpdates();
        return scanResult;
      } catch (err: any) {
        this.status = "scan_failed";
        this.errorMessage = err?.message || "Scan failed";
        this.statusMessage = `Scan failed: ${this.errorMessage}`;
        this.emitUpdates();
        return {
          results: new Map(),
          totalFiles: 0,
          scannedCount: 0,
          skippedCount: 0,
          durationMs: 0,
        };
      }
    };

    if (showNotification) {
      return await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Buggers: Scanning workspace for security flaws & defects...",
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => cts.cancel());
          return await runScan((msg, inc) => progress.report({ message: msg, increment: inc }));
        },
      );
    } else {
      return await runScan();
    }
  }

  public cancelWorkspaceScan() {
    if (this.workspaceTokenSource) {
      this.workspaceTokenSource.cancel();
      this.workspaceTokenSource.dispose();
      this.workspaceTokenSource = null;
      this.status = "scan_cancelled";
      this.statusMessage = "Workspace scan cancelled";
      this.emitUpdates();
    }
  }

  public dismissFinding(findingId: string) {
    this.dismissedIds.add(findingId);
    this.reapplyAllDiagnostics();
    this.emitUpdates();
  }

  public restoreDismissed() {
    this.dismissedIds.clear();
    this.reapplyAllDiagnostics();
    this.emitUpdates();
  }

  public removeFileFindings(filePath: string) {
    this.findingsByFile.delete(filePath);
  }

  public clear() {
    this.findingsByFile.clear();
    this.dismissedIds.clear();
    this.diagnosticCollection.clear();
    this.status = "idle";
    this.statusMessage = "Findings cleared (click Rescan to restore)";
    this.emitUpdates();
  }

  public getAllFindings(): BuggersFinding[] {
    const all: BuggersFinding[] = [];
    for (const findings of this.findingsByFile.values()) {
      for (const f of findings) {
        if (!this.dismissedIds.has(f.id)) {
          all.push(f);
        }
      }
    }
    return all;
  }

  public getAllFindingsRaw(): BuggersFinding[] {
    const all: BuggersFinding[] = [];
    for (const findings of this.findingsByFile.values()) {
      all.push(...findings);
    }
    return all;
  }

  public getFindingsForFile(filePath: string): BuggersFinding[] {
    const list = this.findingsByFile.get(filePath) || [];
    return list.filter((f) => !this.dismissedIds.has(f.id));
  }

  public getOverview(): ScanOverview {
    const all = this.getAllFindings();
    const uniqueFiles = new Set(all.map((f) => f.file));

    return {
      totalFiles: Math.max(uniqueFiles.size, this.scannedFilesCount),
      totalFindings: all.length,
      criticalCount: all.filter((f) => f.severity === "critical").length,
      highCount: all.filter((f) => f.severity === "high").length,
      mediumCount: all.filter((f) => f.severity === "medium").length,
      lowCount: all.filter((f) => f.severity === "low").length,
      scanTimeMs: this.lastScanDurationMs,
      timestamp: this.lastScanTimestamp || new Date().toLocaleTimeString(),
      status: this.status,
      statusMessage: this.statusMessage,
      scannedFiles: this.scannedFilesCount,
      skippedFiles: this.skippedFilesCount,
      errorMessage: this.errorMessage,
    };
  }

  public getStatus(): ScanStatus {
    return this.status;
  }

  public setStatus(status: ScanStatus, message?: string) {
    this.status = status;
    if (message) this.statusMessage = message;
    this.emitUpdates();
  }

  private reapplyAllDiagnostics() {
    this.diagnosticCollection.clear();
    for (const [filePath, findings] of this.findingsByFile.entries()) {
      this.applyFileDiagnostics(vscode.Uri.file(filePath), findings);
    }
  }

  private applyFileDiagnostics(uri: vscode.Uri, findings: BuggersFinding[]) {
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
      if (this.dismissedIds.has(f.id)) continue;
      if ((sevRanks[f.severity] ?? 1) < minRank) continue;

      // Do not duplicate external compiler/LSP/linter diagnostics that are already published in the Problems panel
      if (f.sourceType === "lsp" || f.sourceType === "compiler" || f.sourceType === "linter") {
        continue;
      }

      const lineIdx = Math.max(0, f.line - 1);
      const colIdx = f.column ?? 0;
      const length = f.length ?? 10;

      const range = new vscode.Range(
        new vscode.Position(lineIdx, colIdx),
        new vscode.Position(lineIdx, colIdx + length),
      );

      const sevLevel =
        f.severity === "critical" || f.severity === "high"
          ? vscode.DiagnosticSeverity.Error
          : f.severity === "medium"
            ? vscode.DiagnosticSeverity.Warning
            : vscode.DiagnosticSeverity.Information;

      const diag = new vscode.Diagnostic(
        range,
        `[Buggers ${f.ruleId}] ${f.title}: ${f.problem}`,
        sevLevel,
      );

      diag.source = "Buggers";
      diag.code = f.ruleId;
      diagnostics.push(diag);
    }

    this.diagnosticCollection.set(uri, diagnostics);
  }

  private emitDebounceTimer: NodeJS.Timeout | null = null;
  private emitUpdatesDebounced() {
    if (this.emitDebounceTimer) return;
    this.emitDebounceTimer = setTimeout(() => {
      this.emitDebounceTimer = null;
      this.emitUpdates();
    }, 100);
  }

  private emitUpdates() {
    const all = this.getAllFindings();
    const overview = this.getOverview();
    this._onDidChangeFindings.fire(all);
    this._onDidChangeStatus.fire(overview);
    this.onStatusBarUpdate(all, overview);
  }

  public dispose() {
    if (this.workspaceTokenSource) {
      this.workspaceTokenSource.cancel();
      this.workspaceTokenSource.dispose();
    }
    for (const timer of this.fileDebounceTimers.values()) {
      clearTimeout(timer);
    }
    for (const cts of this.fileTokenSources.values()) {
      cts.cancel();
      cts.dispose();
    }
    this.disposables.forEach((d) => d.dispose());
  }
}
