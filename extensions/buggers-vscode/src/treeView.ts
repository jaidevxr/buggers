import * as vscode from "vscode";
import * as path from "path";
import { BuggersFinding, Severity } from "./types";

export type TreeNode = SeverityGroupNode | FileGroupNode | FindingNode | InfoNode;

export class InfoNode extends vscode.TreeItem {
  constructor(label: string, description?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.iconPath = new vscode.ThemeIcon("info");
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
    this.description = path.dirname(filePath);
    this.iconPath = vscode.ThemeIcon.File;
  }
}

export class FindingNode extends vscode.TreeItem {
  constructor(public readonly finding: BuggersFinding) {
    super(finding.title, vscode.TreeItemCollapsibleState.None);
    this.description = `Line ${finding.line} · ${path.basename(finding.file)}`;
    this.tooltip = new vscode.MarkdownString(
      `### ${finding.title}\n\n**Severity:** \`${finding.severity.toUpperCase()}\` | **Rule:** \`${finding.ruleId}\`\n\n${finding.problem}\n\n**Why it matters:**\n${finding.whyItMatters}\n\n**Evidence:**\n\`\`\`\n${finding.evidence}\n\`\`\`\n\n**Remediation:**\n\`\`\`\n${finding.suggestedFix}\n\`\`\``,
    );

    if (finding.severity === "critical" || finding.severity === "high") {
      this.iconPath = new vscode.ThemeIcon("shield", new vscode.ThemeColor("errorForeground"));
    } else if (finding.severity === "medium") {
      this.iconPath = new vscode.ThemeIcon("alert", new vscode.ThemeColor("problemsWarningIcon.foreground"));
    } else {
      this.iconPath = new vscode.ThemeIcon("search", new vscode.ThemeColor("problemsInfoIcon.foreground"));
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

  setFindings(findings: BuggersFinding[]): void {
    this.findings = findings;
    this.refresh();
  }

  clear(): void {
    this.findings = [];
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
          new InfoNode("No security flaws detected", "Analyze a file or workspace to scan"),
        ]);
      }

      // Group by Severity
      const severities: Severity[] = ["critical", "high", "medium", "low"];
      const groups: TreeNode[] = [];

      for (const sev of severities) {
        const matching = this.findings.filter((f) => f.severity === sev);
        if (matching.length > 0) {
          groups.push(new SeverityGroupNode(sev, matching));
        }
      }

      return Promise.resolve(groups);
    }

    if (element instanceof SeverityGroupNode) {
      return Promise.resolve(
        element.findings.map((finding) => new FindingNode(finding)),
      );
    }

    return Promise.resolve([]);
  }
}
