/**
 * Deterministic risk engine.
 *
 * Every signal is derived from observed GitHub data. No randomness, no
 * fabricated values. Signals that lack supporting data are reported as
 * `insufficient_data` and excluded from the weighted score, which lowers
 * overall confidence instead of inventing a number.
 */

export const RISK_MODEL_VERSION = "risk-engine-1.1.0";

export type SignalStatus = "observed" | "insufficient_data";

export type RiskSignal = {
  id: string;
  label: string;
  kind: "observed" | "derived" | "model" | "ai";
  status: SignalStatus;
  /** Normalised 0..1 contribution. Null when status is insufficient_data. */
  value: number | null;
  weight: number;
  evidence: string;
};

export type FileChange = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
};

export type FileHistoryStat = {
  filename: string;
  /** Number of commits touching this file in the sampled window (e.g. 90 days). */
  commitCount: number;
  /** Commits whose message references a fix/bug/revert/issue closure. */
  defectCommitCount: number;
  /** Distinct authors who touched the file. */
  authorCount: number;
  /** Age of the file's oldest commit in days (true file inception age). Null when unknown. */
  ageDays: number | null;
  /** True when GitHub returned no commit history for the path. */
  insufficient: boolean;
};

export type AiFindingSummary = {
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
};

export type CoverageMetrics = {
  filesAnalyzed: number;
  totalFiles: number;
  patchesTruncated: number;
  filesSkipped: number;
};

export type RiskInput = {
  files: FileChange[];
  additions: number;
  deletions: number;
  commitCount: number;
  history: FileHistoryStat[];
  aiFindings: AiFindingSummary[];
  aiAvailable: boolean;
  coverage?: CoverageMetrics;
};

export type RiskEngineConfig = {
  weights: {
    changeSize: number;
    changeSpread: number;
    commitCount: number;
    fileChurn: number;
    defectHistory: number;
    fileAge: number;
    testChanges: number;
    dependencyChanges: number;
    aiFindings: number;
  };
  midpoints: {
    changeSize: number;
    changeSpread: number;
    commitCount: number;
    fileChurn: number;
    fileAgeYoungestDays: number;
  };
  thresholds: {
    defectRatioMultiplier: number;
    dependencyChangePenalty: number;
    targetTestToCodeRatio: number;
    riskLevels: {
      critical: number;
      high: number;
      medium: number;
    };
  };
};

export const DEFAULT_RISK_CONFIG: RiskEngineConfig = {
  weights: {
    changeSize: 0.18,
    changeSpread: 0.08,
    commitCount: 0.05,
    fileChurn: 0.2,
    defectHistory: 0.2,
    fileAge: 0.05,
    testChanges: 0.09,
    dependencyChanges: 0.05,
    aiFindings: 0.1,
  },
  midpoints: {
    changeSize: 400,
    changeSpread: 12,
    commitCount: 10,
    fileChurn: 15,
    fileAgeYoungestDays: 180,
  },
  thresholds: {
    defectRatioMultiplier: 2.0,
    dependencyChangePenalty: 0.6,
    targetTestToCodeRatio: 0.33, // 1 test file per 3 production code files
    riskLevels: {
      critical: 75,
      high: 55,
      medium: 30,
    },
  },
};

export type RiskResult = {
  score: number | null;
  level: "low" | "medium" | "high" | "critical" | null;
  confidence: number;
  signals: RiskSignal[];
  modelVersion: string;
  reasons: string[];
  coverage: CoverageMetrics;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
/** Saturating curve: 0 at 0, ~0.5 at `mid`, approaching 1. */
const saturate = (n: number, mid: number) => (n <= 0 ? 0 : clamp01(n / (n + mid)));

/**
 * Conventional-commit fix/revert prefixes, issue closing references, and git revert commits.
 * Excludes ambiguous words like "patch" or "crash" to minimize false positives.
 */
export const DEFECT_PATTERN =
  /^(?:fix|revert)(?:\([a-zA-Z0-9_.-]+\))?!?:|\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+#\d+|\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+https?:\/\/github\.com\/[^\s]+|^Revert\s+"|^This reverts commit\s+[0-9a-f]{7,40}/i;

export function isTestPath(path: string): boolean {
  return /(^|\/)(tests?|__tests__|spec)\//i.test(path) || /\.(test|spec)\.[a-z]+$/i.test(path);
}

export function isDocsPath(path: string): boolean {
  return (
    /(^|\/)(docs?|documentation)\//i.test(path) ||
    /\.(md|markdown|mdx|txt|rst|adoc)$/i.test(path) ||
    /^(LICENSE|README|CHANGELOG|CONTRIBUTING)(\.[a-z]+)?$/i.test(path.split("/").pop() ?? "")
  );
}

export function isConfigOnlyPath(path: string): boolean {
  const base = (path.split("/").pop() ?? path).toLowerCase();
  return (
    base.startsWith(".editorconfig") ||
    base.startsWith(".prettier") ||
    base.startsWith(".eslint") ||
    base.startsWith(".gitignore") ||
    base.startsWith(".gitattributes") ||
    base.startsWith("tsconfig") ||
    base.endsWith(".config.js") ||
    base.endsWith(".config.ts") ||
    base.endsWith(".config.mjs") ||
    base.endsWith(".config.json")
  );
}

export function isDependencyManifest(path: string): boolean {
  const base = path.split("/").pop() ?? path;
  return [
    "package.json",
    "package-lock.json",
    "bun.lock",
    "bun.lockb",
    "yarn.lock",
    "pnpm-lock.yaml",
    "requirements.txt",
    "poetry.lock",
    "go.mod",
    "go.sum",
    "cargo.toml",
    "cargo.lock",
    "gemfile",
    "gemfile.lock",
    "pom.xml",
    "build.gradle",
  ].includes(base.toLowerCase());
}

export function computeRisk(
  input: RiskInput,
  config: RiskEngineConfig = DEFAULT_RISK_CONFIG,
): RiskResult {
  const { files, additions, deletions, commitCount, history, aiFindings, aiAvailable, coverage } =
    input;
  const totalChanges = additions + deletions;
  const signals: RiskSignal[] = [];

  const effectiveCoverage: CoverageMetrics = coverage ?? {
    filesAnalyzed: files.length,
    totalFiles: files.length,
    patchesTruncated: 0,
    filesSkipped: 0,
  };

  // 1. Change size (observed)
  signals.push({
    id: "change_size",
    label: "Change size",
    kind: "observed",
    status: "observed",
    value: saturate(totalChanges, config.midpoints.changeSize),
    weight: config.weights.changeSize,
    evidence: `${additions} additions and ${deletions} deletions across ${files.length} file(s).`,
  });

  // 2. Change spread (observed)
  signals.push({
    id: "change_spread",
    label: "Files touched",
    kind: "observed",
    status: "observed",
    value: saturate(files.length, config.midpoints.changeSpread),
    weight: config.weights.changeSpread,
    evidence: `${files.length} file(s) modified in this pull request.`,
  });

  // 3. Commit frequency on the PR (observed)
  signals.push({
    id: "commit_count",
    label: "Commits in pull request",
    kind: "observed",
    status: "observed",
    value: saturate(commitCount, config.midpoints.commitCount),
    weight: config.weights.commitCount,
    evidence: `${commitCount} commit(s) in this pull request.`,
  });

  // 4. File churn and defect history (derived)
  const usable = history.filter((h) => !h.insufficient);
  if (usable.length === 0) {
    signals.push({
      id: "file_churn",
      label: "Historical file churn",
      kind: "derived",
      status: "insufficient_data",
      value: null,
      weight: config.weights.fileChurn,
      evidence: "Insufficient historical data in the 90-day window.",
    });
    signals.push({
      id: "defect_history",
      label: "Defect-associated history",
      kind: "derived",
      status: "insufficient_data",
      value: null,
      weight: config.weights.defectHistory,
      evidence: "Insufficient historical data to determine defect association.",
    });
    signals.push({
      id: "file_age",
      label: "File age",
      kind: "derived",
      status: "insufficient_data",
      value: null,
      weight: config.weights.fileAge,
      evidence: "Insufficient historical data to determine file inception age.",
    });
  } else {
    const avgCommits = usable.reduce((a, h) => a + h.commitCount, 0) / usable.length;
    const defectTotal = usable.reduce((a, h) => a + h.defectCommitCount, 0);
    const commitTotal = usable.reduce((a, h) => a + h.commitCount, 0);
    const defectRatio = commitTotal > 0 ? defectTotal / commitTotal : 0;
    const ages = usable.map((h) => h.ageDays).filter((a): a is number => a !== null);

    signals.push({
      id: "file_churn",
      label: "Historical file churn",
      kind: "derived",
      status: "observed",
      value: saturate(avgCommits, config.midpoints.fileChurn),
      weight: config.weights.fileChurn,
      evidence: `Changed files average ${avgCommits.toFixed(1)} commit(s) in the 90-day window (${usable.length} of ${history.length} file(s) had history).`,
    });
    signals.push({
      id: "defect_history",
      label: "Defect-associated history",
      kind: "derived",
      status: "observed",
      value: clamp01(defectRatio * config.thresholds.defectRatioMultiplier),
      weight: config.weights.defectHistory,
      evidence: `${defectTotal} of ${commitTotal} commit(s) on these files are conventional fixes, issue closures, or reverts.`,
    });
    if (ages.length === 0) {
      signals.push({
        id: "file_age",
        label: "File age",
        kind: "derived",
        status: "insufficient_data",
        value: null,
        weight: config.weights.fileAge,
        evidence: "Insufficient historical data to determine file inception age.",
      });
    } else {
      const youngest = Math.min(...ages);
      signals.push({
        id: "file_age",
        label: "File age",
        kind: "derived",
        status: "observed",
        // Inception age: newly introduced files (< 180 days) carry higher churn risk than long-lived files.
        value: clamp01(1 - saturate(youngest, config.midpoints.fileAgeYoungestDays)),
        weight: config.weights.fileAge,
        evidence: `Youngest changed file inception age is ${Math.round(youngest)} day(s).`,
      });
    }
  }

  // 5. Test coverage movement (observed)
  const testFiles = files.filter((f) => isTestPath(f.filename));
  const nonTestFiles = files.filter((f) => !isTestPath(f.filename));
  const isDocsOrConfigOnly =
    nonTestFiles.length > 0 &&
    nonTestFiles.every(
      (f) =>
        isDocsPath(f.filename) || isConfigOnlyPath(f.filename) || isDependencyManifest(f.filename),
    );

  if (nonTestFiles.length === 0) {
    // Only tests were modified
    signals.push({
      id: "test_changes",
      label: "Test changes",
      kind: "observed",
      status: "observed",
      value: 0,
      weight: config.weights.testChanges,
      evidence: "Test files updated with no production code touched.",
    });
  } else if (isDocsOrConfigOnly) {
    // Exempt docs-only and config-only PRs from test requirement
    signals.push({
      id: "test_changes",
      label: "Test changes",
      kind: "observed",
      status: "observed",
      value: 0,
      weight: config.weights.testChanges,
      evidence:
        "Documentation and configuration changes are exempt from test coverage requirements.",
    });
  } else {
    // Code files require tests; scale based on test-to-code ratio
    const testToCodeRatio = testFiles.length / nonTestFiles.length;
    const testDeficitScore = clamp01(1 - testToCodeRatio / config.thresholds.targetTestToCodeRatio);

    signals.push({
      id: "test_changes",
      label: "Test changes",
      kind: "observed",
      status: "observed",
      value: testDeficitScore,
      weight: config.weights.testChanges,
      evidence:
        testFiles.length > 0
          ? `${testFiles.length} test file(s) updated alongside ${nonTestFiles.length} code file(s) (ratio: ${(testToCodeRatio * 100).toFixed(0)}%, target: ${(config.thresholds.targetTestToCodeRatio * 100).toFixed(0)}%).`
          : `${nonTestFiles.length} code file(s) modified with 0 test files updated.`,
    });
  }

  // 6. Dependency modifications (observed)
  const depFiles = files.filter((f) => isDependencyManifest(f.filename));
  signals.push({
    id: "dependency_changes",
    label: "Dependency modifications",
    kind: "observed",
    status: "observed",
    value: depFiles.length > 0 ? config.thresholds.dependencyChangePenalty : 0,
    weight: config.weights.dependencyChanges,
    evidence:
      depFiles.length > 0
        ? `Dependency manifest changed: ${depFiles.map((f) => f.filename).join(", ")}.`
        : "No dependency manifests changed.",
  });

  // 7. AI findings (ai)
  if (!aiAvailable) {
    signals.push({
      id: "ai_findings",
      label: "AI review findings",
      kind: "ai",
      status: "insufficient_data",
      value: null,
      weight: config.weights.aiFindings,
      evidence: "AI review did not produce validated findings for this pull request.",
    });
  } else {
    const weightOf = (s: AiFindingSummary) =>
      ({ critical: 1, high: 0.75, medium: 0.4, low: 0.15 })[s.severity] * s.confidence;
    const aiScore =
      aiFindings.length === 0 ? 0 : clamp01(aiFindings.reduce((a, f) => a + weightOf(f), 0) / 2);
    signals.push({
      id: "ai_findings",
      label: "AI review findings",
      kind: "ai",
      status: "observed",
      value: aiScore,
      weight: config.weights.aiFindings,
      evidence:
        aiFindings.length === 0
          ? "AI review completed and reported no validated findings."
          : `${aiFindings.length} validated AI finding(s) on real changed lines.`,
    });
  }

  const observed = signals.filter((s) => s.status === "observed" && s.value !== null);
  const observedWeight = observed.reduce((a, s) => a + s.weight, 0);
  const totalWeight = signals.reduce((a, s) => a + s.weight, 0);

  if (observedWeight === 0) {
    return {
      score: null,
      level: null,
      confidence: 0,
      signals,
      modelVersion: RISK_MODEL_VERSION,
      reasons: [],
      coverage: effectiveCoverage,
    };
  }

  const score = Math.round(
    (observed.reduce((a, s) => a + (s.value as number) * s.weight, 0) / observedWeight) * 100,
  );

  // Compute coverage ratio: if 20 of 50 files were analyzed, confidence drops proportionally
  const coverageRatio =
    effectiveCoverage.totalFiles > 0
      ? Math.max(0.05, Math.min(1, effectiveCoverage.filesAnalyzed / effectiveCoverage.totalFiles))
      : 1;

  const confidence = Number(((observedWeight / totalWeight) * coverageRatio).toFixed(2));

  const level: RiskResult["level"] =
    score >= config.thresholds.riskLevels.critical
      ? "critical"
      : score >= config.thresholds.riskLevels.high
        ? "high"
        : score >= config.thresholds.riskLevels.medium
          ? "medium"
          : "low";

  const reasons = observed
    .filter((s) => (s.value as number) >= 0.5)
    .sort((a, b) => (b.value as number) * b.weight - (a.value as number) * a.weight)
    .slice(0, 4)
    .map((s) => `${s.label}: ${s.evidence}`);

  return {
    score,
    level,
    confidence,
    signals,
    modelVersion: RISK_MODEL_VERSION,
    reasons,
    coverage: effectiveCoverage,
  };
}
