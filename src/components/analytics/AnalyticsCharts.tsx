import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  Bug,
  GitPullRequest,
  FileCode2,
  Activity,
  Layers,
  Flame,
} from "lucide-react";

// Theme-adaptive Linear-style Tooltip (Pristine in both Light and Dark)
export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md font-sans">
      <p className="text-[11px] font-mono text-muted-foreground mb-1.5 border-b border-border pb-1">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const color = entry.color || entry.fill || "var(--primary)";
          return (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: color, color }}
                />
                <span className="text-muted-foreground capitalize font-medium">{entry.name}:</span>
              </div>
              <span className="font-mono font-semibold text-foreground">{entry.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Executive Metric Pill Cards (Adaptive to Light & Dark)
export function AnalyticsMetricStrip({
  analysesCount,
  avgRisk,
  findingsCount,
  totalAdditions,
  totalDeletions,
}: {
  analysesCount: number;
  avgRisk: number;
  findingsCount: number;
  totalAdditions: number;
  totalDeletions: number;
}) {
  const getRiskBadge = (score: number) => {
    if (score <= 30) return { label: "Low Risk", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25" };
    if (score <= 60) return { label: "Medium", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25" };
    if (score <= 85) return { label: "High Risk", color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/25" };
    return { label: "Critical", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25" };
  };

  const riskBadge = getRiskBadge(avgRisk);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Metric 1: Analyses */}
      <div className="group surface-card p-4 transition-all duration-200 hover:border-primary/40">
        <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
          <span className="font-medium">Pull Requests Evaluated</span>
          <div className="h-6 w-6 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
            <GitPullRequest className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
            {analysesCount}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {analysesCount > 0 ? "100% scanned" : "No PRs yet"}
          </span>
        </div>
      </div>

      {/* Metric 2: Mean Risk */}
      <div className="group surface-card p-4 transition-all duration-200 hover:border-primary/40">
        <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
          <span className="font-medium">Average Risk Index</span>
          <div className="h-6 w-6 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
            <Activity className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {Math.round(avgRisk)}
            </span>
            <span className="text-xs font-mono text-muted-foreground">/ 100</span>
          </div>
          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${riskBadge.color}`}>
            {riskBadge.label}
          </span>
        </div>
      </div>

      {/* Metric 3: Findings */}
      <div className="group surface-card p-4 transition-all duration-200 hover:border-primary/40">
        <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
          <span className="font-medium">Defects & Vulnerabilities</span>
          <div className="h-6 w-6 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
            <Bug className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
            {findingsCount}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {findingsCount === 0 ? "Zero defects" : "Active triage"}
          </span>
        </div>
      </div>

      {/* Metric 4: Lines of Code Churn */}
      <div className="group surface-card p-4 transition-all duration-200 hover:border-primary/40">
        <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
          <span className="font-medium">Total Code Churn</span>
          <div className="h-6 w-6 rounded-md bg-muted border border-border flex items-center justify-center text-foreground">
            <Layers className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{totalAdditions}</span>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">-{totalDeletions}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {totalAdditions + totalDeletions} net
          </span>
        </div>
      </div>
    </div>
  );
}

// Chart Container Card (surface-card)
export function AnalyticsCard({
  title,
  subtitle,
  badge,
  children,
  enough,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  enough: boolean;
}) {
  return (
    <section className="surface-card p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge && <div>{badge}</div>}
      </div>

      <div className="w-full">
        {enough ? (
          <div className="h-64 w-full">{children}</div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl bg-muted/20">
            <AlertTriangle className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground font-medium">Insufficient data point history</p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">Need at least 2 recorded PR runs to project trends.</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Hero Linear-style Risk Over Time Area Chart
export function HeroRiskChart({
  data,
}: {
  data: Array<{ name: string; score: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {/* Glowing Area Fill */}
          <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="60%" stopColor="#6366f1" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
          </linearGradient>

          {/* Linear's signature diagonal crosshatch pattern for High Risk threshold (>70) */}
          <pattern
            id="dangerZoneCrosshatch"
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="rgba(244, 63, 94, 0.16)"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          strokeOpacity={0.65}
          vertical={false}
        />

        {/* High Risk Critical Zone Diagonal Fill */}
        <ReferenceArea
          y1={70}
          y2={100}
          fill="url(#dangerZoneCrosshatch)"
          strokeOpacity={0}
        />
        <ReferenceLine
          y={70}
          stroke="rgba(244, 63, 94, 0.45)"
          strokeDasharray="3 3"
          label={{
            value: "High Risk Threshold",
            position: "insideTopRight",
            fill: "#f43f5e",
            fontSize: 10,
            fontFamily: "monospace",
          }}
        />

        <XAxis
          dataKey="name"
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)", strokeOpacity: 0.8 }}
        />
        <YAxis
          domain={[0, 100]}
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "3 3", strokeOpacity: 0.5 }}
        />

        <Area
          type="monotone"
          dataKey="score"
          name="Risk Score"
          stroke="#6366f1"
          strokeWidth={2.4}
          fill="url(#riskAreaGrad)"
          activeDot={{
            r: 5,
            fill: "#818cf8",
            stroke: "#4f46e5",
            strokeWidth: 2,
          }}
          dot={{
            r: 3,
            fill: "#6366f1",
            stroke: "var(--card)",
            strokeWidth: 1.5,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// PR Risk Distribution Bar Chart with Risk Level Colors
export function RiskDistributionChart({
  data,
}: {
  data: Array<{ name: string; count: number }>;
}) {
  const RISK_COLORS: Record<string, string> = {
    low: "#10b981",
    medium: "#f59e0b",
    high: "#f97316",
    critical: "#f43f5e",
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          strokeOpacity={0.65}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickFormatter={(val: string) => (val ? val.charAt(0).toUpperCase() + val.slice(1) : "")}
          tickLine={false}
          axisLine={{ stroke: "var(--border)", strokeOpacity: 0.8 }}
        />
        <YAxis
          allowDecimals={false}
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
        />
        <Bar dataKey="count" name="PR Count" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={RISK_COLORS[entry.name.toLowerCase()] || "#6366f1"}
              fillOpacity={0.9}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Finding Trends Area Chart
export function FindingTrendsChart({
  data,
}: {
  data: Array<{ name: string; count: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="findingAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="80%" stopColor="#f43f5e" stopOpacity={0.04} />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          strokeOpacity={0.65}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)", strokeOpacity: 0.8 }}
        />
        <YAxis
          allowDecimals={false}
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "#f43f5e", strokeWidth: 1, strokeDasharray: "3 3", strokeOpacity: 0.5 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="Findings Count"
          stroke="#f43f5e"
          strokeWidth={2.2}
          fill="url(#findingAreaGrad)"
          activeDot={{
            r: 5,
            fill: "#fb7185",
            stroke: "#e11d48",
            strokeWidth: 2,
          }}
          dot={{
            r: 3,
            fill: "#f43f5e",
            stroke: "var(--card)",
            strokeWidth: 1.5,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Change Volume Bar Chart
export function ChangeVolumeChart({
  data,
}: {
  data: Array<{ name: string; additions: number; deletions: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          strokeOpacity={0.65}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)", strokeOpacity: 0.8 }}
        />
        <YAxis
          stroke="var(--border)"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
        />
        <Bar dataKey="additions" name="Additions (+)" fill="#10b981" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
        <Bar dataKey="deletions" name="Deletions (-)" fill="#f43f5e" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// File Hotspots Card
export function FileHotspotsList({
  files,
}: {
  files: Array<[string, number]>;
}) {
  const maxFindings = files.length > 0 ? Math.max(...files.map(([_, count]) => count)) : 1;

  return (
    <section className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Vulnerability Hotspots by File
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Repositories files with highest recurring defect density
          </p>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
          Top {files.length} hotspots
        </span>
      </div>

      {files.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground font-mono">
          No file defects recorded yet. Clean code base!
        </p>
      ) : (
        <div className="space-y-2.5">
          {files.map(([file, count], i) => {
            const percent = Math.min(100, Math.round((count / maxFindings) * 100));
            const isHigh = percent >= 70;
            const isMedium = percent >= 35 && percent < 70;

            return (
              <div
                key={file}
                className="group relative flex items-center justify-between gap-4 p-2.5 rounded-xl border border-border/60 bg-muted/30 hover:border-border hover:bg-muted/70 transition-all duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-[11px] font-mono text-muted-foreground/80 w-4 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="h-6 w-6 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground shrink-0">
                    <FileCode2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-mono text-xs text-foreground group-hover:text-primary transition-colors">
                    {file}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Density Bar */}
                  <div className="w-20 sm:w-28 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block border border-border/50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : isMedium ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span
                    className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border ${
                      isHigh
                        ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25"
                        : isMedium
                        ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25"
                        : "text-primary bg-primary/10 border-primary/25"
                    }`}
                  >
                    {count} {count === 1 ? "finding" : "findings"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
