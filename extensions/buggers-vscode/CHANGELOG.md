# Changelog

All notable changes to the **Buggers** VS Code Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-17

### Added
- **Deterministic SAST Code Scanner**: In-process analysis for OWASP Top 10 vulnerability patterns:
  - SQL Injection in template literals and string concatenation (`sql_injection`)
  - Command Injection via `child_process.exec` / `spawn` with unsanitized parameters (`command_injection`)
  - Server-Side Request Forgery via unsanitized URLs in `fetch` / `axios` / `http.get` (`ssrf_fetch`)
  - Path Traversal via untrusted path segments passed to filesystem methods (`path_traversal`)
  - Overly permissive CORS wildcard headers (`Access-Control-Allow-Origin: *`) (`insecure_cors`)
  - Side-channel timing attacks from non-constant-time equality checks on sensitive tokens (`timing_attack`)
  - Weak cryptographic hash functions (`MD5`, `SHA1`) used in security contexts (`weak_crypto_md5`)
  - Arbitrary code execution via `eval()` and `new Function()` (`eval_injection`)
- **Secret Leak Prevention**: Real-time detection and masking of sensitive credentials before commit:
  - AWS Access Key IDs (`AKIA...`)
  - GitHub Personal Access Tokens (`ghp_...`, `github_pat_...`)
  - OpenAI API Keys (`sk-proj-...`, `sk-...`)
  - Stripe Secret Keys (`sk_live_...`)
  - Unencrypted RSA / EC / OpenSSH Private Key blocks
  - Database Connection Strings containing plaintext passwords (`postgres://`, `mongodb://`, etc.)
- **Native VS Code Problems Panel Integration**:
  - Automatically highlights flaws with precise line and character offsets.
  - Severity mapping: `CRITICAL` & `HIGH` mapped to Error, `MEDIUM` to Warning, `LOW` to Information.
- **Dedicated Buggers Activity Bar View**:
  - Custom sidebar icon and view container (`buggers-sidebar`).
  - Tree view grouping active findings by Severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - 1-click navigation directly to the offending file, line, and column.
- **Secure Credential Management**:
  - Credentials stored in the operating system's native keychain using `vscode.ExtensionContext.secrets`.
  - Zero plaintext tokens stored in workspace settings, state files, or environment variables.
- **Local-First Zero-Trust Architecture**:
  - All scanning occurs 100% locally in-process inside your editor.
  - Source code and workspace contents are never transmitted across the network.
- **Workspace-Wide Auditing**:
  - `buggers.analyzeWorkspace` command scans up to 1,000 files across the workspace.
  - Automatically ignores `node_modules`, `.git`, `dist`, `build`, `coverage`, and other vendor artifacts.
- **Configurable Settings**:
  - `buggers.autoAnalyzeOnSave`: Toggle automatic scanning on document save.
  - `buggers.minimumSeverity`: Filter Problems panel display by severity threshold (`critical`, `high`, `medium`, `low`).
  - `buggers.serverUrl`: Endpoint URL for the Buggers web dashboard and cloud review platform.
