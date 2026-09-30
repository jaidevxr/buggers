import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getAnalysisSchema,
  listAnalysesSchema,
  runAnalysisSchema,
  startAnalysisSchema,
} from "@/lib/validation";

export const startAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(startAnalysisSchema)
  .handler(async ({ data, context }) => {
    const { checkUserRateLimit } = await import("@/server/rateLimit.server");
    checkUserRateLimit(`${context.userId}:startAnalysis`, 10, 60_000);

    const { githubJson } = await import("@/server/github.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const pr = await githubJson<{
      number: number;
      title: string;
      state: string;
      merged_at: string | null;
      user: { login: string } | null;
      head: { ref: string; sha: string };
      base: { ref: string };
    }>(context.userId, `/repos/${encodeURIComponent(data.repoFullName.split("/")[0]!)}/${encodeURIComponent(data.repoFullName.split("/")[1]!)}/pulls/${data.prNumber}`);

    // Idempotent per head commit: re-running on the same SHA reuses the row.
    const { data: existing } = await supabaseAdmin
      .from("analyses")
      .select("id, status")
      .eq("user_id", context.userId)
      .eq("repo_full_name", data.repoFullName)
      .eq("pr_number", data.prNumber)
      .eq("head_sha", pr.head.sha)
      .maybeSingle();

    if (existing) {
      if (existing.status === "processing") return { analysisId: existing.id, alreadyRunning: true };
      await supabaseAdmin
        .from("analyses")
        .update({
          status: "queued",
          stage: "queued",
          error_message: null,
          risk_score: null,
          risk_level: null,
          risk_confidence: null,
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return { analysisId: existing.id, alreadyRunning: false };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("analyses")
      .insert({
        user_id: context.userId,
        repo_full_name: data.repoFullName,
        pr_number: data.prNumber,
        head_sha: pr.head.sha,
        status: "queued",
        stage: "queued",
        pr_title: pr.title,
        pr_author: pr.user?.login ?? null,
        pr_state: pr.merged_at ? "merged" : pr.state,
        base_branch: pr.base.ref,
        head_branch: pr.head.ref,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { analysisId: inserted.id, alreadyRunning: false };
  });

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(runAnalysisSchema)
  .handler(async ({ data, context }) => {
    const { checkUserRateLimit } = await import("@/server/rateLimit.server");
    checkUserRateLimit(`${context.userId}:runAnalysis`, 10, 60_000);

    const { processAnalysis } = await import("@/server/analysis.server");
    await processAnalysis(context.userId, data.analysisId);
    return { ok: true };
  });

export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(getAnalysisSchema)
  .handler(async ({ data, context }) => {
    const { data: analysis, error } = await context.supabase
      .from("analyses")
      .select("*")
      .eq("id", data.analysisId)
      .maybeSingle();
    if (error) throw error;
    if (!analysis) return { analysis: null, findings: [] };

    const { data: findings, error: findingsError } = await context.supabase
      .from("findings")
      .select("*")
      .eq("analysis_id", data.analysisId)
      .order("severity", { ascending: true });
    if (findingsError) throw findingsError;
    return { analysis, findings: findings ?? [] };
  });

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(listAnalysesSchema)
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data?.repoFullName) query = query.eq("repo_full_name", data.repoFullName);
    const { data: rows, error } = await query;
    if (error) throw error;
    return { analyses: rows ?? [] };
  });

export const getDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [analyses, findings, tickets, notifications] = await Promise.all([
      context.supabase.from("analyses").select("*").order("created_at", { ascending: false }).limit(200),
      context.supabase.from("findings").select("id, severity, status, created_at, repo_full_name"),
      context.supabase.from("tickets").select("id, status"),
      context.supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (analyses.error) throw analyses.error;
    if (findings.error) throw findings.error;

    const rows = analyses.data ?? [];
    return {
      analyses: rows.slice(0, 10),
      counts: {
        analyses: rows.length,
        repositoriesAnalyzed: new Set(rows.map((a) => a.repo_full_name)).size,
        highRisk: rows.filter((a) => a.risk_level === "high" || a.risk_level === "critical").length,
        openFindings: (findings.data ?? []).filter((f) => f.status === "open").length,
        openTickets: (tickets.data ?? []).filter((t) => t.status !== "closed").length,
      },
      notifications: notifications.data ?? [],
    };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);
    if (error) throw error;
    return { ok: true };
  });
