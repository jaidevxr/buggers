import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { getAnalysis, runAnalysis, startAnalysis } from "@/lib/analysis.functions";
import { getPullRequestDetail } from "@/lib/github.functions";
import { PageHeader, timeAgo, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/status/EmptyState";
import { ConfidenceMeter, RiskBadge, SeverityBadge, StatusPill } from "@/components/status/StatusBadges";
import { Button } from "@/components/ui/button";
import { DiffViewer } from "@/components/diff/DiffViewer";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({ meta: [{ title: "Analysis — Buggers" }] }),
  component: AnalysisPage,
});

const STAGES = [
  ["queued", "Queued"],
  ["fetching_pr", "Fetching PR"],
  ["fetching_commits", "Fetching commits"],
  ["fetching_files", "Fetching changed files"],
  ["historical_analysis", "Historical analysis"],
  ["ai_review", "AI code review"],
  ["validating_findings", "Findings validation"],
  ["risk_calculation", "Risk calculation"],
  ["completed", "Analysis complete"],
] as const;

type Signal = { key?: string; id?: string; label?: string; name?: string; status?: string; value?: unknown; detail?: string; explanation?: string };

function AnalysisPage() {
  const { id } = Route.useParams();
  const [rerunning, setRerunning] = useState(false);
  const q = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => getAnalysis({ data: { analysisId: id } }),
    refetchInterval: (query) => {
      const s = query.state.data?.analysis?.status;
      return s === "completed" || s === "failed" ? false : 2000;
    },
  });
  const a = q.data?.analysis;
  const pr = useQuery({
    queryKey: ["pr", a?.repo_full_name, a?.pr_number],
    queryFn: () => getPullRequestDetail({ data: { repoFullName: a!.repo_full_name, prNumber: a!.pr_number } }),
    enabled: Boolean(a),
  });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState message={errMsg(q.error)} />;
  if (!a) return <EmptyState title="Analysis not found" action={<Link to="/dashboard" className="text-sm underline">Back to overview</Link>} />;

  const findings = q.data!.findings;
  const stageIdx = STAGES.findIndex(([k]) => k === a.stage);
  const signals = (Array.isArray(a.signals) ? a.signals : []) as Signal[];

  async function rerun() {
    setRerunning(true);
    try {
      const r = await startAnalysis({ data: { repoFullName: a!.repo_full_name, prNumber: a!.pr_number } });
      if (!r.alreadyRunning) void runAnalysis({ data: { analysisId: r.analysisId } }).catch(() => {});
      await q.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setRerunning(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={`#${a.pr_number} ${a.pr_title ?? ""}`}
        description={`${a.repo_full_name} · ${a.head_branch} → ${a.base_branch} · by ${a.pr_author ?? "unknown"} · ${timeAgo(a.created_at)}`}
        actions={
          <>
            <StatusPill status={a.status} />
            {(a.status === "completed" || a.status === "failed") && (
              <Button size="sm" variant="outline" onClick={rerun} disabled={rerunning}>Re-run analysis</Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card p-5">
          <h2 className="mb-3 font-semibold">Pipeline</h2>
          <ol className="space-y-2 text-sm">
            {STAGES.map(([key, label], i) => {
              const failed = a.status === "failed" && i === Math.max(stageIdx, 0);
              const done = a.status === "completed" || i < stageIdx;
              const active = !done && !failed && i === stageIdx;
              return (
                <li key={key} className="flex items-center gap-2">
                  {failed ? <XCircle className="h-4 w-4 text-destructive" /> : done ? <CheckCircle2 className="h-4 w-4 text-risk-low" /> : active ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className={active ? "font-semibold" : done ? "" : "text-muted-foreground"}>{label}</span>
                </li>
              );
            })}
          </ol>
          {a.status === "failed" && (
            <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {a.error_message ?? "Analysis failed. Try running the analysis again."}
            </p>
          )}
        </section>

        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Risk</h2>
          {a.status !== "completed" ? (
            <p className="text-sm text-muted-foreground">Risk will appear once the analysis actually completes.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <span className="text-4xl font-bold">{a.risk_score ?? "—"}</span>
                <RiskBadge level={a.risk_level} />
                {a.risk_confidence != null && <ConfidenceMeter value={Number(a.risk_confidence)} />}
                <span className="text-xs text-muted-foreground">Model {a.model_version}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {signals.map((s, i) => (
                  <div key={s.key ?? s.id ?? i} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{s.label ?? s.name ?? s.key}</span>
                      <span className="text-xs text-muted-foreground">{s.status === "insufficient_data" ? "Insufficient data" : typeof s.value === "number" ? s.value.toFixed(2) : ""}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.detail ?? s.explanation ?? ""}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Findings ({findings.length})</h2>
      {findings.length === 0 ? (
        <EmptyState title={a.status === "completed" ? "No validated findings" : "Analysis pending"} description={a.status === "completed" ? "The AI review produced no findings that passed validation against the real diff." : undefined} />
      ) : (
        <div className="surface-card divide-y divide-border">
          {findings.map((f) => (
            <Link key={f.id} to="/findings/$id" params={{ id: f.id }} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/50">
              <SeverityBadge severity={f.severity} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{f.title}</div>
                <div className="truncate text-xs text-muted-foreground">{f.file_path}{f.line_number ? `:${f.line_number}` : ""} · {f.category}</div>
              </div>
              <ConfidenceMeter value={Number(f.confidence)} />
              <StatusPill status={f.status} />
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 font-semibold">Changed files</h2>
      {pr.isLoading ? <LoadingState label="Loading diff from GitHub…" /> : pr.error ? <ErrorState message={errMsg(pr.error)} /> : pr.data ? (
        <DiffViewer files={pr.data.files} findings={findings} />
      ) : null}
    </div>
  );
}
