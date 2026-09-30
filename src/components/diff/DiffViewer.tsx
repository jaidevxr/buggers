import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type File = { filename: string; status: string; additions: number; deletions: number; patch?: string | undefined };
type Finding = { id: string; file_path: string; line_number: number | null; title: string; severity: string };

export function DiffViewer({ files, findings }: { files: File[]; findings: Finding[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(files.slice(0, 3).map((f) => [f.filename, true])),
  );
  if (files.length === 0) return <p className="text-sm text-muted-foreground">No changed files.</p>;
  return (
    <div className="space-y-3">
      {files.map((f) => {
        const isOpen = open[f.filename];
        const fileFindings = findings.filter((x) => x.file_path === f.filename);
        return (
          <div key={f.filename} className="surface-card overflow-hidden">
            <button
              className="flex w-full items-center gap-2 bg-muted/50 px-3 py-2 text-left text-sm"
              onClick={() => setOpen((o) => ({ ...o, [f.filename]: !isOpen }))}
              aria-expanded={isOpen}
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{f.filename}</span>
              {fileFindings.length > 0 && <span className="rounded bg-risk-high-soft px-1.5 text-xs text-risk-high">{fileFindings.length} finding{fileFindings.length > 1 ? "s" : ""}</span>}
              <span className="text-xs text-risk-low">+{f.additions}</span>
              <span className="text-xs text-destructive">-{f.deletions}</span>
            </button>
            {isOpen && (f.patch ? <Patch patch={f.patch} findings={fileFindings} /> : <p className="p-3 text-xs text-muted-foreground">Diff not available (binary or too large).</p>)}
          </div>
        );
      })}
    </div>
  );
}

function Patch({ patch, findings }: { patch: string; findings: Finding[] }) {
  let oldLn = 0;
  let newLn = 0;
  const rows = patch.split("\n").map((line, i) => {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(line);
    if (hunk) {
      oldLn = Number(hunk[1]);
      newLn = Number(hunk[2]);
      return { i, line, type: "hunk" as const, o: "", n: "", marks: [] as Finding[] };
    }
    const t = line[0] === "+" ? "add" : line[0] === "-" ? "del" : "ctx";
    const o = t === "add" ? "" : String(oldLn++);
    const nNum = t === "del" ? null : newLn++;
    const marks = nNum ? findings.filter((f) => f.line_number === nNum) : [];
    return { i, line, type: t, o, n: nNum ? String(nNum) : "", marks };
  });
  return (
    <div className="overflow-x-auto font-mono text-xs">
      {rows.map((r) => (
        <div key={r.i}>
          <div className={cn("flex", r.type === "add" && "bg-risk-low-soft", r.type === "del" && "bg-risk-critical-soft", r.type === "hunk" && "bg-muted text-muted-foreground")}>
            <span className="w-10 shrink-0 select-none px-1 text-right text-muted-foreground">{r.o}</span>
            <span className="w-10 shrink-0 select-none px-1 text-right text-muted-foreground">{r.n}</span>
            <pre className="whitespace-pre px-2">{r.line}</pre>
          </div>
          {r.marks.map((m) => (
            <div key={m.id} className="border-l-4 border-risk-high bg-risk-high-soft px-3 py-1 font-sans text-xs">
              <span className="font-semibold capitalize">{m.severity}:</span> {m.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
