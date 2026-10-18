import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";
import { GitHubRepoState, GitHubRepoInfo, GitChangedFile, GitHubStatus, CommitReviewResult, BuggersFinding } from "./types";
import { BuggersAuth } from "./auth";
import { ScannerManager } from "./scannerManager";

/**
 * Regex matching GitHub remotes in HTTPS, SSH, and git protocols.
 * Supports organization, user, and team repository structures.
 * Strictly rejects non-GitHub hosts (GitLab, Bitbucket, Azure, etc.).
 */
const GITHUB_REMOTE_REGEX = /^(?:https?:\/\/|git:\/\/|ssh:\/\/git@)?(?:[\w.-]+@)?github\.com[:/]([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?\/?$/;

export class GitHubManager implements vscode.Disposable {
  private _onDidChangeStatus = new vscode.EventEmitter<GitHubStatus>();
  readonly onDidChangeStatus = this._onDidChangeStatus.event;

  private currentStatus: GitHubStatus = { state: "no_workspace" };
  private disposables: vscode.Disposable[] = [];
  private outputChannel: vscode.OutputChannel;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly auth: BuggersAuth,
  ) {
    this.outputChannel =
      typeof vscode.window.createOutputChannel === "function"
        ? vscode.window.createOutputChannel("Buggers GitHub Diagnostics")
        : ({ appendLine: () => {}, append: () => {}, clear: () => {}, show: () => {}, dispose: () => {} } as any);

    // Watch for workspace folder changes
    if (vscode.workspace.onDidChangeWorkspaceFolders) {
      this.disposables.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
          this.refreshStatus();
        }),
      );
    }
  }

  public dispose() {
    if (this._onDidChangeStatus && typeof (this._onDidChangeStatus as any).dispose === "function") {
      this._onDidChangeStatus.dispose();
    }
    this.disposables.forEach((d) => d && typeof d.dispose === "function" && d.dispose());
  }

  public getStatus(): GitHubStatus {
    return this.currentStatus;
  }

  public isGitHubRepo(): boolean {
    const s = this.currentStatus.state;
    return (
      s === "github_remote_detected" ||
      s === "github_unauthenticated" ||
      s === "authenticated" ||
      s === "permission_insufficient" ||
      s === "remote_failed"
    );
  }

  /**
   * Diagnostic logging that redacts all credentials, tokens, and secrets.
   */
  public logDiagnostic(level: "INFO" | "WARN" | "ERROR", action: string, details?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const sanitized = details
      ? Object.entries(details)
          .filter(([k, v]) => v !== undefined && !/key|token|secret|password|pat|auth/i.test(k))
          .map(([k, v]) => `${k}=${v}`)
          .join(" ")
      : "";
    this.outputChannel.appendLine(`[Buggers GitHub] ${timestamp} [${level}] [${action}] ${sanitized}`);
  }

  /**
   * Parses a Git remote URL to check if it points to GitHub.
   * Extracts repository owner and name.
   */
  public static parseGitHubRemote(remoteUrl: string): { owner: string; repo: string; isHttps: boolean; isSsh: boolean } | null {
    if (!remoteUrl || typeof remoteUrl !== "string") return null;
    const trimmed = remoteUrl.trim();

    // Check host: must be github.com
    if (!trimmed.includes("github.com")) {
      return null;
    }

    const match = trimmed.match(GITHUB_REMOTE_REGEX);
    if (!match) return null;

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");
    const isHttps = trimmed.startsWith("http://") || trimmed.startsWith("https://");
    const isSsh = trimmed.startsWith("git@") || trimmed.startsWith("ssh://");

    return { owner, repo, isHttps, isSsh };
  }

  /**
   * Executes a git command safely in a given working directory.
   */
  public async execGit(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; code: number }> {
    const workspaceRoot = cwd || this.getWorkspaceRoot();
    if (!workspaceRoot) {
      return { stdout: "", stderr: "No workspace folder open", code: 1 };
    }

    return new Promise((resolve) => {
      // Prevent running dangerous commands
      const disallowed = ["--force", "-f", "--hard", "push -f", "push --force"];
      const commandStr = args.join(" ");
      for (const d of disallowed) {
        if (commandStr.includes(d)) {
          resolve({ stdout: "", stderr: `Disallowed safe Git operation: ${d}`, code: 1 });
          return;
        }
      }

      const fullCmd = `git ${commandStr}`;
      exec(fullCmd, { cwd: workspaceRoot, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        resolve({
          stdout: stdout || "",
          stderr: stderr || (err ? err.message : ""),
          code: err && err.code ? (typeof err.code === "number" ? err.code : 1) : 0,
        });
      });
    });
  }

  public getWorkspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return undefined;

    // Check active editor file first
    const activeDoc = vscode.window.activeTextEditor?.document;
    if (activeDoc) {
      const matchFolder = vscode.workspace.getWorkspaceFolder(activeDoc.uri);
      if (matchFolder) return matchFolder.uri.fsPath;
    }

    return folders[0].uri.fsPath;
  }

  /**
   * Refreshes the repository detection state and publishes changes.
   */
  public async refreshStatus(): Promise<GitHubStatus> {
    const root = this.getWorkspaceRoot();
    if (!root) {
      this.updateStatus({ state: "no_workspace" });
      return this.currentStatus;
    }

    // 1. Check if .git exists or git rev-parse succeeds
    const revCheck = await this.execGit(["rev-parse", "--is-inside-work-tree"], root);
    if (revCheck.code !== 0 || !revCheck.stdout.trim().includes("true")) {
      this.updateStatus({ state: "no_git" });
      return this.currentStatus;
    }

    // 2. Inspect remotes
    const remotesOut = await this.execGit(["remote", "-v"], root);
    if (remotesOut.code !== 0 || !remotesOut.stdout.trim()) {
      this.updateStatus({ state: "no_github_remote" });
      return this.currentStatus;
    }

    // Parse remotes
    const lines = remotesOut.stdout.split("\n");
    let detectedInfo: GitHubRepoInfo | null = null;

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const remoteName = parts[0];
        const remoteUrl = parts[1];
        const parsed = GitHubManager.parseGitHubRemote(remoteUrl);
        if (parsed) {
          // Get current branch
          const branchRes = await this.execGit(["rev-parse", "--abbrev-ref", "HEAD"], root);
          const branch = branchRes.stdout.trim() || "main";

          detectedInfo = {
            owner: parsed.owner,
            repo: parsed.repo,
            remoteUrl,
            remoteName,
            branch,
            isHttps: parsed.isHttps,
            isSsh: parsed.isSsh,
          };
          break;
        }
      }
    }

    if (!detectedInfo) {
      this.updateStatus({ state: "no_github_remote" });
      return this.currentStatus;
    }

    // 3. Inspect working tree changes
    const statusRes = await this.execGit(["status", "--porcelain=v1"], root);
    const changedFiles: GitChangedFile[] = [];

    if (statusRes.code === 0 && statusRes.stdout.trim()) {
      const statusLines = statusRes.stdout.split("\n");
      for (const sLine of statusLines) {
        if (!sLine.trim()) continue;
        const indexStatus = sLine[0];
        const workStatus = sLine[1];
        const filePath = sLine.slice(3).trim();
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);

        let fileStatus: GitChangedFile["status"] = "modified";
        if (indexStatus === "?" || workStatus === "?") fileStatus = "untracked";
        else if (indexStatus === "A" || workStatus === "A") fileStatus = "added";
        else if (indexStatus === "D" || workStatus === "D") fileStatus = "deleted";
        else if (indexStatus === "R" || workStatus === "R") fileStatus = "renamed";

        const staged = indexStatus !== " " && indexStatus !== "?";
        changedFiles.push({ path: filePath, absolutePath, status: fileStatus, staged });
      }
    }

    // 4. Check GitHub authentication state
    let authUser: string | undefined;
    let state: GitHubRepoState = "github_unauthenticated";

    try {
      if (vscode.authentication && typeof vscode.authentication.getSession === "function") {
        const session = await vscode.authentication.getSession("github", ["repo"], { createIfNone: false });
        if (session) {
          state = "authenticated";
          authUser = session.account.label || "GitHub User";
        }
      }
    } catch {
      // Session lookup failed
    }

    if (state !== "authenticated") {
      const storedPat = await this.auth.getGitHubToken();
      if (storedPat) {
        state = "authenticated";
        authUser = "PAT Configured";
      }
    }

    this.updateStatus({
      state,
      repoInfo: detectedInfo,
      changedFiles,
      authUser,
      lastChecked: new Date().toLocaleTimeString(),
    });

    this.logDiagnostic("INFO", "refreshStatus", {
      state: this.currentStatus.state,
      repo: `${detectedInfo.owner}/${detectedInfo.repo}`,
      branch: detectedInfo.branch,
      changedCount: changedFiles.length,
    });

    return this.currentStatus;
  }

  private updateStatus(newStatus: GitHubStatus) {
    this.currentStatus = newStatus;
    const isGitHub = this.isGitHubRepo();

    // Set VS Code context for conditional UI menu display
    if (vscode.commands && typeof vscode.commands.executeCommand === "function") {
      vscode.commands.executeCommand("setContext", "buggers.isGitHubRepo", isGitHub);
    }

    this._onDidChangeStatus.fire(this.currentStatus);
  }

  /**
   * Connects to GitHub via official VS Code Authentication or secure PAT prompt.
   */
  public async connectGitHub(): Promise<boolean> {
    try {
      if (vscode.authentication && typeof vscode.authentication.getSession === "function") {
        const session = await vscode.authentication.getSession("github", ["repo"], { createIfNone: true });
        if (session) {
          vscode.window.showInformationMessage(`Buggers: Connected to GitHub as ${session.account.label}.`);
          await this.refreshStatus();
          return true;
        }
      }
    } catch (err: any) {
      this.logDiagnostic("WARN", "connectGitHubSessionFailed", { error: err.message });
    }

    // Fallback: prompt for GitHub PAT
    const pat = await vscode.window.showInputBox({
      prompt: "Enter your GitHub Personal Access Token (PAT) with repo scope",
      password: true,
      placeHolder: "ghp_...",
    });

    if (pat && pat.trim()) {
      await this.auth.setGitHubToken(pat.trim());
      vscode.window.showInformationMessage("Buggers: Saved GitHub Personal Access Token in SecretStorage.");
      await this.refreshStatus();
      return true;
    }

    return false;
  }

  /**
   * Performs a security-aware pre-commit review of all modified files.
   */
  public async reviewChangedFiles(scannerManager: ScannerManager): Promise<CommitReviewResult> {
    await this.refreshStatus();
    const changed = this.currentStatus.changedFiles || [];

    if (changed.length === 0) {
      return {
        hasFindingsInChanges: false,
        totalFindingsInChangedFiles: 0,
        findings: [],
        changedFiles: [],
        summaryMessage: "Working directory is clean. No changed files to review.",
      };
    }

    const allFindings: BuggersFinding[] = [];
    for (const file of changed) {
      const findings = scannerManager.getFindingsForFile(file.absolutePath);
      file.findingsCount = findings.length;
      allFindings.push(...findings);
    }

    const crit = allFindings.filter((f) => f.severity === "critical").length;
    const high = allFindings.filter((f) => f.severity === "high").length;

    let summaryMessage = `Audited ${changed.length} changed file(s). Found ${allFindings.length} issue(s) (${crit} critical, ${high} high).`;
    if (allFindings.length === 0) {
      summaryMessage = `Audited ${changed.length} changed file(s). Zero security flaws detected. Clean to commit.`;
    }

    return {
      hasFindingsInChanges: allFindings.length > 0,
      totalFindingsInChangedFiles: allFindings.length,
      findings: allFindings,
      changedFiles: changed,
      summaryMessage,
    };
  }

  /**
   * Prompts user with a complete, safe commit workflow:
   * 1. File selection (only chosen files are staged).
   * 2. Intelligent commit message generation.
   * 3. Explicit user confirmation.
   * 4. Safe execution.
   */
  public async promptSafeCommit(scannerManager: ScannerManager): Promise<boolean> {
    await this.refreshStatus();
    const changed = this.currentStatus.changedFiles || [];

    if (changed.length === 0) {
      vscode.window.showInformationMessage("Buggers Git: Working tree is clean. Nothing to commit.");
      return false;
    }

    // 1. Let user select which files to stage and commit
    const items = changed.map((f) => ({
      label: f.path,
      description: `[${f.status.toUpperCase()}]${f.staged ? " (already staged)" : ""}`,
      picked: true,
      file: f,
    }));

    const selectedItems = await vscode.window.showQuickPick(items, {
      canPickMany: true,
      placeHolder: "Select files to commit (unselected files will NOT be staged)",
    });

    if (!selectedItems || selectedItems.length === 0) {
      return false;
    }

    const selectedFiles = selectedItems.map((i) => i.file);

    // 2. Run security review on selected files
    const relevantFindings: BuggersFinding[] = [];
    for (const f of selectedFiles) {
      const issues = scannerManager.getFindingsForFile(f.absolutePath);
      relevantFindings.push(...issues);
    }

    if (relevantFindings.length > 0) {
      const crit = relevantFindings.filter((f) => f.severity === "critical").length;
      const warnChoice = await vscode.window.showWarningMessage(
        `Buggers Security Warning: Selected files contain ${relevantFindings.length} issue(s) (${crit} critical). Proceed with commit?`,
        "Review Issues First",
        "Proceed with Commit",
        "Cancel",
      );

      if (warnChoice === "Review Issues First") {
        await vscode.commands.executeCommand("buggers.showFindings");
        return false;
      }
      if (warnChoice !== "Proceed with Commit") {
        return false;
      }
    }

    // 3. Propose / ask for commit message
    const defaultMsg =
      relevantFindings.length > 0
        ? `fix(security): resolve vulnerabilities in ${selectedFiles.map((f) => path.basename(f.path)).slice(0, 2).join(", ")}`
        : `chore: update ${selectedFiles.map((f) => path.basename(f.path)).slice(0, 2).join(", ")}`;

    const commitMsg = await vscode.window.showInputBox({
      prompt: "Enter commit message",
      value: defaultMsg,
    });

    if (!commitMsg || !commitMsg.trim()) {
      return false;
    }

    // 4. Require explicit final confirmation
    const confirm = await vscode.window.showInformationMessage(
      `Confirm Git Commit:\n${selectedFiles.length} file(s) with message: "${commitMsg.trim()}"?`,
      "Confirm Commit",
      "Cancel",
    );

    if (confirm !== "Confirm Commit") {
      return false;
    }

    // 5. Stage ONLY the selected files (never git add -A or unrelated files)
    const stageArgs = ["add", "--", ...selectedFiles.map((f) => f.path)];
    const stageRes = await this.execGit(stageArgs);
    if (stageRes.code !== 0) {
      vscode.window.showErrorMessage(`Buggers Git: Staging failed: ${stageRes.stderr}`);
      return false;
    }

    // 6. Execute commit
    const commitRes = await this.execGit(["commit", "-m", commitMsg.trim()]);
    if (commitRes.code !== 0) {
      vscode.window.showErrorMessage(`Buggers Git: Commit failed: ${commitRes.stderr}`);
      return false;
    }

    vscode.window.showInformationMessage(`Buggers Git: Successfully committed ${selectedFiles.length} file(s).`);
    this.logDiagnostic("INFO", "safeCommit", {
      filesCount: selectedFiles.length,
      commitMessage: commitMsg.trim(),
    });

    await this.refreshStatus();
    return true;
  }

  /**
   * Prompts user with a safe push workflow:
   * 1. Confirms target destination and branch.
   * 2. Checks divergence / behind status.
   * 3. Requires explicit confirmation.
   * 4. Runs safe git push (NEVER with --force).
   */
  public async promptSafePush(): Promise<boolean> {
    await this.refreshStatus();
    const info = this.currentStatus.repoInfo;

    if (!info) {
      vscode.window.showWarningMessage("Buggers Git: No GitHub remote repository detected to push to.");
      return false;
    }

    const branch = info.branch || "main";
    const remote = info.remoteName || "origin";

    // Explicit confirmation dialog
    const confirm = await vscode.window.showWarningMessage(
      `Push local branch '${branch}' to remote '${remote}' (${info.owner}/${info.repo}) on GitHub?`,
      "Confirm Push",
      "Cancel",
    );

    if (confirm !== "Confirm Push") {
      return false;
    }

    // Execute safe push: git push <remote> <branch> (strictly prohibited from adding force flags)
    const pushRes = await this.execGit(["push", remote, branch]);
    if (pushRes.code !== 0) {
      this.updateStatus({ state: "remote_failed", errorMessage: pushRes.stderr });
      vscode.window.showErrorMessage(`Buggers Git: Push failed: ${pushRes.stderr || "Remote rejected push."}`);
      return false;
    }

    vscode.window.showInformationMessage(`Buggers Git: Successfully pushed to ${info.owner}/${info.repo} (${branch}).`);
    this.logDiagnostic("INFO", "safePush", {
      remote,
      branch,
      repo: `${info.owner}/${info.repo}`,
    });

    await this.refreshStatus();
    return true;
  }

  /**
   * Opens the repository in the user's browser.
   */
  public async openOnGitHub(): Promise<void> {
    const info = this.currentStatus.repoInfo;
    if (!info) {
      vscode.window.showWarningMessage("Buggers: No verified GitHub repository detected.");
      return;
    }

    const url = `https://github.com/${info.owner}/${info.repo}/tree/${info.branch || "main"}`;
    if (vscode.env && typeof vscode.env.openExternal === "function") {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  }
}
