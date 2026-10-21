import { describe, it, expect } from "vitest";
import { scanFilesForSecrets, maskSecret, SECRET_RULES } from "./secretScanner.server";

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

  describe("Stripe Key Detection Regression Suite (Defect 3)", () => {
    const stripeRule = SECRET_RULES.find((r) => r.id === "stripe_secret_key")!;

    it("detects the exact previously missed test fixture (40-char key)", () => {
      const exactMissedKey = ["sk", "live", "51JzTestSecretKeyForTestingPurposes12345"].join("_");
      const patch = `
@@ -1,2 +1,3 @@
+const stripeKey = "${exactMissedKey}";
`;
      const findings = scanFilesForSecrets([{ filename: "src/billing/service.ts", patch }]);
      expect(findings.length).toBe(1);
      expect(findings[0]?.title).toBe("Exposed Secret: Stripe Live Secret Key");
      expect(findings[0]?.evidence).not.toContain(exactMissedKey);
      expect(findings[0]?.evidence).toContain("sk_l");
    });

    it("detects multiple plausible key lengths (24, 32, 40, 64 characters)", () => {
      const lengths = [24, 32, 40, 64];
      for (const len of lengths) {
        stripeRule.pattern.lastIndex = 0;
        const testToken = ["sk", "live", "A".repeat(len)].join("_");
        const match = stripeRule.pattern.exec(`const key = "${testToken}";`);
        expect(match, `Failed to match length ${len}`).not.toBeNull();
        expect(match![0]).toBe(testToken);
      }
    });

    it("enforces word and token boundaries", () => {
      stripeRule.pattern.lastIndex = 0;
      const prefixed = ["not", "sk", "live", "A".repeat(32)].join("_");
      expect(stripeRule.pattern.exec(`const key = "${prefixed}";`)).toBeNull();

      stripeRule.pattern.lastIndex = 0;
      const testKey = ["sk", "test", "A".repeat(32)].join("_");
      expect(stripeRule.pattern.exec(`const key = "${testKey}";`)).toBeNull();
    });

    it("rejects keys with invalid characters", () => {
      stripeRule.pattern.lastIndex = 0;
      const invalidChars = ["sk", "live", "A".repeat(15) + "!" + "B".repeat(15)].join("_");
      expect(stripeRule.pattern.exec(`const key = "${invalidChars}";`)).toBeNull();
    });

    it("masks evidence so the full token is never returned or logged", () => {
      const sensitiveToken = ["sk", "live", "51JzTestSecretKeyForTestingPurposes12345"].join("_");
      const masked = maskSecret(sensitiveToken);
      expect(masked).not.toBe(sensitiveToken);
      expect(masked).toBe("sk_l****************45");
      expect(masked.length).toBeLessThan(sensitiveToken.length);
    });
  });
});
