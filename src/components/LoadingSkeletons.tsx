/**
 * Skeleton loading components for a premium Linear/Stripe/Vercel-inspired loading experience.
 * These match actual page layouts perfectly to eliminate Cumulative Layout Shift (CLS).
 */

import { cn } from "@/lib/utils";

// ─── Base Skeleton Pulse / Shimmer ─────────────────────────────────

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/60 skeleton-shimmer",
        className,
      )}
      {...props}
    />
  );
}

// ─── Dashboard Skeleton ────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 page-view">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="surface-card p-4 space-y-2.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>

      {/* Security Posture Score */}
      <div className="surface-card p-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface-card p-4 flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[60%]" />
                <Skeleton className="h-3 w-[35%]" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Repositories Skeleton ─────────────────────────────────────────

export function RepositoriesSkeleton() {
  return (
    <div className="space-y-6 page-view">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-72 max-w-full rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Grid of Repository Cards */}
      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface-card flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="space-y-1.5 min-h-[2.5rem]">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="ml-auto h-3 w-20" />
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pull Requests Skeleton ────────────────────────────────────────

export function PullRequestsSkeleton() {
  return (
    <div className="space-y-6 page-view">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-52 rounded-md" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="surface-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-60" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-72 max-w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Findings Table Skeleton ───────────────────────────────────────

export function FindingsTableSkeleton() {
  return (
    <div className="space-y-6 page-view">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-7 w-10" />
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-md" />
        ))}
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border/60 bg-muted/30 p-3.5">
          {["Finding", "Repository", "PR", "File", "Severity", "Confidence", "Status"].map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/30 p-3.5">
            <Skeleton className="h-4 w-[28%]" />
            <Skeleton className="h-4 w-[16%]" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-[18%]" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Finding Detail Skeleton ───────────────────────────────────────

export function FindingDetailSkeleton() {
  return (
    <div className="space-y-6 page-view">
      {/* Breadcrumb / Back Link */}
      <Skeleton className="h-4 w-28" />

      {/* Title & Badge */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-7 w-[60%]" />
        </div>
        <Skeleton className="h-4 w-[40%]" />
      </div>

      {/* Metadata Cards Grid */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      {/* Code Suggestion / Diff Section */}
      <div className="surface-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>

      {/* Ticket & Actions */}
      <div className="surface-card p-5 space-y-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );
}

// ─── Analytics Skeleton ────────────────────────────────────────────

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 page-view">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* 2x2 Chart Grid */}
      <div className="grid gap-4.5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card p-5 space-y-4">
            <Skeleton className="h-5 w-44" />
            <div className="flex h-64 items-end gap-3 pb-2 pt-6">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="flex-1 rounded-t-sm"
                  style={{ height: `${30 + (j * 11) % 65}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Top Files Card */}
      <div className="surface-card p-5 space-y-3">
        <Skeleton className="h-5 w-52" />
        <div className="space-y-2 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tickets Skeleton ──────────────────────────────────────────────

export function TicketsSkeleton() {
  return (
    <div className="space-y-6 page-view">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border/60 bg-muted/30 p-3.5">
          {["ID", "Finding", "Repository", "PR", "Severity", "Status", "Assignee", "Updated"].map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/30 p-3.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-[28%]" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Analysis Detail Skeleton ──────────────────────────────────────

export function AnalysisDetailSkeleton() {
  return (
    <div className="space-y-6 page-view">
      <Skeleton className="h-4 w-24" />

      <div className="space-y-2">
        <Skeleton className="h-7 w-[50%]" />
        <Skeleton className="h-4 w-[35%]" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>

      {/* Quality Gate Box */}
      <div className="surface-card p-5 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-[75%]" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-[60%]" />
            </div>
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings Skeleton ─────────────────────────────────────────────

export function SettingsSkeleton() {
  return (
    <div className="max-w-3xl space-y-6 page-view">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="surface-card p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-[75%]" />
          <div className="space-y-3.5 pt-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between py-1">
                <Skeleton className="h-4 w-[45%]" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Generic Page Skeleton ─────────────────────────────────────────

export function PageSkeleton() {
  return (
    <div className="space-y-6 page-view">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card p-4 space-y-2">
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-3 w-[40%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
