import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTicketFromFinding, getFinding, updateFindingStatus } from "@/lib/findings.functions";
import { PageHeader, timeAgo, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/status/EmptyState";
import { ConfidenceMeter, SeverityBadge, StatusPill } from "@/components/status/StatusBadges";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/findings/$id")({
  head: () => ({ meta: [{ title: "Finding — Buggers" }] }),
  component: FindingDetail,
});

function FindingDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["finding", id], queryFn: () => getFinding({ data: { findingId: id } }) });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message={errMsg(q.error)} />;
  const { finding: f, ticket, analysis } = q.data!;
  if (!f) return <EmptyState title="Finding not found" action={<Link to="/findings" className="text-sm underline">All findings</Link>} />;

  async function setStatus(status: "reviewed" | "false_positive" | "fixed" | "open") {
    try {
      await updateFindingStatus({ data: { findingId: id, status } });
      toast.success("Status updated");
      await qc.invalidateQueries();
    } catch (e) { toast.error(errMsg(e)); }
  }
  async function makeTicket() {
    try {
      await createTicketFromFinding({ data: { findingId: id } });
      toast.success("Ticket created");
      await qc.invalidateQueries();
    } catch (e) { toast.error(errMsg(e)); }
  }

  const Block = ({ title, children }: { title: string; children?: string | null }) =>
    children ? (<section><h3 className="mb-1 text-sm font-semibold">{title}</h3><p className="whitespace-pre-wrap text-sm text-muted-foreground">{children}</p></section>) : null;

  return (
    <div>
      <PageHeader
        title={f.title}
        description={`${f.repo_full_name} · PR #${f.pr_number} · ${f.file_path}${f.line_number ? `:${f.line_number}` : ""} · ${timeAgo(f.created_at)}`}
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SeverityBadge severity={f.severity} />
        <StatusPill status={f.status} />
        <span className="text-xs text-muted-foreground capitalize">{f.category}</span>
        <ConfidenceMeter value={Number(f.confidence)} />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={f.status === "reviewed"} onClick={() => setStatus("reviewed")}>Mark reviewed</Button>
        <Button size="sm" variant="outline" disabled={f.status === "false_positive"} onClick={() => setStatus("false_positive")}>Mark false positive</Button>
        <Button size="sm" variant="outline" disabled={f.status === "fixed"} onClick={() => setStatus("fixed")}>Mark fixed</Button>
        {f.status !== "open" && <Button size="sm" variant="ghost" onClick={() => setStatus("open")}>Reopen</Button>}
        {ticket ? (
          <Button size="sm" asChild><Link to="/tickets">View ticket</Link></Button>
        ) : (
          <Button size="sm" onClick={makeTicket}>Create ticket</Button>
        )}
      </div>
      <div className="surface-card space-y-5 p-5">
        <Block title="Problem">{f.description}</Block>
        <Block title="Why it matters">{f.why_it_matters}</Block>
        <Block title="Evidence">{f.evidence}</Block>
        {f.code_snippet && (<section><h3 className="mb-1 text-sm font-semibold">Code</h3><pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{f.code_snippet}</pre></section>)}
        <Block title="Suggested fix">{f.suggested_fix}</Block>
      </div>
      {analysis && (
        <Link to="/analysis/$id" params={{ id: analysis.id }} className="mt-4 inline-block text-sm underline">View full analysis and diff</Link>
      )}
    </div>
  );
}
