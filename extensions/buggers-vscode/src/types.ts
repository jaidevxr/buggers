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
  problem: string;
  whyItMatters: string;
  evidence: string;
  suggestedFix: string;
}

export interface ScanRule {
  id: string;
  name: string;
  severity: Severity;
  category: Category;
  pattern: RegExp;
  description: string;
  whyItMatters: string;
  suggestedFixTemplate: (matched: string) => string;
}
