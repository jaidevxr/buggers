# Buggers — Security & Bug Triage (VS Code Extension)

Official Visual Studio Code extension bringing Buggers' deterministic SAST code review, secret leak prevention, and vulnerability triage directly into your local editor.

---

## ✨ Features

- 🛡️ **In-Editor Security Flaw Detection:** Deterministically flags high-impact OWASP Top 10 vulnerabilities (SQL Injection, Command Injection, SSRF, Path Traversal, Insecure CORS, Side-Channel Timing Attacks, Weak Cryptography, and Eval Injection).
- 🔑 **Real-Time Secret Leak Prevention:** Prevents accidental credential leaks by detecting unencrypted AWS Access Keys, GitHub PATs, OpenAI API keys, Stripe Secret Keys, Private Key blocks, and Database Connection URIs before code is committed or pushed.
- 📋 **Native VS Code Diagnostics:** Flaws and secrets are populated into VS Code's native **Problems panel** (`Ctrl+Shift+M` / `Cmd+Shift+M`) with precise line and column highlighting.
- 🌳 **Buggers Activity Bar View:** Dedicated sidebar view container grouping findings by Severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with 1-click jump to file and line.
- 🔒 **Zero-Trust Privacy & Data Isolation:** Scans files locally in-process without transmitting source code to external servers. Credentials and tokens are stored securely in the OS keychain via `vscode.ExtensionContext.secrets`.
- ⚡ **Auto-Scan on Save:** Automatically verifies open documents upon saving, giving you continuous security feedback while you code.

---

## 🔒 Privacy & Data Isolation Statement

Buggers is designed with a strict **local-first, zero-trust** architecture:

1. **Local In-Process Scanning:** All SAST rules and secret-detection patterns run entirely within your local VS Code process. Your source code, file contents, file paths, and project structure are **never transmitted** to any remote server or third-party service during analysis.
2. **Zero Telemetry / Zero Trackers:** The extension contains no analytics trackers, advertising beacons, or background data collection.
3. **Secure Credential Storage:** Any API tokens or GitHub PATs you provide are stored exclusively in your operating system's native secure credential store (e.g. Windows Credential Manager, macOS Keychain, or Linux Secret Service via `vscode.ExtensionContext.secrets`). They are never stored in plaintext settings, configuration files, or logs.
4. **Outbound Requests:** The extension only initiates an outbound network action when you explicitly execute **Buggers: Open Buggers Dashboard**, which opens your configured dashboard URL in your system's default web browser.

---

## 🚀 Available Commands

Access all commands via the Command Palette (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on macOS):

| Command ID | Display Title | Description |
|---|---|---|
| `buggers.analyzeFile` | **Buggers: Analyze Current File** | Scan the active editor document and populate the Problems panel and findings view. |
| `buggers.analyzeWorkspace` | **Buggers: Analyze Workspace** | Audit up to 1,000 files across the workspace, respecting `.gitignore` and vendor exclusions. |
| `buggers.showFindings` | **Buggers: Show Findings** | Focus the dedicated Buggers sidebar view in the Activity Bar. |
| `buggers.refreshFindings` | **Buggers: Refresh Findings** | Re-scan the active editor file and refresh the diagnostics. |
| `buggers.clearFindings` | **Buggers: Clear Findings** | Clear all active Buggers diagnostics, status bar counts, and tree view items. |
| `buggers.signIn` | **Buggers: Sign In** | Securely save a Buggers API token or GitHub Personal Access Token in the OS keychain. |
| `buggers.signOut` | **Buggers: Sign Out** | Revoke and remove saved credentials from the OS keychain. |
| `buggers.openDashboard` | **Buggers: Open Buggers Dashboard** | Open the Buggers web platform in your default browser. |

---

## ⚙️ Configuration Settings

Configure in VS Code Settings (`Ctrl+,` / `Cmd+,`) under **Extensions > Buggers**:

| Setting | Type | Default | Description |
|---|---|---|---|
| `buggers.autoAnalyzeOnSave` | `boolean` | `true` | Automatically run SAST and secret analysis whenever an active file is saved. |
| `buggers.minimumSeverity` | `string` (`enum`) | `"low"` | Minimum vulnerability severity displayed in the VS Code Problems panel (`critical`, `high`, `medium`, `low`). |
| `buggers.serverUrl` | `string` | `"https://buggers.vercel.app"` | Buggers dashboard and platform URL. |

---

## 🛡️ Supported SAST & Secret Rules

### Security Vulnerabilities (SAST)
- **`sql_injection` (Critical):** Detects dynamic SQL queries constructed via string concatenation or template literals.
- **`command_injection` (Critical):** Detects unsanitized user inputs passed to `child_process.exec` or shell invocations.
- **`insecure_eval` (Critical):** Detects dangerous dynamic code evaluation via `eval()` or `new Function()`.
- **`ssrf` (High):** Flags unvalidated dynamic URLs passed directly to `fetch()`, `axios`, or `http.get`.
- **`path_traversal` (High):** Detects unvalidated path concatenation in filesystem operations (`fs.readFile`, etc.).
- **`timing_attack` (High):** Identifies non-constant-time equality operators (`===`) comparing sensitive tokens or hashes.
- **`insecure_cors` (Medium):** Detects wildcard `Access-Control-Allow-Origin: *` headers with `credentials: true`.
- **`weak_crypto_hash` (Medium):** Identifies legacy cryptographic hashes (`MD5`, `SHA1`) used in security contexts.

### Secret Detection
- **`aws_access_key` (Critical):** AWS Access Key IDs (`AKIA[0-9A-Z]{16}`).
- **`github_pat` (Critical):** GitHub Personal Access Tokens (`ghp_[A-Za-z0-9_]{36}`, `github_pat_...`).
- **`openai_api_key` (Critical):** OpenAI API Keys (`sk-proj-...`, `sk-...`).
- **`stripe_secret_key` (Critical):** Stripe Secret API Keys (`sk_live_[0-9a-zA-Z]{24}`).
- **`private_key` (Critical):** Unencrypted RSA / EC / OpenSSH Private Key headers.
- **`db_connection_uri` (Critical):** Database connection strings containing embedded credentials.

*Note: The scanner automatically masks discovered secrets in all evidence displays to prevent secondary leaks.*

---

## 📦 Local Installation

To install the packaged extension file (`.vsix`) in VS Code:

1. Open the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
2. Click the `...` (More Actions) menu at the top right of the Extensions view.
3. Select **Install from VSIX...**.
4. Choose the `buggers-vscode-1.0.0.vsix` package file.

Alternatively, via the command line:

```bash
code --install-extension buggers-vscode-1.0.0.vsix
```

---

## 🛠️ Building & Packaging from Source

```bash
# Navigate to extension directory
cd extensions/buggers-vscode

# Install development dependencies
npm install

# Compile TypeScript
npm run compile

# Bundle extension with esbuild
npm run build

# Run comprehensive test suite
npm test

# Package VSIX archive
npm run package
```

---

## 📄 License

Proprietary & All Rights Reserved. See [LICENSE](LICENSE) for details.
Copyright © 2026 Jaidev Yadav. All Rights Reserved.
