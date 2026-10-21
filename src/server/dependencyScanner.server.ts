export interface KnownVulnerability {
  ecosystem: "npm" | "pypi";
  packageName: string;
  vulnerableRange: (version: string) => boolean;
  cve: string;
  severity: "critical" | "high" | "medium";
  summary: string;
  safeVersion: string;
}

// Simple semver comparison helper
function parseSemver(v: string): number[] {
  const clean = v.replace(/[^0-9.]/g, "");
  const parts = clean.split(".").map((p) => parseInt(p, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

function ltSemver(a: string, b: string): boolean {
  const pA = parseSemver(a);
  const pB = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    const numA = pA[i] ?? 0;
    const numB = pB[i] ?? 0;
    if (numA < numB) return true;
    if (numA > numB) return false;
  }
  return false;
}

export const KNOWN_VULNERABILITIES: KnownVulnerability[] = [
  {
    ecosystem: "npm",
    packageName: "lodash",
    vulnerableRange: (v) => ltSemver(v, "4.17.21"),
    cve: "CVE-2021-23337",
    severity: "high",
    summary: "Prototype pollution and command injection in template function.",
    safeVersion: "4.17.21",
  },
  {
    ecosystem: "npm",
    packageName: "axios",
    vulnerableRange: (v) => ltSemver(v, "1.6.0"),
    cve: "CVE-2023-45857",
    severity: "high",
    summary: "Cross-Site Request Forgery (CSRF) & Server-Side Request Forgery vulnerability.",
    safeVersion: "1.6.0",
  },
  {
    ecosystem: "npm",
    packageName: "express",
    vulnerableRange: (v) => ltSemver(v, "4.19.2"),
    cve: "CVE-2024-29041",
    severity: "medium",
    summary: "Open redirect in res.location() and res.redirect() via malformed URLs.",
    safeVersion: "4.19.2",
  },
  {
    ecosystem: "npm",
    packageName: "jsonwebtoken",
    vulnerableRange: (v) => ltSemver(v, "9.0.0"),
    cve: "CVE-2022-23529",
    severity: "critical",
    summary: "Insecure key retrieval leading to arbitrary remote code execution (RCE).",
    safeVersion: "9.0.0",
  },
  {
    ecosystem: "npm",
    packageName: "minimist",
    vulnerableRange: (v) => ltSemver(v, "1.2.6"),
    cve: "CVE-2021-44906",
    severity: "critical",
    summary: "Prototype pollution via constructor or __proto__ manipulation.",
    safeVersion: "1.2.6",
  },
  {
    ecosystem: "npm",
    packageName: "semver",
    vulnerableRange: (v) => ltSemver(v, "7.5.2"),
    cve: "CVE-2022-25883",
    severity: "high",
    summary: "Regular Expression Denial of Service (ReDoS) during version parsing.",
    safeVersion: "7.5.2",
  },
  {
    ecosystem: "npm",
    packageName: "tar",
    vulnerableRange: (v) => ltSemver(v, "6.1.9"),
    cve: "CVE-2021-37713",
    severity: "high",
    summary: "Arbitrary file creation / overwrite due to symlink validation bypass.",
    safeVersion: "6.1.9",
  },
  {
    ecosystem: "npm",
    packageName: "node-forge",
    vulnerableRange: (v) => ltSemver(v, "1.3.0"),
    cve: "CVE-2022-24771",
    severity: "critical",
    summary: "Improper RSA signature verification allows signature forgery.",
    safeVersion: "1.3.0",
  },
  {
    ecosystem: "npm",
    packageName: "moment",
    vulnerableRange: (v) => ltSemver(v, "2.29.4"),
    cve: "CVE-2022-31129",
    severity: "high",
    summary: "Regular Expression Denial of Service (ReDoS) when parsing long date strings.",
    safeVersion: "2.29.4",
  },
  {
    ecosystem: "pypi",
    packageName: "requests",
    vulnerableRange: (v) => ltSemver(v, "2.31.0"),
    cve: "CVE-2023-32681",
    severity: "high",
    summary: "Proxy-Authorization header leak to unintended destinations during redirects.",
    safeVersion: "2.31.0",
  },
  {
    ecosystem: "pypi",
    packageName: "urllib3",
    vulnerableRange: (v) => ltSemver(v, "2.0.7"),
    cve: "CVE-2023-45803",
    severity: "high",
    summary: "Request body not stripped during HTTP 303 redirect leading to data leak.",
    safeVersion: "2.0.7",
  },
  {
    ecosystem: "pypi",
    packageName: "django",
    vulnerableRange: (v) => ltSemver(v, "4.2.11"),
    cve: "CVE-2024-27351",
    severity: "high",
    summary: "Potential ReDoS in truncation and form field handling.",
    safeVersion: "4.2.11",
  },
  {
    ecosystem: "pypi",
    packageName: "flask",
    vulnerableRange: (v) => ltSemver(v, "2.2.5"),
    cve: "CVE-2023-30861",
    severity: "high",
    summary: "Cookie secret key disclosure via improper exception handling.",
    safeVersion: "2.2.5",
  },
];

export interface ScannedDependencyFinding {
  file: string;
  line: number | null;
  title: string;
  severity: "critical" | "high" | "medium";
  category: "dependency";
  confidence: number;
  problem: string;
  why_it_matters: string;
  evidence: string;
  suggested_fix: string;
}

/**
 * Scan package manifest files in the PR diff for vulnerable dependencies
 */
export function scanFilesForVulnerableDependencies(
  files: Array<{ filename: string; patch?: string | undefined }>,
): ScannedDependencyFinding[] {
  const findings: ScannedDependencyFinding[] = [];

  for (const file of files) {
    if (!file.patch) continue;
    const isPackageJson = /package\.json$/i.test(file.filename);
    const isRequirements = /requirements.*\.txt$/i.test(file.filename);

    if (!isPackageJson && !isRequirements) continue;

    const lines = file.patch.split("\n");
    let currentLine = 1;

    for (const rawLine of lines) {
      const hunkMatch = rawLine.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunkMatch) {
        currentLine = parseInt(hunkMatch[1]!, 10);
        continue;
      }

      // Check added or updated lines
      if (rawLine.startsWith("+") && !rawLine.startsWith("+++")) {
        const lineContent = rawLine.slice(1);

        if (isPackageJson) {
          // Match "package": "^1.2.3"
          const match = lineContent.match(/"([^"]+)":\s*"([^"]+)"/);
          if (match) {
            const pkgName = match[1]!;
            const versionStr = match[2]!;

            const vuln = KNOWN_VULNERABILITIES.find(
              (k) => k.ecosystem === "npm" && k.packageName.toLowerCase() === pkgName.toLowerCase(),
            );
            if (vuln && vuln.vulnerableRange(versionStr)) {
              findings.push({
                file: file.filename,
                line: currentLine,
                title: `Vulnerable Dependency: ${pkgName}@${versionStr} (${vuln.cve})`,
                severity: vuln.severity,
                category: "dependency",
                confidence: 0.95,
                problem: `Known vulnerability ${vuln.cve} detected in dependency "${pkgName}@${versionStr}": ${vuln.summary}`,
                why_it_matters:
                  "Using components with known vulnerabilities exposes applications to publicly available exploits and automated attack vectors.",
                evidence: lineContent.trim(),
                suggested_fix: `"${pkgName}": "^${vuln.safeVersion}"`,
              });
            }
          }
        } else if (isRequirements) {
          // Match package==1.2.3 or package>=1.2.3
          const match = lineContent.match(/^([a-zA-Z0-9_\-]+)\s*(?:==|>=|~=)\s*([0-9.]+)/);
          if (match) {
            const pkgName = match[1]!;
            const versionStr = match[2]!;

            const vuln = KNOWN_VULNERABILITIES.find(
              (k) => k.ecosystem === "pypi" && k.packageName.toLowerCase() === pkgName.toLowerCase(),
            );
            if (vuln && vuln.vulnerableRange(versionStr)) {
              findings.push({
                file: file.filename,
                line: currentLine,
                title: `Vulnerable Python Package: ${pkgName}==${versionStr} (${vuln.cve})`,
                severity: vuln.severity,
                category: "dependency",
                confidence: 0.95,
                problem: `Known vulnerability ${vuln.cve} in package "${pkgName}": ${vuln.summary}`,
                why_it_matters:
                  "Outdated Python dependencies can allow remote code execution, token leakage, or denial of service.",
                evidence: lineContent.trim(),
                suggested_fix: `${pkgName}>=${vuln.safeVersion}`,
              });
            }
          }
        }
        currentLine++;
      } else if (!rawLine.startsWith("-")) {
        currentLine++;
      }
    }
  }

  return findings;
}

/**
 * Scan a raw package.json or requirements.txt file content directly
 */
export function scanDependencyFile(
  content: string,
  filename: string = "package.json",
): Array<{
  line: number;
  packageName: string;
  version: string;
  cve: string;
  severity: "critical" | "high" | "medium";
  title: string;
  problem: string;
  why_it_matters: string;
  evidence: string;
  suggested_fix: string;
}> {
  const findings: Array<{
    line: number;
    packageName: string;
    version: string;
    cve: string;
    severity: "critical" | "high" | "medium";
    title: string;
    problem: string;
    why_it_matters: string;
    evidence: string;
    suggested_fix: string;
  }> = [];

  const lines = content.split("\n");
  const isPackageJson = /package\.json$/i.test(filename);
  const isRequirements = /requirements.*\.txt$/i.test(filename);

  for (let idx = 0; idx < lines.length; idx++) {
    const lineContent = lines[idx] ?? "";
    const lineNumber = idx + 1;

    if (isPackageJson) {
      const match = lineContent.match(/"([^"]+)":\s*"([^"]+)"/);
      if (match) {
        const pkgName = match[1]!;
        const versionStr = match[2]!;

        const vuln = KNOWN_VULNERABILITIES.find(
          (k) => k.ecosystem === "npm" && k.packageName.toLowerCase() === pkgName.toLowerCase(),
        );
        if (vuln && vuln.vulnerableRange(versionStr)) {
          findings.push({
            line: lineNumber,
            packageName: pkgName,
            version: versionStr,
            cve: vuln.cve,
            severity: vuln.severity,
            title: `Vulnerable Dependency: ${pkgName}`,
            problem: `Known vulnerability ${vuln.cve} detected in dependency "${pkgName}@${versionStr}": ${vuln.summary}`,
            why_it_matters:
              "Using components with known vulnerabilities exposes applications to publicly available exploits and automated attack vectors.",
            evidence: lineContent.trim(),
            suggested_fix: `"${pkgName}": "^${vuln.safeVersion}"`,
          });
        }
      }
    } else if (isRequirements) {
      const match = lineContent.match(/^([a-zA-Z0-9_\-]+)\s*(?:==|>=|~=)\s*([0-9.]+)/);
      if (match) {
        const pkgName = match[1]!;
        const versionStr = match[2]!;

        const vuln = KNOWN_VULNERABILITIES.find(
          (k) => k.ecosystem === "pypi" && k.packageName.toLowerCase() === pkgName.toLowerCase(),
        );
        if (vuln && vuln.vulnerableRange(versionStr)) {
          findings.push({
            line: lineNumber,
            packageName: pkgName,
            version: versionStr,
            cve: vuln.cve,
            severity: vuln.severity,
            title: `Vulnerable Python Package: ${pkgName}`,
            problem: `Known vulnerability ${vuln.cve} in package "${pkgName}": ${vuln.summary}`,
            why_it_matters:
              "Outdated Python dependencies can allow remote code execution, token leakage, or denial of service.",
            evidence: lineContent.trim(),
            suggested_fix: `${pkgName}>=${vuln.safeVersion}`,
          });
        }
      }
    }
  }

  return findings;
}
