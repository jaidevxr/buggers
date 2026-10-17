type Props = { className?: string; title?: string };

/** Minimal geometric bug mark styled with ASCII numbers for cyber/security aesthetic */
export function BugMark({ className = "h-7 w-7", title = "Buggers" }: Props) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label={title} fill="none">
      {/* Antennae */}
      <path
        d="M10 7.5 13 10M22 7.5 19 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Bug Body Outline with Dark Fill */}
      <rect x="9.5" y="9.5" width="13" height="17" rx="6.5" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" />
      {/* Legs */}
      <path
        d="M9.5 14H4.5M9.5 18H4M9.5 22H5M22.5 14h5M22.5 18h5.5M22.5 22h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* ASCII Numbers in the heart of the Bug */}
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize="7"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontWeight="800"
        letterSpacing="-0.5px"
      >
        01
      </text>
      <text
        x="16"
        y="21"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize="5.5"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontWeight="700"
        letterSpacing="-0.3px"
        opacity="0.85"
      >
        10
      </text>
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
