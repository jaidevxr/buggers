import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GitCommit,
  Loader2,
  Code2,
  GitCompare,
  Columns2,
  RotateCcw,
  Sparkles,
  Github,
  PlusCircle,
  X,
} from "lucide-react";
import {
  applyFindingFixToGitHub,
  createTicketFromFinding,
  getFinding,
  updateFindingStatus,
} from "@/lib/findings.functions";
import { PageHeader, timeAgo, errMsg } from "@/components/layout/PageHeader";
import { FindingDetailSkeleton } from "@/components/LoadingSkeletons";
import { EmptyState, ErrorState } from "@/components/status/EmptyState";
import { ConfidenceMeter, SeverityBadge, StatusPill } from "@/components/status/StatusBadges";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/findings/$id")({
  head: () => ({ meta: [{ title: "Finding – Buggers" }] }),
  component: FindingDetail,
});

function CodeSuggestion({
  suggestedFix,
  evidence,
  findingId,
  isFixed,
  onFixed,
}: {
  suggestedFix: string;
  evidence?: string | null;
  findingId: string;
  isFixed?: boolean;
  onFixed?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{
    url?: string | undefined;
    branch?: string | undefined;
  } | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<"diff" | "editor" | "split">("diff");
  const [customCode, setCustomCode] = useState(suggestedFix);

  const isModified = customCode.trim() !== suggestedFix.trim();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(customCode);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommitToGitHub = async () => {
    setCommitting(true);
    try {
      const res = await applyFindingFixToGitHub({
        data: {
          findingId,
          customFix: isModified ? customCode : undefined,
        },
      });
      setCommitResult({ url: res.commitUrl ?? undefined, branch: res.branch });
      toast.success(`Existing file updated in-place on PR branch ${res.branch}!`);
      onFixed?.();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setCommitting(false);
    }
  };

  const alreadyApplied = isFixed || Boolean(commitResult);

  // Helper to split code into lines for diff rendering
  const evLines = evidence ? evidence.split("\n") : [];
  const fixLines = customCode.split("\n");

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <button
          className="flex items-center gap-2 text-left font-semibold text-sm hover:text-foreground transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <span>Security Remediation & Automated Fix</span>
          {isModified && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500 border border-amber-500/20">
              Customized
            </span>
          )}
          {alreadyApplied && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500 border border-emerald-500/20">
              <Check className="h-3 w-3" /> Committed to GitHub
            </span>
          )}
        </button>

        {expanded && (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
            <button
              onClick={() => setViewMode("diff")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                viewMode === "diff"
                  ? "bg-secondary text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Unified Diff
            </button>
            <button
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                viewMode === "editor"
                  ? "bg-secondary text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Interactive Editor
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                viewMode === "split"
                  ? "bg-secondary text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              Side by Side
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div>
          {/* 1. UNIFIED DIFF VIEW */}
          {viewMode === "diff" && (
            <div className="divide-y divide-border/60">
              <div className="bg-muted/20 px-4 py-2 text-xs font-mono text-muted-foreground flex items-center justify-between">
                <span>@@ Security Diff: Vulnerable code ➔ Remediated fix @@</span>
                <span className="text-[11px]">Direct in-place patch preview</span>
              </div>
              <div className="overflow-x-auto font-mono text-xs leading-relaxed p-0">
                {evLines.length > 0 && (
                  <div className="bg-rose-500/5 text-rose-300/90 divide-y divide-rose-500/10">
                    {evLines.map((line, i) => (
                      <div key={i} className="flex px-4 py-1 hover:bg-rose-500/10">
                        <span className="w-8 shrink-0 select-none text-rose-500/50 text-right pr-3">-</span>
                        <span className="whitespace-pre-wrap">{line}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-emerald-500/5 text-emerald-300/90 divide-y divide-emerald-500/10">
                  {fixLines.map((line, i) => (
                    <div key={i} className="flex px-4 py-1 hover:bg-emerald-500/10">
                      <span className="w-8 shrink-0 select-none text-emerald-500/50 text-right pr-3">+</span>
                      <span className="whitespace-pre-wrap">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. INTERACTIVE FIX EDITOR */}
          {viewMode === "editor" && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Customize the suggested code before committing directly to the GitHub PR branch:</span>
                </div>
                {isModified && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCustomCode(suggestedFix)}
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to AI suggestion
                  </Button>
                )}
              </div>
              <div className="relative rounded-lg border border-border bg-muted/30 focus-within:ring-1 focus-within:ring-primary overflow-hidden">
                <textarea
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  rows={Math.max(6, Math.min(20, customCode.split("\n").length + 2))}
                  className="w-full bg-transparent p-3 font-mono text-xs leading-relaxed text-foreground outline-none resize-y selection:bg-primary/20"
                  spellCheck={false}
                  placeholder="// Enter or edit fix code here..."
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{customCode.split("\n").length} lines · {customCode.length} characters</span>
                <span>Will substitute vulnerable code on PR branch</span>
              </div>
            </div>
          )}

          {/* 3. SIDE BY SIDE SPLIT VIEW */}
          {viewMode === "split" && (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-rose-500">Vulnerable Code</span>
                </div>
                <pre className="overflow-x-auto rounded-lg bg-rose-500/5 border border-rose-500/20 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-rose-200">
                  {evidence || "(No raw evidence snippet)"}
                </pre>
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Remediated Code</span>
                  </div>
                  {isModified && (
                    <span className="text-[11px] text-amber-500 font-medium">Modified</span>
                  )}
                </div>
                <pre className="overflow-x-auto rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-emerald-200">
                  {customCode}
                </pre>
              </div>
            </div>
          )}

          {/* Action buttons bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={alreadyApplied ? "outline" : "default"}
                onClick={handleCommitToGitHub}
                disabled={committing || alreadyApplied}
                className={`gap-1.5 ${
                  !alreadyApplied ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs" : ""
                }`}
              >
                {committing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Committing to GitHub...
                  </>
                ) : alreadyApplied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Committed to GitHub
                  </>
                ) : (
                  <>
                    <GitCommit className="h-3.5 w-3.5" />
                    {isModified ? "Accept & Commit Custom Fix" : "Accept & Commit to GitHub"}
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            </div>

            {commitResult?.url && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span>Updated in-place on branch <strong>{commitResult.branch}</strong> ·</span>
                <a
                  href={commitResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <ExternalLink className="h-3 w-3" />
                  View commit on GitHub
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function FindingDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["finding", id], queryFn: () => getFinding({ data: { findingId: id } }) });

  // Ticket creation modal / state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [createGitHubIssue, setCreateGitHubIssue] = useState(true);
  const [ticketAssignee, setTicketAssignee] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [createdIssueUrl, setCreatedIssueUrl] = useState<string | null>(null);

  if (q.isLoading) return <FindingDetailSkeleton />;
  if (q.error) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  const { finding: f, ticket, analysis } = q.data!;
  if (!f) return <EmptyState title="Finding not found" action={<Link to="/findings" className="text-sm underline">All findings</Link>} />;

  async function setStatus(status: "reviewed" | "false_positive" | "fixed" | "open") {
    try {
      await updateFindingStatus({ data: { findingId: id, status } });
      toast.success("Status updated");
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  async function handleCreateTicket() {
    setCreatingTicket(true);
    try {
      const res = await createTicketFromFinding({
        data: {
          findingId: id,
          assignee: ticketAssignee.trim() || undefined,
          createGitHubIssue,
        },
      });
      toast.success("Security ticket created!");
      if (res.gitHubIssueUrl) {
        setCreatedIssueUrl(res.gitHubIssueUrl);
        toast.success("GitHub Issue created on repository!");
      }
      setShowTicketModal(false);
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setCreatingTicket(false);
    }
  }

  const Block = ({ title, children }: { title: string; children?: string | null }) =>
    children ? (
      <section>
        <h3 className="mb-1 text-sm font-semibold">{title}</h3>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{children}</p>
      </section>
    ) : null;

  return (
    <div className="max-w-7xl page-view content-fade-in">
      <PageHeader
        backTo="/findings"
        backLabel="Findings"
        title={f.title}
        description={`${f.repo_full_name} · PR #${f.pr_number} · ${f.file_path}${f.line_number ? `:${f.line_number}` : ""} · ${timeAgo(f.created_at)}`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SeverityBadge severity={f.severity} />
        <StatusPill
          status={
            f.status === "fixed" && f.source === "automated_fix"
              ? "automated_fix"
              : f.status
          }
        />
        <span className="text-xs text-muted-foreground capitalize font-medium">{f.category}</span>
        <ConfidenceMeter value={Number(f.confidence)} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={f.status === "reviewed"} onClick={() => setStatus("reviewed")}>
          Mark reviewed
        </Button>
        <Button size="sm" variant="outline" disabled={f.status === "false_positive"} onClick={() => setStatus("false_positive")}>
          Mark false positive
        </Button>
        <Button size="sm" variant="outline" disabled={f.status === "fixed"} onClick={() => setStatus("fixed")}>
          Mark fixed
        </Button>
        {f.status !== "open" && (
          <Button size="sm" variant="ghost" onClick={() => setStatus("open")}>
            Reopen
          </Button>
        )}

        {ticket ? (
          <div className="flex items-center gap-2">
            <Button size="sm" asChild variant="secondary">
              <Link to="/tickets">View internal ticket</Link>
            </Button>
            {createdIssueUrl && (
              <a
                href={createdIssueUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <Github className="h-3.5 w-3.5" />
                View GitHub Issue
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ) : (
          <Button size="sm" onClick={() => setShowTicketModal(true)} className="gap-1.5">
            <PlusCircle className="h-3.5 w-3.5" />
            Create Ticket / GitHub Issue
          </Button>
        )}
      </div>

      {/* Ticket creation modal / inline panel */}
      {showTicketModal && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-card p-5 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Create Security Ticket & GitHub Issue</h3>
            </div>
            <button
              onClick={() => setShowTicketModal(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createGitHubIssue}
                onChange={(e) => setCreateGitHubIssue(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>Also file as a tracked <strong>GitHub Issue</strong> directly in <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{f.repo_full_name}</code></span>
            </label>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Assignee (optional GitHub username)
              </label>
              <input
                type="text"
                value={ticketAssignee}
                onChange={(e) => setTicketAssignee(e.target.value)}
                placeholder="e.g. security-lead or reviewer"
                className="w-full max-w-sm rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleCreateTicket} disabled={creatingTicket} className="gap-1.5">
              {creatingTicket ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {creatingTicket ? "Creating..." : createGitHubIssue ? "Create Ticket & GitHub Issue" : "Create Ticket"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowTicketModal(false)} disabled={creatingTicket}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Finding Details Card */}
      <div className="surface-card space-y-5 p-5">
        <Block title="Problem">{f.description}</Block>
        <Block title="Why it matters">{f.why_it_matters}</Block>
        <Block title="Evidence">{f.evidence}</Block>
        {f.code_snippet && (
          <section>
            <h3 className="mb-1 text-sm font-semibold">Diff Context</h3>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{f.code_snippet}</pre>
          </section>
        )}
      </div>

      {/* Code suggestion with interactive editor / diff preview */}
      {f.suggested_fix && (
        <CodeSuggestion
          suggestedFix={f.suggested_fix}
          evidence={f.evidence}
          findingId={f.id}
          isFixed={f.status === "fixed"}
          onFixed={() => qc.invalidateQueries()}
        />
      )}

      {analysis && (
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/analysis/$id"
            params={{ id: analysis.id }}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            View complete PR analysis report & risk breakdown
          </Link>
        </div>
      )}
    </div>
  );
}
