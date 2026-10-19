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
  <a href="https://marketplace.visualstudio.com/items?itemName=buggers.buggers-vscode"><img src="https://img.shields.io/badge/VS%20Code-v1.4.7-007acc?style=flat-square&logo=visual-studio-code" alt="Marketplace" /></a>
  <a href="https://github.com/jaidevxr/buggers"><img src="https://img.shields.io/badge/GitHub-jaidevxr%2Fbuggers-181717?style=flat-square&logo=github" alt="GitHub" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Proprietary-slate?style=flat-square" alt="License" /></a>
</p>

---

## Overview

Buggers for VS Code brings the deterministic intelligence of the Buggers release pipeline directly into your everyday development environment. It continuously inspects open files and workspace projects locally in-process to detect OWASP vulnerabilities, correctness defects, and hardcoded credentials before code is committed or pushed.

Buggers operates with strict zero-trust isolation: analysis is performed entirely on your machine without transmitting code to external servers.

---

## Key Capabilities

- **Continuous Automatic Detection:** Instantly analyzes code when opening files, switching editor tabs, and live typing (debounced incremental re-scanning). Scans workspace in the background on startup without requiring manual button clicks.
- **Click-to-Inspect & Direct Navigation:** Clicking any finding in the Buggers findings panel immediately opens the source document, navigates to the exact line and character column, centers the viewport, and keeps the finding selected. Supports local, untitled, and remote workspaces.
- **Exact-Range Inline Highlighting:** Precise visual decorations highlighting the exact vulnerable expression with severity-themed styling (`critical`, `high`, `medium`, `low`), whole-line background context, and safe line-level fallbacks.
- **Dedicated Finding Inspector:** Sidebar inspector view (`buggers.inspectorView`) rendering real document code context excerpts with highlighted expressions (`<mark class="vuln-mark">`), exploit impact details, and recommended remediation.
- **Instant Direct Fix Workflow:** Apply validated deterministic patches directly to the target file via VS Code `WorkspaceEdit` and remain in your normal editor. Features pre-fix divergence verification and honest re-scan confirmation.
- **Reviewable Side-by-Side Diff Preview:** Inspect proposed fixes in an explicit side-by-side diff editor (`buggers.previewDiff`) with non-empty replacement code whenever manual inspection is preferred.
- **Deterministic Local Rule Explainer:** In-depth offline root-cause explanations and automated unit regression test templates (`RuleExplainer`) generated without external AI dependencies or network calls.
- **Multi-Mode Activity Bar Sidebar:** Dedicated tree view grouping findings by Category (Secrets, Security, Logical Bugs, Code Quality), Severity (Critical, High, Medium, Low), or File path, complete with a comprehensive workspace scan overview.
- **Native VS Code Diagnostics:** Flaws and secrets populate directly into VS Code's Problems panel (`Ctrl+Shift+M` / `Cmd+Shift+M`) with exact range underlines and Quick Fix actions (`Ctrl+.` / `Cmd+.`).
- **SARIF & JSON Export:** Export workspace audit findings to standard SARIF 2.1.0 or JSON format for CI/CD reporting and compliance reviews.

---

## Quick Start

1. Install Buggers from the VS Code Extensions view (`Ctrl+Shift+X` -> search `Buggers`).
2. Open any workspace containing JavaScript, TypeScript, Python, Go, or configuration files.
3. Buggers immediately starts continuous background analysis. Switch tabs or open any file to see instant diagnostics in the Problems panel and the Buggers sidebar.
4. Click on any finding in the Buggers sidebar to jump directly to its code with inline expression highlighting.
5. Use the compact action toolbar in the Finding Inspector or tree view child actions:
   - **Fix Finding:** Applies the validated patch directly to your file and verifies resolution.
   - **Preview Fix:** Opens a side-by-side diff editor to review the change before applying.
   - **Explain:** Displays comprehensive local rule guidance and exploit scenario.
   - **Copy Patch:** Copies the remediation code directly to your clipboard.
   - **Generate Test:** Produces an automated regression unit test template.
   - **Suppress:** Inserts a standard `// buggers-ignore` comment above the offending line.
6. To audit the entire workspace on demand, run `Buggers: Analyze Workspace` or click refresh in the Buggers sidebar.

---

## Privacy & Zero-Trust Architecture

1. **Local-First Processing:** Core SAST scanning, secret pattern matching, and logical bug analysis run 100% locally in your VS Code process. Source code is never transmitted to remote servers during standard audits.
2. **Zero Telemetry:** No user analytics, background telemetry, or behavioral tracking is bundled.
3. **OS Keychain Credential Storage:** API tokens and credentials are encrypted using the operating system keychain via `vscode.ExtensionContext.secrets`. Credentials are never written to plaintext settings or log files.
4. **Zero External AI Dependency:** Buggers runs 100% offline using deterministic rule execution and native language tooling. No source code or snippets are ever dispatched to external cloud AI models.

---

## Available Commands

Access all commands via the Command Palette (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on macOS):

| Command ID | Display Title | Description |
|---|---|---|
| `buggers.analyzeFile` | Buggers: Analyze Current File | Scan the active editor document for security flaws, secrets, and logical bugs. |
| `buggers.analyzeWorkspace` | Buggers: Analyze Workspace | Perform a full workspace audit with progress reporting and cancellation support. |
| `buggers.showFindings` | Buggers: Show Findings | Reveal the dedicated Buggers sidebar view in the Activity Bar. |
| `buggers.refreshFindings` | Buggers: Refresh Findings | Re-analyze the active file or workspace and restore any dismissed findings. |
| `buggers.clearFindings` | Buggers: Clear Displayed Findings | Dismiss all displayed findings from the view without altering source files. |
| `buggers.dismissFinding` | Buggers: Dismiss Finding from Display | Dismiss selected finding from view with one-click undo support. |
| `buggers.moreActions` | Buggers: More Actions for Finding | Open QuickPick action menu (Fix, Preview Diff, Explain, Patch, Test, Suppress, Dismiss). |
| `buggers.toggleGrouping` | Buggers: Toggle Findings Grouping Mode | Switch grouping between Severity (auto-expanded), Flat list, Category, and File. |
| `buggers.filterFindings` | Buggers: Filter Findings by Severity | Filter sidebar findings by minimum severity threshold. |
| `buggers.exportFindings` | Buggers: Export Findings to SARIF or JSON | Export current audit findings to SARIF 2.1.0 or structured JSON. |
| `buggers.selectFinding` | Buggers: Select & Inspect Finding | Jump to finding in editor with exact-range highlighting and populate inspector. |
| `buggers.applyRemedy` | Buggers: Fix Finding (Apply Directly) | Apply verified deterministic patch directly to file and keep user in editor. |
| `buggers.previewDiff` | Buggers: Preview Fix Diff | Inspect side-by-side proposed fix diff before applying. |
| `buggers.copyPatch` | Buggers: Copy Remediation Patch | Copy remediation code snippet directly to clipboard. |
| `buggers.explainFinding` | Buggers: Explain Finding & Evidence | View comprehensive local rule guidance, causation, and remediation pattern. |
| `buggers.generateRegressionTest` | Buggers: Generate Regression Test | Produce an automated unit test reproducing prevention. |
| `buggers.ignoreFinding` | Buggers: Suppress Finding | Insert standard `// buggers-ignore` comment above line. |
| `buggers.inspectFinding` | Buggers: Inspect Selected Finding | Focus and populate the Finding Inspector sidebar view. |
| `buggers.openInspector` | Buggers: Open Finding Inspector | Open the dedicated Finding Inspector sidebar panel. |
| `buggers.gitReviewChanges` | Buggers: Review Changed Files & Pre-Commit Audit | Inspect diff and security findings across modified files before committing. |
| `buggers.gitCommit` | Buggers: Commit Approved Changes to GitHub | Interactive, explicit file-by-file staging and commit workflow. |
| `buggers.gitPush` | Buggers: Push Approved Commits to GitHub | Safely push local commits to verified remote branch without force-pushing. |
| `buggers.openOnGitHub` | Buggers: Open Repository on GitHub | Open the current repository and active branch on github.com in default browser. |
| `buggers.connectGitHub` | Buggers: Connect GitHub Account | Connect via VS Code GitHub session or store Personal Access Token in SecretStorage. |
| `buggers.refreshGitHubStatus` | Buggers: Refresh GitHub Repository Status | Re-check remote configuration, working tree changes, and authentication state. |
| `buggers.openDashboard` | Buggers: Open Buggers Dashboard | Open the Buggers web platform in your system browser. |

---

## Configuration Settings

Configure settings in VS Code Preferences (`Ctrl+,` / `Cmd+,`) under **Extensions > Buggers**:

| Setting | Type | Default | Description |
|---|---|---|---|
| `buggers.autoAnalyzeOnSave` | boolean | `true` | Automatically run security and defect scans whenever an open document is saved. |
| `buggers.minimumSeverity` | string | `"low"` | Minimum finding severity displayed in the Problems panel (`critical`, `high`, `medium`, `low`). |
| `buggers.serverUrl` | string | `"https://buggers.dev"` | Buggers platform URL for web dashboard actions. |

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
- **Khushi Sharma** ([@KhushiSharma006](https://github.com/KhushiSharma006)) — Extension & Security Scanner Lead
- **Jaidev Yadav**
- **Madhvi Mishra**
- **Kumkum**

---

## License

Proprietary. All Rights Reserved. See [LICENSE](LICENSE) for details.
Copyright (c) 2026 Buggers Engineering.
