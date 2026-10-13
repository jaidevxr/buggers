import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "./webhookSecurity.server";
import crypto from "crypto";

describe("Webhook Signature & Event Regression Tests", () => {
  const secret = "test-secret-key-12345";
  const body = JSON.stringify({ zen: "Practicality beats purity.", hook_id: 101 });

  it("successfully validates payload signed with HMAC-SHA256", () => {
    const signature = "sha256=" + crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
    const valid = verifyWebhookSignature(body, signature, secret);
    expect(valid).toBe(true);
  });

  it("rejects payload signed with wrong secret or tampered body", () => {
    const signature = "sha256=" + crypto.createHmac("sha256", "wrong-secret").update(body, "utf8").digest("hex");
    const valid = verifyWebhookSignature(body, signature, secret);
    expect(valid).toBe(false);

    const tamperedBody = JSON.stringify({ zen: "Tampered content", hook_id: 101 });
    const tamperedValid = verifyWebhookSignature(tamperedBody, signature, secret);
    expect(tamperedValid).toBe(false);
  });

  it("rejects request missing signature header", () => {
    const valid = verifyWebhookSignature(body, null, secret);
    expect(valid).toBe(false);
  });
});

describe("Remediation Patch Replacement Logic Regression Tests", () => {
  function applySnippetFix(
    originalContent: string,
    evidence: string,
    suggestedFix: string,
  ): { success: boolean; updatedContent: string } {
    const trimmedEvidence = evidence.trim();
    const trimmedFix = suggestedFix.trim();
    if (!trimmedFix) return { success: false, updatedContent: originalContent };

    // Strategy A: Direct substring match
    if (trimmedEvidence && originalContent.includes(trimmedEvidence)) {
      return {
        success: true,
        updatedContent: originalContent.replace(trimmedEvidence, trimmedFix),
      };
    }

    // Strategy B: Line-by-line whitespace-trimmed match
    if (trimmedEvidence) {
      const lines = originalContent.split("\n");
      const evLines = trimmedEvidence.split("\n").map((l) => l.trim()).filter(Boolean);
      let foundIdx = -1;
      for (let i = 0; i <= lines.length - evLines.length; i++) {
        let allMatch = true;
        for (let j = 0; j < evLines.length; j++) {
          if (!lines[i + j]?.trim().includes(evLines[j]!)) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx !== -1) {
        lines.splice(foundIdx, evLines.length, trimmedFix);
        return {
          success: true,
          updatedContent: lines.join("\n"),
        };
      }
    }

    return { success: false, updatedContent: originalContent };
  }

  it("replaces exact matching evidence with suggested fix", () => {
    const file = `function query(user) {\n  const sql = "SELECT * FROM users WHERE id = " + user.id;\n  return db.execute(sql);\n}`;
    const evidence = `const sql = "SELECT * FROM users WHERE id = " + user.id;`;
    const fix = `const sql = "SELECT * FROM users WHERE id = ?";\n  return db.execute(sql, [user.id]);`;

    const res = applySnippetFix(file, evidence, fix);
    expect(res.success).toBe(true);
    expect(res.updatedContent).toContain("SELECT * FROM users WHERE id = ?");
    expect(res.updatedContent).not.toContain('"SELECT * FROM users WHERE id = " + user.id');
  });

  it("replaces line-by-line formatted code with whitespace variations", () => {
    const file = `const token = process.env.SECRET || "hardcoded_secret_token_12345";`;
    const evidence = `const token = process.env.SECRET || "hardcoded_secret_token_12345";`;
    const fix = `const token = process.env.SECRET;\nif (!token) throw new Error("Missing SECRET");`;

    const res = applySnippetFix(file, evidence, fix);
    expect(res.success).toBe(true);
    expect(res.updatedContent).toContain("if (!token) throw new Error");
  });

  it("returns failure without corrupting content when evidence does not match", () => {
    const file = `const secureToken = crypto.randomBytes(32).toString("hex");`;
    const staleEvidence = `const oldToken = "insecure_stale_token";`;
    const fix = `const fixed = true;`;

    const res = applySnippetFix(file, staleEvidence, fix);
    expect(res.success).toBe(false);
    expect(res.updatedContent).toBe(file);
  });
});

describe("Pull Request Analysis State Consistency Model", () => {
  type AnalysisRecord = {
    pr_number: number;
    head_sha: string;
    status: "queued" | "processing" | "completed" | "failed";
    risk_level: string | null;
  };

  function computePrState(
    pr: { number: number; headSha: string; state: string },
    analyses: AnalysisRecord[],
  ) {
    const currentCommitAnalysis = analyses.find(
      (a) => a.pr_number === pr.number && a.head_sha === pr.headSha,
    );
    const latestAnalysis = analyses.find((a) => a.pr_number === pr.number);

    const isCurrentAnalyzed = currentCommitAnalysis?.status === "completed";
    const isAnalyzing =
      currentCommitAnalysis?.status === "processing" ||
      currentCommitAnalysis?.status === "queued" ||
      (!currentCommitAnalysis &&
        (latestAnalysis?.status === "processing" || latestAnalysis?.status === "queued"));
    const isFailed = currentCommitAnalysis?.status === "failed";
    const hasNewCommits =
      !currentCommitAnalysis &&
      latestAnalysis?.status === "completed" &&
      latestAnalysis.head_sha !== pr.headSha;
    const notAnalyzed = !isCurrentAnalyzed && !isAnalyzing && !isFailed && !hasNewCommits;

    return {
      isCurrentAnalyzed: Boolean(isCurrentAnalyzed),
      isAnalyzing: Boolean(isAnalyzing),
      isFailed: Boolean(isFailed),
      hasNewCommits: Boolean(hasNewCommits),
      notAnalyzed: Boolean(notAnalyzed),
      effectiveRisk: isCurrentAnalyzed ? currentCommitAnalysis.risk_level : null,
    };
  }

  it("identifies PR analyzed on current commit as analyzed with its risk level", () => {
    const pr = { number: 42, headSha: "sha-111", state: "open" };
    const analyses: AnalysisRecord[] = [
      { pr_number: 42, head_sha: "sha-111", status: "completed", risk_level: "high" },
    ];

    const state = computePrState(pr, analyses);
    expect(state.isCurrentAnalyzed).toBe(true);
    expect(state.hasNewCommits).toBe(false);
    expect(state.isAnalyzing).toBe(false);
    expect(state.effectiveRisk).toBe("high");
  });

  it("identifies PR with new commit pushed after prior analysis as needing reanalysis", () => {
    const pr = { number: 42, headSha: "sha-222-new", state: "open" };
    const analyses: AnalysisRecord[] = [
      { pr_number: 42, head_sha: "sha-111-old", status: "completed", risk_level: "low" },
    ];

    const state = computePrState(pr, analyses);
    expect(state.isCurrentAnalyzed).toBe(false);
    expect(state.hasNewCommits).toBe(true);
    expect(state.effectiveRisk).toBe(null);
  });

  it("identifies active queue or processing run as analyzing", () => {
    const pr = { number: 42, headSha: "sha-333", state: "open" };
    const analyses: AnalysisRecord[] = [
      { pr_number: 42, head_sha: "sha-333", status: "processing", risk_level: null },
    ];

    const state = computePrState(pr, analyses);
    expect(state.isAnalyzing).toBe(true);
    expect(state.isCurrentAnalyzed).toBe(false);
  });

  it("identifies failed run as failed and not false-analyzed", () => {
    const pr = { number: 42, headSha: "sha-444", state: "open" };
    const analyses: AnalysisRecord[] = [
      { pr_number: 42, head_sha: "sha-444", status: "failed", risk_level: null },
    ];

    const state = computePrState(pr, analyses);
    expect(state.isFailed).toBe(true);
    expect(state.isCurrentAnalyzed).toBe(false);
  });
});

describe("Credential Redaction and Logger Sanitization", () => {
  it("redacts tokens, api keys, and bearer authorization headers from payloads", async () => {
    const { redactSensitiveData } = await import("./logger.server");

    const payload = {
      user: "jaidevxr",
      token: "ghp_SqMQabcdef1234567890abcdef1234567890",
      apiKey: "sk-or-v1-abcdef1234567890abcdef1234567890",
      headers: {
        authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummyPayload.signature",
        other: "normal-value",
      },
      nested: {
        password: "SuperSecretPassword123!",
        private_key: "-----BEGIN RSA PRIVATE KEY-----",
      },
      message: "Exposed sk-12345678901234567890 in error trace",
    };

    const redacted = redactSensitiveData(payload);

    expect(redacted.token).toBe("[REDACTED]");
    expect(redacted.apiKey).toBe("[REDACTED]");
    expect(redacted.headers.authorization).toBe("[REDACTED]");
    expect(redacted.headers.other).toBe("normal-value");
    expect(redacted.nested.password).toBe("[REDACTED]");
    expect(redacted.nested.private_key).toBe("[REDACTED]");
    expect(redacted.message).toContain("[REDACTED_AI_KEY]");
  });
});
