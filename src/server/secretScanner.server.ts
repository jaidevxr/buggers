export interface SecretRule {
  id: string;
  name: string;
  pattern: RegExp;
  description: string;
  recommendation: string;
}

export const SECRET_RULES: SecretRule[] = [
  {
    id: "aws_access_key",
    name: "AWS Access Key ID",
    pattern: /\b(AKIA[0-9A-Z]{16})\b/g,
    description: "AWS Access Key ID exposed directly in source code.",
    recommendation: "Store AWS credentials in AWS Secrets Manager or environment variables (AWS_ACCESS_KEY_ID).",
  },
  {
    id: "github_pat",
    name: "GitHub Personal Access Token",
    pattern: /\b(gh[pousr]_[A-Za-z0-9_]{36,255})\b/g,
    description: "GitHub Access Token exposed in source code.",
    recommendation: "Revoke token immediately in GitHub Settings and inject via repository secrets (GITHUB_TOKEN).",
  },
  {
    id: "openai_api_key",
    name: "OpenAI API Key",
    pattern: /\b(sk-[a-zA-Z0-9_\-]{20,64})\b/g,
    description: "OpenAI Secret API Key exposed in source code.",
    recommendation: "Move OpenAI key to environment variable (process.env.OPENAI_API_KEY).",
  },
  {
    id: "slack_webhook_or_token",
    name: "Slack Webhook or Token",
    pattern: /(https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]{4,12}\/B[0-9A-Z]{4,12}\/[0-9a-zA-Z]{18,32}|xox[baprs]-[0-9a-zA-Z-]{10,48})/g,
    description: "Slack API Token or Incoming Webhook URL exposed in plaintext.",
    recommendation: "Rotate webhook in Slack App Console and store in server environment variables.",
  },
  {
    id: "stripe_secret_key",
    name: "Stripe Live Secret Key",
    pattern: /\b(sk_live_[0-9a-zA-Z]{24,34})\b/g,
    description: "Stripe Production Secret Key detected in repository.",
    recommendation: "Immediately roll key in Stripe Dashboard and use STRIPE_SECRET_KEY in server environment.",
  },
  {
    id: "google_api_key",
    name: "Google Cloud / Firebase API Key",
    pattern: /\b(AIza[0-9A-Za-z\-_]{35})\b/g,
    description: "Google Cloud / Maps API Key detected in code.",
    recommendation: "Restrict key scope in Google Cloud Console or pass via runtime environment configuration.",
  },
  {
    id: "private_key",
    name: "Unencrypted Private Key Block",
    pattern: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP|PRIVATE) KEY-----/g,
    description: "Cryptographic Private Key header discovered in commit diff.",
    recommendation: "Never commit private keys. Store in a secure key vault or KMS.",
  },
  {
    id: "db_connection_uri",
    name: "Database Connection String with Password",
    pattern: /\b((?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis):\/\/[a-zA-Z0-9_.-]+:[^@\s/]+@[a-zA-Z0-9_.-]+)/g,
    description: "Database connection string containing plaintext password credentials.",
    recommendation: "Store database connection string in DATABASE_URL environment variable.",
  },
];

export interface ScannedSecretFinding {
  file: string;
  line: number | null;
  title: string;
  severity: "critical";
  category: "security";
  confidence: number;
  problem: string;
  why_it_matters: string;
  evidence: string;
  suggested_fix: string;
}

/**
 * Mask raw secret strings so they are never leaked in logs or UI
 */
export function maskSecret(secret: string): string {
  if (secret.length <= 6) return "******";
  return secret.slice(0, 4) + "*".repeat(Math.min(16, secret.length - 6)) + secret.slice(-2);
}

/**
 * Scan pull request files (patches and contents) for leaked secrets and credentials
 */
export function scanFilesForSecrets(
  files: Array<{ filename: string; patch?: string | undefined }>,
): ScannedSecretFinding[] {
  const findings: ScannedSecretFinding[] = [];

  for (const file of files) {
    if (!file.patch) continue;
    // Don't flag secrets inside test fixtures or mock files unless clearly critical
    const isMock = /mock|fixture|sample|\.example/i.test(file.filename);

    const lines = file.patch.split("\n");
    let currentLine = 1;

    for (const rawLine of lines) {
      // Check hunk headers for line numbers (e.g. @@ -10,5 +12,6 @@)
      const hunkMatch = rawLine.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunkMatch) {
        currentLine = parseInt(hunkMatch[1]!, 10);
        continue;
      }

      // We only care about added lines in diffs
      if (rawLine.startsWith("+") && !rawLine.startsWith("+++")) {
        const lineContent = rawLine.slice(1);

        for (const rule of SECRET_RULES) {
          // Reset regex state
          rule.pattern.lastIndex = 0;
          const match = rule.pattern.exec(lineContent);

          if (match && match[0]) {
            const rawSecret = match[0];
            // If it's a mock dummy value like "sk-xxxx" or "AKIAEXAMPLEKEY123456", ignore
            if (/example|dummy|placeholder|your_key|test_token/i.test(rawSecret)) {
              continue;
            }

            const masked = maskSecret(rawSecret);
            const maskedSnippet = lineContent.replace(rawSecret, masked);

            findings.push({
              file: file.filename,
              line: currentLine,
              title: `Exposed Secret: ${rule.name}`,
              severity: "critical",
              category: "security",
              confidence: isMock ? 0.8 : 0.99,
              problem: `${rule.description} (${rule.name})`,
              why_it_matters:
                "Committing plaintext secrets to source control leads to automated scraping, unauthorized resource access, and catastrophic security breaches.",
              evidence: maskedSnippet.trim(),
              suggested_fix: `// Replace hardcoded credential with environment variable:\nprocess.env.${rule.id.toUpperCase()}`,
            });
          }
        }
        currentLine++;
      } else if (!rawLine.startsWith("-")) {
        currentLine++;
      }
    }
  }

  return findings;
}
