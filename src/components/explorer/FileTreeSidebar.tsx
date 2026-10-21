import { useState, useMemo } from "react";
import { Folder, FolderOpen, FileCode, FileText, Search, ChevronRight, ChevronDown, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RepositoryTreeItem } from "@/lib/github.functions";

interface FileTreeNode {
  name: string;
  path: string;
  type: "blob" | "tree";
  size?: number | undefined;
  sha: string;
  children?: Map<string, FileTreeNode> | undefined;
}

interface FileTreeSidebarProps {
  tree: RepositoryTreeItem[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onScanTarget?: (targetPath: string, scope: "file" | "directory" | "repository") => void;
  scanningPath?: string | null;
}

export function FileTreeSidebar({
  tree,
  selectedPath,
  onSelectFile,
  onScanTarget,
  scanningPath,
}: FileTreeSidebarProps) {
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => {
    // Default open root-level directories
    const rootDirs = new Set<string>();
    for (const item of tree) {
      const parts = item.path.split("/");
      if (parts.length > 1) {
        rootDirs.add(parts[0]!);
      }
    }
    return rootDirs;
  });

  const toggleFolder = (folderPath: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  // Build hierarchical tree
  const rootNode = useMemo(() => {
    const root: FileTreeNode = {
      name: "",
      path: "",
      type: "tree",
      sha: "",
      children: new Map(),
    };

    for (const item of tree) {
      const parts = item.path.split("/");
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!;
        const isLeaf = i === parts.length - 1;

        if (!current.children) {
          current.children = new Map();
        }

        if (!current.children.has(part)) {
          const nodePath = parts.slice(0, i + 1).join("/");
          current.children.set(part, {
            name: part,
            path: nodePath,
            type: isLeaf ? item.type : "tree",
            size: isLeaf ? item.size : undefined,
            sha: item.sha,
            children: isLeaf && item.type === "blob" ? undefined : new Map(),
          });
        }
        current = current.children.get(part)!;
      }
    }

    return root;
  }, [tree]);

  // Detected languages
  const languages = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of tree) {
      if (item.type !== "blob") continue;
      const ext = item.path.split(".").pop()?.toLowerCase() ?? "other";
      counts[ext] = (counts[ext] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tree]);

  const renderNode = (node: FileTreeNode, depth = 0) => {
    if (!node.children) return null;

    const entries = Array.from(node.children.values());
    // Sort directories first, then alphabetical
    entries.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "tree" ? -1 : 1;
    });

    return entries.map((child) => {
      // Search filter
      if (search && !child.path.toLowerCase().includes(search.toLowerCase())) {
        if (child.type === "blob") return null;
        // If directory, check if any descendant matches
        const hasMatchingChild = (n: FileTreeNode): boolean => {
          if (!n.children) return n.path.toLowerCase().includes(search.toLowerCase());
          for (const c of n.children.values()) {
            if (hasMatchingChild(c)) return true;
          }
          return false;
        };
        if (!hasMatchingChild(child)) return null;
      }

      // Language filter
      if (child.type === "blob" && selectedLanguage !== "all") {
        const ext = child.path.split(".").pop()?.toLowerCase();
        if (ext !== selectedLanguage) return null;
      }

      const isDirectory = child.type === "tree";
      const isOpen = openFolders.has(child.path) || Boolean(search);
      const isSelected = selectedPath === child.path;

      if (isDirectory) {
        return (
          <div key={child.path} className="select-none">
            <div
              className="group flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-muted/60 cursor-pointer transition-colors"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => toggleFolder(child.path)}
            >
              <div className="flex items-center gap-1.5 truncate">
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                {isOpen ? (
                  <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate font-medium text-foreground">{child.name}</span>
              </div>
              {onScanTarget && (
                <button
                  type="button"
                  title="Scan this directory"
                  onClick={(e) => {
                    e.stopPropagation();
                    onScanTarget(child.path, "directory");
                  }}
                  disabled={scanningPath === child.path}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-background text-muted-foreground hover:text-primary transition-all"
                >
                  <Play className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
            {isOpen && renderNode(child, depth + 1)}
          </div>
        );
      }

      return (
        <div
          key={child.path}
          className={`group flex items-center justify-between rounded-md px-2 py-1 text-xs cursor-pointer transition-colors ${
            isSelected
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          style={{ paddingLeft: `${depth * 12 + 22}px` }}
          onClick={() => onSelectFile(child.path)}
        >
          <div className="flex items-center gap-1.5 truncate">
            {child.name.endsWith(".ts") || child.name.endsWith(".tsx") || child.name.endsWith(".js") ? (
              <FileCode className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            ) : (
              <FileText className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{child.name}</span>
          </div>
          {onScanTarget && (
            <button
              type="button"
              title="Scan this file"
              onClick={(e) => {
                e.stopPropagation();
                onScanTarget(child.path, "file");
              }}
              disabled={scanningPath === child.path}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-background text-muted-foreground hover:text-primary transition-all"
            >
              <Play className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
        {languages.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setSelectedLanguage("all")}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                selectedLanguage === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({tree.filter((i) => i.type === "blob").length})
            </button>
            {languages.slice(0, 6).map(([ext, count]) => (
              <button
                key={ext}
                type="button"
                onClick={() => setSelectedLanguage(ext)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors uppercase ${
                  selectedLanguage === ext
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                .{ext} ({count})
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {renderNode(rootNode)}
      </div>
    </div>
  );
}
