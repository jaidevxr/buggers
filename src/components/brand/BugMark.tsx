type Props = { className?: string; title?: string };

/** Minimal geometric bug mark: a rounded body, two antennae, three leg strokes. */
export function BugMark({ className = "h-7 w-7", title = "Buggers" }: Props) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label={title}>
      <path
        d="M11 7.5 13.5 10M21 7.5 18.5 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="10" y="10" width="12" height="16" rx="6" fill="currentColor" />
      <path
        d="M10 15H5M10 20H6M22 15h5M22 20h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="16" r="2" className="fill-background" />
    </svg>
  );
}

export function BuggersWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BugMark className="h-6 w-6 text-primary" />
      <span className="text-display text-lg font-extrabold tracking-tight">BUGGERS</span>
    </span>
  );
}
