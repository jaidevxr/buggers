import { describe, it, expect } from "vitest";
import { scanFilesForSast } from "./sastScanner.server";

describe("SAST Scanner Engine", () => {
  it("detects SQL injection via string template interpolation", () => {
    const files = [
      {
        filename: "src/db/users.ts",
        patch: `@@ -10,3 +10,4 @@
 function getUser(id) {
+  return db.query(\`SELECT * FROM users WHERE id = \${id}\`);
 }`,
      },
    ];

    const findings = scanFilesForSast(files);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.title).toContain("SQL Injection");
    expect(findings[0]!.severity).toBe("critical");
    expect(findings[0]!.line).toBe(11);
    expect(findings[0]!.suggested_fix).toBeDefined();
  });

  it("detects command injection in child_process.exec calls", () => {
    const files = [
      {
        filename: "src/utils/backup.js",
        patch: `@@ -1,5 +1,6 @@
 const { exec } = require('child_process');
+exec(\`tar -czf backup.tar.gz \${userInput}\`);
`,
      },
    ];

    const findings = scanFilesForSast(files);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.title).toContain("Command Injection");
    expect(findings[0]!.severity).toBe("critical");
  });

  it("detects path traversal via fs.readFile with user input", () => {
    const files = [
      {
        filename: "src/routes/download.js",
        patch: `@@ -1,4 +1,5 @@
 app.get('/file', (req, res) => {
+  fs.readFile(path.join(__dirname, req.params.file), (err, data) => {});
 });`,
      },
    ];

    const findings = scanFilesForSast(files);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.title).toContain("Path Traversal");
    expect(findings[0]!.severity).toBe("high");
  });

  describe("Path Traversal Regression Suite", () => {
    it("detects file access using literal base path concatenation with req.query", () => {
      const files = [
        {
          filename: "src/routes/view.js",
          patch: `@@ -1,4 +1,5 @@
+require("fs").readFile("./uploads/" + req.query.filename, cb);
`,
        },
      ];
      const findings = scanFilesForSast(files);
      expect(findings).toHaveLength(1);
      expect(findings[0]!.title).toContain("Path Traversal");
      expect(findings[0]!.severity).toBe("high");
    });

    it("detects file access across supported request objects (req.params, req.body, request.args)", () => {
      const files = [
        {
          filename: "src/api/files.ts",
          patch: `@@ -1,6 +1,8 @@
+fs.readFileSync(req.params.id);
+fs.createReadStream(req.body.filepath);
+fs.writeFileSync("./out.txt", request.args.data);
`,
        },
      ];
      const findings = scanFilesForSast(files);
      expect(findings.length).toBe(3);
      for (const f of findings) {
        expect(f.title).toContain("Path Traversal");
      }
    });

    it("does not flag benign file access using a fixed literal path", () => {
      const files = [
        {
          filename: "src/config/reader.ts",
          patch: `@@ -1,5 +1,6 @@
+const data = fs.readFileSync("./config/app.json", "utf-8");
+fs.readFile(path.join(__dirname, "static", "logo.svg"), cb);
`,
        },
      ];
      const findings = scanFilesForSast(files);
      expect(findings).toHaveLength(0);
    });

    it("does not flag file operations that do not receive untrusted input", () => {
      const files = [
        {
          filename: "src/utils/cleanup.ts",
          patch: `@@ -1,5 +1,6 @@
+const safePath = path.resolve(BASE_DIR, "temp.log");
+fs.unlinkSync(safePath);
+const exists = fs.existsSync("./ready.lock");
`,
        },
      ];
      const findings = scanFilesForSast(files);
      expect(findings).toHaveLength(0);
    });
  });

  it("detects SSRF via unvalidated fetch/axios calls", () => {
    const files = [
      {
        filename: "src/routes/webhook.js",
        patch: `@@ -1,4 +1,5 @@
 app.post('/proxy', async (req, res) => {
+  const response = await fetch(req.body.targetUrl);
 });`,
      },
    ];

    const findings = scanFilesForSast(files);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.title).toContain("SSRF");
    expect(findings[0]!.severity).toBe("high");
  });

  it("detects insecure CORS pairing wildcard origin with credentials", () => {
    const files = [
      {
        filename: "src/server.js",
        patch: `@@ -1,3 +1,4 @@
+app.use(cors({ origin: "*", credentials: true }));
`,
      },
    ];

    const findings = scanFilesForSast(files);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.title).toContain("Insecure CORS");
  });

  it("detects weak MD5 or SHA-1 hash usage", () => {
    const files = [
      {
        filename: "src/auth/hash.js",
        patch: `@@ -1,3 +1,4 @@
+const hash = crypto.createHash('md5').update(pwd).digest('hex');
`,
      },
    ];

    const findings = scanFilesForSast(files);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.title).toContain("Weak Hash");
    expect(findings[0]!.severity).toBe("medium");
  });

  it("ignores clean code without security defects", () => {
    const files = [
      {
        filename: "src/math.js",
        patch: `@@ -1,3 +1,4 @@
+export function add(a, b) { return a + b; }
`,
      },
    ];

    const findings = scanFilesForSast(files);
    expect(findings).toHaveLength(0);
  });
});
