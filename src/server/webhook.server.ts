import { logStructured } from "@/server/logger.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createGitHubCommitStatus } from "@/server/github.server";
import { processAnalysis } from "@/server/analysis.server";
import {
  verifyWebhookSignature,
  checkWebhookRateLimit,
  sanitizeString,
  sanitizeRef,
  sanitizeRepoFullName,
  sanitizeSha,
  getClientIp,
} from "@/server/webhookSecurity.server";

// ─── Helpers ───────────────────────────────────────────────────────

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Main Handler ──────────────────────────────────────────────────

export async function handleGitHubWebhook(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
  }

  // ── IP-based Rate Limiting ──────────────────────────────────────
  const clientIp = getClientIp(request);
  const rateCheck = checkWebhookRateLimit(clientIp);
  if (!rateCheck.allowed) {
    logStructured("warn", "webhook_rate_limited", { ip: clientIp });
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  // ── Read Raw Body (needed for signature verification) ───────────
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse({ error: "Failed to read request body" }, 400);
  }

  // ── HMAC Signature Verification ─────────────────────────────────
  const webhookSecret = process.env["GITHUB_WEBHOOK_SECRET"];
  if (webhookSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      logStructured("warn", "webhook_signature_invalid", { ip: clientIp });
      return jsonResponse({ error: "Invalid webhook signature" }, 401);
    }
  } else {
    // Log warning if no secret is configured (allow in development)
    logStructured("warn", "webhook_no_secret_configured", {
      note: "GITHUB_WEBHOOK_SECRET not set. Signature verification is disabled. Set it for production!",
    });
  }

  // ── Parse Payload ───────────────────────────────────────────────
  const event = request.headers.get("x-github-event");
  if (!event) {
    return jsonResponse({ error: "Missing X-GitHub-Event header" }, 400);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const deliveryId = request.headers.get("x-github-delivery") ?? "unknown";

  logStructured("info", "github_webhook_received", {
    event,
    action: payload["action"],
    deliveryId,
    ip: clientIp,
  });

  // ── 1. Handle ping event ────────────────────────────────────────
  if (event === "ping") {
    return jsonResponse({
      ok: true,
      message: "Buggers Webhook is alive and connected!",
      zen: payload["zen"] ?? "Keep it simple.",
      hookId: payload["hook_id"],
    });
  }

  // ── 2. Handle pull_request event ────────────────────────────────
  if (event === "pull_request") {
    const action = String(payload["action"] ?? "");
    const supportedActions = ["opened", "synchronize", "reopened"];

    if (!supportedActions.includes(action)) {
      return jsonResponse({
        ok: true,
        message: `Ignored pull_request action: ${action}`,
      });
    }

    const pr = payload["pull_request"] as {
      number: number;
      title: string;
      state: string;
      user: { login: string } | null;
      head: { ref: string; sha: string };
      base: { ref: string };
    } | null;

    const repo = payload["repository"] as {
      full_name: string;
      name: string;
    } | null;

    if (!pr || !repo?.full_name) {
      return jsonResponse(
        { error: "Missing pull_request or repository data in payload" },
        400,
      );
    }

    // ── Sanitize all user-controlled inputs ────────────────────────
    const repoFullName = sanitizeRepoFullName(repo.full_name);
    if (!repoFullName) {
      return jsonResponse({ error: "Invalid repository name format" }, 400);
    }

    const prNumber = Number(pr.number);
    if (!Number.isFinite(prNumber) || prNumber < 1 || prNumber > 999999) {
      return jsonResponse({ error: "Invalid PR number" }, 400);
    }

    const headSha = sanitizeSha(pr.head.sha);
    if (!headSha) {
      return jsonResponse({ error: "Invalid head SHA" }, 400);
    }

    const prTitle = sanitizeString(pr.title, 300);
    const prAuthor = sanitizeString(pr.user?.login, 100);
    const prState = sanitizeString(pr.state, 20);
    const baseBranch = sanitizeRef(pr.base.ref);
    const headBranch = sanitizeRef(pr.head.ref);

    // Resolve which user owns or configured this repository in Buggers
    let userId: string | null = null;

    // 1. Check prior analyses for this exact repository
    const { data: priorAnalysis } = await supabaseAdmin
      .from("analyses")
      .select("user_id")
      .eq("repo_full_name", repoFullName)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (priorAnalysis?.user_id) {
      userId = priorAnalysis.user_id;
    } else {
      // 2. Check if a user's GitHub login matches the repository owner
      const [owner] = repoFullName.split("/");
      if (owner) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("github_login", owner)
          .maybeSingle();
        if (profile?.id) {
          userId = profile.id;
        }
      }
    }

    if (!userId) {
      // 3. Fallback only if there is exactly one user registered in the system (single-tenant mode)
      const { count } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true });

      if (count === 1) {
        const { data: soleUser } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .single();
        if (soleUser?.id) {
          userId = soleUser.id;
        }
      }
    }

    if (!userId) {
      return jsonResponse(
        {
          ok: false,
          error: `No authenticated Buggers user found configured for ${repoFullName}. Please log in and analyze at least once.`,
        },
        404,
      );
    }

    // ── Duplicate detection: skip if same SHA already analyzed ─────
    const { data: existingAnalysis } = await supabaseAdmin
      .from("analyses")
      .select("id, status")
      .eq("user_id", userId)
      .eq("repo_full_name", repoFullName)
      .eq("pr_number", prNumber)
      .eq("head_sha", headSha)
      .maybeSingle();

    if (existingAnalysis) {
      logStructured("info", "webhook_duplicate_skipped", {
        analysisId: existingAnalysis.id,
        status: existingAnalysis.status,
        repoFullName,
        prNumber,
        headSha,
      });
      return jsonResponse({
        ok: true,
        message: `Analysis already exists for ${repoFullName} PR #${prNumber} at ${headSha.slice(0, 7)}`,
        analysisId: existingAnalysis.id,
        status: existingAnalysis.status,
      });
    }

    // Insert new analysis record (with sanitized data)
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("analyses")
      .insert({
        user_id: userId,
        repo_full_name: repoFullName,
        pr_number: prNumber,
        head_sha: headSha,
        status: "queued",
        stage: "queued",
        pr_title: prTitle,
        pr_author: prAuthor || null,
        pr_state: prState,
        base_branch: baseBranch,
        head_branch: headBranch,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return jsonResponse(
        { error: `Failed to queue analysis: ${insertErr?.message ?? "unknown"}` },
        500,
      );
    }

    // Set immediate pending status check on GitHub
    void createGitHubCommitStatus(
      userId,
      repoFullName,
      headSha,
      "pending",
      "Buggers AI Security Review queued...",
    ).catch(() => {});

    // Launch background analysis
    void processAnalysis(userId, inserted.id).catch((err) => {
      console.error(`Webhook triggered analysis ${inserted.id} failed:`, err);
    });

    logStructured("info", "webhook_analysis_queued", {
      analysisId: inserted.id,
      repoFullName,
      prNumber,
      action,
      headSha,
      deliveryId,
    });

    return jsonResponse({
      ok: true,
      message: `Buggers analysis queued successfully for ${repoFullName} PR #${prNumber} (action: ${action})`,
      analysisId: inserted.id,
    });
  }

  // ── 3. Handle push event ────────────────────────────────────────
  if (event === "push") {
    const ref = sanitizeRef(payload["ref"]);
    const repo = sanitizeRepoFullName(
      (payload["repository"] as { full_name?: string } | undefined)?.full_name,
    );

    return jsonResponse({
      ok: true,
      message: `Push event received for ${repo || "unknown"} on ${ref || "unknown"}`,
    });
  }

  // ── 4. Default response for other events ────────────────────────
  return jsonResponse({
    ok: true,
    message: `Event '${sanitizeString(event, 50)}' received`,
  });
}
