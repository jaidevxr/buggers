import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

export type RawAiFinding = {
  file: string;
  line: number | null;
  title: string;
  severity: string;
  category: string;
  confidence: number;
  problem: string;
  why_it_matters: string;
  evidence: string;
  suggested_fix: string;
};

export type AiReviewResult =
  | { ok: true; findings: RawAiFinding[] }
  | { ok: false; error: string };

export type DiffFileForReview = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string | undefined;
};

function buildPrompt(args: {
  repoFullName: string;
  prNumber: number;
  prTitle: string;
  prBody: string | null;
  baseBranch: string;
  headBranch: string;
  files: DiffFileForReview[];
  historyNotes: string[];
}) {
  const diff = args.files
    .map(
      (f) =>
        `--- FILE: ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})\n${
          f.patch ? f.patch.slice(0, 12000) : "[no textual patch available]"
        }`,
    )
    .join("\n\n");

  return [
    `Repository: ${args.repoFullName}`,
    `Pull request #${args.prNumber}: ${args.prTitle}`,
    `Branch: ${args.headBranch} -> ${args.baseBranch}`,
    `Description: ${args.prBody?.slice(0, 4000) || "(no description provided)"}`,
    args.historyNotes.length
      ? `Repository history signals:\n${args.historyNotes.map((n) => `- ${n}`).join("\n")}`
      : "Repository history signals: none available.",
    "",
    "Unified diff of the pull request:",
    diff,
  ].join("\n");
}

const SYSTEM = `You are a precise senior code reviewer performing bug triage on a real pull request.

Rules you must never break:
- Only reference files that appear in the provided diff, using their exact path.
- Only reference line numbers that appear as added or context lines in that file's patch hunks.
- Never invent functions, APIs, dependencies, repository facts, or code that is not in the diff.
- If the diff does not support a concern, do not report it. Reporting nothing is correct when the change is clean.
- Report at most 12 findings, ordered by severity.

Return ONLY a JSON object, no markdown fences, with this exact shape:
{"findings":[{"file":"path/from/diff","line":123,"title":"short title","severity":"critical|high|medium|low","category":"bug|security|performance|correctness|maintainability|testing|dependency","confidence":0.0,"problem":"what is wrong","why_it_matters":"impact","evidence":"quote the exact diff line(s) supporting this","suggested_fix":"concrete fix"}]}
confidence is a number between 0 and 1. line may be null only when the concern applies to the whole file.`;

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("AI response was not valid JSON.");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

export async function runAiReview(args: {
  repoFullName: string;
  prNumber: number;
  prTitle: string;
  prBody: string | null;
  baseBranch: string;
  headBranch: string;
  files: DiffFileForReview[];
  historyNotes: string[];
}): Promise<AiReviewResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, error: "AI review is not configured." };

  const runIdFetch = createRunIdFetch();
  const provider = createOpenAI({
    apiKey,
    baseURL: GATEWAY_URL,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: SYSTEM,
      prompt: buildPrompt(args),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "medium",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const text = await result.text;
    const parsed = extractJson(text) as { findings?: unknown };
    const findings = Array.isArray(parsed.findings) ? (parsed.findings as RawAiFinding[]) : [];
    return { ok: true, findings };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("AI review failed:", message);
    return { ok: false, error: message };
  }
}

/** Parse a unified diff patch into the set of line numbers present in the new file. */
export function patchLineNumbers(patch: string | undefined): Set<number> {
  const lines = new Set<number>();
  if (!patch) return lines;
  let current = 0;
  for (const line of patch.split("\n")) {
    const header = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (header) {
      current = Number(header[1]);
      continue;
    }
    if (line.startsWith("-")) continue;
    if (line.startsWith("+") || line.startsWith(" ")) {
      lines.add(current);
      current += 1;
    }
  }
  return lines;
}

const SEVERITIES = ["critical", "high", "medium", "low"] as const;

/** Drop anything the AI invented: unknown files, lines outside the diff, bad enums. */
export function validateAiFindings(
  raw: RawAiFinding[],
  files: DiffFileForReview[],
): { valid: RawAiFinding[]; rejected: number } {
  const byFile = new Map(files.map((f) => [f.filename, patchLineNumbers(f.patch)]));
  const valid: RawAiFinding[] = [];
  let rejected = 0;

  for (const f of raw) {
    if (!f || typeof f !== "object") {
      rejected++;
      continue;
    }
    const lineSet = byFile.get(f.file);
    const severity = String(f.severity ?? "").toLowerCase();
    const confidence = Number(f.confidence);
    const line = f.line == null ? null : Number(f.line);

    if (!lineSet) {
      rejected++;
      continue;
    }
    if (!SEVERITIES.includes(severity as (typeof SEVERITIES)[number])) {
      rejected++;
      continue;
    }
    if (!f.title || !f.problem) {
      rejected++;
      continue;
    }
    if (line !== null && (!Number.isFinite(line) || (lineSet.size > 0 && !lineSet.has(line)))) {
      rejected++;
      continue;
    }
    valid.push({
      ...f,
      severity,
      line,
      confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5,
      category: String(f.category ?? "correctness").toLowerCase(),
    });
  }
  return { valid, rejected };
}
