import * as vscode from "vscode";
import * as path from "path";
import { BuggersFinding, Severity, Category, GroupingMode, ScanOverview, ScanStatus, GitHubStatus, GitHubRepoState, getFindingUri } from "./types";

export type TreeNode =
  | StatusHeaderNode
  | SeveritySummaryNode
  | GitHubRepoNode
  | GitHubActionNode
  | CategoryGroupNode
  | SeverityGroupNode
  | FileGroupNode
  | FindingNode
  | FindingActionNode
  | InfoNode;

export class StatusHeaderNode extends vscode.TreeItem {
  constructor(public readonly overview: ScanOverview) {
    const status = overview.status || "idle";

    let label = "Workspace Status";
    let desc = `${overview.totalFindings} issue(s) detected`;
    let icon = new vscode.ThemeIcon("shield");

    if (status === "scanning_workspace" || status === "scanning_file") {
      label = "Scanning in Progress...";
      desc = overview.statusMessage || "Analyzing source files...";
      icon = new vscode.ThemeIcon("sync~spin");
    } else if (status === "scan_failed") {
      label = "Scan Failed";
      desc = overview.errorMessage || "Click to retry scan";
      icon = new vscode.ThemeIcon("error", new vscode.ThemeColor("errorForeground"));
    } else if (status === "scan_cancelled") {
      label = "Scan Cancelled";
      desc = "Workspace analysis cancelled by user";
      icon = new vscode.ThemeIcon("circle-slash");
    } else if (status === "no_workspace") {
      label = "No Open Workspace";
      desc = "Open a folder to begin continuous security scanning";
      icon = new vscode.ThemeIcon("folder");
    } else if (status === "no_supported_files") {
      label = "No Supported Files Found";
      desc = "Workspace contains no supported source files (.js, .ts, .py, etc.)";
      icon = new vscode.ThemeIcon("info");
    } else if (status === "scan_complete" && overview.totalFindings === 0) {
      label = "Verified Clean: Zero Flaws";
      desc = `Audited ${overview.scannedFiles ?? overview.totalFiles} file(s) in ${overview.scanTimeMs}ms`;
      icon = new vscode.ThemeIcon("pass", new vscode.ThemeColor("terminal.ansiGreen"));
    } else {
      label = `Scan Complete: ${overview.totalFindings} issue(s) detected`;
      desc = `Audited ${overview.scannedFiles ?? overview.totalFiles} file(s) in ${overview.scanTimeMs}ms`;
      if (overview.criticalCount > 0) {
        icon = new vscode.ThemeIcon("error", new vscode.ThemeColor("errorForeground"));
      } else if (overview.highCount > 0) {
        icon = new vscode.ThemeIcon("warning", new vscode.ThemeColor("problemsWarningIcon.foreground"));
      } else {
        icon = new vscode.ThemeIcon("shield");
      }
    }

    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = desc;
    this.iconPath = icon;

    this.tooltip = new vscode.MarkdownString(
      `### Buggers Security Status\n\n` +
      `- **Status:** \`${status.toUpperCase()}\`\n` +
      `- **Total Files Audited:** ${overview.scannedFiles ?? overview.totalFiles}\n` +
      `- **Files Skipped / Excluded:** ${overview.skippedFiles ?? 0}\n` +
      `- **Total Findings:** ${overview.totalFindings}\n` +
      `- **Critical Priority:** ${overview.criticalCount}\n` +
      `- **High Priority:** ${overview.highCount}\n` +
      `- **Medium Priority:** ${overview.mediumCount}\n` +
      `- **Low Priority:** ${overview.lowCount}\n` +
      `- **Scan Time:** ${overview.scanTimeMs}ms\n` +
      `- **Last Verified:** ${overview.timestamp}\n\n` +
      `*Click to refresh / rescan workspace.*`
    );

    this.command = {
      command: "buggers.refreshFindings",
      title: "Rescan Workspace",
    };
  }
}

export { StatusHeaderNode as OverviewNode };

export class SeveritySummaryNode extends vscode.TreeItem {
  constructor(public readonly overview: ScanOverview) {
    const label = `Critical (${overview.criticalCount}) | High (${overview.highCount}) | Medium (${overview.mediumCount}) | Low (${overview.lowCount})`;
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = `${overview.totalFindings} total`;
    this.iconPath = new vscode.ThemeIcon("dashboard");
    this.tooltip = new vscode.MarkdownString(
      `### Severity Breakdown\n\n` +
      `- **Critical:** ${overview.criticalCount}\n` +
      `- **High:** ${overview.highCount}\n` +
      `- **Medium:** ${overview.mediumCount}\n` +
      `- **Low:** ${overview.lowCount}\n\n` +
      `*Click to filter findings by severity.*`
    );
    this.command = {
      command: "buggers.filterFindings",
      title: "Filter by Severity",
    };
  }
}

export class GitHubRepoNode extends vscode.TreeItem {
  constructor(public readonly status: GitHubStatus) {
    const info = status.repoInfo;
    const repoLabel = info ? `${info.owner}/${info.repo}` : "GitHub Repository";
    const branchLabel = info?.branch ? `(${info.branch})` : "";
    const changedCount = status.changedFiles ? status.changedFiles.length : 0;

    let authDesc = "Authentication Needed";
    if (status.state === "authenticated") {
      authDesc = status.authUser ? `Authenticated (${status.authUser})` : "Authenticated";
    }

    const label = `GitHub: ${repoLabel} ${branchLabel}`.trim();
    super(label, vscode.TreeItemCollapsibleState.Expanded);

    this.description = `${changedCount} change(s) · ${authDesc}`;
    this.iconPath = new vscode.ThemeIcon("repo");
    this.contextValue = "githubRepoNode";

    this.tooltip = new vscode.MarkdownString(
      `### GitHub Integration\n\n` +
      `- **Repository:** [${info?.owner}/${info?.repo}](${info?.remoteUrl})\n` +
      `- **Remote:** \`${info?.remoteName || "origin"}\` (${info?.isHttps ? "HTTPS" : "SSH"})\n` +
      `- **Branch:** \`${info?.branch || "main"}\`\n` +
      `- **Authentication:** ${authDesc}\n` +
      `- **Changed Files:** ${changedCount}\n` +
      `- **Last Checked:** ${status.lastChecked || "Just now"}\n\n` +
      `*Click sub-actions to review changes, run pre-commit security audits, commit, or push.*`
    );
  }
}

export class GitHubActionNode extends vscode.TreeItem {
  constructor(
    label: string,
    description: string | undefined,
    icon: string,
    commandId?: string,
    args?: any[]
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
    if (commandId) {
      this.command = {
        command: commandId,
        title: label,
        arguments: args,
      };
    }
  }
}

export class InfoNode extends vscode.TreeItem {
  constructor(label: string, description?: string, icon: string = "info", commandId?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
    if (commandId) {
      this.command = { command: commandId, title: label };
    }
  }
}

export class CategoryGroupNode extends vscode.TreeItem {
  constructor(
    public readonly categoryId: Category,
    public readonly categoryName: string,
    public readonly findings: BuggersFinding[],
    iconName: string = "shield",
  ) {
    // Auto-expanded by default so all findings are immediately visible
    super(
      `${categoryName} (${findings.length})`,
      vscode.TreeItemCollapsibleState.Expanded,
    );
    this.contextValue = "categoryGroup";
    this.iconPath = new vscode.ThemeIcon(iconName);
    this.description = `${findings.length} issue(s)`;
  }
}

export class SeverityGroupNode extends vscode.TreeItem {
  constructor(
    public readonly severity: Severity,
    public readonly findings: BuggersFinding[],
  ) {
    // Auto-expanded by default so all findings are immediately visible without clicking
    super(
      `${severity.toUpperCase()} (${findings.length})`,
      vscode.TreeItemCollapsibleState.Expanded,
    );
    this.contextValue = "severityGroup";

    if (severity === "critical" || severity === "high") {
      this.iconPath = new vscode.ThemeIcon("error", new vscode.ThemeColor("errorForeground"));
    } else if (severity === "medium") {
      this.iconPath = new vscode.ThemeIcon("warning", new vscode.ThemeColor("problemsWarningIcon.foreground"));
    } else {
      this.iconPath = new vscode.ThemeIcon("info", new vscode.ThemeColor("problemsInfoIcon.foreground"));
    }
  }
}

export class FileGroupNode extends vscode.TreeItem {
  constructor(
    public readonly filePath: string,
    public readonly findings: BuggersFinding[],
  ) {
    // Auto-expanded by default
    super(
      path.basename(filePath),
      vscode.TreeItemCollapsibleState.Expanded,
    );
    this.description = `${findings.length} issue(s) · ${path.dirname(filePath)}`;
    this.iconPath = vscode.ThemeIcon.File;
  }
}

export class FindingNode extends vscode.TreeItem {
  constructor(public readonly finding: BuggersFinding, isFlatView = false) {
    const rawTitle = finding.title.replace(/^(Security Flaw:\s*|Exposed Secret:\s*|Potential Logic Bug:\s*|Logical Bug:\s*|\[(?:CRITICAL|HIGH|MEDIUM|LOW|SECURITY|SYNTAX|TYPE|SEMANTIC|LINT|QUALITY|SECRETS|LOGICAL_BUG)\]\s*)/i, "").trim();
    const label = `[${finding.severity.toUpperCase()}] ${rawTitle}`;

    super(label, vscode.TreeItemCollapsibleState.None);

    const hasFix = !!(finding.replacementCode && finding.replacementCode.trim().length > 0);
    const remediationStatus = hasFix ? "Fix available" : "Manual fix required";
    this.description = `${path.basename(finding.file)}:${finding.line} · ${remediationStatus}`;

    const cweInfo = finding.cwe ? ` | **CWE:** \`${finding.cwe}\`` : "";
    const owaspInfo = finding.owasp ? ` | **OWASP:** \`${finding.owasp}\`` : "";
    const categoryInfo = `**Category:** ${finding.category.toUpperCase().replace("_", " ")}`;
    const confVal = typeof finding.confidence === "number" ? `${Math.round(finding.confidence * 100)}%` : String(finding.confidence).toUpperCase();
    const confidenceInfo = `**Confidence:** ${confVal}`;
    const sourceInfo = finding.sourceType ? ` | **Source:** \`${finding.sourceType.toUpperCase()}\`` : "";

    this.tooltip = new vscode.MarkdownString(
      `### [${finding.severity.toUpperCase()}] ${rawTitle}\n\n` +
      `**Location:** \`${finding.file}\` (Line ${finding.line})\n\n` +
      `**Status:** **${remediationStatus}**\n\n` +
      `**Rule:** \`${finding.ruleId}\`${cweInfo}${owaspInfo}\n\n` +
      `${categoryInfo} | ${confidenceInfo}${sourceInfo}\n\n` +
      `#### Problem Description\n${finding.problem}\n\n` +
      `#### Why It Matters\n${finding.whyItMatters}\n\n` +
      `#### Code Evidence\n\`\`\`javascript\n${finding.evidence}\n\`\`\`\n\n` +
      `#### Recommended Remediation\n\`\`\`javascript\n${finding.replacementCode || finding.suggestedFix}\n\`\`\`\n\n` +
      `*Click finding to jump to code. Action: ${hasFix ? "Fix finding directly" : "Explain & manual guidance"}*`
    );

    if (finding.severity === "critical" || finding.severity === "high") {
      this.iconPath = new vscode.ThemeIcon("error", new vscode.ThemeColor("errorForeground"));
    } else if (finding.severity === "medium") {
      this.iconPath = new vscode.ThemeIcon("warning", new vscode.ThemeColor("problemsWarningIcon.foreground"));
    } else {
      this.iconPath = new vscode.ThemeIcon("info", new vscode.ThemeColor("problemsInfoIcon.foreground"));
    }

    // Context value enables inline action buttons: Fix or Explain, and More Actions
    this.contextValue = hasFix ? "findingWithFix" : "findingNoFix";

    const startLine = Math.max(0, finding.line - 1);
    const startCol = finding.column ?? 0;
    const endCol = startCol + Math.max(1, finding.length || 1);
    const targetUri = getFindingUri(finding);

    this.command = {
      command: "buggers.selectFinding",
      title: "Select & Inspect Finding",
      arguments: [this.finding],
    };
  }
}

export class FindingActionNode extends vscode.TreeItem {
  constructor(
    label: string,
    description: string,
    icon: string,
    commandId: string,
    finding: BuggersFinding,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
    this.command = {
      command: commandId,
      title: label,
      arguments: [finding],
    };
  }
}

export class BuggersFindingsProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private findings: BuggersFinding[] = [];
  // Default grouping mode is "severity" with auto-expanded groups
  private groupingMode: GroupingMode = "severity";
  private filterSeverity: Severity | "all" = "all";
  private scanOverview: ScanOverview | null = null;
  private dismissedIds = new Set<string>();
  private gitHubStatus: GitHubStatus = { state: "no_workspace" };

  setGitHubStatus(status: GitHubStatus): void {
    this.gitHubStatus = status;
    this.refresh();
  }

  getGitHubStatus(): GitHubStatus {
    return this.gitHubStatus;
  }

  isGitHubRepo(): boolean {
    const s = this.gitHubStatus.state;
    return (
      s === "github_remote_detected" ||
      s === "github_unauthenticated" ||
      s === "authenticated" ||
      s === "permission_insufficient" ||
      s === "remote_failed"
    );
  }

  setFindings(findings: BuggersFinding[], overview?: ScanOverview): void {
    this.findings = findings;
    if (overview) {
      this.scanOverview = overview;
    } else if (findings.length > 0) {
      const uniqueFiles = new Set(findings.map((f) => f.file));
      this.scanOverview = {
        totalFiles: uniqueFiles.size,
        totalFindings: findings.length,
        criticalCount: findings.filter((f) => f.severity === "critical").length,
        highCount: findings.filter((f) => f.severity === "high").length,
        mediumCount: findings.filter((f) => f.severity === "medium").length,
        lowCount: findings.filter((f) => f.severity === "low").length,
        scanTimeMs: 0,
        timestamp: new Date().toLocaleTimeString(),
        status: "scan_complete",
      };
    } else {
      this.scanOverview = null;
    }
    this.refresh();
  }

  setOverview(overview: ScanOverview): void {
    this.scanOverview = overview;
    this.refresh();
  }

  getFindings(): BuggersFinding[] {
    return this.findings.filter((f) => !this.dismissedIds.has(f.id));
  }

  getAllFindingsRaw(): BuggersFinding[] {
    return this.findings;
  }

  dismissFinding(findingId: string): void {
    this.dismissedIds.add(findingId);
    this.refresh();
  }

  restoreDismissed(): void {
    this.dismissedIds.clear();
    this.refresh();
  }

  setGroupingMode(mode: GroupingMode): void {
    this.groupingMode = mode;
    this.refresh();
  }

  getGroupingMode(): GroupingMode {
    return this.groupingMode;
  }

  setFilterSeverity(sev: Severity | "all"): void {
    this.filterSeverity = sev;
    this.refresh();
  }

  getFilterSeverity(): Severity | "all" {
    return this.filterSeverity;
  }

  clear(): void {
    this.findings = [];
    this.scanOverview = null;
    this.dismissedIds.clear();
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeNode): Thenable<TreeNode[]> {
    if (!element) {
      const rootNodes: TreeNode[] = [];
      const visibleFindings = this.getFindings();

      // 0. Conditionally show GitHubRepoNode IF AND ONLY IF a GitHub remote is detected
      if (this.isGitHubRepo()) {
        rootNodes.push(new GitHubRepoNode(this.gitHubStatus));
      }

      // 1. Always show StatusHeaderNode at the top
      if (this.scanOverview) {
        rootNodes.push(new StatusHeaderNode(this.scanOverview));
      }

      const status = this.scanOverview?.status;

      // When scanning is in progress and no findings yet, show informative progress node
      if ((status === "scanning_workspace" || status === "scanning_file") && visibleFindings.length === 0) {
        rootNodes.push(
          new InfoNode(
            "Analyzing workspace files in background...",
            "Issues will appear as they are discovered",
            "sync~spin",
          ),
        );
        return Promise.resolve(rootNodes);
      }

      if (status === "scan_failed") {
        rootNodes.push(
          new InfoNode(
            "Scan Failed: Click to Retry",
            this.scanOverview?.errorMessage || "An error occurred during analysis",
            "error",
            "buggers.refreshFindings",
          ),
        );
        return Promise.resolve(rootNodes);
      }

      if (status === "no_workspace") {
        rootNodes.push(
          new InfoNode(
            "Open Folder to Analyze",
            "Select File -> Open Folder to begin security scanning",
            "folder-opened",
            "vscode.openFolder",
          ),
        );
        return Promise.resolve(rootNodes);
      }

      if (status === "no_supported_files") {
        rootNodes.push(
          new InfoNode(
            "No supported source files",
            "Buggers supports .js, .ts, .py, .go, .java, .sql, .env, .sh",
            "info",
          ),
        );
        return Promise.resolve(rootNodes);
      }

      // If zero findings
      if (visibleFindings.length === 0) {
        if (status === "scan_complete") {
          rootNodes.push(
            new InfoNode(
              "Verified Clean: No security flaws detected",
              `Clean bill of health across ${this.scanOverview?.scannedFiles ?? 0} audited file(s)`,
              "pass",
            ),
          );
        } else {
          rootNodes.push(
            new InfoNode(
              "Ready to scan",
              "Open a supported file or click refresh to audit workspace",
              "shield",
              "buggers.analyzeWorkspace",
            ),
          );
        }
        return Promise.resolve(rootNodes);
      }

      // 2. Show Severity Breakdown Summary Node
      if (this.scanOverview) {
        rootNodes.push(new SeveritySummaryNode(this.scanOverview));
      }

      // Apply severity filter if active
      const filtered = this.filterSeverity === "all"
        ? visibleFindings
        : visibleFindings.filter((f) => f.severity === this.filterSeverity);

      if (filtered.length === 0) {
        rootNodes.push(
          new InfoNode(
            `No findings matching filter: ${this.filterSeverity.toUpperCase()}`,
            "Click to clear filter",
            "info",
            "buggers.filterFindings",
          ),
        );
        return Promise.resolve(rootNodes);
      }

      // Grouping Mode: Flat List (Zero nesting, all findings directly visible)
      if (this.groupingMode === "flat") {
        const severityRank: Record<Severity, number> = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        const sorted = [...filtered].sort(
          (a, b) => (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0),
        );
        for (const f of sorted) {
          rootNodes.push(new FindingNode(f, true));
        }
        return Promise.resolve(rootNodes);
      }

      // Grouping Mode: Severity (Default - Auto-expanded groups)
      if (this.groupingMode === "severity") {
        const severities: Severity[] = ["critical", "high", "medium", "low"];
        for (const sev of severities) {
          const matching = filtered.filter((f) => f.severity === sev);
          if (matching.length > 0) {
            rootNodes.push(new SeverityGroupNode(sev, matching));
          }
        }
        return Promise.resolve(rootNodes);
      }

      // Grouping Mode: Category (Auto-expanded groups)
      if (this.groupingMode === "category") {
        const categories: { id: Category; name: string; icon: string }[] = [
          { id: "security", name: "Security Vulnerabilities", icon: "shield" },
          { id: "secrets", name: "Exposed Secrets & Keys", icon: "key" },
          { id: "syntax", name: "Syntax & Compilation Errors", icon: "symbol-keyword" },
          { id: "type", name: "Type & Interface Errors", icon: "symbol-class" },
          { id: "semantic", name: "Semantic & Scope Issues", icon: "references" },
          { id: "logical_bug", name: "Potential Logical Bugs", icon: "bug" },
          { id: "lint", name: "Style & Lint Warnings", icon: "checklist" },
          { id: "quality", name: "Code Quality Issues", icon: "info" },
          { id: "dependency", name: "Dependency & Config Risks", icon: "package" },
        ];

        for (const cat of categories) {
          const matching = filtered.filter((f) => f.category === cat.id);
          if (matching.length > 0) {
            rootNodes.push(new CategoryGroupNode(cat.id, cat.name, matching, cat.icon));
          }
        }
        return Promise.resolve(rootNodes);
      }

      // Grouping Mode: File (Auto-expanded groups)
      if (this.groupingMode === "file") {
        const fileMap = new Map<string, BuggersFinding[]>();
        for (const f of filtered) {
          const list = fileMap.get(f.file) || [];
          list.push(f);
          fileMap.set(f.file, list);
        }

        for (const [filePath, fileFindings] of fileMap.entries()) {
          rootNodes.push(new FileGroupNode(filePath, fileFindings));
        }
        return Promise.resolve(rootNodes);
      }

      return Promise.resolve(rootNodes);
    }

    // Children of Severity / Category / File groups: FindingNodes
    if (element instanceof SeverityGroupNode) {
      return Promise.resolve(
        element.findings.map((finding) => new FindingNode(finding)),
      );
    }

    if (element instanceof CategoryGroupNode) {
      return Promise.resolve(
        element.findings.map((finding) => new FindingNode(finding)),
      );
    }

    if (element instanceof FileGroupNode) {
      return Promise.resolve(
        element.findings.map((finding) => new FindingNode(finding)),
      );
    }

    // Children of GitHubRepoNode: Git Action Nodes
    if (element instanceof GitHubRepoNode) {
      const actions: TreeNode[] = [];
      const changed = this.gitHubStatus.changedFiles || [];

      if (changed.length > 0) {
        actions.push(
          new GitHubActionNode(
            `Review Changed Files (${changed.length})`,
            "Inspect diff and security findings in changed lines",
            "git-compare",
            "buggers.gitReviewChanges",
          ),
        );
        actions.push(
          new GitHubActionNode(
            "Security Pre-Commit Review",
            "Audit pending changes against 33+ security rules",
            "shield-check",
            "buggers.gitReviewChanges",
          ),
        );
        actions.push(
          new GitHubActionNode(
            "Commit Approved Changes",
            "Select files and commit with security confirmation",
            "git-commit",
            "buggers.gitCommit",
          ),
        );
      } else {
        actions.push(
          new GitHubActionNode(
            "Working Tree Clean",
            "Zero uncommitted changes in workspace",
            "pass",
          ),
        );
      }

      actions.push(
        new GitHubActionNode(
          "Push to GitHub",
          "Safely push verified commits to origin",
          "repo-push",
          "buggers.gitPush",
        ),
      );

      actions.push(
        new GitHubActionNode(
          "Open Repository on GitHub",
          "View current branch on github.com",
          "link-external",
          "buggers.openOnGitHub",
        ),
      );

      if (this.gitHubStatus.state === "github_unauthenticated") {
        actions.push(
          new GitHubActionNode(
            "Connect GitHub Account",
            "Sign in with GitHub or enter a Personal Access Token",
            "key",
            "buggers.connectGitHub",
          ),
        );
      }

      return Promise.resolve(actions);
    }

    // Children of FindingNode: Direct Action Nodes when expanded
    if (element instanceof FindingNode) {
      const f = element.finding;
      const actions: TreeNode[] = [];

      if (f.replacementCode && f.replacementCode.trim().length > 0) {
        actions.push(
          new FindingActionNode(
            "[Fix] Suggest Fix / Apply Directly",
            "Apply verified patch directly to file",
            "tools",
            "buggers.applyRemedy",
            f,
          ),
        );
        actions.push(
          new FindingActionNode(
            "[Preview] Preview Fix Diff",
            "Inspect side-by-side proposed change before applying",
            "diff",
            "buggers.previewDiff",
            f,
          ),
        );
      }

      actions.push(
        new FindingActionNode(
          "[Explain] Explain Finding & Rule Guidance",
          "Deep dive into vulnerability causation and exploit scenario",
          "book",
          "buggers.explainFinding",
          f,
        ),
      );

      actions.push(
        new FindingActionNode(
          "[More] View All Secondary Actions",
          "Preview diff, copy patch, test generation, suppression",
          "ellipsis",
          "buggers.moreActions",
          f,
        ),
      );

      actions.push(
        new FindingActionNode(
          "[Dismiss] Dismiss Finding from Display",
          "Hide from current findings view (restored on next rescan)",
          "eye-closed",
          "buggers.dismissFinding",
          f,
        ),
      );

      actions.push(
        new FindingActionNode(
          "[Suppress] Suppress Finding (Ignore Comment)",
          "Insert // buggers-ignore comment above offending line",
          "bell-slash",
          "buggers.ignoreFinding",
          f,
        ),
      );

      if (f.replacementCode || f.suggestedFix) {
        actions.push(
          new FindingActionNode(
            "[Copy Patch] Copy Remediation Patch",
            "Copy standard unified diff to clipboard",
            "copy",
            "buggers.copyPatch",
            f,
          ),
        );
      }

      actions.push(
        new FindingActionNode(
          "[Test] Generate Regression Test",
          "Generate automated unit test reproducing prevention",
          "beaker",
          "buggers.generateRegressionTest",
          f,
        ),
      );

      return Promise.resolve(actions);
    }

    return Promise.resolve([]);
  }
}
