import { cn } from "@/lib/utils";

const riskStyles: Record<string, string> = {
  low: "bg-risk-low-soft text-risk-low",
  medium: "bg-risk-medium-soft text-risk-medium",
  high: "bg-risk-high-soft text-risk-high",
  critical: "bg-risk-critical-soft text-risk-critical",
};

export function RiskBadge({ level, score }: { level?: string | null | undefined; score?: number | null | undefined }) {
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

const statusLabels: Record<string, string> = {
  open: "Open",
  reviewed: "Reviewed",
  false_positive: "False positive",
  fixed: "Fixed",
  closed: "Closed",
  in_progress: "In progress",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
