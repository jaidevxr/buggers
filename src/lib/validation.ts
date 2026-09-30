import { z } from "zod";

/**
 * Strict regex for GitHub repository full names: "owner/repo".
 * Allows alphanumeric characters, hyphens, underscores, and dots.
 */
export const REPO_FULL_NAME_REGEX = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export const repoFullNameSchema = z
  .string()
  .trim()
  .regex(REPO_FULL_NAME_REGEX, "Repository name must be in the format 'owner/repo'");

export const prNumberSchema = z
  .number()
  .int("PR number must be an integer")
  .positive("PR number must be positive");

export const uuidSchema = z.string().uuid("Invalid identifier format");

export const startAnalysisSchema = z.object({
  repoFullName: repoFullNameSchema,
  prNumber: prNumberSchema,
});

export const runAnalysisSchema = z.object({
  analysisId: uuidSchema,
});

export const getAnalysisSchema = z.object({
  analysisId: uuidSchema,
});

export const listAnalysesSchema = z
  .object({
    repoFullName: repoFullNameSchema.optional(),
  })
  .optional()
  .default({});

export const getFindingSchema = z.object({
  findingId: uuidSchema,
});

export const updateFindingStatusSchema = z.object({
  findingId: uuidSchema,
  status: z.enum(["open", "reviewed", "false_positive", "fixed"]),
});

export const createTicketFromFindingSchema = z.object({
  findingId: uuidSchema,
  assignee: z.string().trim().max(100).optional(),
});

export const updateTicketSchema = z.object({
  ticketId: uuidSchema,
  status: z.enum(["open", "in_progress", "closed"]).optional(),
  assignee: z.string().trim().max(100).nullable().optional(),
});

export const completeGitHubConnectSchema = z.object({
  code: z.string().trim().min(1, "OAuth code cannot be empty"),
});

export const listPullRequestsSchema = z.object({
  repoFullName: repoFullNameSchema,
  state: z.enum(["open", "closed", "all"]).optional(),
});

export const repositoryOverviewSchema = z.object({
  repoFullName: repoFullNameSchema,
});

export const pullRequestDetailSchema = z.object({
  repoFullName: repoFullNameSchema,
  prNumber: prNumberSchema,
});

export const userSettingsSchema = z.object({
  notify_high_risk: z.boolean(),
  notify_analysis_complete: z.boolean(),
  min_confidence: z.number().min(0).max(1),
  include_low_severity: z.boolean(),
  max_diff_files: z.number().int().min(1).max(200),
  store_code_snippets: z.boolean(),
});

export const aiFindingSchema = z.object({
  file: z.string().trim().min(1),
  line: z.number().int().nullable().optional(),
  title: z.string().trim().min(1).max(300),
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.enum([
    "bug",
    "security",
    "performance",
    "correctness",
    "maintainability",
    "testing",
    "dependency",
  ]),
  confidence: z.number().min(0).max(1),
  problem: z.string().trim().min(1),
  why_it_matters: z.string().trim().optional().default(""),
  evidence: z.string().trim().optional().default(""),
  suggested_fix: z.string().trim().optional().default(""),
});

export const aiReviewOutputSchema = z.object({
  findings: z.array(aiFindingSchema).max(25),
});
