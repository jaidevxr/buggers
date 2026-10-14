import { useState } from "react";
import { Check, Copy, ChevronDown, Terminal } from "lucide-react";

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
    <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] overflow-hidden my-4 shadow-xl">
      {/* Code Header Bar */}
      <div className="px-4 py-2.5 bg-black/40 border-b border-white/[0.06] flex items-center justify-between text-xs font-mono text-[#8a8f98]">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-300">
            {filename ?? language.toUpperCase()}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
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
      <pre className="p-4 text-xs font-mono overflow-x-auto text-neutral-200 leading-relaxed bg-[#08090a]/60">
        {showLineNumbers ? (
          lines.map((line, idx) => (
            <div key={idx} className="flex">
              <span className="select-none text-neutral-600 text-right pr-4 w-8 shrink-0">
                {idx + 1}
              </span>
              <code className="text-neutral-200">{line}</code>
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
      border: "border-l-2 border-l-white/40 border-white/[0.06]",
      tag: "text-neutral-400 bg-white/5 border border-white/10",
      defaultTitle: "NOTE",
    },
    tip: {
      border: "border-l-2 border-l-emerald-400 border-white/[0.06]",
      tag: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
      defaultTitle: "TIP",
    },
    warning: {
      border: "border-l-2 border-l-amber-400 border-white/[0.06]",
      tag: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
      defaultTitle: "IMPORTANT",
    },
    danger: {
      border: "border-l-2 border-l-rose-400 border-white/[0.06]",
      tag: "text-rose-400 bg-rose-500/10 border border-rose-500/20",
      defaultTitle: "CAUTION",
    },
  }[type];

  return (
    <div className={`rounded-lg border bg-[#0c0d10] p-4 sm:p-5 my-4 space-y-2 ${styles.border}`}>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${styles.tag}`}
        >
          {title ?? styles.defaultTitle}
        </span>
      </div>
      <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">{children}</div>
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
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/25",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    sky: "bg-white/10 text-neutral-300 border-white/20",
    slate: "bg-white/5 text-neutral-400 border-white/10",
  }[badgeColor];

  return (
    <div className="border-b border-white/[0.08] transition-colors py-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full py-4.5 flex items-center justify-between text-left group hover:text-white transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <ChevronDown
            className={`h-4 w-4 text-neutral-500 transition-transform duration-200 shrink-0 ${
              open ? "rotate-0 text-white" : "-rotate-90"
            }`}
          />
          <span className="text-sm sm:text-base font-medium text-neutral-200 group-hover:text-white transition-colors">
            {title}
          </span>
        </div>
        {badge && (
          <span
            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${badgeStyles}`}
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="pl-7 pb-6 pt-1 text-xs sm:text-sm text-neutral-300 space-y-3.5 leading-relaxed animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
