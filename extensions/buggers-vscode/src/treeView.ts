import * as vscode from "vscode";
import * as path from "path";
import { BuggersFinding, Severity, Category, GroupingMode, ScanOverview } from "./types";

export type TreeNode =
  | OverviewNode
  | CategoryGroupNode
  | SeverityGroupNode
  | FileGroupNode
  | FindingNode
  | InfoNode;

export class OverviewNode extends vscode.TreeItem {
  constructor(public readonly overview: ScanOverview) {
    super("Workspace Scan Overview", vscode.TreeItemCollapsibleState.None);
    this.description = `${overview.totalFindings} issue(s) across ${overview.totalFiles} file(s)`;
    this.iconPath = new vscode.ThemeIcon("dashboard");
    this.tooltip = new vscode.MarkdownString(
      `### Buggers Workspace Scan Overview\n\n` +
      `- **Total Files Scanned:** ${overview.totalFiles}\n` +
      `- **Total Findings:** ${overview.totalFindings}\n` +
      `- **Critical:** ${overview.criticalCount}\n` +
      `- **High:** ${overview.highCount}\n` +
      `- **Medium:** ${overview.mediumCount}\n` +
      `- **Low:** ${overview.lowCount}\n` +
      `- **Scan Duration:** ${overview.scanTimeMs}ms\n` +
      `- **Scan Engine:** Local In-Process SAST & Deterministic Bug Triage\n` +
      `- **Last Scan:** ${overview.timestamp}\n`
    );
  }
}

export class InfoNode extends vscode.TreeItem {
  constructor(label: string, description?: string, icon: string = "info") {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}

export class CategoryGroupNode extends vscode.TreeItem {
  constructor(
    public readonly categoryId: Category,
    public readonly categoryName: string,
    public readonly findings: BuggersFinding[],
    iconName: string = "shield",
  ) {
    super(
      `${categoryName} (${findings.length})`,
      vscode.TreeItemCollapsibleState.Expanded,
    );
    this.contextValue = "categoryGroup";
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}

export class SeverityGroupNode extends vscode.TreeItem {
  constructor(
    public readonly severity: Severity,
    public readonly findings: BuggersFinding[],
  ) {
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
    super(
      path.basename(filePath),
      vscode.TreeItemCollapsibleState.Expanded,
    );
    this.description = `${findings.length} issue(s) · ${path.dirname(filePath)}`;
    this.iconPath = vscode.ThemeIcon.File;
  }
}

export class FindingNode extends vscode.TreeItem {
  constructor(public readonly finding: BuggersFinding) {
    super(finding.title, vscode.TreeItemCollapsibleState.None);
    this.description = `Line ${finding.line} · ${path.basename(finding.file)}`;
    const cweInfo = finding.cwe ? ` | **CWE:** \`${finding.cwe}\`` : "";
    const owaspInfo = finding.owasp ? ` | **OWASP:** \`${finding.owasp}\`` : "";
    const categoryInfo = `**Category:** ${finding.category.toUpperCase().replace("_", " ")}`;
    const confidenceInfo = `**Confidence:** ${Math.round((finding.confidence || 0.95) * 100)}%`;

    this.tooltip = new vscode.MarkdownString(
      `### [${finding.severity.toUpperCase()}] ${finding.title}\n\n` +
      `**Rule:** \`${finding.ruleId}\`${cweInfo}${owaspInfo}\n\n` +
      `${categoryInfo} | ${confidenceInfo}\n\n` +
      `#### Problem Description\n${finding.problem}\n\n` +
      `#### Why It Matters\n${finding.whyItMatters}\n\n` +
      `#### Evidence\n\`\`\`javascript\n${finding.evidence}\n\`\`\`\n\n` +
      `#### Remediation\n\`\`\`javascript\n${finding.suggestedFix}\n\`\`\``
    );

    if (finding.severity === "critical" || finding.severity === "high") {
      this.iconPath = new vscode.ThemeIcon("shield", new vscode.ThemeColor("errorForeground"));
    } else if (finding.severity === "medium") {
      this.iconPath = new vscode.ThemeIcon("alert", new vscode.ThemeColor("problemsWarningIcon.foreground"));
    } else {
      this.iconPath = new vscode.ThemeIcon("info", new vscode.ThemeColor("problemsInfoIcon.foreground"));
    }

    this.contextValue = finding.replacementCode ? "findingWithFix" : "finding";

    const startPos = new vscode.Position(
      Math.max(0, finding.line - 1),
      finding.column ?? 0,
    );
    const endPos = new vscode.Position(
      Math.max(0, finding.line - 1),
      (finding.column ?? 0) + (finding.length ?? 1),
    );

    this.command = {
      command: "vscode.open",
      title: "Jump to Finding",
      arguments: [
        vscode.Uri.file(finding.file),
        {
          selection: new vscode.Range(startPos, endPos),
        },
      ],
    };
  }
}

export class BuggersFindingsProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private findings: BuggersFinding[] = [];
  private groupingMode: GroupingMode = "category";
  private filterSeverity: Severity | "all" = "all";
  private scanOverview: ScanOverview | null = null;

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
      };
    } else {
      this.scanOverview = null;
    }
    this.refresh();
  }

  getFindings(): BuggersFinding[] {
    return this.findings;
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
      if (this.findings.length === 0) {
        return Promise.resolve([
          new InfoNode(
            "Clean Workspace: No security flaws detected",
            "Analyze a file or workspace to scan for vulnerabilities",
            "pass",
          ),
        ]);
      }

      const filtered = this.filterSeverity === "all"
        ? this.findings
        : this.findings.filter((f) => f.severity === this.filterSeverity);

      if (filtered.length === 0) {
        return Promise.resolve([
          new InfoNode(
            `No findings matching filter: ${this.filterSeverity.toUpperCase()}`,
            "Change severity filter to view other issues",
            "info",
          ),
        ]);
      }

      const rootNodes: TreeNode[] = [];

      // Add Overview Node at the top
      if (this.scanOverview) {
        rootNodes.push(new OverviewNode(this.scanOverview));
      }

      // Grouping: Category Mode (Default)
      if (this.groupingMode === "category") {
        const categories: { id: Category; name: string; icon: string }[] = [
          { id: "security", name: "Security Vulnerabilities", icon: "shield" },
          { id: "logical_bug", name: "Logical Bugs & Defects", icon: "bug" },
          { id: "quality", name: "Code Quality Issues", icon: "checklist" },
          { id: "dependency", name: "Dependency & Configuration Risks", icon: "package" },
        ];

        for (const cat of categories) {
          const matching = filtered.filter((f) => f.category === cat.id);
          if (matching.length > 0) {
            rootNodes.push(new CategoryGroupNode(cat.id, cat.name, matching, cat.icon));
          }
        }
        return Promise.resolve(rootNodes);
      }

      // Grouping: Severity Mode
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

      // Grouping: File Mode
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

    if (element instanceof CategoryGroupNode) {
      return Promise.resolve(
        element.findings.map((finding) => new FindingNode(finding)),
      );
    }

    if (element instanceof SeverityGroupNode) {
      return Promise.resolve(
        element.findings.map((finding) => new FindingNode(finding)),
      );
    }

    if (element instanceof FileGroupNode) {
      return Promise.resolve(
        element.findings.map((finding) => new FindingNode(finding)),
      );
    }

    return Promise.resolve([]);
  }
}
