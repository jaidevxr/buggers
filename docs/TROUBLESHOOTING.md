# Buggers — Troubleshooting & Operations Runbook

This guide contains diagnostic steps and remediations for common operational scenarios.

---

## 1. GitHub Connection & Authorization

### 1.1 "GitHub authorization expired. Reconnect your account."
- **Symptom**: User receives an authorization warning when attempting to list repositories or run triage.
- **Root Cause**: The GitHub OAuth token was revoked by the user, expired, or access permissions were modified in GitHub settings.
- **Remediation**:
  1. In the Buggers navigation, go to **Settings → GitHub Connection**.
  2. Click **Disconnect Account**.
  3. Click **Connect GitHub** to re-authorize. The system will issue a fresh OAuth token and re-encrypt it in `app_user_connections`.

### 1.2 "GitHub API rate limit reached"
- **Symptom**: Requests fail with HTTP 403 or 429 from GitHub API.
- **Root Cause**: GitHub OAuth tokens permit 5,000 API requests per hour per authenticated user.
- **Remediation**:
  - The worker automatically extracts the `x-ratelimit-reset` header and schedules backoff delays.
  - To minimize API consumption, Buggers caches unified diffs using SHA-256 hashes (`diffCache.server.ts`) and limits historical commit sampling to 10 files per PR.

### 1.3 Private Repositories Not Appearing in List
- **Symptom**: User can view public repositories, but private repositories are missing.
- **Root Cause**: The OAuth app was granted `public_repo` instead of the full `repo` scope, or organization SAML single sign-on (SSO) was not authorized.
- **Remediation**:
  - Verify that `GITHUB_SCOPES` includes `repo` in `src/server/github.server.ts`.
  - In GitHub, go to **Settings → Applications → Authorized OAuth Apps → Buggers** and verify that access has been granted for your organization.

---

## 2. Webhook Ingestion & Signature Verification

### 2.1 HTTP 401 "Invalid webhook signature"
- **Symptom**: GitHub Webhooks delivery shows HTTP 401 failure.
- **Root Cause**: The signature computed from `X-Hub-Signature-256` does not match the HMAC-SHA256 digest of the raw request payload using `GITHUB_WEBHOOK_SECRET`.
- **Remediation**:
  1. Confirm that `GITHUB_WEBHOOK_SECRET` is set in your server environment (`.env`).
  2. In your GitHub repository settings under **Webhooks**, ensure the **Secret** field exactly matches the environment variable.
  3. Ensure no reverse proxy or middleware has modified or parsed the raw HTTP body before signature verification.

### 2.2 HTTP 404 "No authenticated Buggers user found configured for repo"
- **Symptom**: Webhook returns 404 for an incoming pull request event.
- **Root Cause**: Buggers isolates multi-tenant data. The incoming webhook repository has not yet been linked to an authenticated user account.
- **Remediation**:
  - Log in to the Buggers dashboard with your account and navigate to the repository once, or run a manual analysis. This links the repository ownership to your user ID.

### 2.3 HTTP 429 "Rate limit exceeded"
- **Symptom**: Rapid webhook deliveries receive HTTP 429 responses.
- **Root Cause**: In-memory IP rate limiting (`10 requests / 60 seconds`) prevents denial-of-service floods.
- **Remediation**: GitHub will automatically retry deliveries according to its exponential backoff schedule.

---

## 3. Analysis Pipeline & Queue Worker

### 3.1 Analysis Stuck in "Processing" State
- **Symptom**: Analysis remains in `processing` stage for more than 5 minutes.
- **Root Cause**: The serverless lambda executing `processAnalysis` may have timed out or crashed due to upstream API latency.
- **Remediation**:
  - The analysis heartbeat updates every 60 seconds with a 5-minute lease duration (`lease_expires_at`).
  - Trigger the stale job reaper manually or wait for the scheduled cron run:
    ```sh
    curl -X POST https://buggers.dev/api/cron/worker \
      -H "Authorization: Bearer <CRON_SECRET>"
    ```
  - The reaper detects the expired lease, re-queues the job, and increments `attempt_count` (up to 3 retries).

### 3.2 High "AI Findings Rejected" Count in Analysis History
- **Symptom**: Telemetry indicates `ai_rejected > 0`.
- **Root Cause**: The AI model attempted to report a finding on a file or line number that does not exist in the actual Git diff patch.
- **Explanation**: This is expected security behavior. Buggers' `validateAiFindings` filter mathematically drops hallucinated citations to guarantee zero phantom line references.

---

## 4. AI Provider Connectivity & Fallbacks

### 4.1 "All AI model candidates failed"
- **Symptom**: Review logs show fallback attempts failing across providers.
- **Root Cause**: Missing or invalid API key for the configured provider (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`), or provider billing quota exhausted.
- **Remediation**:
  1. Verify provider key validity and account credits.
  2. Even when AI providers fail, Buggers' deterministic static scanners (Secrets, SAST, Dependencies, Churn, Defect History) continue executing and provide risk scores with `aiAvailable: false`.

---

## 5. Telemetry & Log Inspection

### 5.1 Structured JSON Logs
Buggers outputs structured JSON logs for all server operations:
```json
{
  "timestamp": "2026-10-14T08:00:00.000Z",
  "level": "info",
  "message": "analysis_completed",
  "analysisId": "e5812854-...",
  "stage": "completed",
  "durationMs": 3420,
  "tokens": { "promptTokens": 1820, "completionTokens": 240, "totalTokens": 2060 },
  "costUsd": 0.00695,
  "riskScore": 68,
  "riskLevel": "high",
  "findingsCount": 2,
  "findingsRejected": 0
}
```

### 5.2 Client-Side Diagnostics
Open browser developer tools (Console tab). All client exceptions are routed through `reportError()`. If `VITE_SENTRY_DSN` is configured, errors are also mirrored to your Sentry dashboard.
