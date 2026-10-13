import { cn } from "@/lib/utils";

const riskStyles: Record<string, string> = {
  low: "bg-risk-low-soft text-risk-low",
  medium: "bg-risk-medium-soft text-risk-medium",
  high: "bg-risk-high-soft text-risk-high",
  critical: "bg-risk-critical-soft text-risk-critical",
};

export function RiskBadge({
  level,
  score,
  status,
  isOutdated,
}: {
  level?: string | null | undefined;
  score?: number | null | undefined;
  status?: string | null | undefined;
  isOutdated?: boolean | null | undefined;
}) {
  if (status === "processing" || status === "queued") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        Analyzing…
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive border border-destructive/20">
        Analysis Failed
      </span>
    );
  }
  if (isOutdated) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500 border border-amber-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        New commits
      </span>
    );
  }
  if (!level) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Not analyzed
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        riskStyles[level] ?? "bg-muted text-muted-foreground",
      )}
    >
      {level}
      {typeof score === "number" && <span className="opacity-70">{score}</span>}
    </span>
  );
}

const severityStyles: Record<string, string> = {
  critical: "bg-risk-critical-soft text-risk-critical",
  high: "bg-risk-high-soft text-risk-high",
  medium: "bg-risk-medium-soft text-risk-medium",
  low: "bg-risk-low-soft text-risk-low",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
        severityStyles[severity] ?? "bg-muted text-muted-foreground",
      )}
    >
      {severity}
    </span>
  );
}

const statusStyles: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reviewed: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  false_positive: "bg-muted text-muted-foreground border-border",
  fixed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  merged: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  processing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  queued: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  automated_fix: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  reviewed: "Under Review",
  false_positive: "False Positive",
  fixed: "Fixed",
  closed: "Closed",
  in_progress: "In Progress",
  merged: "Merged",
  completed: "Analyzed",
  processing: "Analyzing",
  queued: "Queued",
  failed: "Failed",
  automated_fix: "Auto-Remediated",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        statusStyles[status] ?? "border-border text-muted-foreground",
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </span>
      {pct}% confidence
    </span>
  );
}
