import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { StandaloneAiProvider, runAiReview, type AiReviewProvider } from "./aiReview.server";
import { computeRisk } from "@/lib/risk-engine";

describe("Standalone AI Provider & Risk Engine Boundary", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env["AI_PROVIDER"];
    delete process.env["AI_API_KEY"];
    delete process.env["OPENAI_API_KEY"];
    delete process.env["ANTHROPIC_API_KEY"];
    delete process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    delete process.env["AI_MODEL"];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("Provider Switching by Environment", () => {
    it("defaults to openai provider with gpt-4o", () => {
      const provider = new StandaloneAiProvider();
      expect(provider.provider).toBe("openai");
      expect(provider.model).toBe("gpt-4o");
      expect(provider.isConfigured()).toBe(false);
    });

    it("configures anthropic provider and reads ANTHROPIC_API_KEY", () => {
      process.env["AI_PROVIDER"] = "anthropic";
      process.env["ANTHROPIC_API_KEY"] = "sk-ant-test-key";
      const provider = new StandaloneAiProvider();
      expect(provider.provider).toBe("anthropic");
      expect(provider.model).toBe("claude-3-5-sonnet-latest");
      expect(provider.isConfigured()).toBe(true);
    });

    it("configures google provider and reads GOOGLE_GENERATIVE_AI_API_KEY", () => {
      process.env["AI_PROVIDER"] = "google";
      process.env["GOOGLE_GENERATIVE_AI_API_KEY"] = "google-test-key";
      const provider = new StandaloneAiProvider();
      expect(provider.provider).toBe("google");
      expect(provider.model).toBe("gemini-1.5-pro");
      expect(provider.isConfigured()).toBe(true);
    });

    it("allows custom AI_MODEL override for any provider", () => {
      process.env["AI_PROVIDER"] = "openai";
      process.env["AI_API_KEY"] = "sk-openai-custom";
      process.env["AI_MODEL"] = "gpt-4o-mini";
      const provider = new StandaloneAiProvider();
      expect(provider.model).toBe("gpt-4o-mini");
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe("Unconfigured Provider Behavior", () => {
    it("gracefully returns ok: false without crashing when unconfigured", async () => {
      const result = await runAiReview({
        repoFullName: "owner/repo",
        prNumber: 42,
        prTitle: "Update readme",
        prBody: "Clean docs",
        baseBranch: "main",
        headBranch: "feature",
        files: [],
        historyNotes: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("missing AI_API_KEY");
      }
    });

    it("marks AI signal as insufficient_data when AI review is unavailable", () => {
      const risk = computeRisk({
        files: [
          {
            filename: "src/index.ts",
            status: "modified",
            additions: 10,
            deletions: 5,
            changes: 15,
          },
        ],
        additions: 10,
        deletions: 5,
        commitCount: 2,
        history: [],
        aiFindings: [],
        aiAvailable: false, // Provider unconfigured
      });

      const aiSignal = risk.signals.find((s) => s.id === "ai_findings");
      expect(aiSignal).toBeDefined();
      expect(aiSignal?.status).toBe("insufficient_data");
      expect(aiSignal?.value).toBeNull();
      // Risk score should still compute deterministically from heuristics
      expect(risk.score).toBeGreaterThanOrEqual(0);
      expect(risk.score).toBeLessThanOrEqual(100);
    });
  });

  describe("Mocked AI Review Integration", () => {
    it("processes valid structured findings with custom provider mock", async () => {
      const mockProvider: AiReviewProvider = {
        review: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            findings: [
              {
                file: "src/api.ts",
                line: 10,
                title: "Potential memory leak",
                severity: "high",
                category: "bug",
                confidence: 0.85,
                problem: "Listener not removed",
                why_it_matters: "Leaks memory over time",
                evidence: "emitter.on('data', handler)",
                suggested_fix: "Remove listener in finally block",
              },
            ],
          }),
          usage: {
            promptTokens: 120,
            completionTokens: 80,
            totalTokens: 200,
          },
        }),
      };

      const result = await runAiReview(
        {
          repoFullName: "owner/repo",
          prNumber: 10,
          prTitle: "Feature PR",
          prBody: "Some body",
          baseBranch: "main",
          headBranch: "feat",
          files: [],
          historyNotes: [],
        },
        mockProvider,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.findings).toHaveLength(1);
        expect(result.findings[0]?.title).toBe("Potential memory leak");
        expect(result.usage?.totalTokens).toBe(200);
      }
    });
  });
});
