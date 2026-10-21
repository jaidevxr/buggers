import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function PageHeader({
  title,
  description,
  actions,
  showBack,
  onBack,
  backTo,
  backLabel,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6 space-y-2">
      {(showBack || backTo) && (
        <div>
          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 py-1 px-2.5 -ml-2 rounded-md hover:bg-muted/60 cursor-pointer active:scale-[0.98] group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
              <span>{backLabel ?? "Back"}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onBack ?? (() => window.history.back())}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 py-1 px-2.5 -ml-2 rounded-md hover:bg-muted/60 cursor-pointer active:scale-[0.98] group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
              <span>{backLabel ?? "Back"}</span>
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="surface-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function errMsg(e: unknown): string {
  if (!e) return "An unknown error occurred";
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (typeof e === "object") {
    const obj = e as Record<string, unknown>;
    if (typeof obj["message"] === "string") return obj["message"];
    if (typeof obj["error"] === "string") return obj["error"];
    if (typeof obj["msg"] === "string") return obj["msg"];
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  return String(e);
}
