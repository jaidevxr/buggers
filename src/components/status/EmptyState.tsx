import type { ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  action,
  onRetry,
}: {
  message: string;
  action?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-destructive">Something went wrong</h3>
      <p className="max-w-lg text-sm text-muted-foreground leading-relaxed">{message}</p>
      {action ? (
        <div className="mt-2">{action}</div>
      ) : onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 gap-1.5 border-destructive/30 hover:bg-destructive/10">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-16 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      <span>{label}</span>
    </div>
  );
}
