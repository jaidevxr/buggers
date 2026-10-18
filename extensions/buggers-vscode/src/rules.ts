import { ScanRule } from "./types";

export const SAST_RULES: ScanRule[] = [
  // 1. SQL Injection
  {
    id: "sql_injection",
    name: "SQL Injection via String Concatenation or Interpolation",
    severity: "critical",
    category: "security",
    cwe: "CWE-89",
    owasp: "A03:2021-Injection",
    pattern: /(?:(?:\b(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b[^\n]*?(?:\+|\$\{)|\b(?:query|\$queryRawUnsafe|literal|execute|querySync)\s*\(\s*(?:["'`][^\n]*?(?:\+|\$\{)|[a-zA-Z0-9_\.]+\s*\+\s*["'`a-zA-Z0-9_\.])))/i,
    description: "Direct string concatenation or template interpolation inside a SQL statement.",
    whyItMatters: "Allows attackers to modify the structure of database queries, bypassing authentication or exfiltrating table data.",
    suggestedFixTemplate: () =>
      `await client.query("SELECT * FROM users WHERE id = $1", [userId]);`,
    autoRemedyTemplate: (matched, rawLine) => {
      if (rawLine.includes("${")) {
        return rawLine.replace(
          /`([^`]*)\$\{([^}]+)\}([^`]*)`/,
          `{ text: "$1$$1$3", values: [$2] }`,
        );
      }
      return rawLine.replace(
        /(["'`])([^"'`]+)\1\s*\+\s*([a-zA-Z0-9_\.]+)/,
        `{ text: "$2$$1", values: [$3] }`,
      );
    },
    regressionTestTemplate: (matched, rawLine) =>
      `test("prevents sql injection in query", async () => {\n  const malicious = "' OR 1=1 --";\n  const result = await runQuery(malicious);\n  expect(result.rows).toHaveLength(0);\n});`,
  },

  // 2. Command Injection
  {
    id: "command_injection",
    name: "Command Injection via Child Process Execution",
    severity: "critical",
    category: "security",
    cwe: "CWE-78",
    owasp: "A03:2021-Injection",
    pattern: /\b(?:exec|execSync)\s*\(\s*(?:`[^`]*\$\{[^`]+\}[^`]*`|[a-zA-Z0-9_\.]+\s*\+\s*["'`a-zA-Z0-9_\.]|["'`][^"'`]+["'`]\s*\+\s*[a-zA-Z0-9_\.]|[a-zA-Z0-9_]+\s*[,)])|\b(?:spawn|spawnSync)\s*\([^,)]+,\s*\{[^}]*shell\s*:\s*true/g,
    description: "Dynamic command or arguments executed in a system shell without array escaping.",
    whyItMatters: "Attackers supplying shell metacharacters (e.g. '; rm -rf /') can execute arbitrary commands with host process privileges.",
    suggestedFixTemplate: () =>
      `const { execFile } = require("child_process");\nexecFile("executable", [arg1, arg2], callback);`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/\b(?:exec|execSync)\s*\([^)]+\)/, `execFile("binaryName", [sanitizedArg], callback)`),
    regressionTestTemplate: () =>
      `test("rejects shell metacharacters in command", () => {\n  const input = "test; whoami";\n  expect(() => executeSafe(input)).toThrow(/Invalid input/);\n});`,
  },

  // 3. Path Traversal
  {
    id: "path_traversal",
    name: "Path Traversal in File System Access",
    severity: "high",
    category: "security",
    cwe: "CWE-22",
    owasp: "A01:2021-Broken Access Control",
    pattern: /\b(?:fs\.(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync|open|openSync)|res\.sendFile)\s*\(\s*(?:path\.join\([^)]*(?:req\.|userInput|fileName|filePath|userPath|\.\.)|(?:req\.|userInput|fileName|filePath|userPath|\.\.))/g,
    description: "File access constructed from unvalidated variables without directory sandboxing.",
    whyItMatters: "Passing sequences like '../../etc/passwd' enables attackers to escape the application root and read or overwrite arbitrary system files.",
    suggestedFixTemplate: () =>
      `const safePath = path.resolve(BASE_DIR, path.basename(userPath));\nif (!safePath.startsWith(BASE_DIR)) throw new Error("Path traversal blocked");`,
    autoRemedyTemplate: (matched, rawLine) =>
      `const safePath = path.resolve(BASE_DIR, path.basename(userInput));\n  ${rawLine.replace(/path\.join\([^)]*\)|[a-zA-Z0-9_\.]*(?:userInput|fileName|filePath|userPath)[a-zA-Z0-9_\.]*/, "safePath")}`,
    regressionTestTemplate: () =>
      `test("blocks dot-dot path traversal", () => {\n  expect(() => resolvePath("../../etc/passwd")).toThrow(/traversal/i);\n});`,
  },

  // 4. Weak Cryptography
  {
    id: "weak_cryptography",
    name: "Weak or Broken Cryptographic Algorithm",
    severity: "medium",
    category: "security",
    cwe: "CWE-327",
    owasp: "A02:2021-Cryptographic Failures",
    pattern: /\b(?:crypto\.createHash\(\s*["'](?:md5|sha1)["']|crypto\.createCipher\b|crypto\.createCipheriv\(\s*["'](?:des|des-ede3|rc4|aes-\d+-ecb)["'])/gi,
    description: "Use of obsolete or collision-prone cryptographic algorithms (MD5, SHA-1, DES, RC4, ECB mode).",
    whyItMatters: "Broken hash algorithms are susceptible to collision attacks, and ECB mode leaks plaintext patterns.",
    suggestedFixTemplate: () => `crypto.createHash("sha256")`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/["'](?:md5|sha1)["']/i, `"sha256"`).replace(/["']aes-\d+-ecb["']/i, `"aes-256-gcm"`),
    regressionTestTemplate: () =>
      `test("uses collision-resistant sha256", () => {\n  const hash = generateHash("sample");\n  expect(hash).toHaveLength(64);\n});`,
  },

  // 5. Insecure Randomness
  {
    id: "insecure_randomness",
    name: "Insecure Randomness in Security Context",
    severity: "high",
    category: "security",
    cwe: "CWE-338",
    owasp: "A02:2021-Cryptographic Failures",
    pattern: /(?:token|secret|password|passwd|salt|sessionId|session_id|nonce|auth_key|apiKey|rand|random|id|key|code)\s*[:=][^;\n]*Math\.random\(\)|\bMath\.random\(\)[^;\n]*(?:token|secret|password|salt|session|id|key)/i,
    description: "Math.random() used for generating security-sensitive values (tokens, passwords, salts, keys).",
    whyItMatters: "Math.random() is pseudo-random and predictable. Attackers can determine future values to hijack sessions or predict credentials.",
    suggestedFixTemplate: () => `crypto.randomBytes(32).toString("hex")`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/Math\.random\(\)/g, `crypto.randomBytes(16).toString("hex")`),
    regressionTestTemplate: () =>
      `test("generates cryptographically secure entropy", () => {\n  const token = generateToken();\n  expect(token).toHaveLength(64);\n});`,
  },

  // 6. Cross-Site Scripting (XSS)
  {
    id: "cross_site_scripting",
    name: "Reflected or DOM-Based Cross-Site Scripting (XSS)",
    severity: "high",
    category: "security",
    cwe: "CWE-79",
    owasp: "A03:2021-Injection",
    pattern: /\b(?:innerHTML|outerHTML)\s*=\s*(?:[a-zA-Z0-9_\.]+|`[^`]*\$\{[^`]+\}[^`]*`|["'`][^"'`]+["'`]\s*\+\s*[a-zA-Z0-9_\.]+)|\bdocument\.write\s*\(|\bdangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*(?:`[^`]*\$\{|[a-zA-Z0-9_\.]+\s*\+)|\bres\.send\s*\(\s*(?:["'`]<[^>]+>[^"'`]*\s*\+\s*[a-zA-Z0-9_\.]+|`[^`]*<[^>]+>[^`]*\$\{[^`]+\}[^`]*`)/i,
    description: "Unsanitized user content injected directly into HTML markup or the DOM.",
    whyItMatters: "Allows executing malicious JavaScript in user browsers, leading to session theft, credential harvesting, or unauthorized actions.",
    suggestedFixTemplate: () => `element.textContent = sanitizedValue;`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/\binnerHTML\b/, "textContent"),
    regressionTestTemplate: () =>
      `test("escapes html characters in user output", () => {\n  const dangerous = "<script>alert(1)</script>";\n  const safe = sanitizeHtml(dangerous);\n  expect(safe).not.toContain("<script>");\n});`,
  },

  // 7. Unsafe Redirects
  {
    id: "unsafe_redirect",
    name: "Open Redirect via Untrusted User Input",
    severity: "medium",
    category: "security",
    cwe: "CWE-601",
    owasp: "A01:2021-Broken Access Control",
    pattern: /\bres\.redirect\s*\(\s*(?:req\.(?:query|params|body)|url|target|redirectUrl|nextUrl)[^)]*\)|\bwindow\.location(?:\.href)?\s*=\s*(?:req\.|url|targetUrl|redirectUrl)/g,
    description: "HTTP redirection to a destination parameter provided by an untrusted client without validation.",
    whyItMatters: "Attackers can craft phishing links under your trusted domain that redirect victims to external malicious sites.",
    suggestedFixTemplate: () =>
      `const safeRedirect = ALLOWED_ORIGINS.includes(target) ? target : "/";\nres.redirect(safeRedirect);`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/res\.redirect\s*\(([^)]+)\)/, `res.redirect(isAllowedUrl($1) ? $1 : "/")`),
    regressionTestTemplate: () =>
      `test("blocks external open redirects", () => {\n  expect(validateRedirect("https://evil.com")).toBe(false);\n  expect(validateRedirect("/dashboard")).toBe(true);\n});`,
  },

  // 8. Disabled TLS Verification
  {
    id: "disabled_tls",
    name: "Disabled TLS / SSL Certificate Verification",
    severity: "high",
    category: "security",
    cwe: "CWE-295",
    owasp: "A07:2021-Identification and Authentication Failures",
    pattern: /\b(?:rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']0["']|checkServerIdentity\s*:\s*\([^)]*\)\s*=>\s*(?:undefined|null|true))/g,
    description: "Certificate validation explicitly disabled in network client configuration or environment flags.",
    whyItMatters: "Disables identity verification of remote servers, leaving network traffic exposed to eavesdropping and MITM tampering.",
    suggestedFixTemplate: () => `rejectUnauthorized: true`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/rejectUnauthorized\s*:\s*false/, `rejectUnauthorized: true`),
    regressionTestTemplate: () =>
      `test("enforces strict tls verification", () => {\n  expect(clientOptions.rejectUnauthorized).toBe(true);\n});`,
  },

  // 9. Insecure HTTP Communication
  {
    id: "insecure_http",
    name: "Cleartext HTTP Protocol in Sensitive Communication",
    severity: "medium",
    category: "security",
    cwe: "CWE-319",
    owasp: "A02:2021-Cryptographic Failures",
    pattern: /["']http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|test|example)[a-zA-Z0-9_\.\-]+(?:\/[a-zA-Z0-9_\.\-\/]*?(?:auth|login|token|api|payment|credential|session))["']/i,
    description: "Unencrypted HTTP protocol used for transmission of credentials or sensitive API calls.",
    whyItMatters: "Credentials and sensitive tokens transmitted over plain HTTP can be intercepted on intermediate networks.",
    suggestedFixTemplate: () => `https://api.yourdomain.com/v1/auth`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/http:\/\//, "https://"),
    regressionTestTemplate: () =>
      `test("enforces https url scheme", () => {\n  expect(apiUrl.startsWith("https://")).toBe(true);\n});`,
  },

  // 10. Dynamic Code Execution
  {
    id: "dynamic_code_execution",
    name: "Unsafe Dynamic Code Evaluation (eval / Function)",
    severity: "critical",
    category: "security",
    cwe: "CWE-95",
    owasp: "A03:2021-Injection",
    pattern: /\b(?:eval|new\s+Function)\s*\([^)]+\)|\b(?:setTimeout|setInterval)\s*\(\s*["'`][^"'`]+["'`]\s*,/g,
    description: "Direct execution of dynamic strings as executable JavaScript code.",
    whyItMatters: "Executing dynamic strings as code enables remote code execution if any input reaches the expression.",
    suggestedFixTemplate: () => `JSON.parse(data)`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/\beval\s*\(([^)]+)\)/, `JSON.parse($1)`),
    regressionTestTemplate: () =>
      `test("parses structured payload without code evaluation", () => {\n  const payload = '{"count": 5}';\n  expect(parseData(payload)).toEqual({ count: 5 });\n});`,
  },

  // 11. Sensitive Logging
  {
    id: "sensitive_logging",
    name: "Sensitive Credential or Token Logging",
    severity: "low",
    category: "security",
    cwe: "CWE-532",
    owasp: "A09:2021-Security Logging and Monitoring Failures",
    pattern: /\b(?:console\.(?:log|warn|error|info|debug)|logger\.(?:log|warn|error|info|debug))\s*\([^)]*?\b(?:password|passwd|apiKey|api_key|secret|token|creditCard|privateKey)\b[^)]*\)/gi,
    description: "Plaintext logging of sensitive variables (passwords, tokens, keys) to standard output.",
    whyItMatters: "Logs are frequently indexed, aggregated into third-party dashboards, or stored in plaintext where developers or intruders can inspect them.",
    suggestedFixTemplate: () => `console.log("Operation completed", { userId: user.id });`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/\b(?:password|passwd|apiKey|api_key|secret|token|creditCard|privateKey)\b/g, `"[REDACTED]"`),
    regressionTestTemplate: () =>
      `test("redacts sensitive fields in log output", () => {\n  const logged = formatLog({ password: "secret" });\n  expect(logged).not.toContain("secret");\n});`,
  },

  // 12. Insecure File Permissions
  {
    id: "insecure_file_permissions",
    name: "Overly Permissive File Permissions (0777)",
    severity: "medium",
    category: "security",
    cwe: "CWE-732",
    owasp: "A01:2021-Broken Access Control",
    pattern: /\b(?:chmod|chmodSync)\s*\([^,)]+,\s*(?:0o?777|0o?666|0777|0666|"777"|'777')\)|\b(?:writeFile|writeFileSync)\s*\([^,)]+,[^,)]+,\s*\{[^}]*mode\s*:\s*(?:0o?777|0o?666|0777|0666)\}/g,
    description: "Creation or modification of files with world-readable and world-writable permissions (0777 / 0666).",
    whyItMatters: "Other local users or unprivileged services on the same host can modify or read sensitive files.",
    suggestedFixTemplate: () => `fs.chmodSync(filePath, 0o600);`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/0o?777|0o?666|0777|0666|"777"|'777'/, "0o600"),
    regressionTestTemplate: () =>
      `test("restricts file mode to owner read-write only", () => {\n  expect(fileMode).toBe(0o600);\n});`,
  },

  // 13. Unsafe Temporary Files
  {
    id: "unsafe_temp_files",
    name: "Predictable Temporary File Creation",
    severity: "medium",
    category: "security",
    cwe: "CWE-377",
    owasp: "A01:2021-Broken Access Control",
    pattern: /\b(?:path\.join|path\.resolve)\s*\(\s*["'](?:\/tmp|\\tmp|C:\\Temp)["']\s*,\s*["'][^"']+\.[a-zA-Z0-9]+["']\s*\)|["'](?:\/tmp\/|\\tmp\\|C:\\Temp\\)[a-zA-Z0-9_\.\-]+["']/g,
    description: "Hardcoded, predictable file path in a shared system temporary directory.",
    whyItMatters: "Attackers on shared systems can pre-create symlinks pointing to target files (symlink attack) or overwrite files via race conditions.",
    suggestedFixTemplate: () =>
      `const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "buggers-"));`,
    autoRemedyTemplate: (matched, rawLine) =>
      `const safeTmp = fs.mkdtempSync(path.join(os.tmpdir(), "safe-"));\n  ${rawLine.replace(/["'](?:\/tmp\/|\\tmp\\)[^"']+["']/, "safeTmp")}`,
    regressionTestTemplate: () =>
      `test("creates unique temporary directory with mkdtemp", () => {\n  const dir = createTempDir();\n  expect(fs.existsSync(dir)).toBe(true);\n});`,
  },

  // 14. Weak Security Comparisons
  {
    id: "weak_comparisons",
    name: "Weak Equality Comparison on Security Tokens",
    severity: "medium",
    category: "security",
    cwe: "CWE-697",
    owasp: "A02:2021-Cryptographic Failures",
    pattern: /\b[a-zA-Z0-9_]*(?:password|passwd|token|hash|secret|apiKey|auth)[a-zA-Z0-9_]*\s*(?:==|!=)(?!=)\s*[a-zA-Z0-9_\.]+|\b[a-zA-Z0-9_\.]+\s*(?:==|!=)(?!=)\s*[a-zA-Z0-9_]*(?:password|passwd|token|hash|secret|apiKey|auth)[a-zA-Z0-9_]*|\b(?:if|while)\s*\([^)]*\b[a-zA-Z0-9_]+\s*(?:==|!=)(?!=)\s*[a-zA-Z0-9_]+/gi,
    description: "Loose equality operator (`==` or `!=`) on authentication tokens or passwords.",
    whyItMatters: "Loose equality performs implicit type coercion, potentially causing bypasses with unexpected values (e.g., false, 0, or array conversions).",
    suggestedFixTemplate: () => `crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/==(?!=)/, "===").replace(/!=(?!=)/, "!=="),
    regressionTestTemplate: () =>
      `test("enforces strict type-safe token verification", () => {\n  expect(verifyToken("abc", "abc")).toBe(true);\n  expect(verifyToken("abc", 0)).toBe(false);\n});`,
  },

  // 15. Unsafe Regular Expressions (ReDoS)
  {
    id: "unsafe_regex",
    name: "Unsafe Regular Expression Construction or Catastrophic Backtracking",
    severity: "high",
    category: "security",
    cwe: "CWE-1333",
    owasp: "A03:2021-Injection",
    pattern: /new\s+RegExp\s*\(\s*(?:req\.|userInput|input|pattern|query|["'`][^"'`]*\([^)]*[\+\*]\)[\+\*])[^)]*\)|\/(?:(?:\([^)]*[\+\*]\)[\+\*])|(?:\([^)]*\*)[+*])\/|\bRegExp\s*\([^)]*\([^)]*[\+\*]\)[\+\*]/g,
    description: "Regular expression created from untrusted input or constructed with vulnerable nested quantifiers.",
    whyItMatters: "Crafted input can cause exponential backtracking, leading to complete CPU exhaustion (Regular Expression Denial of Service).",
    suggestedFixTemplate: () => `// Use escaped literals or static regex without nested quantifiers`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/new\s+RegExp\s*\(([^)]+)\)/, `new RegExp(escapeRegExp($1))`),
    regressionTestTemplate: () =>
      `test("evaluates complex string without regex backtracking timeout", () => {\n  const input = "a".repeat(100) + "X";\n  const t0 = Date.now();\n  safeMatch(input);\n  expect(Date.now() - t0).toBeLessThan(50);\n});`,
  },

  // 16. Insecure Cookies
  {
    id: "insecure_cookies",
    name: "Insecure Cookie Settings on Sensitive Token",
    severity: "medium",
    category: "security",
    cwe: "CWE-614",
    owasp: "A05:2021-Security Misconfiguration",
    pattern: /\bres\.cookie\s*\([^)]*\{[^}]*(?:httpOnly\s*:\s*false|secure\s*:\s*false)|\bres\.cookie\s*\([^)]*(?:httpOnly\s*:\s*false|secure\s*:\s*false)|\bdocument\.cookie\s*=/gi,
    description: "Sensitive authentication cookie transmitted without HttpOnly or Secure flags.",
    whyItMatters: "Cookies without HttpOnly can be stolen via XSS, and cookies without Secure can be intercepted over unencrypted channels.",
    suggestedFixTemplate: () =>
      `res.cookie("session", token, { httpOnly: true, secure: true, sameSite: "strict" });`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/httpOnly\s*:\s*false/, "httpOnly: true").replace(/secure\s*:\s*false/, "secure: true"),
    regressionTestTemplate: () =>
      `test("sets cookie with httpOnly and secure attributes", () => {\n  expect(cookieOptions.httpOnly).toBe(true);\n  expect(cookieOptions.secure).toBe(true);\n});`,
  },

  // 17. Error Disclosure
  {
    id: "error_disclosure",
    name: "Internal Error or Stack Trace Disclosure",
    severity: "low",
    category: "security",
    cwe: "CWE-209",
    owasp: "A05:2021-Security Misconfiguration",
    pattern: /\bres\.(?:status\(\d+\)\.)?(?:send|json)\s*\(\s*(?:err\.stack|error\.stack|\{[^}]*stack\s*:\s*(?:err|error)\.stack)[^)]*\)/g,
    description: "Raw execution stack traces or internal errors exposed directly to external callers.",
    whyItMatters: "Exposes software versions, internal file system paths, and implementation details that assist attackers in crafting exploits.",
    suggestedFixTemplate: () =>
      `res.status(500).json({ error: "Internal server error" });`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/err\.stack|error\.stack/, `"[REDACTED_ERROR]"`),
    regressionTestTemplate: () =>
      `test("does not return stack trace in client error response", async () => {\n  const res = await request(app).get("/fault");\n  expect(res.body.stack).toBeUndefined();\n});`,
  },

  // 18. Unsafe File Deletion
  {
    id: "unsafe_file_deletion",
    name: "Unvalidated File Deletion",
    severity: "high",
    category: "security",
    cwe: "CWE-73",
    owasp: "A01:2021-Broken Access Control",
    pattern: /\b(?:fs\.unlink|fs\.unlinkSync|fs\.rm|fs\.rmSync|rimraf)\s*\(\s*(?:req\.(?:query|params|body)|userInput|filePath|userPath)[^)]*\)/g,
    description: "Direct deletion of files using unvalidated path variables.",
    whyItMatters: "Attackers can supply path traversal or arbitrary paths to delete application data, configuration files, or database stores.",
    suggestedFixTemplate: () =>
      `const safeFile = path.resolve(STORAGE_DIR, path.basename(userPath));\nif (safeFile.startsWith(STORAGE_DIR)) fs.unlinkSync(safeFile);`,
    autoRemedyTemplate: (matched, rawLine) =>
      `const safeFile = path.resolve(STORAGE_DIR, path.basename(filePath));\n  ${rawLine.replace(/[a-zA-Z0-9_\.]*(?:userInput|filePath|userPath)[a-zA-Z0-9_\.]*/, "safeFile")}`,
    regressionTestTemplate: () =>
      `test("rejects deletion outside allowed storage directory", () => {\n  expect(() => deleteFile("../important.db")).toThrow(/Access denied/);\n});`,
  },

  // 19. Prototype Pollution
  {
    id: "prototype_pollution",
    name: "Prototype Pollution via Unbounded Object Modification",
    severity: "high",
    category: "security",
    cwe: "CWE-1321",
    owasp: "A03:2021-Injection",
    pattern: /\b(?:target|obj|destination)\[(?:key|prop|property)\]\s*=\s*(?:value|source\[key\])|\.\b__proto__\b|\[["']__proto__["']\]/g,
    description: "Modifying object keys without guarding against __proto__ or constructor.prototype keys.",
    whyItMatters: "Polluting the prototype allows altering behavior of all objects across the runtime, frequently leading to remote code execution or authentication bypass.",
    suggestedFixTemplate: () =>
      `if (key === "__proto__" || key === "constructor" || key === "prototype") continue;\ntarget[key] = value;`,
    autoRemedyTemplate: (matched, rawLine) =>
      `if (key !== "__proto__" && key !== "constructor") { ${rawLine} }`,
    regressionTestTemplate: () =>
      `test("guards against prototype pollution", () => {\n  const payload = JSON.parse('{"__proto__": {"polluted": true}}');\n  safeMerge({}, payload);\n  expect(({} as any).polluted).toBeUndefined();\n});`,
  },

  // 20. Missing Async Error Handling
  {
    id: "missing_async_error_handling",
    name: "Missing Asynchronous Error Handling (Floating Promise)",
    severity: "medium",
    category: "security",
    cwe: "CWE-703",
    owasp: "A04:2021-Insecure Design",
    pattern: /\b(?:fs\.promises|fetch|axios|db\.query)\.[a-zA-Z0-9_]+\([^)]*\)(?!\s*\.catch|[;\s]*\bawait\b)|\.then\s*\([^)]*\)(?!\s*\.catch)/g,
    description: "Asynchronous I/O operation invoked without await, .catch(), or error handling.",
    whyItMatters: "Unhandled rejections can crash the Node.js process, leave database connections open, or mask critical failures.",
    suggestedFixTemplate: () => `await operation().catch((err) => handleError(err));`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/(\b(?:fs\.promises|fetch|axios|db\.query)\.[a-zA-Z0-9_]+\([^)]*\))/, "await $1"),
    regressionTestTemplate: () =>
      `test("handles rejected promises gracefully", async () => {\n  await expect(performAsyncOp()).resolves.toBeDefined();\n});`,
  },

  // 21. Side-Channel Timing Leak
  {
    id: "timing_attack",
    name: "Side-Channel Timing Leak on Sensitive Tokens",
    severity: "high",
    category: "security",
    cwe: "CWE-208",
    owasp: "A02:2021-Cryptographic Failures",
    pattern: /(?:signature|token|authHeader|apiKey|hash|hmac|mac|expectedSig|expectedToken|expected|secret)\s*===\s*(?:signature|token|authHeader|apiKey|hash|hmac|mac|session\.[a-zA-Z]+|expectedSig|expectedToken|expected|secret)/g,
    description: "Direct string equality (`===`) on cryptographic secrets or signatures leaks timing information.",
    whyItMatters: "Terminating on the first mismatching character allows attackers to deduce signatures byte-by-byte via statistical response timing.",
    suggestedFixTemplate: () =>
      `import { timingSafeEqual } from "crypto";\ntimingSafeEqual(Buffer.from(a), Buffer.from(b));`,
    autoRemedyTemplate: (matched, rawLine) => {
      const parts = matched.split("===");
      const left = parts[0]?.trim() || "token";
      const right = parts[1]?.trim() || "expected";
      return rawLine.replace(matched, `crypto.timingSafeEqual(Buffer.from(${left}), Buffer.from(${right}))`);
    },
    regressionTestTemplate: () =>
      `test("verifies tokens in constant time", () => {\n  expect(constantTimeCompare("secret123", "secret123")).toBe(true);\n});`,
  },

  // 22. Insecure CORS Configuration
  {
    id: "insecure_cors",
    name: "Overly Permissive Insecure CORS Configuration",
    severity: "medium",
    category: "security",
    cwe: "CWE-942",
    owasp: "A05:2021-Security Misconfiguration",
    pattern: /cors\(\s*\{[^\}]*origin\s*:\s*["'`]\*["'`][^\}]*credentials\s*:\s*true/g,
    description: "CORS configuration pairs wildcard origin ('*') with credentials: true.",
    whyItMatters: "Allows any third-party malicious website to execute authenticated requests on behalf of users.",
    suggestedFixTemplate: () =>
      `cors({ origin: ["https://app.yourdomain.com"], credentials: true })`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/origin\s*:\s*["'`]\*["'`]/, `origin: ["https://app.yourdomain.com"]`),
    regressionTestTemplate: () =>
      `test("rejects wildcard origin with credentials", () => {\n  expect(corsOptions.origin).not.toBe("*");\n});`,
  },

  // 23. Server-Side Request Forgery (SSRF)
  {
    id: "ssrf",
    name: "Server-Side Request Forgery (SSRF)",
    severity: "high",
    category: "security",
    cwe: "CWE-918",
    owasp: "A10:2021-Server-Side Request Forgery",
    pattern: /\b(?:fetch|axios\.get|axios\.post|http\.get|https\.get)\s*\(\s*(?:req\.(?:params|query|body)\.[a-zA-Z0-9_]+|[a-zA-Z0-9_]*(?:targetUrl|userUrl|webhookUrl|inputUrl|destUrl|untrustedUrl|remoteUrl)[a-zA-Z0-9_]*)|["']https?:\/\/169\.254\.169\.254/g,
    description: "HTTP request constructed directly from user input without hostname validation.",
    whyItMatters: "Allows attackers to target internal microservices, cloud metadata endpoints (169.254.169.254), or local daemons.",
    suggestedFixTemplate: () =>
      `const url = new URL(userUrl);\nif (!ALLOWED_HOSTS.includes(url.hostname)) throw new Error("Destination not allowed");`,
    autoRemedyTemplate: (matched, rawLine) =>
      `if (!isAllowedUrl(req.body.url)) throw new Error("Blocked");\n  ${rawLine}`,
    regressionTestTemplate: () =>
      `test("blocks requests to internal loopback and metadata addresses", () => {\n  expect(isSafeUrl("http://169.254.169.254/latest")).toBe(false);\n});`,
  },

  // 24. Unsafe Deserialization
  {
    id: "unsafe_deserialization",
    name: "Unsafe Object Deserialization",
    severity: "critical",
    category: "security",
    cwe: "CWE-502",
    owasp: "A08:2021-Software and Data Integrity Failures",
    pattern: /\b(?:node-serialize|serialize-javascript|serialize)\.unserialize\s*\(|\bjs-yaml\.load\s*\(\s*(?!.*?schema:\s*SAFE_SCHEMA)[^)]+\)|\byaml\.load\s*\([^)]+\)|\bpickle\.loads\s*\(/g,
    description: "Deserialization of untrusted data without schema or type validation.",
    whyItMatters: "Allows attackers to instantiate arbitrary object prototypes, leading to remote code execution (RCE) or denial of service.",
    suggestedFixTemplate: () => `JSON.parse(untrustedData);`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/\b(?:node-serialize|serialize-javascript)\.unserialize/, "JSON.parse"),
    regressionTestTemplate: () =>
      `test("rejects executable payloads during deserialization", () => {\n  const payload = '{\"rce\":\"_\$\$ND_FUNC\$\$_function(){}\"}';\n  expect(() => safeDeserialize(payload)).not.toThrow();\n});`,
  },

  // 25. Zip Slip Path Traversal
  {
    id: "zip_slip_traversal",
    name: "Zip Slip Path Traversal during Archive Extraction",
    severity: "high",
    category: "security",
    cwe: "CWE-29",
    owasp: "A01:2021-Broken Access Control",
    pattern: /\b(?:unzipper|adm-zip|tar|decompress)\b[^\n]*?\b(?:extractAllTo|extractEntryTo|pipe\s*\(\s*fs\.createWriteStream)\s*\([^)]*(?:entry\.path|entry\.name|header\.name)/g,
    description: "Archive entries extracted to disk without validating relative path prefixes.",
    whyItMatters: "Malicious archives containing filenames like '../../etc/cron.d/evil' can overwrite arbitrary files outside the target directory.",
    suggestedFixTemplate: () =>
      `const targetPath = path.resolve(destDir, entry.path);\nif (!targetPath.startsWith(path.resolve(destDir) + path.sep)) throw new Error("Zip Slip attempt blocked");`,
    autoRemedyTemplate: (matched, rawLine) =>
      `const safeDest = path.resolve(destDir, path.basename(entry.path));\n  ${rawLine}`,
    regressionTestTemplate: () =>
      `test("prevents zip slip directory escape", () => {\n  expect(() => extractEntry("../../evil.sh", "/tmp/dest")).toThrow(/escape/i);\n});`,
  },

  // 26. NoSQL Injection
  {
    id: "nosql_injection",
    name: "NoSQL Injection via Unsanitized Query Object or $where",
    severity: "high",
    category: "security",
    cwe: "CWE-943",
    owasp: "A03:2021-Injection",
    pattern: /\b(?:find|findOne|updateMany|deleteMany)\s*\(\s*\{[^\}]*\$where\s*:\s*(?:["'`]|req\.)|\b(?:find|findOne)\s*\(\s*req\.(?:body|query|params)\b/g,
    description: "MongoDB query constructs $where clause from string input or accepts unvalidated query objects directly from request.",
    whyItMatters: "Attackers can pass operator objects like { $ne: null } or arbitrary JS expressions to bypass authentication or dump database documents.",
    suggestedFixTemplate: () =>
      `User.findOne({ username: String(req.body.username) });`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/req\.(body|query)\.([a-zA-Z0-9_]+)/g, `String(req.$1.$2)`),
    regressionTestTemplate: () =>
      `test("sanitizes object operator injection in queries", async () => {\n  const malicious = { $gt: "" };\n  const result = await findUser(malicious);\n  expect(result).toBeNull();\n});`,
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
    whyItMatters: "Exposed AWS access keys allow unauthorized access to AWS infrastructure and cloud data.",
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
    whyItMatters: "Allows unauthorized access to repositories, organization assets, and CI/CD workflows.",
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
    whyItMatters: "Exposed API keys lead to billing drainage and unauthorized API usage.",
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
    whyItMatters: "Enables unauthorized charges, refunds, and access to customer payment information.",
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
    description: "Cryptographic Private Key block embedded in source code.",
    whyItMatters: "Compromises TLS certificates, SSH servers, or digital signatures.",
    suggestedFixTemplate: () => `process.env.PRIVATE_KEY`,
  },
  {
    id: "db_connection_uri",
    name: "Database Connection URI with Credentials",
    severity: "critical",
    category: "security",
    cwe: "CWE-798",
    owasp: "A07:2021-Identification and Authentication Failures",
    pattern: /\b((?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis):\/\/[a-zA-Z0-9_.-]+:[^@\s/]+@[a-zA-Z0-9_.-]+)/g,
    description: "Database connection string containing plaintext credentials.",
    whyItMatters: "Exposes database credentials in source history, enabling unauthorized data exfiltration.",
    suggestedFixTemplate: () => `process.env.DATABASE_URL`,
  },
  {
    id: "generic_api_secret",
    name: "Hardcoded High-Entropy API Secret or Password",
    severity: "critical",
    category: "security",
    cwe: "CWE-798",
    owasp: "A07:2021-Identification and Authentication Failures",
    pattern: /\b(?:password|passwd|api_key|apikey|secret_key|auth_token)\s*[:=]\s*["'](?!(?:true|false|null|undefined|test|example|placeholder|dummy|your_))[A-Za-z0-9_\-!@#$%^&*]{16,}["']/gi,
    description: "Hardcoded secret string or password assignment.",
    whyItMatters: "Plaintext secrets checked into revision control can be extracted by any viewer of the repository.",
    suggestedFixTemplate: () => `process.env.SECRET_KEY`,
  },
];

export const LOGICAL_BUG_RULES: ScanRule[] = [
  // 1. Accidental Assignment in Condition
  {
    id: "bug_accidental_assignment_in_condition",
    name: "Accidental Assignment Inside Conditional Expression",
    severity: "high",
    category: "logical_bug",
    cwe: "CWE-480",
    pattern: /\bif\s*\(\s*([a-zA-Z0-9_]+)\s*=\s*([^=][^)]*)\)/g,
    description: "Assignment operator `=` used inside an `if` condition instead of comparison operator `===`.",
    whyItMatters: "The assignment modifies the variable and evaluates to truthiness of the assigned value, causing branches to execute unexpectedly.",
    suggestedFixTemplate: (matched) => matched.replace(/=/, "==="),
    autoRemedyTemplate: (matched, rawLine) => rawLine.replace(/(\bif\s*\(\s*[a-zA-Z0-9_]+\s*)=(?!=)/, "$1==="),
    regressionTestTemplate: () =>
      `test("evaluates conditional equality without mutation", () => {\n  const x = 5;\n  expect(checkValue(x)).toBe(false);\n  expect(x).toBe(5);\n});`,
  },

  // 2. Tautological or Contradictory Condition
  {
    id: "bug_tautological_condition",
    name: "Tautological or Self-Comparing Condition",
    severity: "medium",
    category: "logical_bug",
    cwe: "CWE-571",
    pattern: /\b([a-zA-Z0-9_\.]+)\s*===\s*\1\b|\b([a-zA-Z0-9_\.]+)\s*!==\s*\2\b/g,
    description: "Condition compares an identifier directly to itself (e.g. `x === x`), always resulting in true or false.",
    whyItMatters: "Indicates a typo where a second distinct variable was intended, causing dead branches or logic inversion.",
    suggestedFixTemplate: () => `// Compare against the intended target variable: x === target`,
    autoRemedyTemplate: (matched, rawLine) => rawLine,
    regressionTestTemplate: () =>
      `test("compares against valid reference variable", () => {\n  expect(evaluateCondition(1, 2)).toBe(false);\n});`,
  },

  // 3. Comparison with NaN
  {
    id: "bug_nan_comparison",
    name: "Direct Comparison with NaN (Always False)",
    severity: "medium",
    category: "logical_bug",
    cwe: "CWE-697",
    pattern: /\b[a-zA-Z0-9_\.]+\s*===?\s*NaN\b|\bNaN\s*===?\s*[a-zA-Z0-9_\.]+/g,
    description: "Direct equality check against `NaN`. In JavaScript, `NaN === NaN` is always false.",
    whyItMatters: "Expressions checking `value === NaN` will never evaluate to true. Use `Number.isNaN(value)` instead.",
    suggestedFixTemplate: () => `Number.isNaN(value)`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/([a-zA-Z0-9_\.]+)\s*===?\s*NaN/, "Number.isNaN($1)"),
    regressionTestTemplate: () =>
      `test("correctly identifies NaN values", () => {\n  expect(isInvalidNumber(NaN)).toBe(true);\n  expect(isInvalidNumber(42)).toBe(false);\n});`,
  },

  // 4. Off-By-One Array Indexing
  {
    id: "bug_off_by_one_index",
    name: "Off-By-One Boundary Error in Loop Condition",
    severity: "medium",
    category: "logical_bug",
    cwe: "CWE-193",
    pattern: /for\s*\(\s*let\s+([a-zA-Z0-9_]+)\s*=\s*0\s*;\s*\1\s*<=\s*([a-zA-Z0-9_\.]+)\.length\s*;/g,
    description: "Loop condition uses `<= array.length` which accesses `array[array.length]` (undefined).",
    whyItMatters: "Causes unexpected undefined elements, runtime TypeError crashes on property access, or out-of-bounds reads.",
    suggestedFixTemplate: () => `for (let i = 0; i < array.length; i++)`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/<=\s*([a-zA-Z0-9_\.]+)\.length/, "< $1.length"),
    regressionTestTemplate: () =>
      `test("does not process out-of-bounds undefined element", () => {\n  const items = [1, 2, 3];\n  const collected: number[] = [];\n  processItems(items, (x) => collected.push(x));\n  expect(collected).toEqual([1, 2, 3]);\n});`,
  },

  // 5. Unreachable Code After Return
  {
    id: "bug_unreachable_code",
    name: "Unreachable Code After Terminating Statement",
    severity: "low",
    category: "logical_bug",
    cwe: "CWE-561",
    pattern: /\breturn\s+[^;]+;\s*\n\s*(?!\}|\/\/|\/\*)[a-zA-Z0-9_]+\b[^;\n]*;/g,
    description: "Executable code detected directly after an unconditional `return` statement in the same scope.",
    whyItMatters: "Dead code that never executes often indicates a misplaced return statement or incomplete refactoring.",
    suggestedFixTemplate: () => `// Move logic before return statement, or remove dead code.`,
    autoRemedyTemplate: (matched, rawLine) => rawLine,
    regressionTestTemplate: () =>
      `test("executes intended logic prior to termination", () => {\n  expect(calculateResult()).toBeDefined();\n});`,
  },

  // 6. Async Callback in Array.forEach (Unhandled Concurrency)
  {
    id: "bug_async_foreach",
    name: "Asynchronous Callback in Array.forEach()",
    severity: "medium",
    category: "logical_bug",
    cwe: "CWE-696",
    pattern: /\b[a-zA-Z0-9_\.]+\.forEach\s*\(\s*async\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g,
    description: "Array.forEach() does not wait for async promises returned by its callback.",
    whyItMatters: "Async operations inside forEach run concurrently without awaiting completion, causing race conditions or missing error handling.",
    suggestedFixTemplate: () => `await Promise.all(items.map(async (item) => { ... })) or use for (const item of items)`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/\b([a-zA-Z0-9_\.]+)\.forEach\s*\(\s*async/, "await Promise.all($1.map(async"),
    regressionTestTemplate: () =>
      `test("properly awaits all asynchronous iterations", async () => {\n  const results: number[] = [];\n  await processAll([1, 2, 3]);\n  expect(results).toHaveLength(3);\n});`,
  },

  // 7. Invalid typeof Comparison
  {
    id: "bug_invalid_typeof",
    name: "Invalid typeof Comparison (Always False)",
    severity: "medium",
    category: "logical_bug",
    cwe: "CWE-697",
    pattern: /\btypeof\s+([a-zA-Z0-9_\.]+)\s*===?\s*["'](?:null|array|regexp)["']/g,
    description: "Comparing typeof against 'null' or 'array'. In JavaScript, typeof null and typeof [] are 'object'.",
    whyItMatters: "Comparisons like `typeof x === 'null'` or `typeof x === 'array'` will always evaluate to false.",
    suggestedFixTemplate: () => `val === null or Array.isArray(val)`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/typeof\s+([a-zA-Z0-9_\.]+)\s*===?\s*["']null["']/, "$1 === null")
             .replace(/typeof\s+([a-zA-Z0-9_\.]+)\s*===?\s*["']array["']/, "Array.isArray($1)"),
    regressionTestTemplate: () =>
      `test("correctly checks for null or array type", () => {\n  expect(checkType(null)).toBe(true);\n  expect(checkType([])).toBe(true);\n});`,
  },

  // 8. Missing Await in Boolean Condition
  {
    id: "bug_missing_await_promise",
    name: "Missing Await on Async Function in Condition",
    severity: "high",
    category: "logical_bug",
    cwe: "CWE-252",
    pattern: /\bif\s*\(\s*(?:validate[A-Za-z0-9_]*|check[A-Za-z0-9_]*|is[A-Za-z0-9_]*Async|verify[A-Za-z0-9_]*)\s*\([^)]*\)\s*\)/g,
    description: "Calling an async function inside an `if (...)` condition without `await`.",
    whyItMatters: "Async functions return a Promise object, which is always truthy, causing the if-branch to execute even if the check returns false.",
    suggestedFixTemplate: () => `if (await checkAsync())`,
    autoRemedyTemplate: (matched, rawLine) =>
      rawLine.replace(/(\bif\s*\(\s*)([a-zA-Z0-9_]+\s*\([^)]*\))/, "$1await $2"),
    regressionTestTemplate: () =>
      `test("correctly evaluates resolved promise value", async () => {\n  expect(await runCheck(false)).toBe(false);\n});`,
  },

  // 9. Infinite Loop Counter Direction
  {
    id: "bug_infinite_loop_counter",
    name: "Loop Counter Direction Contradicts Termination Condition",
    severity: "high",
    category: "logical_bug",
    cwe: "CWE-835",
    pattern: /for\s*\(\s*let\s+([a-zA-Z0-9_]+)\s*=\s*0\s*;\s*\1\s*<\s*[^;]+;\s*\1--\s*\)/g,
    description: "For-loop initialized to 0 with condition `< length`, but counter decrements (`i--`).",
    whyItMatters: "Counter moves further away from termination, resulting in an infinite loop that freezes the process or browser tab.",
    suggestedFixTemplate: () => `for (let i = 0; i < length; i++)`,
    autoRemedyTemplate: (matched, rawLine) => rawLine.replace(/--\s*\)/, "++)"),
    regressionTestTemplate: () =>
      `test("loop terminates within bounded step limit", () => {\n  expect(boundedLoop([1, 2])).toBe(2);\n});`,
  },

  // 10. Contradictory Boolean Logic
  {
    id: "bug_contradictory_condition",
    name: "Contradictory Boolean Expression (Always False)",
    severity: "medium",
    category: "logical_bug",
    cwe: "CWE-570",
    pattern: /\b([a-zA-Z0-9_\.]+)\s*&&\s*!\1\b|\b!([a-zA-Z0-9_\.]+)\s*&&\s*\2\b/g,
    description: "Boolean condition checks `x && !x`, which is mutually exclusive and can never be true.",
    whyItMatters: "Guarantees the branch will never execute, pointing to an erroneous variable name or inverted logic check.",
    suggestedFixTemplate: () => `// Fix the secondary condition variable: x && !y`,
    autoRemedyTemplate: (matched, rawLine) => rawLine,
    regressionTestTemplate: () =>
      `test("evaluates consistent dual-variable expression", () => {\n  expect(checkFlags(true, false)).toBe(true);\n});`,
  },
];
