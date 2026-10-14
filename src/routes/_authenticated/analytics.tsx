import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { listAnalyses } from "@/lib/analysis.functions";
import { listFindings } from "@/lib/findings.functions";
import { PageHeader, errMsg } from "@/components/layout/PageHeader";
import { AnalyticsSkeleton } from "@/components/LoadingSkeletons";
import { ErrorState } from "@/components/status/EmptyState";
import { LinearCycleBurndown } from "@/components/analytics/LinearCycleBurndown";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics – Buggers" }] }),
  component: Analytics,
});

function Card({ title, children, enough }: { title: string; children: React.ReactNode; enough: boolean }) {
  return (
    <section className="surface-card p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {enough ? <div className="h-64">{children}</div> : <p className="py-16 text-center text-sm text-muted-foreground">Not enough data to generate this trend.</p>}
    </section>
  );
}

function Analytics() {
  const a = useQuery({ queryKey: ["analyses"], queryFn: () => listAnalyses({ data: {} }) });
  const f = useQuery({ queryKey: ["findings"], queryFn: () => listFindings() });
  if (a.isLoading || f.isLoading) return <AnalyticsSkeleton />;
  if (a.error || f.error)
    return (
      <ErrorState
        message={errMsg(a.error ?? f.error)}
        onRetry={() => {
          void a.refetch();
          void f.refetch();
        }}
      />
    );

  const done = a.data!.analyses.filter((x) => x.status === "completed").reverse();
  const riskOverTime = done.map((x) => ({ name: `#${x.pr_number}`, score: Number(x.risk_score ?? 0) }));
  const dist = ["low", "medium", "high", "critical"].map((l) => ({ name: l, count: done.filter((x) => x.risk_level === l).length }));
  const byDay = new Map<string, number>();
  for (const x of f.data!.findings) { const d = x.created_at.slice(0, 10); byDay.set(d, (byDay.get(d) ?? 0) + 1); }
  const findingTrend = [...byDay.entries()].sort().map(([name, count]) => ({ name, count }));
  const fileCounts = new Map<string, number>();
  for (const x of f.data!.findings) fileCounts.set(x.file_path, (fileCounts.get(x.file_path) ?? 0) + 1);
  const topFiles = [...fileCounts.entries()].sort((p, q) => q[1] - p[1]).slice(0, 8);
  const volume = done.map((x) => ({ name: `#${x.pr_number}`, additions: x.additions ?? 0, deletions: x.deletions ?? 0 }));

  return (
    <div className="page-view content-fade-in space-y-6">
      <PageHeader title="Analytics" description="Built only from your stored analyses and findings." />
      
      {/* Linear Cycle Burndown & Scope Tracker */}
      <LinearCycleBurndown
        realPrCount={a.data?.analyses.length ?? 0}
        realCompletedCount={done.length}
        realFindingsCount={f.data?.findings.length ?? 0}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Risk over time" enough={riskOverTime.length >= 2}>
          <ResponsiveContainer><LineChart data={riskOverTime}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Line dataKey="score" stroke="var(--primary)" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </Card>
        <Card title="PR risk distribution" enough={done.length >= 1}>
          <ResponsiveContainer><BarChart data={dist}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="var(--primary)" radius={4} /></BarChart></ResponsiveContainer>
        </Card>
        <Card title="Finding trends" enough={findingTrend.length >= 2}>
          <ResponsiveContainer><LineChart data={findingTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="count" stroke="var(--destructive)" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </Card>
        <Card title="Change volume" enough={volume.length >= 1}>
          <ResponsiveContainer><BarChart data={volume}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="additions" fill="var(--risk-low)" /><Bar dataKey="deletions" fill="var(--destructive)" /></BarChart></ResponsiveContainer>
        </Card>
      </div>
      <section className="surface-card mt-4 p-5">
        <h2 className="mb-3 font-semibold">Files with the most findings</h2>
        {topFiles.length === 0 ? <p className="text-sm text-muted-foreground">Not enough data to generate this list.</p> : (
          <ul className="divide-y divide-border text-sm">{topFiles.map(([file, n]) => <li key={file} className="flex justify-between py-2"><span className="truncate font-mono text-xs">{file}</span><span>{n}</span></li>)}</ul>
        )}
      </section>
    </div>
  );
}
