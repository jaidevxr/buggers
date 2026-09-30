import { describe, it, expect } from "vitest";
import {
  computeRisk,
  DEFECT_PATTERN,
  isTestPath,
  isDocsPath,
  isConfigOnlyPath,
  isDependencyManifest,
  type RiskInput,
} from "./risk-engine";
import { patchLineNumbers, validateAiFindings, type RawAiFinding } from "../server/aiReview.server";

describe("risk-engine: pattern detection helpers", () => {
  it("identifies defect commits correctly", () => {
    expect(DEFECT_PATTERN.test("fix: handle null pointer")).toBe(true);
    expect(DEFECT_PATTERN.test("fix(auth): fix token expiry")).toBe(true);
    expect(DEFECT_PATTERN.test("revert: undo broken refactor")).toBe(true);
    expect(DEFECT_PATTERN.test("feat: awesome new feature, closes #142")).toBe(true);
    expect(DEFECT_PATTERN.test('Revert "feat: breaking change"')).toBe(true);

    // Noisy words should not match
    expect(DEFECT_PATTERN.test("feat: add patch utility")).toBe(false);
    expect(DEFECT_PATTERN.test("chore: investigate crash report")).toBe(false);
    expect(DEFECT_PATTERN.test("docs: update README")).toBe(false);
  });

  it("identifies test files", () => {
    expect(isTestPath("src/lib/risk-engine.test.ts")).toBe(true);
    expect(isTestPath("tests/auth.spec.js")).toBe(true);
    expect(isTestPath("src/__tests__/app.ts")).toBe(true);
    expect(isTestPath("src/lib/risk-engine.ts")).toBe(false);
  });

  it("identifies docs paths", () => {
    expect(isDocsPath("docs/architecture.md")).toBe(true);
    expect(isDocsPath("README.md")).toBe(true);
    expect(isDocsPath("LICENSE")).toBe(true);
    expect(isDocsPath("src/index.ts")).toBe(false);
  });

  it("identifies config paths and dependency manifests", () => {
    expect(isConfigOnlyPath(".prettierrc")).toBe(true);
    expect(isConfigOnlyPath("tsconfig.json")).toBe(true);
    expect(isDependencyManifest("package.json")).toBe(true);
    expect(isDependencyManifest("Cargo.toml")).toBe(true);
    expect(isDependencyManifest("src/app.ts")).toBe(false);
  });
});

describe("risk-engine: computeRisk deterministic scoring", () => {
  it("returns low risk for small, clean, docs-only PR", () => {
    const input: RiskInput = {
      files: [
        { filename: "README.md", status: "modified", additions: 5, deletions: 1, changes: 6 },
      ],
      additions: 5,
      deletions: 1,
      commitCount: 1,
      history: [
        {
          filename: "README.md",
          commitCount: 3,
          defectCommitCount: 0,
          authorCount: 2,
          ageDays: 120,
          insufficient: false,
        },
      ],
      aiFindings: [],
      aiAvailable: true,
      coverage: {
        filesAnalyzed: 1,
        totalFiles: 1,
        patchesTruncated: 0,
        filesSkipped: 0,
      },
    };

    const result = computeRisk(input);
    expect(result.level).toBe("low");
    expect(result.score).toBeLessThan(30);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("exempts docs/config-only PRs from test penalty", () => {
    const input: RiskInput = {
      files: [
        { filename: "docs/spec.md", status: "modified", additions: 50, deletions: 0, changes: 50 },
      ],
      additions: 50,
      deletions: 0,
      commitCount: 1,
      history: [],
      aiFindings: [],
      aiAvailable: false,
    };

    const result = computeRisk(input);
    const testSignal = result.signals.find((s) => s.id === "test_changes");
    expect(testSignal?.value).toBe(0);
    expect(testSignal?.evidence).toContain("exempt from test coverage requirements");
  });

  it("penalizes high churn and high defect history files", () => {
    const input: RiskInput = {
      files: [
        {
          filename: "src/critical.ts",
          status: "modified",
          additions: 250,
          deletions: 150,
          changes: 400,
        },
      ],
      additions: 250,
      deletions: 150,
      commitCount: 8,
      history: [
        {
          filename: "src/critical.ts",
          commitCount: 45,
          defectCommitCount: 25,
          authorCount: 12,
          ageDays: 200,
          insufficient: false,
        },
      ],
      aiFindings: [
        { severity: "critical", confidence: 0.9 },
        { severity: "high", confidence: 0.8 },
      ],
      aiAvailable: true,
    };

    const result = computeRisk(input);
    expect(result.level === "high" || result.level === "critical").toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });
});

describe("aiReview: validation and patchLineNumbers", () => {
  const samplePatch = `@@ -10,4 +10,6 @@
 context line
-old line
+new line 11
+new line 12
 context line 13`;

  it("extracts line numbers correctly from unified diff patch", () => {
    const lines = patchLineNumbers(samplePatch);
    expect(lines.has(10)).toBe(true);
    expect(lines.has(11)).toBe(true);
    expect(lines.has(12)).toBe(true);
    expect(lines.has(13)).toBe(true);
    expect(lines.has(99)).toBe(false);
  });

  it("drops findings for non-existent files or invalid lines", () => {
    const rawFindings: RawAiFinding[] = [
      {
        file: "unknown.ts",
        line: 10,
        title: "Ghost file finding",
        severity: "high",
        category: "bug",
        confidence: 0.8,
        problem: "Not in diff",
        why_it_matters: "",
        evidence: "",
        suggested_fix: "",
      },
      {
        file: "src/app.ts",
        line: 999, // Outside patch line numbers
        title: "Bad line finding",
        severity: "medium",
        category: "correctness",
        confidence: 0.7,
        problem: "Line out of bounds",
        why_it_matters: "",
        evidence: "new line 11",
        suggested_fix: "",
      },
      {
        file: "src/app.ts",
        line: 11,
        title: "Valid finding",
        severity: "high",
        category: "bug",
        confidence: 0.9,
        problem: "Valid issue on line 11",
        why_it_matters: "Matters",
        evidence: "new line 11",
        suggested_fix: "Fix it",
      },
    ];

    const files = [
      {
        filename: "src/app.ts",
        status: "modified",
        additions: 2,
        deletions: 1,
        patch: samplePatch,
      },
    ];

    const result = validateAiFindings(rawFindings, files);
    expect(result.valid).toHaveLength(1);
    expect(result.rejected).toBe(2);
    expect(result.valid[0]?.title).toBe("Valid finding");
  });

  it("rejects findings for patchless files", () => {
    const rawFindings: RawAiFinding[] = [
      {
        file: "binary.png",
        line: null,
        title: "Binary issue",
        severity: "low",
        category: "maintainability",
        confidence: 0.5,
        problem: "Image issue",
        why_it_matters: "",
        evidence: "",
        suggested_fix: "",
      },
    ];

    const files = [
      {
        filename: "binary.png",
        status: "added",
        additions: 0,
        deletions: 0,
        patch: undefined,
      },
    ];

    const result = validateAiFindings(rawFindings, files);
    expect(result.valid).toHaveLength(0);
    expect(result.rejected).toBe(1);
  });
});
