import * as vscode from "vscode";

/**
 * Centralized Virtual Text Document Provider for Buggers Remedy & Fix Previews.
 * Singleton ensures only one content provider is registered for the 'buggers-preview' scheme.
 */
export class BuggersPreviewProvider implements vscode.TextDocumentContentProvider {
  public static readonly scheme = "buggers-preview";
  private static instance: BuggersPreviewProvider | null = null;

  private previews = new Map<string, string>();
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

  public static getInstance(): BuggersPreviewProvider {
    if (!BuggersPreviewProvider.instance) {
      BuggersPreviewProvider.instance = new BuggersPreviewProvider();
    }
    return BuggersPreviewProvider.instance;
  }

  public setPreview(uri: vscode.Uri, content: string): void {
    this.previews.set(uri.toString(), content);
    this._onDidChange.fire(uri);
  }

  public getPreview(uri: vscode.Uri): string | undefined {
    return this.previews.get(uri.toString());
  }

  public clearPreview(uri: vscode.Uri): void {
    this.previews.delete(uri.toString());
    this._onDidChange.fire(uri);
  }

  public clearAll(): void {
    this.previews.clear();
  }

  public provideTextDocumentContent(uri: vscode.Uri): string {
    return this.previews.get(uri.toString()) || "";
  }
}
