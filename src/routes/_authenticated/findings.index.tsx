import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listFindings } from "@/lib/findings.functions";
import { PageHeader, StatCard, errMsg } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState } from "@/components/status/EmptyState";
import { FindingsTableSkeleton } from "@/components/LoadingSkeletons";
import { ConfidenceMeter, SeverityBadge, StatusPill } from "@/components/status/StatusBadges";

export const Route = createFileRoute("/_authenticated/findings/")({
  head: () => ({ meta: [{ title: "Findings – Buggers" }] }),
  component: Findings,
});

function Findings() {
  const q = useQuery({ queryKey: ["findings"], queryFn: () => listFindings() });
  const [sev, setSev] = useState("");
  const [repo, setRepo] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [minConf, setMinConf] = useState(0);

  if (q.isLoading) return <FindingsTableSkeleton />;
  if (q.error) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  const all = q.data!.findings;
  const uniq = (k: "repo_full_name" | "category") => [...new Set(all.map((f) => f[k]))];
  const rows = all.filter(
    (f) => (!sev || f.severity === sev) && (!repo || f.repo_full_name === repo) && (!cat || f.category === cat) && (!status || f.status === status) && Number(f.confidence) >= minConf,
  );
  const count = (s: string) => all.filter((f) => f.severity === s).length;
  const Sel = ({ v, set, opts, label }: { v: string; set: (s: string) => void; opts: string[]; label: string }) => (
    <select aria-label={label} className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={v} onChange={(e) => set(e.target.value)}>
      <option value="">All {label.toLowerCase()}</option>
      {opts.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
    </select>
  );

  return (
    <div className="page-view content-fade-in">
      <PageHeader title="Findings" description="Every finding from your real analyses." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["critical", "high", "medium", "low"].map((s) => <StatCard key={s} label={s} value={count(s)} />)}
      </div>
      {all.length === 0 ? (
        <EmptyState title="No findings yet" description="Run an analysis on a pull request to generate findings." action={<Link to="/pull-requests" className="text-sm underline">Go to pull requests</Link>} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Sel v={sev} set={setSev} opts={["critical", "high", "medium", "low"]} label="Severities" />
            <Sel v={repo} set={setRepo} opts={uniq("repo_full_name")} label="Repositories" />
            <Sel v={cat} set={setCat} opts={uniq("category")} label="Categories" />
            <Sel v={status} set={setStatus} opts={["open", "reviewed", "false_positive", "fixed"]} label="Statuses" />
            <select aria-label="Minimum confidence" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={minConf} onChange={(e) => setMinConf(Number(e.target.value))}>
              {[0, 0.5, 0.7, 0.9].map((c) => <option key={c} value={c}>{c === 0 ? "Any confidence" : `≥ ${c * 100}%`}</option>)}
            </select>
          </div>
          <div className="surface-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr><th className="p-3">Finding</th><th className="p-3">Repository</th><th className="p-3">PR</th><th className="p-3">File</th><th className="p-3">Severity</th><th className="p-3">Confidence</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/50">
                    <td className="p-3"><Link to="/findings/$id" params={{ id: f.id }} className="font-medium hover:underline">{f.title}</Link></td>
                    <td className="p-3 text-muted-foreground">{f.repo_full_name}</td>
                    <td className="p-3">#{f.pr_number}</td>
                    <td className="max-w-[200px] truncate p-3 font-mono text-xs">{f.file_path}{f.line_number ? `:${f.line_number}` : ""}</td>
                    <td className="p-3"><SeverityBadge severity={f.severity} /></td>
                    <td className="p-3"><ConfidenceMeter value={Number(f.confidence ?? 0.8)} /></td>
                    <td className="p-3">
                      <StatusPill
                        status={
                          f.status === "fixed" && f.source === "automated_fix"
                            ? "automated_fix"
                            : f.status
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No findings match these filters.</p>}
          </div>
        </>
      )}
    </div>
  );
}
