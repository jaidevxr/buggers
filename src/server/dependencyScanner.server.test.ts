import { describe, it, expect } from "vitest";
import { scanFilesForVulnerableDependencies } from "./dependencyScanner.server";

describe("Dependency Vulnerability (SCA) Scanner", () => {
  it("detects vulnerable lodash version in package.json", () => {
    const patch = `
@@ -15,3 +15,4 @@
   "dependencies": {
+    "lodash": "4.17.15",
   }
`;
    const findings = scanFilesForVulnerableDependencies([
      { filename: "package.json", patch },
    ]);
    expect(findings.length).toBe(1);
    expect(findings[0]?.title).toContain("Vulnerable Dependency: lodash@4.17.15");
    expect(findings[0]?.severity).toBe("high");
    expect(findings[0]?.suggested_fix).toBe('"lodash": "^4.17.21"');
  });

  it("detects vulnerable jsonwebtoken (RCE) in package.json", () => {
    const patch = `
@@ -10,2 +10,3 @@
+    "jsonwebtoken": "8.5.1",
`;
    const findings = scanFilesForVulnerableDependencies([
      { filename: "package.json", patch },
    ]);
    expect(findings.length).toBe(1);
    expect(findings[0]?.severity).toBe("critical");
    expect(findings[0]?.title).toContain("CVE-2022-23529");
  });

  it("ignores safe package versions", () => {
    const patch = `
@@ -10,2 +10,3 @@
+    "lodash": "4.17.21",
+    "axios": "1.7.0",
`;
    const findings = scanFilesForVulnerableDependencies([
      { filename: "package.json", patch },
    ]);
    expect(findings.length).toBe(0);
  });

  it("detects vulnerable python packages in requirements.txt", () => {
    const patch = `
@@ -1,2 +1,3 @@
+django==3.2.0
`;
    const findings = scanFilesForVulnerableDependencies([
      { filename: "requirements.txt", patch },
    ]);
    expect(findings.length).toBe(1);
    expect(findings[0]?.title).toContain("Vulnerable Python Package: django==3.2.0");
  });
});
