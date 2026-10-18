export type Severity = "critical" | "high" | "medium" | "low";
export type Category = "security" | "dependency" | "quality" | "logical_bug";

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
  regressionTest?: string;
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

export type AiProviderType = "openai" | "anthropic" | "gemini" | "ollama" | "custom";

export interface AiConfig {
  provider: AiProviderType;
  model: string;
  customEndpoint?: string;
  timeoutMs?: number;
}

export type GroupingMode = "category" | "severity" | "file";

export interface ScanOverview {
  totalFiles: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  scanTimeMs: number;
  timestamp: string;
}

