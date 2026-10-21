import { useEffect, useRef, useState } from "react";
import { Copy, Check, ShieldAlert, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CodebaseFinding } from "@/server/codebaseAnalyzer.server";

interface CodeViewerProps {
  filePath: string;
  content: string;
  language: string;
  lines: number;
  size: number;
  targetLine?: number | null;
  findings?: CodebaseFinding[];
  onScanFile?: () => void;
  scanning?: boolean;
}

export function CodeViewer({
  filePath,
  content,
  language,
  lines,
  size,
  targetLine,
  findings = [],
  onScanFile,
  scanning,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const targetLineRef = useRef<HTMLDivElement | null>(null);

  const fileLines = content ? content.split("\n") : [];

  // Group findings by line number
  const findingsByLine = new Map<number, CodebaseFinding[]>();
  for (const f of findings) {
    if (f.line_number != null) {
      const list = findingsByLine.get(f.line_number) || [];
      list.push(f);
      findingsByLine.set(f.line_number, list);
    }
  }

  useEffect(() => {
    if (targetLine && targetLineRef.current) {
      targetLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetLine]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50">
        <div className="flex items-center gap-2 truncate">
          <span className="font-mono text-xs font-semibold text-foreground truncate">{filePath}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {language}
          </span>
          <span className="text-xs text-muted-foreground">
            {lines} lines · {formatSize(size)}
          </span>
          {findings.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-destructive px-2 py-0.5 rounded bg-destructive/10">
              <ShieldAlert className="h-3 w-3" />
              {findings.length} issue{findings.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {onScanFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onScanFile}
              disabled={scanning}
              className="h-7 text-xs gap-1"
            >
              <Play className="h-3 w-3 text-primary" />
              {scanning ? "Scanning..." : "Scan File"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Copy file contents"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto font-mono text-xs leading-5 p-4 selection:bg-primary/20">
        {fileLines.length === 0 ? (
          <div className="text-muted-foreground italic p-8 text-center">Empty file or unable to preview.</div>
        ) : (
          <div className="min-w-fit">
            {fileLines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isTarget = targetLine === lineNum;
              const lineFindings = findingsByLine.get(lineNum);
              const hasFindings = Boolean(lineFindings && lineFindings.length > 0);

              return (
                <div key={lineNum}>
                  <div
                    ref={isTarget ? targetLineRef : undefined}
                    id={`L${lineNum}`}
                    className={`flex items-start group hover:bg-muted/40 transition-colors ${
                      isTarget
                        ? "bg-amber-500/15 border-l-2 border-amber-500"
                        : hasFindings
                        ? "bg-destructive/10 border-l-2 border-destructive"
                        : "border-l-2 border-transparent"
                    }`}
                  >
                    {/* Line Number */}
                    <a
                      href={`#L${lineNum}`}
                      className="w-12 select-none text-right pr-4 text-muted-foreground/60 hover:text-foreground shrink-0 text-[11px]"
                    >
                      {lineNum}
                    </a>

                    {/* Line Content */}
                    <pre className="flex-1 whitespace-pre overflow-x-visible text-foreground">
                      {lineText || " "}
                    </pre>

                    {/* Finding Badge */}
                    {hasFindings && (
                      <span className="shrink-0 mr-2 text-[10px] font-sans px-1.5 py-0.2 rounded bg-destructive text-destructive-foreground">
                        {lineFindings![0]?.title}
                      </span>
                    )}
                  </div>

                  {/* Inline Finding Details Card */}
                  {hasFindings && (
                    <div className="ml-12 my-1 mr-4 p-2.5 rounded-md border border-destructive/30 bg-destructive/5 text-foreground space-y-1">
                      <div className="flex items-center gap-1.5 font-sans font-semibold text-xs text-destructive">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {lineFindings![0]?.title}
                      </div>
                      <p className="font-sans text-[11px] text-muted-foreground">
                        {lineFindings![0]?.explanation}
                      </p>
                      {lineFindings![0]?.suggested_fix && (
                        <div className="mt-1 font-mono text-[10px] bg-background p-1.5 rounded border border-border">
                          <span className="text-emerald-500 font-semibold font-sans">Fix: </span>
                          {lineFindings![0]?.suggested_fix}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
