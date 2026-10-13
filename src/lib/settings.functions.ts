import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { userSettingsSchema } from "@/lib/validation";

export type UserSettings = {
  notify_high_risk: boolean;
  notify_analysis_complete: boolean;
  min_confidence: number;
  include_low_severity: boolean;
  max_diff_files: number;
  store_code_snippets: boolean;
};

const DEFAULTS: UserSettings = {
  notify_high_risk: true,
  notify_analysis_complete: true,
  min_confidence: 0.5,
  include_low_severity: true,
  max_diff_files: 40,
  store_code_snippets: true,
};

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return { settings: (data as UserSettings | null) ?? DEFAULTS, exists: Boolean(data) };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(userSettingsSchema.partial())
  .handler(async ({ data, context }) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );
    const { error } = await context.supabase.from("user_settings").upsert(
      { user_id: context.userId, ...cleaned, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const deleteMyAnalysisData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("tickets").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("findings").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("analyses").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("notifications").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const testWebhookPing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { handleGitHubWebhook } = await import("@/server/webhook.server");
    const secret = process.env["GITHUB_WEBHOOK_SECRET"];
    const payload = JSON.stringify({
      zen: "Practicality beats purity.",
      hook_id: 101,
      sender: { login: "buggers-admin" },
    });
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-github-event": "ping",
      "x-github-delivery": `test-${Date.now()}`,
    };
    if (secret) {
      const crypto = await import("crypto");
      headers["x-hub-signature-256"] =
        "sha256=" + crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
    }

    const testReq = new Request("http://localhost:8080/api/webhooks/github", {
      method: "POST",
      headers,
      body: payload,
    });

    const res = await handleGitHubWebhook(testReq);
    const data = (await res.json()) as { ok?: boolean; zen?: string; error?: string; message?: string };
    if (!res.ok) {
      throw new Error(data.error ?? `Webhook endpoint returned HTTP ${res.status}`);
    }
    return { ok: true, zen: data.zen ?? "pong", message: data.message ?? "Verified" };
  });

