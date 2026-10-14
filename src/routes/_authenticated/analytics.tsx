import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAnalyses } from "@/lib/analysis.functions";
import { listFindings } from "@/lib/findings.functions";
import { PageHeader, errMsg } from "@/components/layout/PageHeader";
import { AnalyticsSkeleton } from "@/components/LoadingSkeletons";
import { ErrorState } from "@/components/status/EmptyState";
import {
  AnalyticsMetricStrip,
  AnalyticsCard,
  HeroRiskChart,
  RiskDistributionChart,
  FindingTrendsChart,
  ChangeVolumeChart,
  FileHotspotsList,
} from "@/components/analytics/AnalyticsCharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics – Buggers" }] }),
  component: Analytics,
});

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
  for (const x of f.data!.findings) {
    const d = x.created_at.slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const findingTrend = [...byDay.entries()].sort().map(([name, count]) => ({ name, count }));

  const fileCounts = new Map<string, number>();
  for (const x of f.data!.findings) {
    fileCounts.set(x.file_path, (fileCounts.get(x.file_path) ?? 0) + 1);
  }
  const topFiles = [...fileCounts.entries()].sort((p, q) => q[1] - p[1]).slice(0, 8);

  const volume = done.map((x) => ({
    name: `#${x.pr_number}`,
    additions: x.additions ?? 0,
    deletions: x.deletions ?? 0,
  }));

  const avgRisk =
    done.length > 0
      ? done.reduce((acc, curr) => acc + Number(curr.risk_score ?? 0), 0) / done.length
      : 0;

  const totalAdditions = done.reduce((acc, curr) => acc + (curr.additions ?? 0), 0);
  const totalDeletions = done.reduce((acc, curr) => acc + (curr.deletions ?? 0), 0);

  return (
    <div className="page-view content-fade-in space-y-6">
      <PageHeader
        title="Analytics"
        description="Real-time security index, defect trends, and code churn calculated across all repository analyses."
      />

      {/* Top Executive Metrics Strip */}
      <AnalyticsMetricStrip
        analysesCount={a.data?.analyses.length ?? 0}
        avgRisk={avgRisk}
        findingsCount={f.data?.findings.length ?? 0}
        totalAdditions={totalAdditions}
        totalDeletions={totalDeletions}
      />

      {/* Main Charts Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsCard
          title="Risk Velocity over Time"
          subtitle="PR risk scores over analysis sequence with critical danger zone"
          badge={
            <span className="text-[11px] font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
              {riskOverTime.length} PRs
            </span>
          }
          enough={riskOverTime.length >= 2}
        >
          <HeroRiskChart data={riskOverTime} />
        </AnalyticsCard>

        <AnalyticsCard
          title="PR Risk Tier Distribution"
          subtitle="Categorization of evaluated pull requests by severity rating"
          badge={
            <span className="text-[11px] font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
              4 tiers
            </span>
          }
          enough={done.length >= 1}
        >
          <RiskDistributionChart data={dist} />
        </AnalyticsCard>

        <AnalyticsCard
          title="Finding Discovery Trends"
          subtitle="Daily volume of detected security defects and code quality issues"
          badge={
            <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {f.data?.findings.length ?? 0} total defects
            </span>
          }
          enough={findingTrend.length >= 2}
        >
          <FindingTrendsChart data={findingTrend} />
        </AnalyticsCard>

        <AnalyticsCard
          title="Code Churn Impact per PR"
          subtitle="Lines of code added versus deleted across analyzed pull requests"
          badge={
            <div className="flex items-center gap-2.5 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Additions
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Deletions
              </span>
            </div>
          }
          enough={volume.length >= 1}
        >
          <ChangeVolumeChart data={volume} />
        </AnalyticsCard>
      </div>

      {/* Hotspots Section */}
      <FileHotspotsList files={topFiles} />
    </div>
  );
}
