<p align="center">
  <a href="https://buggers.dev">
    <img src="https://buggers.dev/icon-192.png" width="96" height="96" alt="Buggers Logo" style="border-radius: 20px;" />
  </a>
</p>

<h1 align="center">Buggers — Security & Code Review</h1>

<p align="center">
  <b>Deterministic In-Editor SAST, Secret Leak Prevention, Logical Bug Detection, and Pull Request Triage for Visual Studio Code.</b><br />
  Built by <b>Jaidev Yadav</b>, <b>Khushi Sharma</b>, <b>Madhvi Mishra</b>, and <b>Kumkum</b>.<br />
  Official Extension | Platform: <a href="https://buggers.dev">https://buggers.dev</a> | Documentation: <a href="https://buggers.dev/docs">https://buggers.dev/docs</a>
</p>

<p align="center">
  <a href="https://buggers.dev"><img src="https://img.shields.io/badge/Platform-buggers.dev-000000?style=flat-square&logo=vercel" alt="Platform" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=buggers.buggers-vscode"><img src="https://img.shields.io/badge/VS%20Code-v1.3.0-007acc?style=flat-square&logo=visual-studio-code" alt="Marketplace" /></a>
  <a href="https://github.com/jaidevxr/buggers"><img src="https://img.shields.io/badge/GitHub-jaidevxr%2Fbuggers-181717?style=flat-square&logo=github" alt="GitHub" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Proprietary-slate?style=flat-square" alt="License" /></a>
</p>

---

## Overview

Buggers for VS Code brings the deterministic intelligence of the Buggers release pipeline directly into your everyday development environment. It continuously inspects open files and workspace projects locally in-process to detect OWASP vulnerabilities, correctness defects, and hardcoded credentials before code is committed or pushed.

Whether you develop backend services, web applications, microservices, or APIs, Buggers operates with strict zero-trust isolation: analysis is performed entirely on your machine without transmitting code to external servers unless you explicitly request AI assistance with confirmed consent.

---

## Key Capabilities

- **In-Editor Security Flaw Detection:** Scans for high-impact security vulnerabilities including SQL/NoSQL Injection, Command Injection, SSRF, Path Traversal, Insecure Deserialization, Zip Slip, Insecure CORS, and Side-Channel Timing Attacks.
- **Real-Time Secret Leak Prevention:** Detects unencrypted AWS Access Keys, GitHub PATs, OpenAI API keys, Stripe Secret Keys, Private Key blocks, and Database Connection URIs before code is committed. Discovered secrets are safely masked in diagnostics.
- **Logical Bug & Correctness Detection:** Identifies off-by-one boundary indexing, un-awaited promises in conditions, unhandled async operations in loops, invalid typeof comparisons, accidental conditional assignments, and infinite loop counter errors.
- **Multi-Mode Activity Bar Sidebar:** Dedicated tree view grouping findings by Category (Security, Secrets, Logical Bugs, Code Quality), Severity (Critical, High, Medium, Low), or File path, complete with a comprehensive workspace scan overview.
- **Native VS Code Diagnostics:** Flaws and secrets populate directly into VS Code's Problems panel (`Ctrl+Shift+M` / `Cmd+Shift+M`) with exact range underlines and Quick Fix actions (`Ctrl+.` / `Cmd+.`).
- **Safe Reviewable Remediation:** Proposed fixes are presented in a side-by-side diff preview. Patches require explicit user confirmation before application, with source-change validation to prevent overwriting modified code.
- **SARIF & JSON Export:** Export workspace audit findings to standard SARIF 2.1.0 or JSON format for CI/CD reporting and compliance reviews.
- **Privacy-First AI Assistant:** Optional AI debugging and explanation powered by OpenAI, Anthropic, Gemini, Ollama (Local), or custom endpoints. Tokens are stored in the OS keychain via SecretStorage, and code is never transmitted without explicit user consent.

---

## Quick Start

1. Install Buggers from the VS Code Extensions view (`Ctrl+Shift+X` -> search `Buggers`).
2. Open any workspace containing JavaScript, TypeScript, Python, Go, or configuration files.
3. Save any open file or press `Ctrl+Shift+P` and execute:
   ```text
   Buggers: Analyze Current File
   ```
4. View detected security findings in the **Problems** tab or open the Buggers shield icon in the Activity Bar.
5. To audit the entire workspace, run:
   ```text
   Buggers: Analyze Workspace
   ```

---

## Privacy & Zero-Trust Architecture

1. **Local-First Processing:** Core SAST scanning, secret pattern matching, and logical bug analysis run 100% locally in your VS Code process. Source code is never transmitted to remote servers during standard audits.
2. **Zero Telemetry:** No user analytics, background telemetry, or behavioral tracking is bundled.
3. **OS Keychain Credential Storage:** API tokens and credentials are encrypted using the operating system keychain via `vscode.ExtensionContext.secrets`. Credentials are never written to plaintext settings or log files.
4. **Explicit AI Consent:** Before any code snippet is sent to a remote AI model, Buggers displays a modal confirmation detailing the provider, model, and lines to be sent.

---

## Available Commands

Access all commands via the Command Palette (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on macOS):

| Command ID | Display Title | Description |
|---|---|---|
| `buggers.analyzeFile` | Buggers: Analyze Current File | Scan the active editor document for security flaws, secrets, and logical bugs. |
| `buggers.analyzeWorkspace` | Buggers: Analyze Workspace | Perform a full workspace audit with progress reporting and cancellation support. |
| `buggers.showFindings` | Buggers: Show Findings | Reveal the dedicated Buggers sidebar view in the Activity Bar. |
| `buggers.refreshFindings` | Buggers: Refresh Findings | Re-analyze the active file or workspace and update diagnostics. |
| `buggers.clearFindings` | Buggers: Clear Findings | Clear all active diagnostics, status bar indicators, and tree items. |
| `buggers.toggleGrouping` | Buggers: Toggle Findings Grouping Mode | Cycle tree view grouping between Category, Severity, and File path. |
| `buggers.filterFindings` | Buggers: Filter Findings by Severity | Filter sidebar findings by minimum severity threshold. |
| `buggers.exportFindings` | Buggers: Export Findings to SARIF or JSON | Export current audit findings to SARIF 2.1.0 or structured JSON. |
| `buggers.suggestFix` | Buggers: Preview Security Remedy Diff | Review proposed fix in a side-by-side diff with accept/copy/reject options. |
| `buggers.explainFinding` | Buggers: Explain Finding | Inspect root cause, exploit vector, and remediation guidance. |
| `buggers.debugSelection` | Buggers: Debug Selected Code | Analyze highlighted code selection for subtle bugs and edge cases. |
| `buggers.generateRegressionTest` | Buggers: Generate Regression Test | Produce a test case asserting the flaw is resolved. |
| `buggers.configureAiProvider` | Buggers: Configure AI Provider | Select provider (OpenAI, Anthropic, Gemini, Ollama, Custom) and set API key. |
| `buggers.openDashboard` | Buggers: Open Buggers Dashboard | Open the Buggers web platform in your system browser. |

---

## Configuration Settings

Configure settings in VS Code Preferences (`Ctrl+,` / `Cmd+,`) under **Extensions > Buggers**:

| Setting | Type | Default | Description |
|---|---|---|---|
| `buggers.autoAnalyzeOnSave` | boolean | `true` | Automatically run security and defect scans whenever an open document is saved. |
| `buggers.minimumSeverity` | string | `"low"` | Minimum finding severity displayed in the Problems panel (`critical`, `high`, `medium`, `low`). |
| `buggers.serverUrl` | string | `"https://buggers.dev"` | Buggers platform URL for web dashboard actions. |
| `buggers.ai.provider` | string | `"openai"` | AI provider for assisted explanations (`openai`, `anthropic`, `gemini`, `ollama`, `custom`). |
| `buggers.ai.model` | string | `"gpt-4o-mini"` | Model identifier for AI debugging and explanation requests. |
| `buggers.ai.customEndpoint` | string | `""` | Base URL for local or self-hosted LLMs (e.g. `http://localhost:11434/v1`). |
| `buggers.ai.timeoutMs` | number | `30000` | Maximum network timeout in milliseconds for AI requests. |

---

## Rule Coverage

### Security Vulnerabilities (SAST)
- `sql_injection` (Critical, CWE-89): String concatenation and interpolation in SQL statements.
- `command_injection` (Critical, CWE-78): Unescaped variables executed via system shell.
- `unsafe_deserialization` (Critical, CWE-502): Unsafe object deserialization leading to RCE.
- `dynamic_code_execution` (Critical, CWE-95): Dynamic code execution via `eval()` or `new Function()`.
- `path_traversal` (High, CWE-22): Unsanitized path concatenation in file system calls.
- `zip_slip_traversal` (High, CWE-29): Directory escape during archive extraction.
- `nosql_injection` (High, CWE-943): Unsanitized MongoDB `$where` clauses or unvalidated query objects.
- `cross_site_scripting` (High, CWE-79): Direct DOM insertion via `innerHTML` or `dangerouslySetInnerHTML`.
- `ssrf` (High, CWE-918): Unvalidated user-supplied URLs passed to HTTP clients.
- `insecure_randomness` (High, CWE-338): `Math.random()` used for security tokens or credentials.
- `side_channel_timing` (High, CWE-208): Non-constant-time equality operators comparing secrets or HMACs.
- `disabled_tls_verification` (High, CWE-295): Disabled TLS certificate validation (`rejectUnauthorized: false`).
- `unsafe_file_deletion` (High, CWE-73): Dynamic unvalidated file or directory removal.
- `weak_cryptography` (Medium, CWE-327): Deprecated cryptographic algorithms (MD5, SHA-1, DES, RC4, ECB).
- `insecure_cors` (Medium, CWE-942): Wildcard origin combined with authenticated credentials.
- `insecure_cookies` (Medium, CWE-614): Cookies missing `HttpOnly`, `Secure`, or `SameSite` flags.
- `unsafe_redirect` (Medium, CWE-601): Open redirection using unvalidated input.
- `sensitive_data_logging` (Medium, CWE-532): Plaintext credentials logged to stdout or loggers.
- `insecure_file_permissions` (Medium, CWE-732): Overly permissive file modes (`0o777`).
- `unsafe_temporary_files` (Medium, CWE-377): Predictable temporary file paths.
- `prototype_pollution` (Medium, CWE-1321): Unsafe recursive object merge vulnerable to `__proto__` pollution.
- `unsafe_regular_expression` (Medium, CWE-1333): ReDoS patterns vulnerable to polynomial backtracking.
- `missing_async_error_handling` (Medium, CWE-703): Unhandled promise rejections without `.catch()`.
- `error_disclosure` (Low, CWE-209): Unhandled error stack traces sent directly to HTTP clients.
- `insecure_http` (Low, CWE-319): Unencrypted HTTP protocol URLs for sensitive resources.
- `weak_comparison` (Low, CWE-697): Loose equality (`==`) where strict comparison is warranted.

### Secret & Credential Detection
- `aws_access_key` (Critical, CWE-798): AWS Access Key IDs (`AKIA[0-9A-Z]{16}`).
- `github_pat` (Critical, CWE-798): GitHub Personal Access Tokens (`ghp_...`, `github_pat_...`).
- `openai_api_key` (Critical, CWE-798): OpenAI API Keys (`sk-proj-...`, `sk-...`).
- `stripe_secret_key` (Critical, CWE-798): Stripe Secret API Keys (`sk_live_...`).
- `private_key_block` (Critical, CWE-798): PEM Private Key blocks.
- `db_connection_uri` (Critical, CWE-798): Database connection URIs containing embedded passwords.
- `generic_api_secret` (Critical, CWE-798): High-entropy API secrets and passwords assigned in code.

### Logical Bug & Correctness Detection
- `bug_accidental_assignment_in_condition` (High, CWE-480): Assignment operator `=` inside `if` condition.
- `bug_missing_await_promise` (High, CWE-252): Missing `await` on async function evaluated in boolean condition.
- `bug_infinite_loop_counter` (High, CWE-835): Loop counter decrements while condition checks ascending bound.
- `bug_off_by_one_index` (Medium, CWE-193): Loop condition `<= array.length` accessing out-of-bounds index.
- `bug_async_foreach` (Medium, CWE-696): Async callback in `Array.forEach()` ignoring promise resolution.
- `bug_invalid_typeof` (Medium, CWE-697): Comparison against impossible `typeof` results (`"null"`, `"array"`).
- `bug_tautological_condition` (Medium, CWE-571): Self-comparison condition (`x === x`) always evaluating to constant.
- `bug_nan_comparison` (Medium, CWE-697): Direct `x === NaN` comparison that always evaluates to false.
- `bug_contradictory_condition` (Medium, CWE-570): Contradictory boolean expression (`x && !x`).
- `bug_unreachable_code` (Low, CWE-561): Dead statements located after unconditional `return`.

---

## Local Installation

To install the packaged extension file (`.vsix`) in VS Code:

1. Open the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
2. Click the `...` (More Actions) menu at the top right of the Extensions view.
3. Select **Install from VSIX...**.
4. Choose the `buggers-vscode-1.3.0.vsix` package file.

Alternatively, install via terminal:
```bash
code --install-extension buggers-vscode-1.3.0.vsix
```

---

## Building from Source

```bash
# Navigate to the extension folder
cd extensions/buggers-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Bundle extension with esbuild
npm run build

# Run automated test suite
npm test

# Package VSIX archive
npm run package
```

---

## Team & Credits

Buggers for VS Code was designed and engineered by:
- **Jaidev Yadav**
- **Khushi Sharma**
- **Madhvi Mishra**
- **Kumkum**

---

## License

Proprietary. All Rights Reserved. See [LICENSE](LICENSE) for details.
Copyright (c) 2026 Buggers Engineering.
