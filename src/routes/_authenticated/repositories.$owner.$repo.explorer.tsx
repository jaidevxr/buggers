import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { FolderTree, ArrowLeft, ExternalLink, Loader2, Play, ShieldAlert, Sparkles } from "lucide-react";
import { getRepositoryTree, getFileContent, getRepositoryOverview } from "@/lib/github.functions";
import { listFindings } from "@/lib/findings.functions";
import { startRepositoryAnalysis, runAnalysis } from "@/lib/analysis.functions";
import { PageHeader, errMsg } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/LoadingSkeletons";
import { ErrorState } from "@/components/status/EmptyState";
import { FileTreeSidebar } from "@/components/explorer/FileTreeSidebar";
import { CodeViewer } from "@/components/explorer/CodeViewer";
import { Button } from "@/components/ui/button";
import type { CodebaseFinding } from "@/server/codebaseAnalyzer.server";

const searchSchema = z.object({
  file: z.string().optional(),
  line: z.coerce.number().optional(),
  ref: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/repositories/$owner/$repo/explorer")({
  validateSearch: searchSchema,
  head: ({ params }) => ({ meta: [{ title: `Explorer: ${params.owner}/${params.repo} – Buggers` }] }),
  component: RepoExplorerPage,
});

function RepoExplorerPage() {
  const { owner, repo } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const full = `${owner}/${repo}`;

  const [selectedPath, setSelectedPath] = useState<string | null>(search.file || null);
  const [targetLine, setTargetLine] = useState<number | null>(search.line || null);
  const [scanningTarget, setScanningTarget] = useState<string | null>(null);

  // Sync state if search params change
  useEffect(() => {
    if (search.file) setSelectedPath(search.file);
    if (search.line) setTargetLine(search.line);
  }, [search.file, search.line]);

  // 1. Fetch Repository Metadata
  const repoMeta = useQuery({
    queryKey: ["repo", full],
    queryFn: () => getRepositoryOverview({ data: { repoFullName: full } }),
  });

  const activeRef = search.ref || repoMeta.data?.repo?.defaultBranch;

  // 2. Fetch File Tree
  const treeQuery = useQuery({
    queryKey: ["repoTree", full, activeRef],
    queryFn: () =>
      getRepositoryTree({
        data: {
          repoFullName: full,
          branch: activeRef,
          recursive: true,
        },
      }),
    enabled: Boolean(activeRef || repoMeta.data),
  });

  // Automatically select first file if none selected
  useEffect(() => {
    if (!selectedPath && treeQuery.data?.tree) {
      const firstBlob = treeQuery.data.tree.find((i) => i.type === "blob");
      if (firstBlob) {
        setSelectedPath(firstBlob.path);
      }
    }
  }, [selectedPath, treeQuery.data]);

  // 3. Fetch Selected File Content
  const fileContentQuery = useQuery({
    queryKey: ["fileContent", full, selectedPath, activeRef],
    queryFn: () =>
      getFileContent({
        data: {
          repoFullName: full,
          path: selectedPath!,
          ref: activeRef,
        },
      }),
    enabled: Boolean(selectedPath),
  });

  // 4. Fetch Existing Findings for this repo to highlight lines
  const findingsQuery = useQuery({
    queryKey: ["findings", full],
    queryFn: () => listFindings(),
  });

  // Filter findings for the active file
  const activeFileFindings: CodebaseFinding[] = (findingsQuery.data?.findings || [])
    .filter((f) => f.repo_full_name === full && f.file_path === selectedPath)
    .map((f) => ({
      id: f.id,
      file_path: f.file_path,
      line_number: f.line_number,
      title: f.title,
      category: (f.category as any) || "security",
      severity: f.severity as any,
      confidence: Number(f.confidence) || 0.9,
      evidence: f.evidence || "",
      explanation: f.description || "",
      expected_behavior: "Expected secure behavior",
      actual_behavior: f.why_it_matters || "Vulnerability or flaw detected",
      suggested_fix: f.suggested_fix || "",
      rule_id: f.source || "sast",
      is_confirmed: true,
    }));

  const handleSelectFile = (path: string) => {
    setSelectedPath(path);
    setTargetLine(null);
    navigate({
      search: (prev) => ({ ...prev, file: path, line: undefined }),
      replace: true,
    });
  };

  const handleScanTarget = async (targetPath: string, scope: "file" | "directory" | "repository") => {
    setScanningTarget(targetPath);
    try {
      const res = await startRepositoryAnalysis({
        data: {
          repoFullName: full,
          branch: repoMeta.data?.repo?.defaultBranch,
          targetPath,
          scope,
        },
      });
      if (!res.alreadyRunning) {
        void runAnalysis({ data: { analysisId: res.analysisId } }).catch(() => {});
      }
      toast.success(`Analysis initiated for ${scope}: ${targetPath}`);
      navigate({ to: "/analysis/$id", params: { id: res.analysisId } });
    } catch (e) {
      toast.error(errMsg(e));
      setScanningTarget(null);
    }
  };

  if (repoMeta.isLoading || treeQuery.isLoading) return <PageSkeleton />;
  if (repoMeta.error)
    return (
      <ErrorState
        message={errMsg(repoMeta.error)}
        onRetry={() => repoMeta.refetch()}
        action={
          <Link to="/repositories" className="text-sm underline">
            Back to repositories
          </Link>
        }
      />
    );

  const tree = treeQuery.data?.tree || [];
  const fileData = fileContentQuery.data;

  return (
    <div className="page-view content-fade-in flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
            <Link to="/repositories/$owner/$repo" params={{ owner, repo }}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Overview</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold flex items-center gap-1.5">
              <FolderTree className="h-4 w-4 text-primary" />
              <span>{full}</span>
              <span className="text-muted-foreground font-normal text-xs">
                ({repoMeta.data?.repo?.defaultBranch || "main"})
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedPath && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleScanTarget(selectedPath, "file")}
              disabled={scanningTarget === selectedPath}
              className="h-8 text-xs gap-1.5"
            >
              {scanningTarget === selectedPath ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>Scan Active File</span>
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleScanTarget("", "repository")}
            disabled={scanningTarget === ""}
            className="h-8 text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Scan Entire Repo</span>
          </Button>
        </div>
      </div>

      {/* Explorer Workspace */}
      <div className="flex-1 flex overflow-hidden pt-3 gap-0 rounded-lg border border-border shadow-sm bg-card">
        {/* Left: File Tree Sidebar (300px) */}
        <div className="w-72 shrink-0 h-full border-r border-border">
          <FileTreeSidebar
            tree={tree}
            selectedPath={selectedPath}
            onSelectFile={handleSelectFile}
            onScanTarget={handleScanTarget}
            scanningPath={scanningTarget}
          />
        </div>

        {/* Right: Code Viewer (Remaining) */}
        <div className="flex-1 h-full overflow-hidden bg-background">
          {fileContentQuery.isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading file content...</span>
            </div>
          ) : selectedPath && fileData ? (
            <CodeViewer
              filePath={selectedPath}
              content={fileData.content}
              language={fileData.language}
              lines={fileData.lines}
              size={fileData.size}
              targetLine={targetLine}
              findings={activeFileFindings}
              onScanFile={() => handleScanTarget(selectedPath, "file")}
              scanning={scanningTarget === selectedPath}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs space-y-2">
              <FolderTree className="h-8 w-8 text-muted-foreground/40" />
              <span>Select a file from the tree to inspect code</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
