export type Severity = "critical" | "high" | "medium" | "low";
export type Category = "security" | "dependency" | "quality";

export interface BuggersFinding {
  id: string;
  file: string;
  line: number;
  column?: number;
  length?: number;
  title: string;
  severity: Severity;
  category: Category;
  confidence: number;
  ruleId: string;
  cwe?: string;
  owasp?: string;
  problem: string;
  whyItMatters: string;
  evidence: string;
  suggestedFix: string;
  replacementCode?: string;
  replacementRange?: { startLine: number; startCol: number; endLine: number; endCol: number };
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
}
