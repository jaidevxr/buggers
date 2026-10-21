import { describe, it, expect } from "vitest";
import {
  detectLanguage,
  shouldExcludeFile,
  analyzeWholeCodebaseFiles,
  type ScannedFileContent,
} from "./repoScanner.server";
import { scanDependencyFile } from "./dependencyScanner.server";
import { SECRET_RULES, maskSecret } from "./secretScanner.server";

describe("Exhaustive Codebase Multi-Language & Security Matrix", () => {
  describe("Comprehensive Language & File Classifier Matrix", () => {
    const testCases: Array<[string, string]> = [
      ["src/main.rs", "rust"],
      ["app/main.go", "go"],
      ["scripts/data.py", "python"],
      ["backend/server.ts", "typescript"],
      ["frontend/App.tsx", "typescript"],
      ["public/bundle.js", "javascript"],
      ["infra/Dockerfile", "dockerfile"],
      ["infra/k8s/deployment.yaml", "yaml"],
      ["config/database.json", "json"],
      ["README.md", "markdown"],
      ["include/core.h", "c"],
      ["src/native.cpp", "cpp"],
      ["android/MainActivity.kt", "kotlin"],
      ["ios/AppDelegate.swift", "swift"],
      ["api/v1/routes.php", "php"],
      ["scripts/deploy.sh", "shell"],
      ["db/schema.sql", "sql"],
    ];

    it.each(testCases)("accurately identifies %s as %s", (path, expectedLang) => {
      expect(detectLanguage(path)).toBe(expectedLang);
    });

    it("identifies diverse vendor, binary, build, and media files for exclusion", () => {
      const exclusions = [
        ["static/images/hero.png", 50000],
        ["assets/icon.svg", 15000],
        ["dist/index.js", 200000],
        ["build/app.min.js", 50000],
        ["node_modules/express/index.js", 1000],
        ["vendor/bundle/ruby.rb", 2000],
        ["target/debug/app.exe", 1000000],
        [".next/server/page.js", 3000],
        [".git/HEAD", 50],
        ["package-lock.json", 400000],
        ["yarn.lock", 250000],
        ["pnpm-lock.yaml", 300000],
      ] as const;

      for (const [path, size] of exclusions) {
        const res = shouldExcludeFile(path, size);
        expect(res.exclude, `Path "${path}" should be excluded`).toBe(true);
      }
    });

    it("retains core application code, configurations, and manifests", () => {
      const inclusions = [
        ["src/index.ts", 4000],
        ["src/components/Header.tsx", 1500],
        ["services/api.py", 8000],
        ["cmd/api/main.go", 6000],
        ["Cargo.toml", 500],
        ["package.json", 1200],
        ["requirements.txt", 400],
        ["Dockerfile", 600],
        ["docker-compose.yml", 1200],
      ] as const;

      for (const [path, size] of inclusions) {
        const res = shouldExcludeFile(path, size);
        expect(res.exclude, `Path "${path}" should NOT be excluded`).toBe(false);
      }
    });
  });

  describe("Exhaustive Secrets Detection Across All Providers", () => {
    it("detects and masks every recognized credential format without leaking values", () => {
      const dummyAws = ["AKIA", "IOSFODNN7ABCD123"].join("");
      const dummyGh = ["ghp", "1234567890abcdefghijklmnopqrstuvwxyz12"].join("_");
      const dummyOpenAi = ["sk", "proj", "abcdef1234567890abcdef1234567890"].join("-");
      const dummySlack = ["https://hooks", "slack.com/services/T01234567/B01234567/abcdefghijklmnopqrstuvwx"].join(".");
      const dummyStripe = ["sk", "live", "51ABCDEF123456789012345678"].join("_");
      const dummyGoogle = ["AIza", "SyA1234567890abcdefghijklmnopqrstuv"].join("");
      const dummyDb = ["postgres://admin:", "SuperSecretPass123", "@db.prod.internal:5432/core"].join("");

      const credentialsFile: ScannedFileContent = {
        path: "config/secrets.env",
        language: "shell",
        size: 1500,
        sha: "sec123",
        content: [
          "# AWS Credentials",
          `AWS_KEY_ID="${dummyAws}"`,
          "# GitHub Personal Access Token",
          `GH_TOKEN="${dummyGh}"`,
          "# OpenAI Secret Key",
          `OPENAI_API_KEY="${dummyOpenAi}"`,
          "# Slack Incoming Webhook",
          `SLACK_WEBHOOK="${dummySlack}"`,
          "# Stripe Production Key",
          `STRIPE_LIVE_KEY="${dummyStripe}"`,
          "# Google API Key",
          `GOOGLE_KEY="${dummyGoogle}"`,
          "# Database URI",
          `DATABASE_URL="${dummyDb}"`,
        ].join("\n"),
      };

      const findings = analyzeWholeCodebaseFiles([credentialsFile]);
      const secretFindings = findings.filter((f) => f.source === "secrets");

      expect(secretFindings.length).toBeGreaterThanOrEqual(6);

      // Verify masking guarantees: evidence must NEVER leak raw keys
      for (const sf of secretFindings) {
        expect(sf.severity).toBe("critical");
        expect(sf.evidence).toContain("****");
        expect(sf.evidence).not.toContain("SuperSecretPass123");
        expect(sf.evidence).not.toContain(dummyStripe);
        expect(sf.evidence).not.toContain(dummyGh);
      }
    });
  });

  describe("Python & Multi-Language Security Vulnerability Scanning", () => {
    it("detects Python insecure deserialization and SQL interpolation", () => {
      const pythonFile: ScannedFileContent = {
        path: "app/auth.py",
        language: "python",
        size: 600,
        sha: "py123",
        content: [
          "import pickle",
          "import sqlite3",
          "",
          "def restore_session(raw_bytes):",
          "    # Insecure deserialization",
          "    session = pickle.loads(raw_bytes)",
          "    return session",
          "",
          "def get_user_records(cursor, user_id):",
          '    # SQL injection via string template interpolation',
          '    query = f"SELECT * FROM users WHERE id = {user_id}"',
          "    cursor.execute(query)",
        ].join("\n"),
      };

      const findings = analyzeWholeCodebaseFiles([pythonFile]);

      const deserialization = findings.find((f) => f.rule_id === "insecure_deserialization");
      expect(deserialization).toBeDefined();
      expect(deserialization?.line_number).toBe(6);
      expect(deserialization?.severity).toBe("critical");

      const sqli = findings.find((f) => f.rule_id === "sql_injection");
      expect(sqli).toBeDefined();
      expect(sqli?.line_number).toBe(11);
      expect(sqli?.severity).toBe("critical");
    });

    it("detects vulnerable Python packages in requirements.txt", () => {
      const reqContent = [
        "requests==2.25.1", // Vulnerable (CVE-2023-32681 < 2.31.0)
        "urllib3==1.26.5", // Vulnerable (CVE-2023-45803 < 2.0.7)
        "django==3.2.10", // Vulnerable (CVE-2024-27351 < 4.2.11)
        "flask==2.0.1", // Vulnerable (CVE-2023-30861 < 2.2.5)
        "numpy==1.24.3", // Safe
      ].join("\n");

      const findings = scanDependencyFile(reqContent, "requirements.txt");

      expect(findings.length).toBe(4);
      expect(findings.map((f) => f.packageName)).toContain("requests");
      expect(findings.map((f) => f.packageName)).toContain("urllib3");
      expect(findings.map((f) => f.packageName)).toContain("django");
      expect(findings.map((f) => f.packageName)).toContain("flask");

      for (const f of findings) {
        expect(f.severity).toBe("high");
        expect(f.suggested_fix).toMatch(/>=/);
      }
    });
  });

  describe("Simulated Full Codebase Multi-File Scan", () => {
    it("analyzes a multi-file repository with zero false positives on clean files", () => {
      const repoFiles: ScannedFileContent[] = [
        {
          path: "src/safe_util.ts",
          language: "typescript",
          size: 400,
          sha: "sha1",
          content: [
            "export function add(a: number, b: number): number {",
            "  return a + b;",
            "}",
            "export function sanitize(input: string): string {",
            "  return encodeURIComponent(input);",
            "}",
          ].join("\n"),
        },
        {
          path: "src/clean_model.py",
          language: "python",
          size: 350,
          sha: "sha2",
          content: [
            "class UserModel:",
            "    def __init__(self, username):",
            "        self.username = username",
            "",
            "    def to_json(self):",
            '        return {"username": self.username}',
          ].join("\n"),
        },
        {
          path: "src/vulnerable_api.ts",
          language: "typescript",
          size: 500,
          sha: "sha3",
          content: [
            'import { execSync } from "child_process";',
            "export function ping(target: string) {",
            '  return execSync("ping -c 1 " + target);',
            "}",
          ].join("\n"),
        },
      ];

      const findings = analyzeWholeCodebaseFiles(repoFiles);

      // Only the vulnerable API file should produce findings
      expect(findings.length).toBe(1);
      expect(findings[0]?.file_path).toBe("src/vulnerable_api.ts");
      expect(findings[0]?.rule_id).toBe("command_injection");
      expect(findings[0]?.line_number).toBe(3);
    });
  });
});
