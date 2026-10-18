import * as vscode from "vscode";

export type Severity = "critical" | "high" | "medium" | "low";
export type DiagnosticCategory =
  | "security"
  | "secrets"
  | "syntax"
  | "type"
  | "semantic"
  | "logical_bug"
  | "lint"
  | "quality"
  | "dependency";
export type Category = DiagnosticCategory;
export type DiagnosticSourceType = "compiler" | "lsp" | "linter" | "buggers_rule";
export type ConfidenceLevel = "high" | "medium" | "low";

export function getFindingUri(finding: BuggersFinding): vscode.Uri {
  if (!finding || !finding.file) {
    return vscode.Uri.file("");
  }
  if (
    finding.file.startsWith("vscode-remote:") ||
    finding.file.startsWith("vscode-vfs:") ||
    finding.file.startsWith("untitled:") ||
    finding.file.startsWith("file:")
  ) {
    return vscode.Uri.parse(finding.file);
  }
  return vscode.Uri.file(finding.file);
}

export type ScanStatus =
  | "idle"
  | "initializing"
  | "scanning_workspace"
  | "scanning_file"
  | "scan_complete"
  | "scan_failed"
  | "scan_cancelled"
  | "no_supported_files"
  | "no_workspace";

export interface BuggersFinding {
  id: string;
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  length?: number;
  title: string;
  severity: Severity;
  category: DiagnosticCategory;
  confidence: number | ConfidenceLevel;
  ruleId: string;
  sourceType?: DiagnosticSourceType;
  source?: string;
  cwe?: string;
  owasp?: string;
  problem: string;
  whyItMatters: string;
  evidence: string;
  suggestedFix: string;
  replacementCode?: string;
  replacementRange?: { startLine: number; startCol: number; endLine: number; endCol: number };
  regressionTest?: string;
  relatedInformation?: Array<{ message: string; file: string; line: number }>;
}

export interface ScanRule {
  id: string;
  name: string;
  severity: Severity;
  category: Category;
  cwe?: string;
  owasp?: string;
  pattern: RegExp;
  description: string;
  whyItMatters: string;
  suggestedFixTemplate: (matched: string) => string;
  autoRemedyTemplate?: (matched: string, rawLine: string) => string;
  regressionTestTemplate?: (matched: string, rawLine: string) => string;
}

export type GroupingMode = "severity" | "flat" | "category" | "file";

export interface ScanOverview {
  totalFiles: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  scanTimeMs: number;
  timestamp: string;
  status?: ScanStatus;
  statusMessage?: string;
  scannedFiles?: number;
  skippedFiles?: number;
  errorMessage?: string;
}

export type GitHubRepoState =
  | "no_workspace"
  | "no_git"
  | "no_github_remote"
  | "github_remote_detected"
  | "github_unauthenticated"
  | "authenticated"
  | "permission_insufficient"
  | "remote_failed";

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  remoteUrl: string;
  remoteName: string;
  branch: string;
  isHttps: boolean;
  isSsh: boolean;
  ahead?: number;
  behind?: number;
}

export interface GitChangedFile {
  path: string;
  absolutePath: string;
  status: "modified" | "added" | "deleted" | "untracked" | "renamed";
  staged: boolean;
  findingsCount?: number;
}

export interface GitHubStatus {
  state: GitHubRepoState;
  repoInfo?: GitHubRepoInfo;
  changedFiles?: GitChangedFile[];
  authUser?: string;
  errorMessage?: string;
  lastChecked?: string;
}

export interface CommitReviewResult {
  hasFindingsInChanges: boolean;
  totalFindingsInChangedFiles: number;
  findings: BuggersFinding[];
  changedFiles: GitChangedFile[];
  summaryMessage: string;
}
