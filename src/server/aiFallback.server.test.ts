import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { StandaloneAiProvider, runAiReview, type ModelResolver } from "./aiReview.server";

describe("AI Fallback System & Multi-Provider Resilience", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("falls back to secondary model when primary model returns 404/error", async () => {
    process.env["AI_PROVIDER"] = "openrouter";
    process.env["AI_API_KEY"] = "sk-test-key";
    process.env["AI_MODEL"] = "primary-model";

    const attempts: string[] = [];

    const mockStreamText = (({ model }: any) => {
      const modelId = model?.modelId || "unknown";
      attempts.push(modelId);

      if (modelId === "primary-model") {
        return {
          text: Promise.reject(new Error("404 Model primary-model not found")),
          usage: Promise.resolve({ inputTokens: 0, outputTokens: 0, totalTokens: 0 }),
        } as any;
      }

      // Fallback candidate succeeds
      return {
        text: Promise.resolve(
          JSON.stringify({
            findings: [
              {
                file: "src/vuln.js",
                line: 12,
                title: "SQL Injection",
                severity: "critical",
                category: "security",
                confidence: 0.95,
                problem: "Unsanitized user input in query",
                why_it_matters: "Allows arbitrary database extraction",
                evidence: "SELECT * FROM users WHERE id = " + "id",
                suggested_fix: "db.query('SELECT * FROM users WHERE id = $1', [id])",
              },
            ],
          }),
        ),
        usage: Promise.resolve({ inputTokens: 100, outputTokens: 50, totalTokens: 150 }),
      } as any;
    }) as any;

    const mockResolver: ModelResolver = (_provider, _key, modelName) => {
      return { modelId: modelName, provider: "mock" } as any;
    };

    const provider = new StandaloneAiProvider(mockResolver, mockStreamText);
    const result = await provider.review("Test prompt", "Test system");

    expect(attempts.length).toBeGreaterThanOrEqual(2);
    expect(attempts[0]).toBe("primary-model");
    expect(result.text).toContain("SQL Injection");
    expect(result.usage?.totalTokens).toBe(150);
  });

  it("falls back to next model when primary model returns empty/whitespace response", async () => {
    process.env["AI_PROVIDER"] = "openrouter";
    process.env["AI_API_KEY"] = "sk-test-key";
    process.env["AI_MODEL"] = "empty-model";

    const attempts: string[] = [];

    const mockStreamText = (({ model }: any) => {
      const modelId = model?.modelId || "unknown";
      attempts.push(modelId);

      if (modelId === "empty-model") {
        return {
          text: Promise.resolve("   \n\t  "), // Empty whitespace response
          usage: Promise.resolve({ inputTokens: 50, outputTokens: 0, totalTokens: 50 }),
        } as any;
      }

      return {
        text: Promise.resolve(
          JSON.stringify({
            findings: [],
          }),
        ),
        usage: Promise.resolve({ inputTokens: 50, outputTokens: 10, totalTokens: 60 }),
      } as any;
    }) as any;

    const mockResolver: ModelResolver = (_provider, _key, modelName) => {
      return { modelId: modelName, provider: "mock" } as any;
    };

    const provider = new StandaloneAiProvider(mockResolver, mockStreamText);
    const result = await provider.review("Test prompt", "Test system");

    expect(attempts[0]).toBe("empty-model");
    expect(attempts.length).toBeGreaterThanOrEqual(2);
    expect(result.text).toContain('"findings":[]');
  });

  it("fails fast with allCandidatesExhausted when all models in fallback chain fail", async () => {
    process.env["AI_PROVIDER"] = "openrouter";
    process.env["AI_API_KEY"] = "sk-test-key";
    process.env["AI_MODEL"] = "failing-model-1";

    const mockStreamText = (({ model }: any) => {
      return {
        text: Promise.reject(new Error(`HTTP 404 model ${model?.modelId || "unknown"} unavailable`)),
        usage: Promise.resolve({ inputTokens: 0, outputTokens: 0, totalTokens: 0 }),
      } as any;
    }) as any;

    const mockResolver: ModelResolver = (_provider, _key, modelName) => {
      return { modelId: modelName, provider: "mock" } as any;
    };

    const provider = new StandaloneAiProvider(mockResolver, mockStreamText);

    await expect(provider.review("Test prompt", "Test system")).rejects.toThrow(
      /All \d+ AI model candidates failed/,
    );

    // Verify candidate error tracking and allCandidatesExhausted flag
    try {
      await provider.review("Test prompt", "Test system");
    } catch (err: any) {
      expect(err.allCandidatesExhausted).toBe(true);
      expect(Array.isArray(err.candidateErrors)).toBe(true);
      expect(err.candidateErrors.length).toBeGreaterThan(1);
    }
  });

  it("runAiReview short-circuits attempt 2 when candidate chain is exhausted (no duplicate retry loop)", async () => {
    process.env["AI_PROVIDER"] = "openrouter";
    process.env["AI_API_KEY"] = "sk-test-key";
    process.env["AI_MODEL"] = "dead-model";

    let totalCalls = 0;
    const mockStreamText = (() => {
      totalCalls++;
      return {
        text: Promise.reject(new Error("503 Service Unavailable")),
        usage: Promise.resolve({ inputTokens: 0, outputTokens: 0, totalTokens: 0 }),
      } as any;
    }) as any;

    const mockResolver: ModelResolver = (_provider, _key, modelName) => {
      return { modelId: modelName, provider: "mock" } as any;
    };

    const provider = new StandaloneAiProvider(mockResolver, mockStreamText);
    const start = Date.now();
    const result = await runAiReview(
      {
        repoFullName: "owner/repo",
        prNumber: 1,
        prTitle: "PR",
        prBody: "desc",
        baseBranch: "main",
        headBranch: "feature",
        files: [],
        historyNotes: [],
      },
      provider,
    );

    const elapsed = Date.now() - start;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("All");
      expect(result.error).toContain("candidates failed");
    }

    // Must finish quickly without repeating attempt 2
    expect(elapsed).toBeLessThan(5000);
  });
});
