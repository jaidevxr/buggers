// ============================================================================
// Buggers VS Code Extension: Comprehensive Vulnerability & Bug Sample File
// Covers all 21 security categories + logical bugs + secret tokens
// ============================================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { exec } = require("child_process");

// 1. SQL Injection (CWE-89)
const userId = "105";
const sqlQuery = `SELECT * FROM users WHERE id = ${userId}`;

// 2. Command Injection (CWE-78)
const host = "127.0.0.1; whoami";
exec(`ping -c 1 ${host}`);

// 3. Path Traversal (CWE-22)
const userPath = "../../../etc/passwd";
fs.readFile(path.join("/var/data", userPath));

// 4. Weak Cryptography (CWE-327)
const cipher = crypto.createCipher("des", "password");
const weakHash = crypto.createHash("md5").update("data").digest("hex");

// 5. Insecure Randomness (CWE-338)
const sessionToken = Math.random().toString(36).substring(2);

// 6. Cross-Site Scripting (CWE-79)
const untrustedInput = "<script>alert(1)</script>";
document.getElementById("output").innerHTML = untrustedInput;

// 7. Unsafe Redirect (CWE-601)
const redirectUrl = "https://evil.com";
res.redirect(redirectUrl);

// 8. Disabled TLS Verification (CWE-295)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// 9. Insecure HTTP (CWE-319)
const backendService = "http://internal-auth.corp/token";

// 10. Dynamic Code Execution (CWE-95)
const calcInput = "2 + 2";
const calcResult = eval(calcInput);

// 11. Sensitive Data Logging (CWE-532)
const userPassword = "super_secret_password";
console.log("User password is:", userPassword);

// 12. Insecure File Permissions (CWE-732)
fs.chmodSync("/tmp/secret.key", 0o777);

// 13. Unsafe Temporary Files (CWE-377)
const tempFile = "/tmp/cache-" + Date.now() + ".dat";

// 14. Weak Security Comparisons (CWE-697)
const tokenA = "abc";
const tokenB = "def";
if (tokenA == tokenB) {
  grantAccess();
}

// 15. Unsafe Regular Expressions / ReDoS (CWE-1333)
const vulnerableRegex = new RegExp("(a+)+$");

// 16. Insecure Cookies (CWE-614)
res.cookie("session_id", "xyz123", { httpOnly: false });

// 17. Error Information Disclosure (CWE-209)
try {
  riskyOperation();
} catch (err) {
  res.status(500).send(err.stack);
}

// 18. Unsafe File Deletion (CWE-73)
fs.unlinkSync(userPath);

// 19. Prototype Pollution (CWE-1321)
const target = {};
target["__proto__"] = { isAdmin: true };

// 20. Missing Async Error Handling (CWE-703)
fs.promises.readFile("config.json").then((data) => parse(data));

// 21. Side-Channel Timing Attack (CWE-208)
const expectedSignature = "abc123sig";
if (signature === expectedSignature) {
  verifyUser();
}

// 22. Insecure CORS Configuration (CWE-942)
cors({ origin: "*", credentials: true });

// 23. Server-Side Request Forgery / SSRF (CWE-918)
const webhookUrl = "http://169.254.169.254/latest/meta-data/";
fetch(webhookUrl);

// Secrets Detection
const awsKey = "AKIA1234567890ABCDEF";
const githubToken = "ghp_1234567890abcdef1234567890abcdef1234";

// Logical Bugs
// 1. Accidental Assignment in Condition
let isAuthenticated = false;
if (isAuthenticated = true) {
  grantAdmin();
}

// 2. Tautological Condition
if (user.id === user.id) {
  noOp();
}

// 3. Comparison with NaN
const num = NaN;
if (num === NaN) {
  handleNan();
}

// 4. Off-by-one Loop Boundary
const items = [1, 2, 3];
for (let i = 0; i <= items.length; i++) {
  console.log(items[i]);
}

// 5. Unreachable Code After Return
function computeScore() {
  return 100;
  const deadCalculation = 50 * 2;
}
