export interface SecurityPolicy {
  maxRiskScore: number;
  blockOnCritical: boolean;
  blockOnHigh: boolean;
  blockOnSecretLeaks: boolean;
  blockOnVulnerableDependencies: boolean;
}

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  maxRiskScore: 75,
  blockOnCritical: true,
  blockOnHigh: true,
  blockOnSecretLeaks: true,
  blockOnVulnerableDependencies: true,
};

export function getSavedSecurityPolicy(): SecurityPolicy {
  if (typeof window === "undefined") return DEFAULT_SECURITY_POLICY;
  try {
    const stored = localStorage.getItem("buggers_security_policy");
    if (!stored) return DEFAULT_SECURITY_POLICY;
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    return {
      maxRiskScore:
        typeof parsed["maxRisk"] === "number"
          ? parsed["maxRisk"]
          : typeof parsed["maxRiskScore"] === "number"
            ? parsed["maxRiskScore"]
            : DEFAULT_SECURITY_POLICY.maxRiskScore,
      blockOnCritical:
        typeof parsed["blockCritical"] === "boolean"
          ? parsed["blockCritical"]
          : typeof parsed["blockOnCritical"] === "boolean"
            ? parsed["blockOnCritical"]
            : DEFAULT_SECURITY_POLICY.blockOnCritical,
      blockOnHigh:
        typeof parsed["blockHigh"] === "boolean"
          ? parsed["blockHigh"]
          : typeof parsed["blockOnHigh"] === "boolean"
            ? parsed["blockOnHigh"]
            : DEFAULT_SECURITY_POLICY.blockOnHigh,
      blockOnSecretLeaks:
        typeof parsed["blockSecrets"] === "boolean"
          ? parsed["blockSecrets"]
          : typeof parsed["blockOnSecretLeaks"] === "boolean"
            ? parsed["blockOnSecretLeaks"]
            : DEFAULT_SECURITY_POLICY.blockOnSecretLeaks,
      blockOnVulnerableDependencies:
        typeof parsed["blockDependencies"] === "boolean"
          ? parsed["blockDependencies"]
          : typeof parsed["blockOnVulnerableDependencies"] === "boolean"
            ? parsed["blockOnVulnerableDependencies"]
            : DEFAULT_SECURITY_POLICY.blockOnVulnerableDependencies,
    };
  } catch {
    return DEFAULT_SECURITY_POLICY;
  }
}

export interface QualityGateResult {
  passed: boolean;
  status: "success" | "failure";
  reason: string;
  summary: string;
  violations: string[];
}

export function evaluateQualityGate(
  policy: SecurityPolicy,
  context: {
    riskScore: number;
    findings: Array<{
      severity: string;
      category?: string;
      title?: string;
    }>;
  },
): QualityGateResult {
  const violations: string[] = [];

  // 1. Risk score threshold
  if (context.riskScore > policy.maxRiskScore) {
    violations.push(`Risk score (${context.riskScore}/100) exceeds maximum threshold (${policy.maxRiskScore})`);
  }

  // 2. Critical findings
  const criticalCount = context.findings.filter((f) => f.severity === "critical").length;
  if (policy.blockOnCritical && criticalCount > 0) {
    violations.push(`${criticalCount} Critical severity finding(s) detected`);
  }

  // 3. High findings
  const highCount = context.findings.filter((f) => f.severity === "high").length;
  if (policy.blockOnHigh && highCount > 0) {
    violations.push(`${highCount} High severity finding(s) detected`);
  }

  // 4. Secret leaks
  const secretCount = context.findings.filter(
    (f) => f.category === "security" && (f.title?.toLowerCase().includes("secret") || f.title?.toLowerCase().includes("token") || f.title?.toLowerCase().includes("key")),
  ).length;
  if (policy.blockOnSecretLeaks && secretCount > 0) {
    violations.push(`${secretCount} plaintext secret / credential leak(s) detected`);
  }

  // 5. Dependency vulnerabilities
  const depCount = context.findings.filter((f) => f.category === "dependency").length;
  if (policy.blockOnVulnerableDependencies && depCount > 0) {
    violations.push(`${depCount} vulnerable package dependencies (CVE) detected`);
  }

  const passed = violations.length === 0;

  return {
    passed,
    status: passed ? "success" : "failure",
    reason: passed
      ? `Quality Gate Passed: Risk score ${context.riskScore}/100 meets all security thresholds.`
      : `Quality Gate Failed: ${violations.join(" · ")}`,
    summary: passed
      ? `Passed (Risk ${context.riskScore}/100)`
      : `Blocked: ${violations[0]}`,
    violations,
  };
}
