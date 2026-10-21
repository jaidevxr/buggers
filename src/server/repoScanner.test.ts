import { describe, it, expect } from "vitest";
import {
  detectLanguage,
  shouldExcludeFile,
  analyzeWholeCodebaseFiles,
  isDynamicEvalArgument,
  hasDynamicEvalExecution,
  type ScannedFileContent,
} from "./repoScanner.server";

describe("Whole-Repository Codebase Scanner", () => {
  describe("Language & File Detection", () => {
    it("accurately detects languages across multi-language projects", () => {
      expect(detectLanguage("src/index.ts")).toBe("typescript");
      expect(detectLanguage("components/App.tsx")).toBe("typescript");
      expect(detectLanguage("server/api.js")).toBe("javascript");
      expect(detectLanguage("scripts/model.py")).toBe("python");
      expect(detectLanguage("cmd/main.go")).toBe("go");
      expect(detectLanguage("src/lib.rs")).toBe("rust");
      expect(detectLanguage("Dockerfile")).toBe("dockerfile");
      expect(detectLanguage("deploy/k8s.yaml")).toBe("yaml");
      expect(detectLanguage("package.json")).toBe("json");
    });

    it("excludes binary files, vendor directories, and minified bundles", () => {
      expect(shouldExcludeFile("assets/logo.png", 1024).exclude).toBe(true);
      expect(shouldExcludeFile("fonts/inter.woff2", 5000).exclude).toBe(true);
      expect(shouldExcludeFile("node_modules/react/index.js", 200).exclude).toBe(true);
      expect(shouldExcludeFile("dist/bundle.js", 500).exclude).toBe(true);
      expect(shouldExcludeFile(".git/objects/abc", 100).exclude).toBe(true);
      expect(shouldExcludeFile("static/app.min.js", 200).exclude).toBe(true);
      expect(shouldExcludeFile("large_dump.sql", 500 * 1024).exclude).toBe(true);

      // Should keep important source & config files
      expect(shouldExcludeFile("src/auth/login.ts", 4096).exclude).toBe(false);
      expect(shouldExcludeFile("package.json", 1200).exclude).toBe(false);
      expect(shouldExcludeFile("Dockerfile", 500).exclude).toBe(false);
    });
  });

  describe("Multi-Layer SAST & Secret Detection", () => {
    it("detects SQL injection, command injection, and eval in whole files with exact line numbers", () => {
      const mockFile: ScannedFileContent = {
        path: "src/server/database.ts",
        language: "typescript",
        size: 500,
        sha: "abc1234",
        content: `import { client } from "./db";

export async function getUser(req, res) {
  const userId = req.query.id;
  // Vulnerable SQL interpolation
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  const result = await client.query(query);
  return res.json(result);
}

export function runShell(command) {
  const { execSync } = require("child_process");
  execSync("echo " + command);
}

export function dangerousDynamic(userFormula) {
  return eval(userFormula);
}
`,
      };

      const findings = analyzeWholeCodebaseFiles([mockFile]);

      expect(findings.length).toBeGreaterThanOrEqual(3);

      const sqli = findings.find((f) => f.rule_id === "sql_injection");
      expect(sqli).toBeDefined();
      expect(sqli?.line_number).toBe(6);
      expect(sqli?.severity).toBe("critical");

      const cmdi = findings.find((f) => f.rule_id === "command_injection");
      expect(cmdi).toBeDefined();
      expect(cmdi?.line_number).toBe(13);
      expect(cmdi?.severity).toBe("critical");

      const evali = findings.find((f) => f.rule_id === "dynamic_eval_execution");
      expect(evali).toBeDefined();
      expect(evali?.line_number).toBe(17);
      expect(evali?.severity).toBe("critical");
    });

    it("detects and masks exposed API secrets across repository files", () => {
      const dummyStripe = ["sk", "live", "51ABCDEF123456789012345678"].join("_");
      const dummyOpenAi = ["sk", "proj", "abcdef1234567890abcdef1234567890"].join("-");
      const dummyAws = ["AKIA", "IOSFODNN7EXAMPLE"].join("");

      const mockSecretsFile: ScannedFileContent = {
        path: "config/keys.js",
        language: "javascript",
        size: 300,
        sha: "def5678",
        content: `module.exports = {
  stripeKey: "${dummyStripe}",
  openAiKey: "${dummyOpenAi}",
  awsKeyId: "${dummyAws}",
};
`,
      };

      const findings = analyzeWholeCodebaseFiles([mockSecretsFile]);
      const secretFindings = findings.filter((f) => f.category === "security" && f.source === "secrets");

      expect(secretFindings.length).toBe(3);

      for (const sf of secretFindings) {
        expect(sf.severity).toBe("critical");
        // Ensure evidence never leaks raw secret values
        expect(sf.evidence).toContain("****");
        expect(sf.evidence).not.toContain(dummyStripe);
        expect(sf.evidence).not.toContain(dummyOpenAi);
      }
    });

    it("detects vulnerable dependencies inside package.json manifests", () => {
      const mockPkgJson: ScannedFileContent = {
        path: "package.json",
        language: "json",
        size: 400,
        sha: "pkg1234",
        content: JSON.stringify(
          {
            name: "test-app",
            dependencies: {
              lodash: "4.17.15", // Vulnerable
              axios: "0.21.1", // Vulnerable
              jsonwebtoken: "8.5.1", // Vulnerable
            },
          },
          null,
          2,
        ),
      };

      const findings = analyzeWholeCodebaseFiles([mockPkgJson]);
      const depFindings = findings.filter((f) => f.source === "dependencies");

      expect(depFindings.length).toBe(3);
      expect(depFindings.map((d) => d.title)).toContain("Vulnerable Dependency: lodash");
      expect(depFindings.map((d) => d.title)).toContain("Vulnerable Dependency: axios");
      expect(depFindings.map((d) => d.title)).toContain("Vulnerable Dependency: jsonwebtoken");
    });
  });

  describe("Eval Argument Safety Regression Suite (Defect 2)", () => {
    it("distinguishes constant strings containing nested single or double quotes", () => {
      // Double quotes with inner single quotes
      expect(isDynamicEvalArgument('"console.log(\'safe constant\') "')).toBe(false);
      expect(hasDynamicEvalExecution('eval("console.log(\'safe constant\')");')).toBe(false);

      // Single quotes with inner double quotes
      expect(isDynamicEvalArgument('\'console.log("safe constant")\'')).toBe(false);
      expect(hasDynamicEvalExecution('eval(\'console.log("safe constant")\');')).toBe(false);
    });

    it("distinguishes escaped quotes in constant strings", () => {
      expect(isDynamicEvalArgument('"console.log(\\"escaped double\\")"')).toBe(false);
      expect(hasDynamicEvalExecution('eval("console.log(\\"escaped double\\")");')).toBe(false);

      expect(isDynamicEvalArgument("'console.log(\\'escaped single\\')'")).toBe(false);
      expect(hasDynamicEvalExecution("eval('console.log(\\'escaped single\\')');")).toBe(false);
    });

    it("flags dynamic variables passed to eval", () => {
      expect(isDynamicEvalArgument("userCode")).toBe(true);
      expect(isDynamicEvalArgument("formula")).toBe(true);
      expect(hasDynamicEvalExecution("eval(userCode);")).toBe(true);
    });

    it("flags request-controlled values passed to eval", () => {
      expect(isDynamicEvalArgument("req.body.code")).toBe(true);
      expect(isDynamicEvalArgument('request.GET.get("expr")')).toBe(true);
      expect(hasDynamicEvalExecution("eval(req.body.code);")).toBe(true);
      expect(hasDynamicEvalExecution('res = eval(request.GET.get("expr"));')).toBe(true);
    });

    it("flags template literals containing interpolation", () => {
      expect(isDynamicEvalArgument("`const x = ${user}`")).toBe(true);
      expect(isDynamicEvalArgument("`calc(${a} + ${b})`")).toBe(true);
      expect(hasDynamicEvalExecution("eval(`const x = ${user}`);")).toBe(true);
    });

    it("does not flag template literals without interpolation", () => {
      expect(isDynamicEvalArgument("`console.log('safe template')`")).toBe(false);
      expect(hasDynamicEvalExecution("eval(`console.log('safe template')`);")).toBe(false);
    });

    it("flags concatenation expressions even if they start with a string literal", () => {
      expect(isDynamicEvalArgument('"prefix" + userCode')).toBe(true);
      expect(hasDynamicEvalExecution('eval("prefix" + userCode);')).toBe(true);
    });
  });
});
