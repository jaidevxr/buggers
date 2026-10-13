import { describe, it, expect } from "vitest";
import { scanFilesForSecrets, maskSecret } from "./secretScanner.server";

describe("Secret Scanner", () => {
  it("masks secrets correctly", () => {
    const masked = maskSecret("AKIAIOSFODNN7EXAMPLE");
    expect(masked).toMatch(/^AKIA\*{12,16}LE$/);
  });

  it("detects AWS Access Keys in diffs", () => {
    const patch = `
@@ -10,3 +10,4 @@
 const config = {
+  awsKey: "AKIA1234567890ABCDEF",
 };
`;
    const findings = scanFilesForSecrets([{ filename: "src/config.ts", patch }]);
    expect(findings.length).toBe(1);
    expect(findings[0]?.title).toBe("Exposed Secret: AWS Access Key ID");
    expect(findings[0]?.severity).toBe("critical");
    expect(findings[0]?.evidence).toContain("AKIA");
    expect(findings[0]?.evidence).not.toContain("AKIA1234567890ABCDEF");
  });

  it("detects GitHub Personal Access Tokens", () => {
    const patch = `
@@ -1,2 +1,3 @@
+const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz1234";
`;
    const findings = scanFilesForSecrets([{ filename: "scripts/deploy.js", patch }]);
    expect(findings.length).toBe(1);
    expect(findings[0]?.title).toBe("Exposed Secret: GitHub Personal Access Token");
  });

  it("detects Stripe Live Secret Keys", () => {
    const patch = `
@@ -5,2 +5,3 @@
+const stripe = require('stripe')('sk_live_51Abcdefghijklmno12345678');
`;
    const findings = scanFilesForSecrets([{ filename: "src/billing.ts", patch }]);
    expect(findings.length).toBe(1);
    expect(findings[0]?.title).toBe("Exposed Secret: Stripe Live Secret Key");
  });

  it("ignores deleted lines in diff", () => {
    const patch = `
@@ -5,3 +5,2 @@
-const stripe = 'sk_live_51Abcdefghijklmno12345678';
+const stripe = process.env.STRIPE_KEY;
`;
    const findings = scanFilesForSecrets([{ filename: "src/billing.ts", patch }]);
    expect(findings.length).toBe(0);
  });
});
