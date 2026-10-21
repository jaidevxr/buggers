import { ShieldCheck, AlertTriangle, FileText, Ban, AlertCircle } from "lucide-react";
import type { InventoryMetrics } from "@/server/repoScanner.server";

interface CoverageReportCardProps {
  metrics?: InventoryMetrics;
  isTruncated?: boolean;
  targetPath?: string;
}

export function CoverageReportCard({ metrics, isTruncated, targetPath }: CoverageReportCardProps) {
  if (!metrics) return null;

  const total = metrics.totalFilesDiscovered || 0;
  const analyzed = metrics.scannedFiles || 0;
  const skipped = metrics.skippedFiles || 0;
  const failed = metrics.failedFiles || 0;

  const isComplete = !isTruncated && skipped === 0 && failed === 0;
  const coveragePercent = total > 0 ? Math.round((analyzed / total) * 100) : 100;

  return (
    <div className="surface-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
          <div>
            <h3 className="font-semibold text-sm">
              {isComplete ? "Full Scan Coverage" : "Partial Scan Coverage"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {targetPath && targetPath !== "entire_repository"
                ? `Scoped to '${targetPath}'`
                : "Whole Repository Scan"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold font-mono text-foreground">{coveragePercent}%</span>
          <p className="text-[10px] text-muted-foreground">Coverage rate</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border text-center">
        <div className="p-2 rounded bg-muted/40">
          <p className="text-[10px] text-muted-foreground">Discovered</p>
          <p className="text-sm font-semibold font-mono">{total}</p>
        </div>
        <div className="p-2 rounded bg-emerald-500/10 text-emerald-500">
          <p className="text-[10px] text-muted-foreground">Analyzed</p>
          <p className="text-sm font-semibold font-mono">{analyzed}</p>
        </div>
        <div className="p-2 rounded bg-amber-500/10 text-amber-500">
          <p className="text-[10px] text-muted-foreground">Excluded</p>
          <p className="text-sm font-semibold font-mono">{skipped}</p>
        </div>
        <div className="p-2 rounded bg-destructive/10 text-destructive">
          <p className="text-[10px] text-muted-foreground">Failed</p>
          <p className="text-sm font-semibold font-mono">{failed}</p>
        </div>
      </div>

      {/* Explicit Reasons for Exclusions */}
      {metrics.skippedPaths && metrics.skippedPaths.length > 0 && (
        <div className="pt-2 text-xs space-y-1">
          <p className="font-medium text-muted-foreground text-[11px]">Explicit Exclusion Accounting:</p>
          <div className="max-h-24 overflow-y-auto divide-y divide-border/50 text-[11px] font-mono">
            {metrics.skippedPaths.slice(0, 5).map((sp, idx) => (
              <div key={idx} className="py-1 flex items-center justify-between gap-2">
                <span className="truncate text-foreground/80">{sp.path}</span>
                <span className="text-[10px] shrink-0 text-muted-foreground bg-muted px-1.5 rounded">
                  {sp.reason}
                </span>
              </div>
            ))}
            {metrics.skippedPaths.length > 5 && (
              <p className="text-[10px] text-muted-foreground pt-1 italic">
                + {metrics.skippedPaths.length - 5} additional excluded files (lockfiles, vendor assets)
              </p>
            )}
          </div>
        </div>
      )}

      {isTruncated && (
        <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 p-2 rounded">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>GitHub API tree truncated due to size limits. Upper bounds applied.</span>
        </div>
      )}
    </div>
  );
}
