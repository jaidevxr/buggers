import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Star,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Calendar,
  Sparkles,
} from "lucide-react";

interface CycleData {
  id: string;
  name: string;
  status: "upcoming" | "current" | "completed";
  capacityPercent: number;
  capacityLabel: string;
  isOverCapacity?: boolean;
  timeRemaining?: string;
  scope: number;
  scopeDelta?: string;
  started: number;
  startedPercent?: number;
  completed: number;
  completedPercent?: number;
  startDate: string;
  endDate: string;
  milestoneDateTop?: string;
  milestoneDateBottom?: string;
  graphPoints?: {
    scopePath: string;
    startedPath: string;
    completedPath: string;
    idealPath: string;
    forecastX: number;
    forecastWidth: number;
    currentPoint: { x: number; y: number };
    completedMilestones: Array<{ x: number; y1: number; y2: number }>;
  };
}

const DEFAULT_CYCLES: CycleData[] = [
  {
    id: "cycle-191",
    name: "Cycle 191",
    status: "upcoming",
    capacityPercent: 20,
    capacityLabel: "20% of capacity",
    scope: 19,
    started: 0,
    completed: 0,
    startDate: "Nov 17",
    endDate: "Nov 24",
    milestoneDateTop: "Nov 17",
  },
  {
    id: "cycle-190",
    name: "Cycle 190",
    status: "current",
    capacityPercent: 132,
    capacityLabel: "132% of capacity",
    isOverCapacity: true,
    timeRemaining: "3 weekdays left",
    scope: 123,
    scopeDelta: "-23%",
    started: 44,
    startedPercent: 36,
    completed: 11,
    completedPercent: 9,
    startDate: "Nov 10",
    endDate: "Nov 17",
    milestoneDateTop: "Nov 17",
    milestoneDateBottom: "Nov 10",
    graphPoints: {
      // SVG viewBox is 0 0 540 180
      // Scope line: starts at y=50, flat, smooth cubic bezier down to y=95, then flat to end
      scopePath: "M 10 50 L 150 50 C 180 50, 200 95, 240 95 L 530 95",
      // Ideal burndown: dotted line from started origin toward target intersection
      idealPath: "M 10 160 L 370 95",
      // Started curve: starts at y=160, curves smoothly up to (200, 108)
      startedPath: "M 10 160 C 60 115, 120 110, 200 108",
      // Completed curve: starts at y=160, subtle gentle rise to (200, 150)
      completedPath: "M 10 160 C 60 159, 130 156, 200 150",
      forecastX: 380,
      forecastWidth: 150,
      currentPoint: { x: 200, y: 108 },
      completedMilestones: [
        { x: 80, y1: 160, y2: 125 },
        { x: 150, y1: 160, y2: 138 },
        { x: 190, y1: 160, y2: 148 },
      ],
    },
  },
  {
    id: "cycle-189",
    name: "Cycle 189",
    status: "completed",
    capacityPercent: 40,
    capacityLabel: "40% success",
    scope: 238,
    started: 84,
    completed: 84,
    startDate: "Nov 03",
    endDate: "Nov 10",
    milestoneDateTop: "Nov 10",
  },
];

export function LinearCycleBurndown({
  realPrCount = 0,
  realCompletedCount = 0,
  realFindingsCount = 0,
}: {
  realPrCount?: number;
  realCompletedCount?: number;
  realFindingsCount?: number;
}) {
  const cycles = useMemo<CycleData[]>(() => {
    if (realPrCount > 0) {
      // Dynamically blend stored analysis counts into the active cycle
      const updated = [...DEFAULT_CYCLES];
      const active = { ...updated[1]! };
      const calculatedScope = Math.max(active.scope, realPrCount + Math.round(realFindingsCount * 0.5));
      const calculatedStarted = Math.max(active.started, realPrCount);
      const calculatedCompleted = realCompletedCount > 0 ? realCompletedCount : active.completed;

      active.scope = calculatedScope;
      active.started = calculatedStarted;
      active.completed = calculatedCompleted;
      active.startedPercent = Math.round((calculatedStarted / calculatedScope) * 100);
      active.completedPercent = Math.round((calculatedCompleted / calculatedScope) * 100);
      updated[1] = active;
      return updated;
    }
    return DEFAULT_CYCLES;
  }, [realPrCount, realCompletedCount, realFindingsCount]);

  const [expandedCycleId, setExpandedCycleId] = useState<string>("cycle-190");
  const [isStarred, setIsStarred] = useState(false);
  const [hoveredX, setHoveredX] = useState<number | null>(null);

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0c0d10] text-neutral-200 overflow-hidden shadow-2xl font-sans select-none">
      {/* Top Linear Breadcrumb Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#0a0b0d]">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center justify-center h-5 w-5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-400">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-white tracking-wide text-xs">ENG</span>
          <span className="text-neutral-500 font-mono text-[11px]">&gt;</span>
          <span className="text-neutral-400 font-medium text-xs">All cycles</span>
        </div>

        <button
          type="button"
          onClick={() => setIsStarred(!isStarred)}
          className={`p-1 rounded-md transition-colors ${
            isStarred ? "text-amber-400" : "text-neutral-500 hover:text-white"
          }`}
          title="Favorite view"
        >
          <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
        </button>
      </div>

      {/* Main Linear Timeline Container */}
      <div className="p-4 sm:p-6 space-y-3 relative">
        {cycles.map((cycle, idx) => {
          const isExpanded = expandedCycleId === cycle.id;
          const isCurrent = cycle.status === "current";

          return (
            <div key={cycle.id} className="relative flex items-start gap-4 sm:gap-6 group">
              {/* Left Timeline Rail & Milestone Node */}
              <div className="flex flex-col items-center self-stretch shrink-0 w-12 sm:w-16 pt-1 relative">
                {/* Milestone Date Label (e.g., Nov 17) */}
                {cycle.milestoneDateTop && (
                  <span className="text-[10px] font-mono text-neutral-500 tracking-tight leading-none mb-1 text-center">
                    {cycle.milestoneDateTop}
                  </span>
                )}

                {/* Milestone Node on Track */}
                <div className="relative z-10 flex items-center justify-center my-0.5">
                  {cycle.status === "current" ? (
                    <div className="relative flex items-center justify-center">
                      <span className="absolute h-4 w-4 rounded-full bg-indigo-500/25 animate-ping" />
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 ring-2 ring-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    </div>
                  ) : cycle.status === "completed" ? (
                    <span className="h-2 w-2 rounded-full border border-neutral-600 bg-neutral-800" />
                  ) : (
                    <span className="h-2 w-2 rounded-full border border-neutral-600 bg-transparent" />
                  )}
                </div>

                {/* Vertical Rail Connector Line */}
                {idx < cycles.length - 1 && (
                  <div className="flex-1 w-[1.5px] bg-indigo-500/25 my-1" />
                )}

                {/* Bottom Milestone Date Anchor (e.g. Nov 10) */}
                {cycle.milestoneDateBottom && (
                  <span className="text-[10px] font-mono text-neutral-500 tracking-tight leading-none mt-auto text-center pt-2">
                    {cycle.milestoneDateBottom}
                  </span>
                )}
              </div>

              {/* Cycle Content Card */}
              <div
                className={`flex-1 rounded-xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "border-white/[0.09] bg-[#0f1014] shadow-lg shadow-black/40"
                    : "border-transparent hover:border-white/[0.04] hover:bg-white/[0.015]"
                }`}
              >
                {/* Header Row (Clickable to Expand / Collapse) */}
                <div
                  onClick={() => setExpandedCycleId(isExpanded ? "" : cycle.id)}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 cursor-pointer"
                >
                  {/* Left Title & Status */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <span className="text-sm font-medium text-white tracking-tight">
                      {cycle.name}
                    </span>

                    {/* Status Pill Badge */}
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                        cycle.status === "current"
                          ? "bg-white/[0.08] text-white border border-white/[0.08]"
                          : cycle.status === "completed"
                          ? "bg-white/[0.03] text-neutral-400 border border-white/[0.04]"
                          : "bg-white/[0.03] text-neutral-500 border border-white/[0.04]"
                      }`}
                    >
                      {cycle.status === "current"
                        ? "Current"
                        : cycle.status === "completed"
                        ? "Completed"
                        : "Upcoming"}
                    </span>
                  </div>

                  {/* Right Metrics Preview */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    {/* Capacity Ring Indicator */}
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <div className="relative h-3.5 w-3.5 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 -rotate-90" viewBox="0 0 24 24">
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            fill="none"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth="3"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            fill="none"
                            stroke={
                              cycle.isOverCapacity
                                ? "#f43f5e"
                                : cycle.status === "completed"
                                ? "#6366f1"
                                : "#818cf8"
                            }
                            strokeWidth="3"
                            strokeDasharray={56.5}
                            strokeDashoffset={
                              56.5 - (56.5 * Math.min(cycle.capacityPercent, 100)) / 100
                            }
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <span
                        className={`text-xs ${
                          cycle.isOverCapacity ? "text-rose-400 font-semibold" : "text-neutral-300"
                        }`}
                      >
                        {cycle.capacityLabel}
                      </span>
                    </div>

                    {/* Time remaining */}
                    {cycle.timeRemaining && (
                      <span className="text-neutral-400 hidden sm:inline">
                        {cycle.timeRemaining}
                      </span>
                    )}

                    {/* Scope Badge */}
                    <div className="flex items-center gap-1 text-neutral-400">
                      <AlertTriangle className="h-3 w-3 text-neutral-500" />
                      <span>{cycle.scope} scope</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Burndown Engine & Metrics */}
                {isExpanded && cycle.graphPoints && (
                  <div className="p-4 sm:p-5 pt-1 border-t border-white/[0.04] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Interactive Linear SVG Burndown Graph */}
                    <div className="lg:col-span-8 relative">
                      <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] rounded-lg bg-[#08090b] border border-white/[0.06] p-2 overflow-hidden">
                        <svg
                          viewBox="0 0 540 180"
                          className="w-full h-full overflow-visible"
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = Math.round(((e.clientX - rect.left) / rect.width) * 540);
                            setHoveredX(x);
                          }}
                          onMouseLeave={() => setHoveredX(null)}
                        >
                          <defs>
                            {/* Linear's signature diagonal crosshatch forecast pattern */}
                            <pattern
                              id="diagonalForecast"
                              width="6"
                              height="6"
                              patternTransform="rotate(45 0 0)"
                              patternUnits="userSpaceOnUse"
                            >
                              <line
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="6"
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeWidth="1"
                              />
                            </pattern>

                            {/* Completed Milestone Glow Filter */}
                            <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          {/* Horizontal Reference Gridlines */}
                          <line
                            x1="10"
                            y1="40"
                            x2="530"
                            y2="40"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="1"
                          />
                          <line
                            x1="10"
                            y1="95"
                            x2="530"
                            y2="95"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="1"
                          />
                          <line
                            x1="10"
                            y1="160"
                            x2="530"
                            y2="160"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="1"
                          />

                          {/* Diagonal Crosshatch Forecast Region (Nov 14 to Nov 17) */}
                          <rect
                            x={cycle.graphPoints.forecastX}
                            y="40"
                            width={cycle.graphPoints.forecastWidth}
                            height="120"
                            fill="url(#diagonalForecast)"
                            className="pointer-events-none"
                          />

                          {/* Ideal Burndown Projection Line (Dotted Indigo) */}
                          <path
                            d={cycle.graphPoints.idealPath}
                            fill="none"
                            stroke="#4f46e5"
                            strokeWidth="1.8"
                            strokeDasharray="3 3"
                            opacity="0.8"
                          />

                          {/* Scope Curve (Solid Linear Steel Gray) */}
                          <path
                            d={cycle.graphPoints.scopePath}
                            fill="none"
                            stroke="#8a8f98"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />

                          {/* Completed Cumulative Progress Curve (Soft Violet) */}
                          <path
                            d={cycle.graphPoints.completedPath}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />

                          {/* Completed Vertical Milestone Bars */}
                          {cycle.graphPoints.completedMilestones.map((m, mIdx) => (
                            <line
                              key={mIdx}
                              x1={m.x}
                              y1={m.y1}
                              x2={m.x}
                              y2={m.y2}
                              stroke="#818cf8"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              filter="url(#purpleGlow)"
                              opacity="0.9"
                            />
                          ))}

                          {/* Started Progress Curve (Amber/Yellow Glow) */}
                          <path
                            d={cycle.graphPoints.startedPath}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />

                          {/* Current Day Vertical Guideline */}
                          <line
                            x1={cycle.graphPoints.currentPoint.x}
                            y1="40"
                            x2={cycle.graphPoints.currentPoint.x}
                            y2="160"
                            stroke="rgba(245, 158, 11, 0.25)"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />

                          {/* Active Started Node (Bright Amber Dot) */}
                          <circle
                            cx={cycle.graphPoints.currentPoint.x}
                            cy={cycle.graphPoints.currentPoint.y}
                            r="4.5"
                            fill="#fbbf24"
                            stroke="#78350f"
                            strokeWidth="1.5"
                            className="animate-pulse"
                          />

                          {/* Interactive Hover Crosshair */}
                          {hoveredX !== null && hoveredX >= 10 && hoveredX <= 530 && (
                            <g>
                              <line
                                x1={hoveredX}
                                y1="30"
                                x2={hoveredX}
                                y2="165"
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                              />
                            </g>
                          )}
                        </svg>

                        {/* Date Labels below Graph */}
                        <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-mono text-neutral-500">
                          <span>{cycle.startDate}</span>
                          <span>{cycle.endDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right-Hand Metric Legend Cards (Matches Linear Screenshot 1:1) */}
                    <div className="lg:col-span-4 space-y-3 font-sans">
                      {/* Metric 1: Scope */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-[#8a8f98]" />
                          <span className="text-xs font-medium text-neutral-300">Scope</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1 text-white font-semibold">
                            <AlertTriangle className="h-3 w-3 text-neutral-400" />
                            <span>{cycle.scope}</span>
                          </div>
                          {cycle.scopeDelta && (
                            <span className="text-emerald-400 text-[11px] font-medium">
                              {cycle.scopeDelta}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metric 2: Started */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                          <span className="text-xs font-medium text-neutral-300">Started</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1 text-white font-semibold">
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                            <span>{cycle.started}</span>
                          </div>
                          {cycle.startedPercent !== undefined && (
                            <span className="text-neutral-400 text-[11px]">
                              • {cycle.startedPercent}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metric 3: Completed */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                          <span className="text-xs font-medium text-neutral-300">Completed</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1 text-white font-semibold">
                            <AlertTriangle className="h-3 w-3 text-indigo-400" />
                            <span>{cycle.completed}</span>
                          </div>
                          {cycle.completedPercent !== undefined && (
                            <span className="text-neutral-400 text-[11px]">
                              • {cycle.completedPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
