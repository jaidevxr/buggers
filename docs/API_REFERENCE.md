# Buggers — API & Server Functions Reference

This reference documents all REST endpoints and type-safe TanStack Start Server Functions (`serverFn`) implemented in Buggers.

---

## 1. Nitro REST Endpoints

### 1.1 GitHub Webhook Ingestion
- **Route**: `POST /api/webhooks/github` (Alias: `POST /api/webhook`)
- **Authentication**: HMAC-SHA256 signature verification via `X-Hub-Signature-256` header.
- **Rate Limit**: In-memory IP-based sliding window rate limiter (`10 requests / 60 seconds`).

#### Request Headers
| Header | Description | Required |
| :--- | :--- | :--- |
| `X-GitHub-Event` | Name of the GitHub event (`ping`, `pull_request`, `push`) | Yes |
| `X-Hub-Signature-256` | HMAC-SHA256 signature calculated with `GITHUB_WEBHOOK_SECRET` | Production |
| `X-GitHub-Delivery` | Unique GUID representing the webhook delivery event | Yes |
| `Content-Type` | Must be `application/json` | Yes |

#### Supported Events & Actions
1. **`ping`**:
   - Sent when a webhook is newly created in GitHub settings.
   - Response: `200 OK` with `{ ok: true, message: "Buggers Webhook is alive and connected!", zen, hookId }`.
2. **`pull_request`**:
   - Supported actions: `opened`, `synchronize`, `reopened`.
   - Resolves repository owner against configured Buggers accounts.
   - Performs duplicate detection: if an analysis already exists for the same `head_sha`, the request returns the existing analysis ID without duplicating work.
   - Inserts an analysis record in `queued` state.
   - Sets GitHub commit status to `pending` ("Buggers AI Security Review queued...").
   - Dispatches background pipeline worker `processAnalysis()`.
   - Response: `200 OK` with `{ ok: true, analysisId: "uuid", message: "Buggers analysis queued successfully..." }`.

---

### 1.2 Cron Worker & Stale Job Reaper
- **Route**: `POST /api/cron/worker` or `GET /api/cron/worker`
- **Authentication**: Constant-time SHA-256 digest comparison against `CRON_SECRET` or `CRON_SECRET_PREVIOUS`.
- **Authorization Header**: `Authorization: Bearer <CRON_SECRET>` (or query parameter `?token=<CRON_SECRET>`).

#### Execution Lifecycle
1. **Stale Job Reaping**: Queries analyses in `processing` state whose `heartbeat_at` has not updated in > 5 minutes.
   - If `attempt_count < 3`: Re-queues the analysis with an incremented attempt count and resets worker lease locks.
   - If `attempt_count >= 3`: Marks the analysis permanently as `failed` with diagnostic logs.
2. **Queue Processing**: Queries the oldest `queued` analysis, acquires an atomic lease lock (`lease_expires_at = now + 6 minutes`), and executes `processAnalysis()`.
3. **Response**: `200 OK` with worker telemetry report:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-10-14T08:00:00.000Z",
     "reapedStaleCount": 0,
     "retriedCount": 0,
     "failedCount": 0,
     "processedCount": 1,
     "errors": []
   }
   ```

---

### 1.3 Service Health Check
- **Route**: `GET /api/health`
- **Authentication**: Public.
- **Response**: `200 OK`
  ```json
  {
    "status": "healthy",
    "service": "buggers-security-engine",
    "timestamp": "2026-10-14T08:00:00.000Z",
    "uptimeSeconds": 1420
  }
  ```

---

## 2. TanStack Start Server Functions (`serverFn`)

All server functions are exported from `src/lib/*.functions.ts`. They use TanStack Start's RPC protocol and are protected by the `requireSupabaseAuth` middleware, which validates the client's Bearer JWT and injects `context.userId` and `context.supabase`.

### 2.1 GitHub Connection (`src/lib/github.functions.ts`)

#### `startGitHubConnect`
- **Method**: `POST`
- **Purpose**: Initiates the GitHub OAuth handshake.
- **Process**: Generates a cryptographically secure, signed OAuth state payload (`userId`, `nonce`, `expiresAt`) encrypted with AES-256-GCM.
- **Returns**: `{ authorizationUrl: string }`

#### `completeGitHubConnect`
- **Method**: `POST`
- **Input**: `{ code: string, state: string }`
- **Purpose**: Completes OAuth code exchange. Verifies the state token against the authenticated user ID and replay nonce cache. Exchanges the temporary code for a GitHub access token, encrypts it via AES-256-GCM, and upserts into `app_user_connections`.
- **Returns**: `{ ok: true }`

#### `getGitHubConnection`
- **Method**: `GET`
- **Purpose**: Checks connection status. Calls GitHub `/user` using the decrypted token. Detects token revocations (401/Bad credentials) and marks `reconnect_required: true`.
- **Returns**: `{ connected: boolean, reconnectRequired?: boolean, login?: string, avatarUrl?: string, profileUrl?: string }`

#### `disconnectGitHub`
- **Method**: `POST`
- **Purpose**: Calls GitHub API to revoke the token, then removes the connection record from `app_user_connections`.
- **Returns**: `{ ok: true }`

#### `saveGitHubToken`
- **Method**: `POST`
- **Input**: `{ token: string }`
- **Purpose**: Manually validates and stores a Personal Access Token (PAT).
- **Returns**: `{ ok: true }`

#### `listRepositories`
- **Method**: `GET`
- **Purpose**: Retrieves all repositories the user has access to (owned, collaborated, or organization-affiliated).
- **Returns**: `Array<RepoSummary>` (name, fullName, private, stars, forks, language, defaultBranch, pushedAt)

#### `listPullRequests`
- **Method**: `POST`
- **Input**: `{ repoFullName: string, state?: "open" | "closed" | "all" }`
- **Purpose**: Fetches pull requests for a specific repository.
- **Returns**: `Array<PullRequestSummary>`

---

### 2.2 Analysis Operations (`src/lib/analysis.functions.ts`)

#### `startAnalysis`
- **Method**: `POST`
- **Rate Limit**: 10 calls per minute per user.
- **Input**: `{ repoFullName: string, prNumber: number }`
- **Purpose**: Enqueues an analysis for a pull request. If an analysis already exists for the same commit SHA, reuses the existing row (idempotent).
- **Returns**: `{ analysisId: string, alreadyRunning: boolean }`

#### `runAnalysis`
- **Method**: `POST`
- **Input**: `{ analysisId: string }`
- **Purpose**: Synchronously advances or executes pipeline stages for an analysis. Used for polling and real-time client progression.
- **Returns**: `{ status: "processing" | "completed" | "failed", stage: string }`

#### `getAnalysis`
- **Method**: `POST`
- **Input**: `{ analysisId: string }`
- **Purpose**: Retrieves full analysis telemetry, including risk score, categorical level, signals breakdown, file history, stages, duration, and token cost.
- **Returns**: Full analysis record.

#### `listAnalyses`
- **Method**: `POST`
- **Input**: `{ repoFullName?: string, limit?: number, offset?: number }`
- **Purpose**: Returns paginated analysis history for the current user.

#### `analyzeAllPullRequests`
- **Method**: `POST`
- **Input**: `{ repoFullName: string }`
- **Purpose**: Discovers all open PRs in a repository and enqueues triage analyses for each.

#### `postReportToGitHubPR`
- **Method**: `POST`
- **Input**: `{ analysisId: string }`
- **Purpose**: Formats and posts a markdown triage report comment directly to the pull request on GitHub.

---

### 2.3 Findings & Automated Fixes (`src/lib/findings.functions.ts`)

#### `listFindings`
- **Method**: `GET`
- **Purpose**: Returns all findings across all user repositories with severity, category, confidence, and status.

#### `getFinding`
- **Method**: `POST`
- **Input**: `{ findingId: string }`
- **Purpose**: Retrieves detailed finding information, the associated source code patch, related ticket, and parent analysis.

#### `updateFindingStatus`
- **Method**: `POST`
- **Input**: `{ findingId: string, status: "open" | "fixed" | "dismissed" }`
- **Purpose**: Updates finding resolution state. If updated to `fixed`, automatically marks associated tickets as closed.

#### `createTicketFromFinding`
- **Method**: `POST`
- **Input**: `{ findingId: string, title?: string, priority?: string }`
- **Purpose**: Generates an internal issue ticket linked to the defect.

#### `applyFindingFix`
- **Method**: `POST`
- **Input**: `{ findingId: string, commitMessage?: string }`
- **Purpose**: Automates remediation. Fetches the PR's target branch, retrieves current file blob from GitHub Git Trees API, substitutes the verified fix, creates a new tree and commit, and updates the branch ref.
- **Returns**: `{ ok: true, commitSha: string, commitUrl: string }`

#### `applyBatchFindingFixes`
- **Method**: `POST`
- **Input**: `{ findingIds: string[], commitMessage?: string }`
- **Purpose**: Applies multiple finding remediations across different files in a single atomic Git commit.

---

### 2.4 User Settings (`src/lib/settings.functions.ts`)

#### `getSettings`
- **Method**: `GET`
- **Purpose**: Retrieves notification toggles, minimum confidence filter, and data retention preferences.

#### `saveSettings`
- **Method**: `POST`
- **Input**: Partial `userSettingsSchema` (`notify_high_risk`, `min_confidence`, `store_code_snippets`, etc.).
- **Purpose**: Upserts user configuration into `user_settings`.

#### `deleteMyAnalysisData`
- **Method**: `POST`
- **Purpose**: GDPR data deletion. Purges all tickets, findings, analyses, and notifications belonging to the authenticated user.
