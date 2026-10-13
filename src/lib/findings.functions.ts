import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  applyBatchFindingFixesSchema,
  applyFindingFixSchema,
  createTicketFromFindingSchema,
  getFindingSchema,
  updateFindingStatusSchema,
  updateTicketSchema,
} from "@/lib/validation";

export const listFindings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("findings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return { findings: data ?? [] };
  });

export const getFinding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(getFindingSchema)
  .handler(async ({ data, context }) => {
    const { data: finding, error } = await context.supabase
      .from("findings")
      .select("*")
      .eq("id", data.findingId)
      .maybeSingle();
    if (error) throw error;
    if (!finding) return { finding: null, ticket: null, analysis: null };

    const [{ data: ticket }, { data: analysis }] = await Promise.all([
      context.supabase.from("tickets").select("*").eq("finding_id", data.findingId).maybeSingle(),
      context.supabase.from("analyses").select("*").eq("id", finding.analysis_id).maybeSingle(),
    ]);
    return { finding, ticket: ticket ?? null, analysis: analysis ?? null };
  });

export const updateFindingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(updateFindingStatusSchema)
  .handler(async ({ data, context }) => {
    const updatePayload: { status: string; updated_at: string; source?: string } = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    if (data.status === "fixed") {
      updatePayload.source = "manual";
    }
    const { error } = await context.supabase
      .from("findings")
      .update(updatePayload)
      .eq("id", data.findingId);
    if (error) throw error;

    if (data.status === "fixed") {
      await context.supabase
        .from("tickets")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("finding_id", data.findingId);
    }
    return { ok: true };
  });

export const createTicketFromFinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(createTicketFromFindingSchema)
  .handler(async ({ data, context }) => {
    // Check if a ticket for this finding already exists (idempotent creation)
    const { data: existingTicket } = await context.supabase
      .from("tickets")
      .select("*")
      .eq("finding_id", data.findingId)
      .maybeSingle();

    if (existingTicket) {
      return { ticket: existingTicket };
    }

    const { data: finding, error: findingError } = await context.supabase
      .from("findings")
      .select("*")
      .eq("id", data.findingId)
      .maybeSingle();
    if (findingError) throw findingError;
    if (!finding) throw new Error("Finding not found.");

    const { data: ticket, error } = await context.supabase
      .from("tickets")
      .insert({
        user_id: context.userId,
        finding_id: finding.id,
        title: finding.title,
        repo_full_name: finding.repo_full_name,
        pr_number: finding.pr_number,
        severity: finding.severity,
        status: "open",
        assignee: data.assignee ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;

    let gitHubIssueUrl: string | undefined;
    if (data.createGitHubIssue && finding.repo_full_name) {
      try {
        const { createGitHubIssue } = await import("@/server/github.server");
        const issueBody = `## 🛡️ Buggers Security Ticket: ${finding.title}

- **Severity:** \`${finding.severity.toUpperCase()}\`
- **Category:** \`${finding.category}\`
- **File Location:** \`${finding.file_path}${finding.line_number ? `:${finding.line_number}` : ""}\`
- **Originating PR:** #${finding.pr_number}

### Problem Summary
${finding.description}

### Security Impact
${finding.why_it_matters || "Security vulnerability requiring remediation."}

${finding.evidence ? `### Vulnerable Code Snippet\n\`\`\`\n${finding.evidence}\n\`\`\`` : ""}

${finding.suggested_fix ? `### Recommended Fix\n\`\`\`\n${finding.suggested_fix}\n\`\`\`` : ""}

---
*Tracked via Buggers Security Review Platform*`;

        const res = await createGitHubIssue(
          context.userId,
          finding.repo_full_name,
          `[Security ${finding.severity.toUpperCase()}] ${finding.title}`,
          issueBody,
          ["security", "buggers", `severity-${finding.severity}`],
        );
        gitHubIssueUrl = res.issueUrl;
      } catch (err) {
        console.warn("Failed to create GitHub Issue:", err);
      }
    }

    return { ticket, gitHubIssueUrl };
  });

export const listTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { tickets: data ?? [] };
  });

export const updateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(updateTicketSchema)
  .handler(async ({ data, context }) => {
    const patch: { updated_at: string; status?: string; assignee?: string | null } = { updated_at: new Date().toISOString() };
    if (data.status) patch.status = data.status;
    if (data.assignee !== undefined) patch.assignee = data.assignee;
    const { error } = await context.supabase.from("tickets").update(patch).eq("id", data.ticketId);
    if (error) throw error;
    return { ok: true };
  });

export const applyFindingFixToGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(applyFindingFixSchema)
  .handler(async ({ data, context }) => {
    // 1. Get finding
    const { data: finding, error: findingError } = await context.supabase
      .from("findings")
      .select("*")
      .eq("id", data.findingId)
      .maybeSingle();
    if (findingError) throw findingError;
    if (!finding) throw new Error("Finding not found.");
    if (!finding.suggested_fix && !data.customFix) {
      throw new Error("No suggested fix available for this finding.");
    }

    // 2. Get analysis to find repository and branch
    const { data: analysis, error: analysisError } = await context.supabase
      .from("analyses")
      .select("repo_full_name, head_branch, pr_number")
      .eq("id", finding.analysis_id)
      .maybeSingle();
    if (analysisError) throw analysisError;
    if (!analysis) throw new Error("Analysis not found.");
    if (!analysis.head_branch) throw new Error("PR head branch is not recorded for this analysis.");

    const { getGitHubFileContent, commitFileToGitHub, githubJson } = await import("@/server/github.server");

    // Validate PR state on GitHub before committing fix
    let prHeadBranch = analysis.head_branch;
    let livePrState: string | null = null;
    try {
      const livePr = await githubJson<{
        state: string;
        head: { ref: string; sha: string };
        base: { ref: string };
      }>(context.userId, `/repos/${analysis.repo_full_name}/pulls/${analysis.pr_number}`);
      livePrState = livePr.state;
      prHeadBranch = livePr.head.ref;
    } catch (e) {
      console.warn("Could not pre-verify live PR state on GitHub, using recorded branch:", e);
    }

    if (livePrState !== null && livePrState !== "open") {
      throw new Error(
        `Pull request #${analysis.pr_number} is ${livePrState}. Automated security fixes can only be committed to open pull requests.`,
      );
    }

    const branch = prHeadBranch;

    // 3. Fetch existing file content from GitHub branch
    const { sha: fileSha, content: currentContent } = await getGitHubFileContent(
      context.userId,
      analysis.repo_full_name,
      finding.file_path,
      branch,
    );

    // 4. Perform code substitution
    let updatedContent = currentContent;
    const evidence = (finding.evidence ?? "").trim();
    const fix = (data.customFix?.trim() || finding.suggested_fix || "").trim();

    if (evidence && currentContent.includes(evidence)) {
      updatedContent = currentContent.replace(evidence, fix);
    } else if (evidence) {
      // Try line-by-line whitespace-trimmed match
      const lines = currentContent.split("\n");
      const evLines = evidence.split("\n").map((l) => l.trim()).filter(Boolean);
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
        lines.splice(foundIdx, evLines.length, fix);
        updatedContent = lines.join("\n");
      } else if (finding.line_number && finding.line_number <= lines.length) {
        // Fallback to line_number
        const idx = Math.max(0, finding.line_number - 1);
        lines[idx] = fix;
        updatedContent = lines.join("\n");
      } else {
        throw new Error("Could not automatically locate the exact code snippet in the file. Please review the diff manually.");
      }
    } else {
      throw new Error("No evidence code snippet available to locate the vulnerable lines.");
    }

    // 5. Commit directly to GitHub branch
    const commitMsg = `fix: ${finding.title} [Buggers Security Fix]`;
    const result = await commitFileToGitHub({
      userId: context.userId,
      repoFullName: analysis.repo_full_name,
      branch,
      filePath: finding.file_path,
      content: updatedContent,
      commitMessage: commitMsg,
      fileSha,
    });

    // 6. Mark finding as fixed in database with automated_fix source
    await context.supabase
      .from("findings")
      .update({
        status: "fixed",
        source: "automated_fix",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.findingId);

    // Also close any linked ticket
    await context.supabase
      .from("tickets")
      .update({
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("finding_id", data.findingId);

    // 7. Automatically analyze the new commit!
    let newAnalysisId: string | null = null;
    try {
      const { githubJson } = await import("@/server/github.server");
      const { processAnalysis } = await import("@/server/analysis.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const pr = await githubJson<{
        number: number;
        title: string;
        state: string;
        user: { login: string } | null;
        head: { ref: string; sha: string };
        base: { ref: string };
      }>(context.userId, `/repos/${analysis.repo_full_name}/pulls/${analysis.pr_number}`);

      const { data: inserted } = await supabaseAdmin
        .from("analyses")
        .insert({
          user_id: context.userId,
          repo_full_name: analysis.repo_full_name,
          pr_number: analysis.pr_number,
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

      if (inserted) {
        newAnalysisId = inserted.id;
        void processAnalysis(context.userId, inserted.id).catch((err) =>
          console.error("Auto-analysis failed:", err),
        );
      }
    } catch (e) {
      console.warn("Could not auto-trigger analysis for new commit:", e);
    }

    return {
      ok: true,
      commitUrl: result.commitUrl,
      branch: analysis.head_branch,
      newAnalysisId,
    };
  });

export const applyBatchFindingFixesToGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(applyBatchFindingFixesSchema)
  .handler(async ({ data, context }) => {
    const { getGitHubFileContent, commitFileToGitHub, githubJson } = await import(
      "@/server/github.server"
    );

    // 1. Get analysis details
    const { data: analysis, error: analysisError } = await context.supabase
      .from("analyses")
      .select("id, repo_full_name, head_branch, head_sha, pr_number")
      .eq("id", data.analysisId)
      .maybeSingle();
    if (analysisError) throw analysisError;
    if (!analysis) throw new Error("Analysis record not found.");
    if (!analysis.head_branch) throw new Error("PR head branch is not recorded for this analysis.");

    // 2. Validate repository and target PR status on GitHub before any write
    let prHeadBranch = analysis.head_branch;
    let livePrState: string | null = null;
    try {
      const livePr = await githubJson<{
        state: string;
        head: { ref: string; sha: string };
        base: { ref: string };
      }>(context.userId, `/repos/${analysis.repo_full_name}/pulls/${analysis.pr_number}`);
      livePrState = livePr.state;
      prHeadBranch = livePr.head.ref;
    } catch (e) {
      // If live PR fetch failed due to permissions or rate limits, log and proceed with recorded head_branch
      console.warn("Could not pre-verify live PR state on GitHub, using recorded branch:", e);
    }

    if (livePrState !== null && livePrState !== "open") {
      throw new Error(
        `Pull request #${analysis.pr_number} is ${livePrState}. Automated security fixes can only be committed to open pull requests.`,
      );
    }

    const branch = prHeadBranch;

    // 3. Fetch all open findings with validated suggested fixes
    let query = context.supabase
      .from("findings")
      .select("*")
      .eq("analysis_id", data.analysisId)
      .eq("status", "open")
      .not("suggested_fix", "is", null);

    if (data.findingIds && data.findingIds.length > 0) {
      query = query.in("id", data.findingIds);
    }

    const { data: rawFindings, error: findingsError } = await query;
    if (findingsError) throw findingsError;

    const findings = (rawFindings ?? []).filter(
      (f) => typeof f.suggested_fix === "string" && f.suggested_fix.trim().length > 0,
    );

    if (findings.length === 0) {
      return {
        ok: true,
        appliedCount: 0,
        failedCount: 0,
        totalEligible: 0,
        message: "All findings have already been remediated or have no automated fixes available.",
        modifiedFiles: [],
        branch,
        results: [],
      };
    }

    // 4. Group findings by file_path
    const fileMap = new Map<string, typeof findings>();
    for (const f of findings) {
      const list = fileMap.get(f.file_path) ?? [];
      list.push(f);
      fileMap.set(f.file_path, list);
    }

    const modifiedFiles: string[] = [];
    const fixedFindingIds: string[] = [];
    const results: Array<{
      id: string;
      title: string;
      filePath: string;
      status: "applied" | "failed";
      reason?: string;
    }> = [];

    // 5. Process each file safely
    for (const [filePath, fileFindings] of fileMap.entries()) {
      let currentContent: string;
      let fileSha: string;

      try {
        const fileData = await getGitHubFileContent(
          context.userId,
          analysis.repo_full_name,
          filePath,
          branch,
        );
        currentContent = fileData.content;
        fileSha = fileData.sha;
      } catch (err) {
        const errMsgStr = err instanceof Error ? err.message : String(err);
        for (const f of fileFindings) {
          results.push({
            id: f.id,
            title: f.title,
            filePath,
            status: "failed",
            reason: `Unable to read file from GitHub: ${errMsgStr}`,
          });
        }
        continue;
      }

      let updatedContent = currentContent;
      const stagedFindingsForFile: typeof fileFindings = [];

      for (const finding of fileFindings) {
        const evidence = (finding.evidence ?? "").trim();
        const fix = (finding.suggested_fix ?? "").trim();
        if (!fix) {
          results.push({
            id: finding.id,
            title: finding.title,
            filePath,
            status: "failed",
            reason: "No code fix suggestion provided.",
          });
          continue;
        }

        let applied = false;

        // Strategy A: Direct substring match
        if (evidence && updatedContent.includes(evidence)) {
          updatedContent = updatedContent.replace(evidence, fix);
          applied = true;
        } else if (evidence) {
          // Strategy B: Line-by-line whitespace-trimmed match
          const lines = updatedContent.split("\n");
          const evLines = evidence.split("\n").map((l) => l.trim()).filter(Boolean);
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
            lines.splice(foundIdx, evLines.length, fix);
            updatedContent = lines.join("\n");
            applied = true;
          }
        }

        if (applied) {
          stagedFindingsForFile.push(finding);
        } else {
          results.push({
            id: finding.id,
            title: finding.title,
            filePath,
            status: "failed",
            reason: "Vulnerable code snippet could not be located in current branch file.",
          });
        }
      }

      // If changes were staged for this file, commit them to GitHub
      if (stagedFindingsForFile.length > 0 && updatedContent !== currentContent) {
        try {
          await commitFileToGitHub({
            userId: context.userId,
            repoFullName: analysis.repo_full_name,
            branch,
            filePath,
            content: updatedContent,
            commitMessage: `fix(security): remediate ${stagedFindingsForFile.length} finding(s) in ${filePath} [Buggers Security Fix]`,
            fileSha,
          });

          modifiedFiles.push(filePath);
          for (const f of stagedFindingsForFile) {
            fixedFindingIds.push(f.id);
            results.push({
              id: f.id,
              title: f.title,
              filePath,
              status: "applied",
            });
          }
        } catch (commitErr) {
          const commitErrStr = commitErr instanceof Error ? commitErr.message : String(commitErr);
          for (const f of stagedFindingsForFile) {
            results.push({
              id: f.id,
              title: f.title,
              filePath,
              status: "failed",
              reason: `GitHub commit rejected: ${commitErrStr}`,
            });
          }
        }
      }
    }

    // 6. Persist status updates to Supabase only for genuinely committed fixes
    if (fixedFindingIds.length > 0) {
      await context.supabase
        .from("findings")
        .update({
          status: "fixed",
          source: "automated_fix",
          updated_at: new Date().toISOString(),
        })
        .in("id", fixedFindingIds);

      // Also close any linked tickets
      await context.supabase
        .from("tickets")
        .update({
          status: "closed",
          updated_at: new Date().toISOString(),
        })
        .in("finding_id", fixedFindingIds);
    }

    // 7. Auto-queue analysis on the new commit if fixes were committed
    let newAnalysisId: string | null = null;
    if (fixedFindingIds.length > 0) {
      try {
        const { processAnalysis } = await import("@/server/analysis.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const updatedPr = await githubJson<{
          number: number;
          title: string;
          state: string;
          user: { login: string } | null;
          head: { ref: string; sha: string };
          base: { ref: string };
        }>(context.userId, `/repos/${analysis.repo_full_name}/pulls/${analysis.pr_number}`);

        const { data: insertedAnalysis } = await supabaseAdmin
          .from("analyses")
          .insert({
            user_id: context.userId,
            repo_full_name: analysis.repo_full_name,
            pr_number: analysis.pr_number,
            head_sha: updatedPr.head.sha,
            status: "queued",
            stage: "queued",
            pr_title: updatedPr.title,
            pr_author: updatedPr.user?.login ?? null,
            pr_state: updatedPr.state,
            base_branch: updatedPr.base.ref,
            head_branch: updatedPr.head.ref,
          })
          .select("id")
          .single();

        if (insertedAnalysis) {
          newAnalysisId = insertedAnalysis.id;
          void processAnalysis(context.userId, insertedAnalysis.id).catch((err) =>
            console.error("Auto-analysis of security remediation commit failed:", err),
          );
        }
      } catch (e) {
        console.warn("Could not auto-trigger analysis for remediation commit:", e);
      }
    }

    return {
      ok: true,
      appliedCount: fixedFindingIds.length,
      failedCount: findings.length - fixedFindingIds.length,
      totalEligible: findings.length,
      modifiedFiles,
      branch,
      newAnalysisId,
      results,
    };
  });

