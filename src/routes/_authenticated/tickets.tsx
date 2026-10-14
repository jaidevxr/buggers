import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listTickets, updateTicket } from "@/lib/findings.functions";
import { PageHeader, timeAgo, errMsg } from "@/components/layout/PageHeader";
import { TicketsSkeleton } from "@/components/LoadingSkeletons";
import { EmptyState, ErrorState } from "@/components/status/EmptyState";
import { SeverityBadge } from "@/components/status/StatusBadges";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({ meta: [{ title: "Tickets – Buggers" }] }),
  component: Tickets,
});

function Tickets() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tickets"], queryFn: () => listTickets() });

  async function patch(
    ticketId: string,
    p: { status?: "open" | "in_progress" | "closed"; assignee?: string | null },
  ) {
    try {
      await updateTicket({ data: { ticketId, ...p } });
      await qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket updated");
    } catch (e) { toast.error(errMsg(e)); }
  }

  if (q.isLoading) return <TicketsSkeleton />;
  if (q.error) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  const rows = q.data!.tickets;
  return (
    <div className="page-view content-fade-in">
      <PageHeader title="Tickets" description="Findings turned into actionable work." />
      {rows.length === 0 ? (
        <EmptyState title="No tickets yet" description="Open a finding and choose “Create ticket”." action={<Link to="/findings" className="text-sm underline">Go to findings</Link>} />
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr><th className="p-3">ID</th><th className="p-3">Finding</th><th className="p-3">Repository</th><th className="p-3">PR</th><th className="p-3">Severity</th><th className="p-3">Status</th><th className="p-3">Assignee</th><th className="p-3">Updated</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="p-3 font-mono text-xs">{t.id.slice(0, 8)}</td>
                  <td className="p-3"><Link to="/findings/$id" params={{ id: t.finding_id }} className="font-medium hover:underline">{t.title}</Link></td>
                  <td className="p-3 text-muted-foreground">{t.repo_full_name}</td>
                  <td className="p-3">#{t.pr_number}</td>
                  <td className="p-3"><SeverityBadge severity={t.severity} /></td>
                  <td className="p-3">
                    <select
                      aria-label="Ticket status"
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                      value={t.status}
                      onChange={(e) =>
                        patch(t.id, {
                          status: e.target.value as "open" | "in_progress" | "closed",
                        })
                      }
                    >
                      <option value="open">Open</option><option value="in_progress">In progress</option><option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <input aria-label="Assignee" defaultValue={t.assignee ?? ""} placeholder="Unassigned" className="w-28 rounded-md border border-input bg-background px-2 py-1 text-xs"
                      onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== t.assignee) void patch(t.id, { assignee: v }); }} />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{timeAgo(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
