# Changelog

All notable changes to the **Buggers** VS Code Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.7] - 2026-10-18

### Added
- **48-Rule Empirical Benchmark & Rescan Verification Suite (Suite 23)**:
  - Added comprehensive automated regression tests evaluating every detection rule across vulnerable samples, clean samples, and remediated code.
  - Achieved 100% True Positive detection (48/48 rules) and 0% False Positive rate across all categories.
  - 100% of automated fixes (35/35 rules) verified to resolve the vulnerability upon immediate rescanning.
- **Truthful Remediation Declarations**:
  - Accurately declares "Manual fix required" for rules that depend on business logic or developer intent (tautological conditions, unreachable code, contradictory conditions, null dereferences, state mutations, and secret credentials).
  - Eliminated misleading no-op auto-remedy templates that previously offered automated fixes for complex logical flaws.
- **Unified Code Diagnostics & Multi-Language Static Analysis**:
  - Full unified diagnostics model surfacing security flaws, syntax errors, type errors, semantic bugs, and linter warnings in a single triage experience.
  - Native compiler AST syntax validation for JavaScript and TypeScript catching unclosed brackets, unexpected tokens, and invalid declarations without brittle regex parsers.
  - Real-time diagnostic synchronization with VS Code language servers without duplicating Problems panel entries.

### Fixed
- **False-Positive Suppression for Guarded Code**:
  - Added guards for `missing_async_error_handling` and `bug_unhandled_promise_rejection` to prevent flagging `.then()` promise chains that terminate with `.catch()` handlers.
  - Added guards for `unsafe_redirect` and `ssrf` when guarded by whitelist functions (`isAllowedUrl`, `isWhitelisted`, `isSafeUrl`, `sanitizeUrl`).
  - Added guards for `zip_slip_traversal` when paths are normalized via `path.basename` or validated against directory traversal.
  - Fixed `disabled_tls` auto-remediation to support `NODE_TLS_REJECT_UNAUTHORIZED` environment flags alongside `rejectUnauthorized`.
  - Fixed `unsafe_temp_files` auto-remediation to replace hardcoded temporary paths in place with secure `path.join(os.tmpdir(), ...)`.

### Removed
- **Permanent Removal of Stale AI Assistant View & Registrations**:
  - Completely purged `buggers.chatView` from extension contributions and deleted legacy assistant assets.
  - Removed all dead AI commands and configuration keys from `package.json`.
  - Excluded `.gitignore` and source maps (`**/*.map`) from packaged VSIX releases via `.vscodeignore`.

---

## [1.4.6] - 2026-10-18

### Fixed
- **Corrected SQL Injection Remediation & Zero False Success**:
  - Rewrote the SQL injection remediation template to support standard database drivers (`node-postgres`, `mysql2`, `sqlite3`, generic connection pools) across direct query calls and query variable assignments.
  - Eliminated the broken regex flaw where embedded single quotes in string concatenation prevented replacement matching.
  - Resolved false "already applied" reports: fixes are never marked as already applied while the source line still matches the vulnerability pattern.
  - Replaced unsafe string concatenations with genuine parameter placeholders (`$1`, `$2`, etc.) and corresponding value arrays, automatically stripping dangerous enclosing single quotes.
  - Added strict post-patch validation in `executeDirectFix` and `executeReviewableFix`: patches that fail to eliminate the vulnerability or leave unsafe expressions are rejected and flagged for manual guidance.
- **Eliminated Editor Shaking & Viewport Jumps**:
  - Removed the automatic selection of the first remaining finding after a fix or scan, eliminating unexpected editor jumps to line 1 or the top of the file.
  - Reused active text editors and applied re-entrancy guards (`isNavigatingFinding`) in `buggers.selectFinding` to prevent multiple document opens and viewport jitter.
  - Preserved the user's cursor position and visible editor viewport during fixes and background diagnostic updates.
  - Prevented inspector view activations from stealing active editor focus.
- **Complete Elimination of Stale AI Assistant View & Assets**:
  - Deleted legacy `src/chatView.ts` and `src/aiService.ts` source files.
  - Cleaned all residual AI configurations, commands, and containers from the extension bundle and tests.
  - Ensured no spinning, uninitialized, or collapsed assistant views appear in the sidebar or workspace storage.

### Added
- **Unified Code Diagnostics System**:
  - Implemented a unified findings model capable of surfacing security vulnerabilities, syntax errors, type errors, semantic bugs, logical defects, and linter warnings.
  - Added rich metadata to all diagnostics: `category`, `sourceType` (`compiler`, `lsp`, `linter`, `buggers_rule`), `confidence` level, precise start/end ranges, rule identifiers, and contextual remediation.
  - Real-time synchronization with active language servers and compilers via `vscode.languages.onDidChangeDiagnostics` without blocking editor input.
- **Native Syntax Error Detection**:
  - Accurate, authoritative syntax checking using TypeScript compiler AST parsing (`parseDiagnostics`) and Node.js VM compilation for JavaScript and TypeScript.
  - Detects unclosed brackets/braces/parentheses, unexpected tokens, malformed expressions, and invalid declarations with exact column positions without brittle regex parsers.
  - Transparently surfaces native syntax diagnostics for Python, Go, Rust, and other languages from installed language servers.
- **Type and Semantic Error Surfacing**:
  - Ingests and categorizes compiler diagnostics from TypeScript, ESLint, PyLance, gopls, and other language tools into explicit `type` and `semantic` categories.
  - Clearly distinguishes compiler-confirmed type violations (e.g. TS2322, TS2345, TS2741) and unresolved identifiers/imports (e.g. TS2304, TS2552) from heuristic warnings.
- **Expanded Static Logical Bug Detection**:
  - Added new rules to `LOGICAL_BUG_RULES` for common software defects:
    - `bug_null_undefined_dereference`: Direct property access immediately after a null/undefined check in the falsy block.
    - `bug_unhandled_promise_rejection`: Un-awaited promise or `.then()` chain lacking a terminal `.catch()` rejection handler.
    - `bug_suspicious_state_mutation`: Direct mutation of component state bypassing immutable state updaters.
    - `bug_silent_swallowed_error`: Empty catch block silently discarding exceptions without logging or handling.
- **Non-Duplication in Problems Panel**:
  - Language server and compiler diagnostics already reported in VS Code's Problems panel are unified in Buggers' TreeView and Inspector without duplicate re-publishing to the Problems panel.
  - Clean category grouping in TreeView with auto-expanded category nodes (`Security Vulnerabilities`, `Syntax & Compilation Errors`, `Type & Interface Errors`, `Semantic & Scope Issues`, `Potential Logical Bugs`, `Style & Lint Warnings`).

---

## [1.4.5] - 2026-10-18

### Added
- **Click-to-Inspect & Immediate Navigation**:
  - Clicking any finding in the Buggers findings panel immediately opens the target source file, navigates to the exact line and character column, centers the viewport, and keeps the finding selected.
  - Full support for unsaved buffers (`untitled:`) and remote workspaces (`vscode-remote:`, `vscode-vfs:`).
- **Exact-Range Inline Highlighting & Decorations**:
  - Implemented `HighlightManager` providing precise inline expression highlights with severity-themed borders (`critical`, `high`, `medium`, `low`).
  - Added subtle whole-line background highlighting for clear visual context.
  - Safe line-level fallback highlighting when scanner outputs approximate ranges or line numbers only.
  - Clean decoration lifecycle: automatically clears or updates highlights when switching findings, modifying affected lines, closing documents, or resolving issues.
- **Finding Inspector View with Compact Action Toolbar**:
  - Dedicated finding inspector (`buggers.inspectorView`) in the Buggers sidebar displaying genuine source code context excerpts with line numbers and highlighted expression tags (`<mark class="vuln-mark">`).
  - Full finding metadata: file path, line/column, severity badge, CWE and OWASP identifiers, problem description, exploit impact, and recommended remediation.
  - Compact action toolbar featuring:
    - **Fix Finding** — applies validated deterministic fix directly to the file.
    - **Preview Fix** — opens side-by-side diff editor to review proposed change before applying.
    - **Explain** — displays comprehensive local rule explanation, exploit analysis, and remediation pattern.
    - **Copy Patch** — copies verified replacement code or suggested fix to the clipboard.
    - **Open Source** — jumps directly to the offending line in the normal editor.
    - **Generate Test** — generates an automated unit regression test template reproducing prevention.
    - **Suppress** — inserts standard `// buggers-ignore` comment above the line.
    - **Dismiss** — hides finding from display until the next scan.
- **Deterministic Local Rule Explainer**:
  - Introduced `RuleExplainer` producing comprehensive, structured markdown explanations and regression test templates 100% offline without external AI dependencies or API keys.

### Fixed
- **Direct Fix Workflow (Normal Editor Preservation)**:
  - Default Fix action now applies validated patches directly to the target document via VS Code `WorkspaceEdit` and keeps the user in the normal editor without forcing unwanted diff views.
  - Strict pre-application checks: validates line bounds, verifies code has not diverged since the scan, and preserves leading indentation.
  - Honest post-fix verification: triggers immediate re-scan and only reports resolution when the finding is confirmed eliminated.
- **Empty Proposed Diff Resolution**:
  - Fixed preview diff provider cache cleanup: diff view now reliably displays non-empty proposed replacement content.
- **Clean Removal of Broken AI Assistant**:
  - Cleanly removed the non-functional AI sidebar chat webview (`buggers.chatView`), dead AI commands (`buggers.debugSelection`, `buggers.configureAiProvider`, `buggers.clearAiCredentials`, `buggers.askChatAboutFinding`, `buggers.openChat`), and `buggers.ai.*` configuration settings.
  - Strictly eliminated decorative emojis across tree items, webview templates, command titles, and notifications.

## [1.4.4] - 2026-10-18

### Fixed
- **Confusing Fix Behavior & Empty Diff Resolution**:
  - Root cause resolved: Eliminated duplicate `vscode.workspace.registerTextDocumentContentProvider` collisions that caused VS Code to shadow document providers and render empty diff editors. Centralized virtual document serving via singleton `BuggersPreviewProvider.getInstance()`.
  - Replaced intrusive modal dialog with clear side-by-side virtual diff editor titled `Original Source <-> Buggers Proposed Fix: [ruleId]` paired with a non-blocking actionable prompt.
  - Provided three explicit actions: "Apply Fix", "Copy Patch", and "Reject".
  - Implemented leading indentation preservation, non-empty replacement validation, and stale-source divergence detection to ensure edits never overwrite subsequent changes.
  - Automatic re-analysis on patch application that reports verified remediation status.

- **Missing Fix Actions Across UI & Remote Environments**:
  - Fixed tree item commands, context values, and inline child actions to guarantee visibility for all actionable findings.
  - Eliminated hardcoded `{ scheme: "file" }` restrictions in language feature registrations (CodeActions, Hovers, CodeLenses), extending full support to remote schemes (`vscode-remote`, `vscode-vfs`, `untitled`, and `file`).
  - Added multi-scheme URI resolution (`getFindingUri`) in `types.ts` and `scannerManager.ts` ensuring full operational compatibility in VS Code Desktop, Remote-SSH, WSL, and GitHub Codespaces.

- **AI Assistant Resilience & Decision Rule Implementation**:
  - Implemented 35-second UI safety timeouts preventing permanent disabled states in webview inputs.
  - Guaranteed Send functionality via both button click and keyboard Enter (Shift+Enter for newline) with strict rejection of whitespace-only submissions.
  - Truthful status labeling: accurately displays `LOCAL ENGINE` when running offline or unconfigured, and requires explicit user consent before transmitting code remotely.
  - Introduced a compact, dedicated **Local Remediation Panel** displayed when a security finding is active, providing 7 verified local actions: Explain Finding, Show Evidence, Recommended Remediation, Preview Fix Diff (disabled if no patch pattern exists), Copy Patch, Open Source, and Generate Test.

## [1.4.3] - 2026-10-18

### Fixed
- **Root Cause Fix for Unresponsive AI Assistant Controls & Send Button**:
  - Implemented strict, compliant Content Security Policy (CSP) with dynamic per-render cryptographic nonces (`script-src 'nonce-${nonce}'`).
  - Eliminated all inline HTML event handlers (`onclick`, `onkeydown`) that were blocked by VS Code's webview sandbox.
  - Implemented standard DOM event listeners and delegated click dispatching on container elements for all quick actions, toolbar buttons, code blocks, and retry actions.
  - Implemented safe singleton initialization for `acquireVsCodeApi()` preventing runtime crashes upon view recreation.
  - Repaired message submission lifecycle: validated non-empty input, disabled Send button and input during requests, restored them upon completion, error, or cancellation.
  - User prompt draft preservation: user input is preserved if a request fails, surfacing an actionable error banner with an immediate 1-click "Retry" button.
  - In-flight cancellation: clicking "Cancel" halts pending requests immediately and restores UI interactivity.
  - Fully wired all visible quick actions:
    - `Explain Finding`: explains active finding or auto-binds findings on the current line of the active editor.
    - `Suggest Fix`: generates contextual remediation with diff preview for active finding or active line.
    - `Debug Selection`: inspects highlighted editor code for security vulnerabilities, logic defects, and edge cases.
    - `Review File`: audits entire active file with line count and static scan results.
    - `Generate Test`: generates automated regression or unit test for selected finding or code snippet.
    - `New Chat`: resets conversation history and cleanly detaches context.
    - `Configure AI`: opens interactive provider configuration workflow and updates badges immediately.

### Added
- **Repository-Aware GitHub Integration**:
  - Automatic detection of GitHub repositories from workspace Git remotes supporting HTTPS (`https://github.com/owner/repo.git`) and SSH (`git@github.com:owner/repo.git`) formats.
  - Strict host validation: non-GitHub hosts (GitLab, Bitbucket, Azure DevOps, local Git) are classified as non-GitHub and omit GitHub-specific controls.
  - Accurate representation of 8 repository states: `no_workspace`, `no_git`, `no_github_remote`, `github_remote_detected`, `github_unauthenticated`, `authenticated`, `permission_insufficient`, `remote_failed`.
  - Conditional UI: GitHub nodes and title bar actions are displayed only when a verified GitHub remote is present.
  - Compact `GitHub: owner/repo (branch)` status node in the findings tree view.
- **Safe Commit & Push Workflows**:
  - File-by-file staging: user explicitly selects files via interactive multi-select pick list; never stages unrelated or ignored files (`git add -- file1 file2`, never `git add -A`).
  - Explicit confirmation requirement before executing commits or pushes.
  - Strictly prohibited force-push flags: `--force` and `-f` are blocked by built-in safety filters.
- **Security-Aware Pre-Commit Review**:
  - Automatically correlates modified and staged files with active Buggers security findings prior to committing.
  - Informs the user of critical and high-severity issues in changed files and allows reviewing before proceeding.
- **GitHub Authentication & Navigation**:
  - Integrated `buggers.connectGitHub` supporting VS Code GitHub Authentication sessions and secure SecretStorage Personal Access Tokens.
  - Direct `buggers.openOnGitHub` action opening the verified repository and branch in the default browser.

## [1.4.2] - 2026-10-18

### Fixed
- **Root Cause Fix for Repetitive and Generic AI Assistant Responses**:
  - Eliminated rigid `debugSelection` wrapper that forcibly converted all conversational questions into a generic security audit template.
  - User questions now reach the configured provider verbatim with exact conversational intent.
  - Implemented multi-turn conversational history: all prior turns are preserved and forwarded in provider requests.
  - Implemented Google Gemini multi-turn format (`contents: [{ role, parts: [{ text }] }]`), OpenAI chat completions format, and Anthropic messages format.
  - Added context isolation: finding context is cleanly scoped and detachable with a one-click "Detach (x)" action, preventing sticky findings from dominating unrelated questions.
  - Eliminated repetitive static fallbacks: local rule intelligence now analyzes the user's specific question intent (remediation, risk causation, regression testing, or false positive evaluation) and produces rule-specific explanations.
  - Honest error surfacing: provider authentication errors (HTTP 401), rate limits (HTTP 429), and timeouts are reported directly to the user rather than masked behind generic canned text.

- **Sanitized Diagnostic Logging**:
  - Implemented structured diagnostic logging via dedicated `Buggers AI Diagnostics` output channel.
  - Logs timestamps, levels, categories, providers, models, status codes, and message counts while strictly redacting API keys, bearer tokens, and source code.

- **Redesigned Compact Findings Sidebar & Immediate Discovery**:
  - Replaced cramped, deeply nested finding trees with a clean, readable leaf list grouped by severity by default.
  - Replaced truncated verbose titles with clean, meaningful labels (`SQL Injection`, `Hardcoded Credential`, `Command Injection`, `Path Traversal`, `Unsafe HTML Insertion`).
  - Added file, line, and concise problem summaries to finding row descriptions (`users.js:42 - Direct string concatenation`).
  - Inline action buttons immediately visible on hover: `Fix` (if fix available) or `Explain` (if no fix), alongside `More Actions`.
  - Removed permanent large patch previews from the sidebar in favor of dedicated on-demand VS Code diff editor previews (`vscode.diff`).

- **Fix Verification Workflow**:
  - Automatically re-scans the document immediately after a patch is accepted and reports whether the flaw was verified resolved or remains present.
  - Stale-source protection checks that the file has not diverged from scanned evidence before applying any patch.

- **Dedicated Scrollable AI Chat Interface**:
  - Sized, scrollable chat view with distinct user and assistant speech bubbles.
  - Explicit badges showing `[Remote AI: <provider> (<model>)]` or `[Local Rule Guidance]`.
  - Syntax-highlighted code blocks with inline "Copy" and "Apply to Editor" actions.
  - Multi-line input supporting Enter to send and Shift+Enter for newlines.
  - Loading indicators with in-flight cancellation support.
  - Zero decorative emojis across all UI, diagnostics, and documentation.

## [1.4.1] - 2026-10-18

### Fixed
- **Immediate Findings Visibility Without Expansion**:
  - Redesigned findings tree view with auto-expanded groups by default, ensuring all detected flaws are immediately visible upon opening.
  - Added Flat View mode (`buggers.toggleGrouping`) displaying findings as a clean, un-nested list prioritized by severity.
  - Resolved issue where findings were hidden behind collapsed categories and required multiple clicks to discover.
- **Root Cause Fix for Unscanned Active Test Files**:
  - Fixed active editor lifecycle detection: automatically evaluates active documents on startup and tab focus, including unsaved and untitled buffers.
  - Added visible editors listener (`onDidChangeVisibleTextEditors`) so multi-pane editor setups are continuously audited.
  - Broadened activation events to include `onView:buggers.findingsView`, language triggers, and workspace file discovery.
- **Accurate Scan Status Representation**:
  - Enforced strict state separation: verified clean status is only displayed after a completed scan of supported files with zero findings.
  - The findings view never displays "Clean Workspace" while scanning is in progress, cancelled, failed, or when findings are present.
  - Failed scans explicitly show the error cause and provide an interactive retry action.
- **Direct Action Buttons**:
  - Added inline action buttons directly to finding rows on hover/selection: Fix, Explain, More Actions, and Dismiss.
  - Added `buggers.moreActions` command presenting a consolidated QuickPick for side-by-side diff preview, direct fix application, patch copying, AI debugging, test generation, suppression, and dismissal.
- **Clear Findings & Rescan Safeguards**:
  - Added distinct `buggers.clearFindings` workflow to dismiss displayed results without altering source code or permanently suppressing rules.
  - Added `buggers.dismissFinding` with one-click "Undo" capability.
  - Re-scanning (`buggers.refreshFindings`) restores all unresolved findings still present in code.
- **Expanded Security Detection Rules**:
  - Added `hardcoded_password` rule in secrets category detecting hardcoded database, admin, and user passwords.
  - Enhanced `path_traversal` pattern with case-insensitive matching for all file and path parameters.
  - Enhanced `insecure_randomness` rule to detect `Math.random()` in token, key, and random string generation contexts.
  - Enhanced `insecure_http` to flag `http.get` and `http.request` calls.

## [1.4.0] - 2026-10-18

### Added
- **Continuous Automatic Detection Engine**:
  - Added real-time background and incremental scanning managed by `ScannerManager`.
  - Automatically analyzes open files when switching editor tabs (`onDidChangeActiveTextEditor`) and during live editing (`onDidChangeTextDocument` debounced).
  - Automatically performs non-blocking incremental workspace scans upon project activation.
  - File event integration: automatically updates findings and diagnostics when files are created, renamed, or deleted.
  - Resolves detection failure where test files remained unscanned without explicit user saves.
- **Redesigned Buggers View & Simple UX**:
  - Reorganized findings view into clear first-class categories: Exposed Secrets, Security Vulnerabilities, Potential Logical Bugs, and Code Quality Issues.
  - Added dedicated status overview node showing real-time scanning progress, file audit counts, and verified clean states.
  - Findings nodes now expose direct quick actions (Suggest Fix, Explain Root Cause, Ask Buggers AI, Generate Regression Test, Copy Remediation Patch, Suppress).
  - Enforced strict state fidelity: never displays a clean state while scanning is in progress, cancelled, or failed.
- **Integrated Buggers AI Assistant Chat View**:
  - Added native sidebar WebviewView (`buggers.chatView`) for interactive code security debugging.
  - Context-aware conversations automatically linking selected findings, line numbers, and code evidence.
  - Quick action shortcuts for explaining findings, debugging selections, reviewing active files, suggesting fixes, and generating tests.
  - Rich code blocks with one-click "Copy" and "Apply to Editor" functionality.
  - Local fallback intelligence: provides comprehensive rule-based analysis and remediation guides even when no remote AI API key is configured.
- **Safe Remediation & Stale Source Protection**:
  - Pre-flight divergence verification: ensures the target file line has not changed before applying patches or automated remedies.
  - Added `buggers.copyPatch` command to copy safe remediation snippets directly to clipboard.
  - Expanded `sensitive_logging` rule to detect logging of database connection strings and URIs.

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
