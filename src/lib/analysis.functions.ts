import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  analyzeAllPullRequestsSchema,
  getAnalysisSchema,
  listAnalysesSchema,
  postReportToGitHubPRSchema,
  runAnalysisSchema,
  startAnalysisSchema,
  startRepositoryAnalysisSchema,
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
      // Dead-run detection: if processing but heartbeat stale (>15 min), treat as retriable
      if (existing.status === "processing") {
        const { data: full } = await supabaseAdmin
          .from("analyses")
          .select("heartbeat_at, lease_expires_at, updated_at")
          .eq("id", existing.id)
          .single();
        const now = Date.now();
        const heartbeat = full?.heartbeat_at ? new Date(full.heartbeat_at).getTime() : 0;
        const leaseExp = full?.lease_expires_at ? new Date(full.lease_expires_at).getTime() : 0;
        const lastUpdate = full?.updated_at ? new Date(full.updated_at).getTime() : 0;
        const staleCutoff = 15 * 60_000; // 15 minutes

        const isAlive =
          (heartbeat > 0 && now - heartbeat < staleCutoff) ||
          (leaseExp > 0 && leaseExp > now) ||
          (lastUpdate > 0 && now - lastUpdate < staleCutoff);

        if (isAlive) {
          return { analysisId: existing.id, alreadyRunning: true };
        }
        // Dead run: fall through to re-queue below
      }
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
          stage_data: {},
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

export const startRepositoryAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(startRepositoryAnalysisSchema)
  .handler(async ({ data, context }) => {
    const { checkUserRateLimit } = await import("@/server/rateLimit.server");
    checkUserRateLimit(`${context.userId}:startRepoAnalysis`, 10, 60_000);

    const { githubJson } = await import("@/server/github.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let headSha = data.commitSha;
    let branch = data.branch;

    if (!headSha) {
      // Fetch repository default branch
      const repo = await githubJson<{ default_branch: string; owner: { login: string } }>(
        context.userId,
        `/repos/${data.repoFullName}`,
      );
      branch = branch ?? repo.default_branch ?? "main";

      const branchData = await githubJson<{ commit: { sha: string } }>(
        context.userId,
        `/repos/${data.repoFullName}/branches/${encodeURIComponent(branch)}`,
      );
      headSha = branchData.commit.sha;
    } else if (!branch) {
      branch = headSha.slice(0, 7);
    }

    const scanTitle = data.commitSha
      ? `Commit Analysis: ${data.commitMessage ? data.commitMessage.slice(0, 60) : data.commitSha.slice(0, 7)}`
      : data.targetPath
        ? `Targeted Analysis: ${data.targetPath} (${branch})`
        : `Full Codebase Analysis (${branch})`;

    const stageDataPayload: Record<string, unknown> = {
      ...(data.targetPath ? { targetPath: data.targetPath, scope: data.scope || "directory" } : {}),
      ...(data.commitSha ? { commitSha: data.commitSha, commitMessage: data.commitMessage } : {}),
    };

    // Idempotency check: see if a scan exists for this repo at pr_number = 0 and head_sha
    const { data: existing } = await supabaseAdmin
      .from("analyses")
      .select("id, status, heartbeat_at, lease_expires_at, updated_at")
      .eq("user_id", context.userId)
      .eq("repo_full_name", data.repoFullName)
      .eq("pr_number", 0)
      .eq("head_sha", headSha)
      .maybeSingle();

    if (existing) {
      if (existing.status === "processing" || existing.status === "queued") {
        const now = Date.now();
        const heartbeat = existing.heartbeat_at ? new Date(existing.heartbeat_at).getTime() : 0;
        const leaseExp = existing.lease_expires_at ? new Date(existing.lease_expires_at).getTime() : 0;
        const lastUpdate = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
        const staleCutoff = 15 * 60_000;

        const isAlive =
          (heartbeat > 0 && now - heartbeat < staleCutoff) ||
          (leaseExp > 0 && leaseExp > now) ||
          (lastUpdate > 0 && now - lastUpdate < staleCutoff);

        if (isAlive) {
          return { analysisId: existing.id, alreadyRunning: true };
        }
      }

      await supabaseAdmin
        .from("analyses")
        .update({
          status: "queued",
          stage: "queued",
          pr_title: scanTitle,
          stage_data: stageDataPayload,
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
        pr_number: 0,
        head_sha: headSha,
        status: "queued",
        stage: "queued",
        pr_title: scanTitle,
        pr_author: "Repository",
        pr_state: "repository",
        base_branch: branch,
        head_branch: branch,
        stage_data: stageDataPayload,
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
      context.supabase.from("findings").select("id, severity, category, status, created_at, repo_full_name"),
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
    const allFindings = findings.data ?? [];
    const openFindingsList = allFindings.filter((f) => f.status === "open");
    const fixedFindingsList = allFindings.filter((f) => f.status === "fixed");

    // Severity breakdown of open findings
    const severityBreakdown = {
      critical: openFindingsList.filter((f) => f.severity === "critical").length,
      high: openFindingsList.filter((f) => f.severity === "high").length,
      medium: openFindingsList.filter((f) => f.severity === "medium").length,
      low: openFindingsList.filter((f) => f.severity === "low").length,
    };

    // Category breakdown of open findings
    const categoryBreakdown: Record<string, number> = {};
    for (const f of openFindingsList) {
      const cat = f.category || "security";
      categoryBreakdown[cat] = (categoryBreakdown[cat] ?? 0) + 1;
    }

    // High risk analyses count
    const highRiskCount = rows.filter((a) => a.risk_level === "high" || a.risk_level === "critical").length;

    // Security Posture Rating
    let securityGrade: "A" | "B" | "C" | "D" = "A";
    let securityGradeLabel = "Secure";
    if (severityBreakdown.critical > 0 || highRiskCount > 2) {
      securityGrade = severityBreakdown.critical > 2 ? "D" : "C";
      securityGradeLabel = severityBreakdown.critical > 2 ? "Critical Risk" : "Attention Required";
    } else if (severityBreakdown.high > 2 || highRiskCount > 0) {
      securityGrade = "B";
      securityGradeLabel = "Good Posture";
    }

    const remediationRate = allFindings.length > 0
      ? Math.round((fixedFindingsList.length / allFindings.length) * 100)
      : 100;

    return {
      analyses: rows.slice(0, 10),
      counts: {
        analyses: rows.length,
        repositoriesAnalyzed: new Set(rows.map((a) => a.repo_full_name)).size,
        highRisk: highRiskCount,
        openFindings: openFindingsList.length,
        fixedFindings: fixedFindingsList.length,
        openTickets: (tickets.data ?? []).filter((t) => t.status !== "closed").length,
      },
      analytics: {
        securityGrade,
        securityGradeLabel,
        remediationRate,
        severityBreakdown,
        categoryBreakdown,
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

export const analyzeAllPullRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(analyzeAllPullRequestsSchema)
  .handler(async ({ data, context }) => {
    const { githubJson } = await import("@/server/github.server");
    const { processAnalysis } = await import("@/server/analysis.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch all open PRs for repository
    const [owner, repo] = data.repoFullName.split("/");
    const prs = await githubJson<
      Array<{
        number: number;
        title: string;
        state: string;
        user: { login: string } | null;
        head: { ref: string; sha: string };
        base: { ref: string };
      }>
    >(context.userId, `/repos/${encodeURIComponent(owner!)}/${encodeURIComponent(repo!)}/pulls?state=open&per_page=30`);

    const queuedPrNumbers: number[] = [];
    let alreadyAnalyzedCount = 0;
    let alreadyProcessingCount = 0;

    for (const pr of prs) {
      // Check if this head SHA already has an analysis
      const { data: existing } = await supabaseAdmin
        .from("analyses")
        .select("id, status, head_sha")
        .eq("user_id", context.userId)
        .eq("repo_full_name", data.repoFullName)
        .eq("pr_number", pr.number)
        .eq("head_sha", pr.head.sha)
        .maybeSingle();

      if (existing?.status === "completed") {
        alreadyAnalyzedCount++;
        continue;
      }

      if (existing?.status === "processing" || existing?.status === "queued") {
        const { data: full } = await supabaseAdmin
          .from("analyses")
          .select("heartbeat_at, lease_expires_at, updated_at")
          .eq("id", existing.id)
          .single();
        const now = Date.now();
        const heartbeat = full?.heartbeat_at ? new Date(full.heartbeat_at).getTime() : 0;
        const leaseExp = full?.lease_expires_at ? new Date(full.lease_expires_at).getTime() : 0;
        const lastUpdate = full?.updated_at ? new Date(full.updated_at).getTime() : 0;
        const staleCutoff = 15 * 60_000;

        const isAlive =
          (heartbeat > 0 && now - heartbeat < staleCutoff) ||
          (leaseExp > 0 && leaseExp > now) ||
          (lastUpdate > 0 && now - lastUpdate < staleCutoff);

        if (isAlive) {
          alreadyProcessingCount++;
          continue;
        }
        // Dead run: fall through to re-queue below
      }

      // If not analyzed on this commit or previous run failed, queue analysis
      let targetId = existing?.id;
      if (!targetId) {
        const { data: inserted } = await supabaseAdmin
          .from("analyses")
          .insert({
            user_id: context.userId,
            repo_full_name: data.repoFullName,
            pr_number: pr.number,
            head_sha: pr.head.sha,
            status: "queued",
            stage: "queued",
            pr_title: pr.title,
            pr_author: pr.user?.login ?? null,
            pr_state: pr.state,
            base_branch: pr.base.ref,
            head_branch: pr.head.ref,
          })
          .select("id")
          .single();
        targetId = inserted?.id;
      } else {
        await supabaseAdmin
          .from("analyses")
          .update({
            status: "queued",
            stage: "queued",
            error_message: null,
            stage_data: {},
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetId);
      }

      if (targetId) {
        queuedPrNumbers.push(pr.number);
        void processAnalysis(context.userId, targetId).catch((err) =>
          console.error(`Auto-analysis for PR #${pr.number} failed:`, err),
        );
      }
    }

    return {
      queuedCount: queuedPrNumbers.length,
      queuedPrNumbers,
      totalOpenPrs: prs.length,
      alreadyAnalyzedCount,
      alreadyProcessingCount,
    };
  });

export const postReportToGitHubPR = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(postReportToGitHubPRSchema)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { postGitHubPullRequestComment, createGitHubCommitStatus } = await import(
      "@/server/github.server"
    );

    const { data: analysis, error: aErr } = await supabaseAdmin
      .from("analyses")
      .select("*")
      .eq("id", data.analysisId)
      .eq("user_id", context.userId)
      .single();
    if (aErr || !analysis) throw new Error("Analysis not found");

    const { data: findings } = await supabaseAdmin
      .from("findings")
      .select("*")
      .eq("analysis_id", data.analysisId)
      .order("created_at", { ascending: true });

    const findingsList = findings ?? [];
    const criticalCount = findingsList.filter((f) => f.severity === "critical").length;
    const highCount = findingsList.filter((f) => f.severity === "high").length;
    const mediumCount = findingsList.filter((f) => f.severity === "medium").length;
    const lowCount = findingsList.filter((f) => f.severity === "low").length;

    const riskBadge =
      analysis.risk_level === "critical"
        ? "🔴 **CRITICAL**"
        : analysis.risk_level === "high"
        ? "🟠 **HIGH**"
        : analysis.risk_level === "medium"
        ? "🟡 **MEDIUM**"
        : "🟢 **LOW**";

    const findingsSection =
      findingsList.length === 0
        ? "✅ **No security vulnerabilities or defect risks identified.** Clean pull request!"
        : findingsList
            .map(
              (f, i) => `#### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title}
- **Location:** \`${f.file_path}${f.line_number ? `:${f.line_number}` : ""}\`
- **Category:** \`${f.category}\` (Confidence: ${Math.round((f.confidence ?? 0.8) * 100)}%)
- **Problem:** ${f.description}
- **Impact:** ${f.why_it_matters ?? "Potential security exposure"}
${f.evidence ? `\n\`\`\`\n${f.evidence}\n\`\`\`` : ""}
${f.suggested_fix ? `\n**Suggested Fix Available:**\n\`\`\`\n${f.suggested_fix}\n\`\`\`` : ""}`,
            )
            .join("\n\n---\n\n");

    const commentBody = `## 🛡️ Buggers Security Analysis Report

| Metric | Assessment |
| :--- | :--- |
| **Risk Score** | **${analysis.risk_score ?? 0} / 100** (${riskBadge}) |
| **Model** | \`${analysis.model_version ?? "risk-engine-1.1.0"}\` (${Math.round(Number(analysis.risk_confidence ?? 1) * 100)}% confidence) |
| **Files Analyzed** | ${analysis.changed_files ?? 0} files (+${analysis.additions ?? 0} / -${analysis.deletions ?? 0}) |
| **Security Findings** | **${findingsList.length}** (${criticalCount} Critical, ${highCount} High, ${mediumCount} Medium, ${lowCount} Low) |

### Findings & Remediation Details
${findingsSection}

---
*Report posted automatically by [Buggers AI Security Platform](http://localhost:8080/analysis/${analysis.id})*`;

    const res = await postGitHubPullRequestComment(
      context.userId,
      analysis.repo_full_name,
      analysis.pr_number,
      commentBody,
    );

    // Update commit status on GitHub using configured quality gate policy
    if (analysis.head_sha) {
      const { evaluateQualityGate, DEFAULT_SECURITY_POLICY } = await import(
        "@/lib/security-policy"
      );
      const qualityGate = evaluateQualityGate(DEFAULT_SECURITY_POLICY, {
        riskScore: analysis.risk_score ?? 0,
        findings: findingsList.map((f) => ({
          severity: f.severity,
          category: f.category,
        })),
      });
      await createGitHubCommitStatus(
        context.userId,
        analysis.repo_full_name,
        analysis.head_sha,
        qualityGate.status,
        qualityGate.summary.slice(0, 140),
        `http://localhost:8080/analysis/${analysis.id}`,
      );
    }

    return { ok: true, commentUrl: res.commentUrl };
  });

