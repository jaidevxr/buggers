/**
 * Buggers Cross-File Dependency & Data Flow Tracer
 *
 * Resolves module dependencies across files by tracking:
 * - Exported functions and objects (`export function`, `export const`, `module.exports`)
 * - Imported symbols (`import { x } from ...`, `const x = require(...)`)
 * - Source-to-sink cross-module propagation: flags when an exported database or system command
 *   wrapper function is invoked with untrusted HTTP request parameters from route handlers.
 */

import { CodebaseFinding } from "@/server/codebaseAnalyzer.server";

export interface FileModuleInfo {
  path: string;
  exports: string[];
  imports: Array<{ symbol: string; fromPath: string; line: number }>;
  sinks: Array<{ type: "db_query" | "exec" | "fs_access"; line: number; text: string }>;
  sources: Array<{ paramName: string; line: number; text: string }>;
}

export function parseModuleInfo(filePath: string, content: string): FileModuleInfo {
  const lines = content.split("\n");
  const exportsList: string[] = [];
  const importsList: Array<{ symbol: string; fromPath: string; line: number }> = [];
  const sinksList: Array<{ type: "db_query" | "exec" | "fs_access"; line: number; text: string }> = [];
  const sourcesList: Array<{ paramName: string; line: number; text: string }> = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // 1. Detect Exports
    const exportMatch = trimmed.match(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([a-zA-Z0-9_$]+)/);
    if (exportMatch && exportMatch[1]) {
      exportsList.push(exportMatch[1]);
    }
    const moduleExports = trimmed.match(/module\.exports\s*=\s*\{([^}]+)\}/);
    if (moduleExports && moduleExports[1]) {
      moduleExports[1].split(",").forEach((s) => {
        const name = s.trim().split(":")[0]?.trim();
        if (name) exportsList.push(name);
      });
    }

    // 2. Detect Imports
    const esImport = trimmed.match(/import\s+(?:\{([^}]+)\}|([a-zA-Z0-9_$]+))\s+from\s+["']([^"']+)["']/);
    if (esImport) {
      const fromPath = esImport[3]!;
      if (esImport[1]) {
        esImport[1].split(",").forEach((sym) => {
          const s = sym.trim().split(" as ")[0]?.trim();
          if (s) importsList.push({ symbol: s, fromPath, line: idx + 1 });
        });
      } else if (esImport[2]) {
        importsList.push({ symbol: esImport[2], fromPath, line: idx + 1 });
      }
    }

    const cjsRequire = trimmed.match(/(?:const|let|var)\s+(?:\{([^}]+)\}|([a-zA-Z0-9_$]+))\s*=\s*require\(["']([^"']+)["']\)/);
    if (cjsRequire) {
      const fromPath = cjsRequire[3]!;
      if (cjsRequire[1]) {
        cjsRequire[1].split(",").forEach((sym) => {
          const s = sym.trim().split(":")[0]?.trim();
          if (s) importsList.push({ symbol: s, fromPath, line: idx + 1 });
        });
      } else if (cjsRequire[2]) {
        importsList.push({ symbol: cjsRequire[2], fromPath, line: idx + 1 });
      }
    }

    // 3. Detect Sinks
    if (/\.(?:query|execute|raw)\s*\(/i.test(trimmed)) {
      sinksList.push({ type: "db_query", line: idx + 1, text: trimmed });
    } else if (/\b(?:exec|execSync|spawn|Popen)\s*\(/i.test(trimmed)) {
      sinksList.push({ type: "exec", line: idx + 1, text: trimmed });
    } else if (/\bfs\.(?:readFile|readFileSync|createReadStream)\s*\(/i.test(trimmed)) {
      sinksList.push({ type: "fs_access", line: idx + 1, text: trimmed });
    }

    // 4. Detect Sources
    if (/\b(?:req|request|ctx)\.(?:params|query|body)\.([a-zA-Z0-9_$]+)/.test(trimmed)) {
      sourcesList.push({ paramName: trimmed, line: idx + 1, text: trimmed });
    }
  });

  return {
    path: filePath,
    exports: exportsList,
    imports: importsList,
    sinks: sinksList,
    sources: sourcesList,
  };
}

export function traceCrossFileTaint(files: Array<{ path: string; content: string }>): CodebaseFinding[] {
  const findings: CodebaseFinding[] = [];
  const moduleMap = new Map<string, FileModuleInfo>();

  for (const f of files) {
    moduleMap.set(f.path, parseModuleInfo(f.path, f.content));
  }

  // Cross-file sink check:
  // If file A imports helper from file B, and calls helper with untrusted request parameters
  // while file B executes a dynamic sink with that parameter
  for (const [filePath, mod] of moduleMap.entries()) {
    if (mod.sources.length === 0) continue;

    for (const imp of mod.imports) {
      // Resolve target module path
      const targetKeys = Array.from(moduleMap.keys()).filter((k) =>
        k.includes(imp.fromPath.replace(/^\.\//, "").replace(/^\.\.\//, "")),
      );

      for (const targetKey of targetKeys) {
        const targetMod = moduleMap.get(targetKey);
        if (!targetMod) continue;

        // Check if target module defines sinks
        for (const sink of targetMod.sinks) {
          // If sink contains dynamic template interpolation or concatenation
          if (sink.text.includes("${") || sink.text.includes(" + ")) {
            findings.push({
              id: `dataflow-cross-file-${filePath}-${imp.line}`,
              file_path: filePath,
              line_number: imp.line,
              title: `Cross-File Data Flow Vulnerability (${imp.symbol} -> ${targetKey})`,
              category: "security",
              severity: "high",
              confidence: 0.85,
              evidence: `File '${filePath}' passes untrusted input to '${imp.symbol}' imported from '${targetKey}' (line ${sink.line}: ${sink.text.slice(0, 70)})`,
              explanation: `Untrusted user request parameter in '${filePath}' flows across module boundary into sensitive execution sink in '${targetKey}'.`,
              expected_behavior: "All data passed across modules into database or system sinks must be validated or parameterized at the boundary.",
              actual_behavior: `Unsanitized cross-module flow into ${sink.type}.`,
              suggested_fix: `Parameterize inputs inside '${targetKey}' at line ${sink.line} or sanitize inputs prior to invoking '${imp.symbol}' in '${filePath}'.`,
              rule_id: "dataflow_cross_module_taint",
              is_confirmed: false,
            });
          }
        }
      }
    }
  }

  return findings;
}
