# Changelog

All notable changes to the **Buggers** VS Code Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-10-18

### Added
- **Multi-Mode Grouping & Scan Overview in Activity Bar**:
  - Added dedicated workspace scan overview node displaying total files scanned, total findings count, severity distribution, and scan duration.
  - Added grouping toggle (`buggers.toggleGrouping`) allowing developers to group findings by Category, Severity, or File path.
  - Added severity filter control (`buggers.filterFindings`) for focusing on critical or high vulnerabilities.
- **SARIF 2.1.0 and JSON Audit Export**:
  - Added `buggers.exportFindings` command to export workspace audit results to standard SARIF 2.1.0 format or structured JSON for CI/CD compliance.
- **Expanded Security Detection Rules**:
  - `unsafe_deserialization` (Critical, CWE-502): Detects unvalidated object deserialization via `node-serialize`, `serialize-javascript`, `yaml.load`, and `pickle.loads`.
  - `zip_slip_traversal` (High, CWE-29): Detects archive extraction without directory boundary validation.
  - `nosql_injection` (High, CWE-943): Flags unvalidated MongoDB `$where` clauses and raw query object injection.
- **Expanded Deterministic Logical Bug Checks**:
  - `bug_async_foreach` (Medium, CWE-696): Detects async callbacks inside `Array.forEach()` that fail to await promise resolution.
  - `bug_invalid_typeof` (Medium, CWE-697): Catches invalid `typeof` checks against `"null"` or `"array"`.
  - `bug_missing_await_promise` (High, CWE-252): Flags async check functions called without `await` in boolean conditions.
  - `bug_infinite_loop_counter` (High, CWE-835): Flags loops where the counter decrements while the condition expects an ascending termination bound.
  - `bug_contradictory_condition` (Medium, CWE-570): Detects mutually exclusive boolean conditions (`x && !x`).
- **Remediation & Review Workflow Hardening**:
  - Diff previews now verify that the underlying source file has not changed underfoot before applying edits.
  - Added "Copy Patch" action to diff preview alongside "Accept & Apply".
  - Full removal of all emoji symbols across documentation, command titles, notifications, and sidebar tree views for clean enterprise aesthetics.

## [1.2.0] - 2026-10-17

### Added
- **AI-Assisted Debugging & Consent-Gated Patch Proposals**:
  - `Buggers: Explain Finding` for in-depth threat taxonomy and exploit scenarios.
  - `Buggers: Suggest Fix` with side-by-side native diff preview and approval gates.
  - `Buggers: Debug Selected Code` for finding edge cases and null pointer hazards.
  - `Buggers: Generate Regression Test` to generate reproducible security spec files.
  - `Buggers: Find Logical Errors` for deterministic AST inspection of boolean conditions and off-by-one loops.
- **Enhanced Rule Coverage**:
  - Full suite of 23 SAST security rules covering all 21 OWASP categories.
  - 7 token and credential regex scanners with high entropy filters.
  - 5 deterministic logical error checks.

## [1.1.0] - 2026-10-17

### Added
- **21+ Security Vulnerability Categories (OWASP & CWE Covered)**:
  - SQL Injection (`sql_injection`, CWE-89)
  - Command Injection (`command_injection`, CWE-78)
  - Path Traversal (`path_traversal`, CWE-22)
  - Weak Cryptography (`weak_cryptography`, CWE-327)
  - Insecure Randomness (`insecure_randomness`, CWE-338)
  - Cross-Site Scripting (`cross_site_scripting`, CWE-79)
  - Unsafe Redirect (`unsafe_redirect`, CWE-601)
  - Disabled TLS Verification (`disabled_tls`, CWE-295)
  - Insecure HTTP Endpoints (`insecure_http`, CWE-319)
  - Dynamic Code Execution (`dynamic_code_execution`, CWE-95)
  - Sensitive Data Logging (`sensitive_logging`, CWE-532)
  - Insecure File Permissions (`insecure_file_permissions`, CWE-732)
  - Unsafe Temporary Files (`unsafe_temp_files`, CWE-377)
  - Weak Security Comparisons (`weak_comparisons`, CWE-697)
  - Unsafe Regular Expressions / ReDoS (`unsafe_regex`, CWE-1333)
  - Insecure Cookie Attributes (`insecure_cookies`, CWE-614)
  - Error Information Disclosure (`error_disclosure`, CWE-209)
  - Unsafe File Deletion (`unsafe_file_deletion`, CWE-73)
  - Prototype Pollution Risks (`prototype_pollution`, CWE-1321)
  - Missing Async Error Handling (`missing_async_error_handling`, CWE-703)
  - Side-Channel Timing Attacks (`timing_attack`, CWE-208)
  - Insecure CORS Configuration (`insecure_cors`, CWE-942)
  - Server-Side Request Forgery (`ssrf`, CWE-918)
- **Deterministic Logical Bug Detection** (`buggers.findLogicalBugs`):
  - Accidental assignment in conditional expression (`bug_accidental_assignment_in_condition`, CWE-480)
  - Tautological and self-comparing conditions (`bug_tautological_condition`, CWE-571)
  - Direct equality comparison with NaN (`bug_nan_comparison`, CWE-697)
  - Off-by-one boundary indexing in loops (`bug_off_by_one_index`, CWE-193)
  - Unreachable dead code after return (`bug_unreachable_code`, CWE-561)
- **Root Cause Explanation** (`buggers.explainFinding`): Deep causal analysis explaining vulnerability mechanism and impact.
- **Reviewable Side-by-Side Diff Fix Workflow** (`buggers.suggestFix`): Proposed fixes are shown in native `vscode.diff` allowing review before Accept or Reject.
- **Regression Test Generation** (`buggers.generateRegressionTest`): Automatically generates unit test assertions verifying that the vulnerability cannot regress.
- **AI-Assisted Debugging Support**:
  - Multi-provider architecture supporting OpenAI, Anthropic, Gemini, Ollama, and custom OpenAI-compatible endpoints.
  - Strict privacy gate: Requires explicit modal user confirmation before transmitting any code snippet.
  - 100% functional offline without AI keys using deterministic rules and remediation templates.
  - Secure credential storage in VS Code `context.secrets`.
- **UI Simplification & Professional Polish**: Clean, native VS Code styling adhering strictly to VS Code Codicons and theme guidelines.

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
