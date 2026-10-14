# Buggers — Deterministic Risk Engine & Security Scanners

This specification details the mathematical model behind Buggers' risk evaluation, the deterministic rules used by our static scanners, and how automated merge quality gates operate.

---

## 1. Deterministic Risk Engine (`risk-engine-1.1.0`)

### 1.1 Guiding Principles
- **Observed Data Grounding**: Every signal is computed directly from observable GitHub repository metadata and diff patches.
- **Zero Fabrication**: If historical data is missing (e.g. newly initialized repository or deleted files), the engine marks the signal as `insufficient_data` and removes its weight from the denominator. This reduces overall confidence rather than inventing numbers.
- **Saturating Mathematical Curves**: Unbounded inputs (such as lines changed or commit counts) pass through a saturating curve:
  $$\text{saturate}(n, \text{mid}) = \frac{n}{n + \text{mid}}$$
  This produces a smooth $[0, 1)$ output where $n = \text{mid}$ contributes exactly $0.5$.

---

### 1.2 Risk Signals & Weight Distribution

The default configuration (`DEFAULT_RISK_CONFIG`) allocates weights across 8 observable signals:

| Signal ID | Label | Kind | Weight | Midpoint / Target | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `change_size` | Change size | Observed | **0.18** | 400 lines | Total additions and deletions across all pull request files. |
| `change_spread`| Files touched | Observed | **0.08** | 12 files | Total count of modified files. Large blast radiuses increase risk. |
| `commit_count` | Commits in PR | Observed | **0.05** | 10 commits | Total commits in pull request branch. High counts indicate churn. |
| `file_churn` | Historical file churn | Derived | **0.20** | 15 commits | Average commits on these files over the prior 90-day window. |
| `defect_history`| Defect-associated history | Derived | **0.20** | Multiplier: 2.0 | Ratio of past commits on these files matching conventional fixes or reverts. |
| `file_age` | File inception age | Derived | **0.05** | 180 days | Age of the youngest changed file. Newly introduced files carry higher churn risk. |
| `test_changes` | Test coverage delta | Observed | **0.09** | 0.33 ratio | Ratio of test files to production code files. Exempts docs and config PRs. |
| `dependency_changes`| Dependency changes | Observed | **0.05** | Penalty: 0.6 | Flags modifications to manifests (`package.json`, `go.mod`, etc.). |
| `ai_findings` | AI review findings | Model | **0.10** | Weighted | Severity-weighted findings validated against real diff hunks. |

---

### 1.3 Score Calculation & Categorical Tiers

1. **Observed Weights Sum**:
   $$W_{\text{observed}} = \sum_{s \in \text{observed}} s.\text{weight}$$
2. **Normalized Score**:
   $$\text{Score} = \text{round}\left( \frac{\sum_{s \in \text{observed}} (s.\text{value} \times s.\text{weight})}{W_{\text{observed}}} \times 100 \right)$$
3. **Confidence Metric**:
   $$\text{Confidence} = \frac{W_{\text{observed}}}{W_{\text{total}}} \times \max\left(0.05, \min\left(1, \frac{\text{filesAnalyzed}}{\text{totalFiles}}\right)\right)$$
4. **Categorical Risk Levels**:
   - **Critical (75–100)**: Unhandled transactions, plaintext secret leaks, broken auth checks, or severe defect density.
   - **High (55–74)**: Missing error boundaries, high historical file churn without accompanying test changes.
   - **Medium (30–54)**: Architectural shifts, multiple modified modules, moderate churn.
   - **Low (0–29)**: Focused updates, documentation, pure configuration, or changes with high test coverage.

---

### 1.4 Conventional Defect History Pattern
The engine scans git log history using the regex:
```regex
/^(?:fix|revert)(?:\([a-zA-Z0-9_.-]+\))?!?:|\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+#\d+|\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+https?:\/\/github\.com\/[^\s]+|^Revert\s+"|^This reverts commit\s+[0-9a-f]{7,40}/i
```
This isolates explicit bug remediation commits while excluding ambiguous keywords.

---

## 2. High-Entropy Secret Scanner

Implemented in `src/server/secretScanner.server.ts`. It parses unified diff added lines (`+`) to prevent committing plaintext credentials:

| Secret Identifier | Pattern Description | Detection Strategy |
| :--- | :--- | :--- |
| **AWS Access Key ID** | `\b(AKIA[0-9A-Z]{16})\b` | Standard 20-character AWS prefix |
| **GitHub Personal Access Token**| `\b(gh[pousr]_[A-Za-z0-9_]{36,255})\b` | GitHub classic and fine-grained PAT prefixes |
| **OpenAI Secret API Key** | `\b(sk-[a-zA-Z0-9_\-]{20,64})\b` | Standard `sk-` prefix with high entropy |
| **Slack Webhooks & Tokens** | `hooks.slack.com/services/...` or `xox[baprs]-...` | Incoming webhook URL or OAuth bot token |
| **Stripe Live Secret Key** | `\b(sk_live_[0-9a-zA-Z]{24,34})\b` | Production Stripe secret key |
| **Google Cloud API Key** | `\b(AIza[0-9A-Za-z\-_]{35})\b` | Standard 39-character GCP API key |
| **Unencrypted Private Keys** | `-----BEGIN (RSA\|EC\|DSA\|OPENSSH\|PGP\|PRIVATE) KEY-----` | Header markers for cryptographic private keys |
| **Database Connection Strings**| `(postgres\|mysql\|mongodb(\+srv)?):\/\/[^\s:@]+:[^\s:@]+@...` | URIs embedding raw usernames and passwords |

---

## 3. Static Application Security Testing (SAST) Scanner

Implemented in `src/server/sastScanner.server.ts`. Scans modified code for OWASP Top 10 vulnerabilities:

1. **Command Injection (Critical)**:
   - Detects `child_process.exec` or `execSync` with template string or variable interpolation.
   - Suggests using `execFile` or `spawn` with argument arrays.
2. **SQL Injection (Critical)**:
   - Detects raw query concatenation or string interpolation (`query("SELECT ... " + id)` or ``query`... ${id}```).
   - Suggests parameterized queries (`$1`) or ORM tagged template literals.
3. **Path Traversal (High)**:
   - Detects `fs.readFile` or `createReadStream` constructed with unsanitized request parameters without `path.resolve` boundary verification.
4. **Server-Side Request Forgery (SSRF) (High)**:
   - Detects `fetch` or `axios` taking arbitrary user-supplied URLs without allowlist validation.
5. **Insecure CORS Wildcard (Medium)**:
   - Detects `Access-Control-Allow-Origin: *` configured simultaneously with `credentials: true`.
6. **Weak Cryptography (Medium)**:
   - Detects outdated hash algorithms (`crypto.createHash("md5")` or `"sha1"`).
7. **Insecure Randomness for Security Tokens (Medium)**:
   - Detects `Math.random()` used to generate session IDs, authentication tokens, or nonces. Suggests `crypto.randomBytes()`.

---

## 4. Quality Gate & Merge Policies

Implemented in `src/lib/security-policy.ts`. Before pull requests merge, Buggers evaluates the overall Quality Gate:

```typescript
export interface SecurityPolicy {
  maxRiskScore: number;                 // Default: 75
  blockOnCritical: boolean;             // Default: true
  blockOnHigh: boolean;                 // Default: true
  blockOnSecretLeaks: boolean;          // Default: true
  blockOnVulnerableDependencies: boolean;// Default: true
}
```

### Evaluation Outcomes
- **Passed (`success`)**: Risk score is below threshold and zero blocked violations were identified. Commit status check is published as green.
- **Blocked (`failure`)**: Pull request violates at least one policy rule. Commit status check is published as failure with explicit rejection reasons (e.g. `Blocked: 1 plaintext secret / credential leak(s) detected`).
