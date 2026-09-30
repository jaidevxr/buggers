import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  .inputValidator((input: Partial<UserSettings>) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_settings").upsert(
      { user_id: context.userId, ...data, updated_at: new Date().toISOString() },
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
