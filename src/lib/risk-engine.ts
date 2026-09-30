/**
 * Deterministic risk engine.
 *
 * Every signal is derived from observed GitHub data. No randomness, no
 * fabricated values. Signals that lack supporting data are reported as
 * `insufficient_data` and excluded from the weighted score, which lowers
 * overall confidence instead of inventing a number.
 */

export const RISK_MODEL_VERSION = "risk-engine-1.0.0";

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
  /** Number of commits touching this file in the sampled window. */
  commitCount: number;
  /** Commits whose message references a fix/bug/revert/hotfix. */
  defectCommitCount: number;
  /** Distinct authors who touched the file. */
  authorCount: number;
  /** Age of the file's oldest sampled commit, in days. Null when unknown. */
  ageDays: number | null;
  /** True when GitHub returned no commit history for the path. */
  insufficient: boolean;
};

export type AiFindingSummary = {
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
};

export type RiskInput = {
  files: FileChange[];
  additions: number;
  deletions: number;
  commitCount: number;
  history: FileHistoryStat[];
  aiFindings: AiFindingSummary[];
  aiAvailable: boolean;
};

export type RiskResult = {
  score: number | null;
  level: "low" | "medium" | "high" | "critical" | null;
  confidence: number;
  signals: RiskSignal[];
  modelVersion: string;
  reasons: string[];
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
/** Saturating curve: 0 at 0, ~0.5 at `mid`, approaching 1. */
const saturate = (n: number, mid: number) => (n <= 0 ? 0 : clamp01(n / (n + mid)));

export const DEFECT_PATTERN = /\b(fix(e[sd])?|bug|hotfix|revert|regression|patch|crash)\b/i;

export function isTestPath(path: string) {
  return /(^|\/)(tests?|__tests__|spec)\//i.test(path) || /\.(test|spec)\.[a-z]+$/i.test(path);
}

export function isDependencyManifest(path: string) {
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

export function computeRisk(input: RiskInput): RiskResult {
  const { files, additions, deletions, commitCount, history, aiFindings, aiAvailable } = input;
  const totalChanges = additions + deletions;
  const signals: RiskSignal[] = [];

  // 1. Change size (observed)
  signals.push({
    id: "change_size",
    label: "Change size",
    kind: "observed",
    status: "observed",
    value: saturate(totalChanges, 400),
    weight: 0.18,
    evidence: `${additions} additions and ${deletions} deletions across ${files.length} file(s).`,
  });

  // 2. Change spread (observed)
  signals.push({
    id: "change_spread",
    label: "Files touched",
    kind: "observed",
    status: "observed",
    value: saturate(files.length, 12),
    weight: 0.08,
    evidence: `${files.length} file(s) modified in this pull request.`,
  });

  // 3. Commit frequency on the PR (observed)
  signals.push({
    id: "commit_count",
    label: "Commits in pull request",
    kind: "observed",
    status: "observed",
    value: saturate(commitCount, 10),
    weight: 0.05,
    evidence: `${commitCount} commit(s) in this pull request.`,
  });

  // 4. File churn history (derived)
  const usable = history.filter((h) => !h.insufficient);
  if (usable.length === 0) {
    signals.push({
      id: "file_churn",
      label: "Historical file churn",
      kind: "derived",
      status: "insufficient_data",
      value: null,
      weight: 0.2,
      evidence: "Insufficient historical data to determine this signal.",
    });
    signals.push({
      id: "defect_history",
      label: "Defect-associated history",
      kind: "derived",
      status: "insufficient_data",
      value: null,
      weight: 0.2,
      evidence: "Insufficient historical data to determine this signal.",
    });
    signals.push({
      id: "file_age",
      label: "File age",
      kind: "derived",
      status: "insufficient_data",
      value: null,
      weight: 0.05,
      evidence: "Insufficient historical data to determine this signal.",
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
      value: saturate(avgCommits, 15),
      weight: 0.2,
      evidence: `Changed files average ${avgCommits.toFixed(1)} commit(s) in the sampled history (${usable.length} of ${history.length} file(s) had history).`,
    });
    signals.push({
      id: "defect_history",
      label: "Defect-associated history",
      kind: "derived",
      status: "observed",
      value: clamp01(defectRatio * 2),
      weight: 0.2,
      evidence: `${defectTotal} of ${commitTotal} historical commit(s) on these files reference a fix, bug, or revert.`,
    });
    if (ages.length === 0) {
      signals.push({
        id: "file_age",
        label: "File age",
        kind: "derived",
        status: "insufficient_data",
        value: null,
        weight: 0.05,
        evidence: "Insufficient historical data to determine this signal.",
      });
    } else {
      const youngest = Math.min(...ages);
      signals.push({
        id: "file_age",
        label: "File age",
        kind: "derived",
        status: "observed",
        // Recently created files carry more risk than long-stable ones.
        value: clamp01(1 - saturate(youngest, 180)),
        weight: 0.05,
        evidence: `Youngest changed file has ${Math.round(youngest)} day(s) of sampled history.`,
      });
    }
  }

  // 5. Test coverage movement (observed)
  const testFiles = files.filter((f) => isTestPath(f.filename));
  const codeFiles = files.filter((f) => !isTestPath(f.filename));
  signals.push({
    id: "test_changes",
    label: "Test changes",
    kind: "observed",
    status: "observed",
    value: codeFiles.length === 0 ? 0 : testFiles.length > 0 ? 0.15 : 0.7,
    weight: 0.09,
    evidence:
      codeFiles.length === 0
        ? "No production code files changed."
        : testFiles.length > 0
          ? `${testFiles.length} test file(s) changed alongside ${codeFiles.length} code file(s).`
          : `${codeFiles.length} code file(s) changed with no test files updated.`,
  });

  // 6. Dependency modifications (observed)
  const depFiles = files.filter((f) => isDependencyManifest(f.filename));
  signals.push({
    id: "dependency_changes",
    label: "Dependency modifications",
    kind: "observed",
    status: "observed",
    value: depFiles.length > 0 ? 0.6 : 0,
    weight: 0.05,
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
      weight: 0.1,
      evidence: "AI review did not produce validated findings for this pull request.",
    });
  } else {
    const weightOf = (s: AiFindingSummary) =>
      ({ critical: 1, high: 0.75, medium: 0.4, low: 0.15 })[s.severity] * s.confidence;
    const aiScore = aiFindings.length === 0 ? 0 : clamp01(aiFindings.reduce((a, f) => a + weightOf(f), 0) / 2);
    signals.push({
      id: "ai_findings",
      label: "AI review findings",
      kind: "ai",
      status: "observed",
      value: aiScore,
      weight: 0.1,
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
    };
  }

  const score = Math.round(
    (observed.reduce((a, s) => a + (s.value as number) * s.weight, 0) / observedWeight) * 100,
  );
  const confidence = Number((observedWeight / totalWeight).toFixed(2));

  const level: RiskResult["level"] =
    score >= 75 ? "critical" : score >= 55 ? "high" : score >= 30 ? "medium" : "low";

  const reasons = observed
    .filter((s) => (s.value as number) >= 0.5)
    .sort((a, b) => (b.value as number) * b.weight - (a.value as number) * a.weight)
    .slice(0, 4)
    .map((s) => `${s.label}: ${s.evidence}`);

  return { score, level, confidence, signals, modelVersion: RISK_MODEL_VERSION, reasons };
}
