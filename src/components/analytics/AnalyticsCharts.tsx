import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
  ShieldCheck,
  AlertTriangle,
  Bug,
  GitPullRequest,
  TrendingDown,
  TrendingUp,
  FileCode2,
  Activity,
  Layers,
  Sparkles,
  Flame,
} from "lucide-react";

// Linear-style Custom Dark Glass Tooltip
export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-white/[0.1] bg-[#0c0d12]/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md font-sans">
      <p className="text-[11px] font-mono text-neutral-400 mb-1.5 border-b border-white/[0.06] pb-1">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const color = entry.color || entry.fill || "#818cf8";
          return (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: color, color }}
                />
                <span className="text-neutral-300 capitalize font-medium">{entry.name}:</span>
              </div>
              <span className="font-mono font-semibold text-white">{entry.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Top Linear-style Executive Metric Pill Cards
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
    if (score <= 30) return { label: "Low Risk", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (score <= 60) return { label: "Medium", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    if (score <= 85) return { label: "High Risk", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" };
    return { label: "Critical", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  };

  const riskBadge = getRiskBadge(avgRisk);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Metric 1: Analyses */}
      <div className="group rounded-xl border border-white/[0.08] bg-[#0c0d11] p-4 hover:border-white/[0.14] transition-all duration-200">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
          <span className="font-medium">Pull Requests Evaluated</span>
          <div className="h-6 w-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300">
            <GitPullRequest className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {analysesCount}
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {analysesCount > 0 ? "100% scanned" : "No PRs yet"}
          </span>
        </div>
      </div>

      {/* Metric 2: Mean Risk */}
      <div className="group rounded-xl border border-white/[0.08] bg-[#0c0d11] p-4 hover:border-white/[0.14] transition-all duration-200">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
          <span className="font-medium">Average Risk Index</span>
          <div className="h-6 w-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300">
            <Activity className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {Math.round(avgRisk)}
            </span>
            <span className="text-xs font-mono text-neutral-500">/ 100</span>
          </div>
          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${riskBadge.color}`}>
            {riskBadge.label}
          </span>
        </div>
      </div>

      {/* Metric 3: Findings */}
      <div className="group rounded-xl border border-white/[0.08] bg-[#0c0d11] p-4 hover:border-white/[0.14] transition-all duration-200">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
          <span className="font-medium">Defects & Vulnerabilities</span>
          <div className="h-6 w-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300">
            <Bug className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {findingsCount}
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {findingsCount === 0 ? "Zero defects" : "Active triage"}
          </span>
        </div>
      </div>

      {/* Metric 4: Lines of Code Churn */}
      <div className="group rounded-xl border border-white/[0.08] bg-[#0c0d11] p-4 hover:border-white/[0.14] transition-all duration-200">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
          <span className="font-medium">Total Code Churn</span>
          <div className="h-6 w-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-300">
            <Layers className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">+{totalAdditions}</span>
            <span className="text-neutral-600">/</span>
            <span className="text-rose-400 font-semibold">-{totalDeletions}</span>
          </div>
          <span className="text-[11px] text-neutral-400">
            {totalAdditions + totalDeletions} net
          </span>
        </div>
      </div>
    </div>
  );
}

// Chart Container Card with Linear Style
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
    <section className="rounded-2xl border border-white/[0.08] bg-[#0c0d11] p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge && <div>{badge}</div>}
      </div>

      <div className="w-full">
        {enough ? (
          <div className="h-64 w-full">{children}</div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.06] rounded-xl bg-white/[0.01]">
            <AlertTriangle className="h-6 w-6 text-neutral-600 mb-2" />
            <p className="text-xs text-neutral-400 font-medium">Insufficient data point history</p>
            <p className="text-[11px] text-neutral-600 mt-0.5">Need at least 2 recorded PR runs to project trends.</p>
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
              stroke="rgba(244, 63, 94, 0.12)"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255, 255, 255, 0.05)"
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
          stroke="rgba(244, 63, 94, 0.35)"
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
          stroke="#52525b"
          tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
        />
        <YAxis
          domain={[0, 100]}
          stroke="#52525b"
          tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip content={<ChartTooltip />} />

        <Area
          type="monotone"
          dataKey="score"
          name="Risk Score"
          stroke="#818cf8"
          strokeWidth={2.4}
          fill="url(#riskAreaGrad)"
          activeDot={{
            r: 5,
            fill: "#a5b4fc",
            stroke: "#4f46e5",
            strokeWidth: 2,
            className: "shadow-[0_0_12px_#6366f1]",
          }}
          dot={{
            r: 3,
            fill: "#6366f1",
            stroke: "#0c0d11",
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
          stroke="rgba(255, 255, 255, 0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          stroke="#52525b"
          tick={{ fill: "#a1a1aa", fontSize: 11, textTransform: "capitalize" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
        />
        <YAxis
          allowDecimals={false}
          stroke="#52525b"
          tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" name="PR Count" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={RISK_COLORS[entry.name.toLowerCase()] || "#6366f1"}
              fillOpacity={0.85}
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
          stroke="rgba(255, 255, 255, 0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          stroke="#52525b"
          tick={{ fill: "#a1a1aa", fontSize: 10, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
        />
        <YAxis
          allowDecimals={false}
          stroke="#52525b"
          tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          name="Findings Count"
          stroke="#fb7185"
          strokeWidth={2.2}
          fill="url(#findingAreaGrad)"
          activeDot={{
            r: 5,
            fill: "#fda4af",
            stroke: "#e11d48",
            strokeWidth: 2,
          }}
          dot={{
            r: 3,
            fill: "#f43f5e",
            stroke: "#0c0d11",
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
          stroke="rgba(255, 255, 255, 0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          stroke="#52525b"
          tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
        />
        <YAxis
          stroke="#52525b"
          tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="additions" name="Additions (+)" fill="#10b981" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
        <Bar dataKey="deletions" name="Deletions (-)" fill="#f43f5e" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
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
    <section className="rounded-2xl border border-white/[0.08] bg-[#0c0d11] p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            Vulnerability Hotspots by File
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Repositories files with highest recurring defect density
          </p>
        </div>
        <span className="text-[11px] font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
          Top {files.length} hotspots
        </span>
      </div>

      {files.length === 0 ? (
        <p className="py-8 text-center text-xs text-neutral-500 font-mono">
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
                className="group relative flex items-center justify-between gap-4 p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:border-white/[0.09] hover:bg-white/[0.03] transition-all duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-[11px] font-mono text-neutral-600 w-4 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="h-6 w-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-400 shrink-0">
                    <FileCode2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-mono text-xs text-neutral-200 group-hover:text-white transition-colors">
                    {file}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Density Bar */}
                  <div className="w-20 sm:w-28 h-1.5 rounded-full bg-white/[0.06] overflow-hidden hidden sm:block">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : isMedium ? "bg-amber-500" : "bg-indigo-400"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span
                    className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border ${
                      isHigh
                        ? "text-rose-400 bg-rose-500/10 border-rose-500/25"
                        : isMedium
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/25"
                        : "text-indigo-400 bg-indigo-500/10 border-indigo-500/25"
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
