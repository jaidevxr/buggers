import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional fallback component. If not provided, uses the default error UI. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary — catches JS errors anywhere in the child tree,
 * logs them, and shows a fallback UI instead of a white crash screen.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorUI
        error={this.state.error}
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

// ─── Default Error Fallback UI ─────────────────────────────────────

function DefaultErrorUI({
  error,
  onRetry,
  onGoHome,
}: {
  error: Error | null;
  onRetry: () => void;
  onGoHome: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while rendering this page.
            {error?.message && (
              <span className="mt-1 block font-mono text-xs text-destructive/80">
                {error.message.slice(0, 200)}
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </button>
        </div>

        {/* Details (collapsible in dev) */}
        {process.env["NODE_ENV"] !== "production" && error?.stack && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Error Details (dev only)
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
