import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
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
    const { error } = await context.supabase
      .from("findings")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.findingId);
    if (error) throw error;
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
    return { ticket };
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
