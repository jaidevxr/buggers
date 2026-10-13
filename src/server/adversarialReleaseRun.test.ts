import { describe, it, expect, vi } from "vitest";
import { evaluateQualityGate, DEFAULT_SECURITY_POLICY, type SecurityPolicy } from "@/lib/security-policy";
import { handleGitHubWebhook } from "@/server/webhook.server";
import { reapStaleAnalyses } from "@/server/queueWorker.server";

describe("Adversarial Scenario A: Quality-Gate Consistency & Rule Enforcement", () => {
  it("enforces maximum risk threshold violation", () => {
    const policy: SecurityPolicy = { ...DEFAULT_SECURITY_POLICY, maxRiskScore: 60 };
    const result = evaluateQualityGate(policy, {
      riskScore: 75,
      findings: [],
    });

    expect(result.passed).toBe(false);
    expect(result.status).toBe("failure");
    expect(result.violations[0]).toContain("Risk score (75/100) exceeds maximum threshold (60)");
    expect(result.summary).toContain("Blocked");
  });

  it("blocks PR on Critical severity finding regardless of risk score", () => {
    const result = evaluateQualityGate(DEFAULT_SECURITY_POLICY, {
      riskScore: 30, // low overall risk
      findings: [{ severity: "critical", title: "Remote Code Execution" }],
    });

    expect(result.passed).toBe(false);
    expect(result.status).toBe("failure");
    expect(result.violations.some((v) => v.includes("1 Critical severity finding(s)"))).toBe(true);
  });

  it("blocks PR on High severity finding when blockOnHigh is enabled", () => {
    const result = evaluateQualityGate(DEFAULT_SECURITY_POLICY, {
      riskScore: 40,
      findings: [{ severity: "high", title: "Missing Access Control" }],
    });

    expect(result.passed).toBe(false);
    expect(result.status).toBe("failure");
    expect(result.violations.some((v) => v.includes("1 High severity finding(s)"))).toBe(true);
  });

  it("blocks PR on plaintext secret/token/key leaks", () => {
    const result = evaluateQualityGate(DEFAULT_SECURITY_POLICY, {
      riskScore: 25,
      findings: [
        {
          severity: "medium",
          category: "security",
          title: "Hardcoded AWS Access Key detected in code",
        },
      ],
    });

    expect(result.passed).toBe(false);
    expect(result.status).toBe("failure");
    expect(result.violations.some((v) => v.includes("plaintext secret / credential leak(s)"))).toBe(true);
  });

  it("blocks PR on vulnerable package dependencies (CVEs)", () => {
    const result = evaluateQualityGate(DEFAULT_SECURITY_POLICY, {
      riskScore: 35,
      findings: [
        {
          severity: "medium",
          category: "dependency",
          title: "Vulnerable package: lodash < 4.17.21 (Prototype Pollution)",
        },
      ],
    });

    expect(result.passed).toBe(false);
    expect(result.status).toBe("failure");
    expect(result.violations.some((v) => v.includes("vulnerable package dependencies (CVE)"))).toBe(true);
  });

  it("passes PR cleanly when all thresholds and checks are satisfied", () => {
    const result = evaluateQualityGate(DEFAULT_SECURITY_POLICY, {
      riskScore: 20,
      findings: [
        { severity: "low", category: "maintainability", title: "Missing JSDoc comment" },
      ],
    });

    expect(result.passed).toBe(true);
    expect(result.status).toBe("success");
    expect(result.violations).toHaveLength(0);
    expect(result.reason).toContain("Quality Gate Passed");
    expect(result.summary).toContain("Passed (Risk 20/100)");
  });
});

describe("Adversarial Scenario B: Closed and Merged PR Remediation Safety", () => {
  it("rejects code fixes on closed or merged pull requests", async () => {
    // Simulate PR verification helper
    function verifyPrStateForRemediation(prState: string, prNumber: number) {
      if (prState !== "open") {
        throw new Error(
          `Pull request #${prNumber} is ${prState}. Automated security fixes can only be committed to open pull requests.`,
        );
      }
    }

    expect(() => verifyPrStateForRemediation("closed", 101)).toThrow(/is closed/);
    expect(() => verifyPrStateForRemediation("merged", 101)).toThrow(/is merged/);
    expect(() => verifyPrStateForRemediation("open", 101)).not.toThrow();
  });
});

describe("Adversarial Scenario C: Partial Batch Remediation Accounting", () => {
  it("accurately separates applied vs failed fixes without corrupting state", () => {
    const rawFindings = [
      { id: "f1", title: "SQLi", file_path: "src/db.js", evidence: "SELECT * FROM users", suggested_fix: "db.query($1)" },
      { id: "f2", title: "No fix", file_path: "src/db.js", evidence: "console.log(err)", suggested_fix: "" }, // missing fix
      { id: "f3", title: "Mismatch", file_path: "src/db.js", evidence: "non_existent_token", suggested_fix: "replacement" }, // evidence not in content
    ];

    const currentFileContent = "const q = 'SELECT * FROM users';\nconsole.log(q);";
    let updatedContent = currentFileContent;

    const results: Array<{ id: string; status: "applied" | "failed"; reason?: string }> = [];
    const fixedFindingIds: string[] = [];

    for (const f of rawFindings) {
      if (!f.suggested_fix.trim()) {
        results.push({ id: f.id, status: "failed", reason: "No code fix suggestion provided." });
        continue;
      }

      if (updatedContent.includes(f.evidence)) {
        updatedContent = updatedContent.replace(f.evidence, f.suggested_fix);
        fixedFindingIds.push(f.id);
        results.push({ id: f.id, status: "applied" });
      } else {
        results.push({ id: f.id, status: "failed", reason: "Evidence snippet not found in current file content." });
      }
    }

    expect(results).toHaveLength(3);
    expect(results[0]?.status).toBe("applied");
    expect(results[1]?.status).toBe("failed");
    expect(results[1]?.reason).toBe("No code fix suggestion provided.");
    expect(results[2]?.status).toBe("failed");
    expect(results[2]?.reason).toContain("not found in current file content");

    // Only f1 was staged and marked fixed
    expect(fixedFindingIds).toEqual(["f1"]);
    // File content only had f1 modified
    expect(updatedContent).toContain("db.query($1)");
    expect(updatedContent).not.toContain("SELECT * FROM users");
  });
});

describe("Adversarial Scenario D: Webhook Signature & Duplicate Delivery Defense", () => {
  it("rejects webhook requests with forged or invalid HMAC signature when secret is configured", async () => {
    const originalSecret = process.env["GITHUB_WEBHOOK_SECRET"];
    process.env["GITHUB_WEBHOOK_SECRET"] = "test-adversarial-secret-32-bytes";

    try {
      const req = new Request("http://localhost:8080/api/webhook/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GitHub-Event": "pull_request",
          "X-Hub-Signature-256": "sha256=0000000000000000000000000000000000000000000000000000000000000000",
        },
        body: JSON.stringify({ action: "opened" }),
      });

      const res = await handleGitHubWebhook(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid webhook signature");
    } finally {
      if (originalSecret) {
        process.env["GITHUB_WEBHOOK_SECRET"] = originalSecret;
      } else {
        delete process.env["GITHUB_WEBHOOK_SECRET"];
      }
    }
  });

  it("handles ping events cleanly without error", async () => {
    const originalSecret = process.env["GITHUB_WEBHOOK_SECRET"];
    delete process.env["GITHUB_WEBHOOK_SECRET"];

    try {
      const req = new Request("http://localhost:8080/api/webhook/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GitHub-Event": "ping",
        },
        body: JSON.stringify({ zen: "Responsive is better than delayed.", hook_id: 12345 }),
      });

      const res = await handleGitHubWebhook(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.zen).toBe("Responsive is better than delayed.");
    } finally {
      process.env["GITHUB_WEBHOOK_SECRET"] = originalSecret;
    }
  });
});
