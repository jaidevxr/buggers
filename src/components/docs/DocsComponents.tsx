import { useState } from "react";
import { Check, Copy, ChevronDown, ChevronRight, Terminal } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = "bash",
  filename,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split("\n");

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0e15] overflow-hidden my-4 shadow-xl">
      {/* Code Header Bar */}
      <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-semibold text-slate-300">
            {filename ?? language.toUpperCase()}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 text-xs font-mono overflow-x-auto text-slate-200 leading-relaxed">
        {showLineNumbers ? (
          lines.map((line, idx) => (
            <div key={idx} className="flex">
              <span className="select-none text-slate-600 text-right pr-4 w-8 shrink-0">
                {idx + 1}
              </span>
              <code className="text-slate-200">{line}</code>
            </div>
          ))
        ) : (
          <code>{code.trim()}</code>
        )}
      </pre>
    </div>
  );
}

interface CalloutProps {
  type?: "info" | "tip" | "warning" | "danger";
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type = "info", title, children }: CalloutProps) {
  const styles = {
    info: {
      border: "border-sky-500/20",
      bg: "bg-sky-500/[0.06]",
      tag: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      defaultTitle: "NOTE",
    },
    tip: {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/[0.06]",
      tag: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      defaultTitle: "TIP",
    },
    warning: {
      border: "border-amber-500/20",
      bg: "bg-amber-500/[0.06]",
      tag: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      defaultTitle: "IMPORTANT",
    },
    danger: {
      border: "border-rose-500/20",
      bg: "bg-rose-500/[0.06]",
      tag: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      defaultTitle: "CAUTION",
    },
  }[type];

  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-4 sm:p-5 my-4 space-y-2`}>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${styles.tag}`}
        >
          {title ?? styles.defaultTitle}
        </span>
      </div>
      <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">{children}</div>
    </div>
  );
}

interface AccordionItemProps {
  title: string;
  badge?: string;
  badgeColor?: "amber" | "rose" | "emerald" | "sky" | "slate";
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  badge,
  badgeColor = "slate",
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  const badgeStyles = {
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    slate: "bg-white/10 text-slate-300 border-white/10",
  }[badgeColor];

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e111a] overflow-hidden transition-all duration-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold text-slate-200">{title}</span>
        </div>
        {badge && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeStyles}`}
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 border-t border-white/5 space-y-3 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
