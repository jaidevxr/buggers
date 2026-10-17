<p align="center">
  <a href="https://buggers.dev">
    <img src="https://buggers.dev/icon-192.png" width="96" height="96" alt="Buggers Logo" style="border-radius: 20px;" />
  </a>
</p>

<h1 align="center">Buggers — Security & Code Review</h1>

<p align="center">
  <b>Deterministic In-Editor SAST, Secret Leak Prevention, and Pull Request Triage for Visual Studio Code.</b><br />
  Built by <a href="https://github.com/jaidevxr">Jaidev Yadav (@jaidevxr)</a> with the help of team <b>Khushi Sharma</b>, <b>Madhvi Mishra</b>, and <b>Kumkum</b>.<br />
  Official Extension · Platform: <a href="https://buggers.dev">https://buggers.dev</a> · Documentation: <a href="https://buggers.dev/docs">https://buggers.dev/docs</a>
</p>

<p align="center">
  <a href="https://buggers.dev"><img src="https://img.shields.io/badge/Platform-buggers.dev-000000?style=flat-square&logo=vercel" alt="Platform" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=buggers.buggers-vscode"><img src="https://img.shields.io/badge/VS%20Code-v1.2.0-007acc?style=flat-square&logo=visual-studio-code" alt="Marketplace" /></a>
  <a href="https://github.com/jaidevxr/buggers"><img src="https://img.shields.io/badge/GitHub-jaidevxr%2Fbuggers-181717?style=flat-square&logo=github" alt="GitHub" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Proprietary-slate?style=flat-square" alt="License" /></a>
</p>

---

## 📖 Overview

**Buggers for VS Code** brings the precision of Buggers' cloud release intelligence directly into your everyday developer workflow. It continuously inspects your code locally in-process to catch OWASP Top 10 vulnerabilities, code quality risks, and accidental secret exposures before you ever commit or open a pull request.

Whether you're developing backend APIs, smart contracts, microservices, or frontend web applications, Buggers provides deterministic security audits with zero telemetry and zero code exfiltration.

---

## ✨ Features

- 🛡️ **In-Editor Security Flaw Detection:** Deterministically flags high-impact OWASP Top 10 vulnerabilities (SQL Injection, Command Injection, SSRF, Path Traversal, Insecure CORS, Side-Channel Timing Attacks, Weak Cryptography, and Eval Injection).
- 🔑 **Real-Time Secret Leak Prevention:** Prevents accidental credential leaks by detecting unencrypted AWS Access Keys, GitHub PATs, OpenAI API keys, Stripe Secret Keys, Private Key blocks, and Database Connection URIs before code is committed or pushed.
- 📋 **Native VS Code Diagnostics:** Flaws and secrets are populated into VS Code's native **Problems panel** (`Ctrl+Shift+M` / `Cmd+Shift+M`) with precise line and column highlighting.
- 🌳 **Buggers Activity Bar View:** Dedicated sidebar view container grouping findings by Severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with 1-click jump to file and line.
- 🔒 **Zero-Trust Privacy & Data Isolation:** Scans files locally in-process without transmitting source code to external servers. Credentials and tokens are stored securely in the OS keychain via `vscode.ExtensionContext.secrets`.
- ⚡ **Auto-Scan on Save:** Automatically verifies open documents upon saving, giving you continuous security feedback while you code.

---

## ⚡ Quick Start

1. Install **Buggers** from the VS Code Extensions panel (`Ctrl+Shift+X` ➔ search `Buggers`).
2. Open any project workspace containing JavaScript, TypeScript, Python, Go, or configuration files.
3. Save any file or press `Ctrl+Shift+P` and run:
   ```text
   Buggers: Analyze Current File
   ```
4. View detected security issues and masked secrets directly in the **Problems** tab or open the **Buggers** shield icon on the Activity Bar.

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
| `buggers.serverUrl` | `string` | `"https://buggers.dev"` | Buggers dashboard and platform URL. |

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

## 👥 Team & Acknowledgments

Buggers for VS Code was designed and engineered by **[Jaidev Yadav (@jaidevxr)](https://github.com/jaidevxr)** with the help and contributions of team:
- **Khushi Sharma**
- **Madhvi Mishra**
- **Kumkum**

---

## 📄 License

Proprietary & All Rights Reserved. See [LICENSE](LICENSE) for details.
Copyright © 2026 Jaidev Yadav. All Rights Reserved.
