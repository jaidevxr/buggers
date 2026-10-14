/**
 * Isomorphic / Client-safe Scanner Rules Specification.
 *
 * Source of truth for Buggers' 8 plaintext secret regex rules and 7 OWASP SAST rules.
 * Safe to import from both Nitro server functions and client-rendered documentation views.
 */

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

export const SAST_RULES: SastRule[] = [
  {
    id: "command_injection",
    name: "Command Injection via Child Process",
    severity: "critical",
    category: "security",
    pattern: /\b(?:exec|execSync)\s*\(\s*(?:`[^`]*\$\{[^`]+\}[^`]*`|[a-zA-Z0-9_\.]+\s*\+\s*["'`a-zA-Z0-9_\.])/g,
    description: "User input or variable concatenation detected inside a shell execution command.",
    whyItMatters: "An attacker who controls this variable can append arbitrary shell commands and achieve Remote Code Execution (RCE) on the host machine.",
    suggestedFixTemplate: () =>
      `// Replace shell exec with execFile or spawn and pass arguments as an array:\nconst { execFile } = require("child_process");\nexecFile("binaryName", [arg1, arg2], (err, stdout) => { ... });`,
  },
  {
    id: "sql_injection",
    name: "SQL Injection via String Concatenation",
    severity: "critical",
    category: "security",
    pattern: /(?:(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+[^\n]*\$\{|\b(?:query|\$queryRawUnsafe|literal)\s*\(\s*`[^`]*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)[^`]*\$\{)/i,
    description: "Direct string interpolation detected in a SQL statement.",
    whyItMatters: "Allows attackers to alter SQL query structure, bypass authentication, exfiltrate sensitive database records, or corrupt tables via SQL injection.",
    suggestedFixTemplate: () =>
      `// Use parameterized queries or ORM tagged templates instead of string interpolation:\nawait client.query("SELECT * FROM users WHERE id = $1", [userId]);`,
  },
  {
    id: "path_traversal",
    name: "Potential Path Traversal in File System Access",
    severity: "high",
    category: "security",
    pattern: /\bfs\.(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync)\s*\(\s*(?:path\.join\([^)]*req\.(?:params|query|body)|req\.(?:params|query|body))/g,
    description: "File system access constructed directly from HTTP request parameters without sanitization.",
    whyItMatters: "Attackers can pass dot-dot-slash sequences ('../../etc/passwd') to traverse directory boundaries and read sensitive system files.",
    suggestedFixTemplate: () =>
      `// Sanitize path and verify it stays inside base directory:\nconst safePath = path.resolve(BASE_DIR, path.basename(req.params.file));\nif (!safePath.startsWith(BASE_DIR)) throw new Error("Path traversal detected");`,
  },
  {
    id: "ssrf",
    name: "Server-Side Request Forgery (SSRF)",
    severity: "high",
    category: "security",
    pattern: /\b(?:fetch|axios\.get|axios\.post|http\.get|https\.get)\s*\(\s*req\.(?:params|query|body)\.[a-zA-Z0-9_]+/g,
    description: "HTTP client requests a URL supplied directly by user input without domain validation.",
    whyItMatters: "Enables attackers to force the server to send requests to internal network services or cloud metadata endpoints (169.254.169.254).",
    suggestedFixTemplate: () =>
      `// Validate URL protocol and allowlist target host:\nconst target = new URL(req.body.targetUrl);\nif (!ALLOWED_HOSTS.includes(target.hostname)) throw new Error("Untrusted destination");`,
  },
  {
    id: "insecure_cors",
    name: "Overly Permissive Insecure CORS Configuration",
    severity: "medium",
    category: "security",
    pattern: /cors\(\s*\{[^\}]*origin\s*:\s*["'`]\*["'`][^\}]*credentials\s*:\s*true/g,
    description: "CORS configuration pairs wildcard origin ('*') with credentials: true.",
    whyItMatters: "Permits malicious third-party websites to make authenticated cross-origin requests and read private user session data.",
    suggestedFixTemplate: () =>
      `// Explicitly allow specific trusted domains when credentials are enabled:\ncors({ origin: ["https://app.yourdomain.com"], credentials: true })`,
  },
  {
    id: "weak_crypto_hash",
    name: "Weak Hash Algorithm (MD5 / SHA-1)",
    severity: "medium",
    category: "security",
    pattern: /crypto\.createHash\(\s*["'](?:md5|sha1)["']\s*\)/gi,
    description: "Legacy hash algorithm (MD5 or SHA-1) used for cryptographic operations.",
    whyItMatters: "MD5 and SHA-1 suffer from collision attacks and do not meet modern security standards.",
    suggestedFixTemplate: () => `// Upgrade to modern SHA-256:\ncrypto.createHash("sha256")`,
  },
  {
    id: "insecure_token_randomness",
    name: "Insecure Randomness for Security Tokens",
    severity: "medium",
    category: "security",
    pattern: /(?:token|session|csrf|secret|apiKey)\s*=\s*[^;\n]*Math\.random\(\)/gi,
    description: "Math.random() used to generate security-sensitive tokens.",
    whyItMatters: "Math.random() is pseudorandom and predictable. Attackers can forecast future values to hijack sessions or forge tokens.",
    suggestedFixTemplate: () => `// Use cryptographically secure randomness:\nconst token = crypto.randomBytes(32).toString("hex");`,
  },
];
