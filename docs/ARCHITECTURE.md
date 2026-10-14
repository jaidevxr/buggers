# Buggers — Architecture Specification

Buggers is a high-assurance code review and security triage platform built with **TanStack Start** (React 19, Vite, TanStack Router with file-based routing, Nitro SSR) and **Supabase** (PostgreSQL with Row Level Security and Supabase Auth).

---

## 1. High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              Client (Browser)                          │
│                                                                        │
│   React 19 · TanStack Router (File Routes) · TanStack React Query      │
│   Supabase Auth Client (localStorage session persistence)              │
│   auth-attacher client middleware → automatically attaches Bearer JWT  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (JSON-RPC serverFn / REST)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       Nitro Server Runtime (Vercel)                    │
│                                                                        │
│   ┌────────────────────────┐  ┌─────────────────────────┐              │
│   │ requireSupabaseAuth    │  │ Sliding Window Rate     │              │
│   │ Middleware (JWT verify)│  │ Limiter (per-user/IP)   │              │
│   └───────────┬────────────┘  └────────────┬────────────┘              │
│               ▼                            ▼                           │
│   ┌─────────────────────────────────────────────────────┐              │
│   │              Server Functions & API Routes          │              │
│   │                                                     │              │
│   │  · /api/webhooks/github  (HMAC-SHA256 signature)    │              │
│   │  · /api/cron/worker      (Constant-time digest auth)│              │
│   │  · /api/health           (Uptime & service health)  │              │
│   │  · analysis.functions    (Triage execution & polling│              │
│   │  · findings.functions    (Remediation & Git Trees)  │              │
│   │  · github.functions      (OAuth, Repos & PR metadata│              │
│   │  · settings.functions    (User security preferences)│              │
│   └───────────────┬─────────────────────────┬───────────┘              │
│                   │                         │                          │
│         ┌─────────▼─────────┐     ┌─────────▼─────────┐                │
│         │   GitHub REST &   │     │  Vercel AI SDK    │                │
│         │   Reviews API     │     │  Provider Chain   │                │
│         │                   │     │  OpenAI / Claude /│                │
│         │  · PR Diffs       │     │  Gemini           │                │
│         │  · Commit History │     │                   │                │
│         │  · Commit Status  │     │  · System boundary│                │
│         │  · Inline Reviews │     │  · Hunk validation│                │
│         │  · Git Trees API  │     │  · Token tracking │                │
│         └───────────────────┘     └───────────────────┘                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQL (Pooler / Service Role)
                         ┌──────────▼──────────┐
                         │  Supabase Postgres  │
                         │  (RLS Enabled)      │
                         │                     │
                         │  Tables:            │
                         │  · profiles         │
                         │  · app_user_conn.   │
                         │  · analyses         │
                         │  · findings         │
                         │  · tickets          │
                         │  · notifications    │
                         │  · user_settings    │
                         └─────────────────────┘
```

---

## 2. Directory Structure

```
buggers/
├── docs/                               # Engineering documentation
│   ├── ARCHITECTURE.md                 # System architecture & component lifecycles
│   ├── SETUP.md                        # Step-by-step infrastructure provisioning
│   ├── API_REFERENCE.md                # Server functions and Nitro REST endpoints
│   ├── RISK_AND_SCANNERS.md            # Risk scoring model, AST, SAST & secret rules
│   └── TROUBLESHOOTING.md              # Diagnostics, error codes & runbook
├── src/
│   ├── components/                     # React UI component library
│   │   ├── brand/                      # Buggers logo, icon marks, wordmarks
│   │   ├── diff/                       # Unified diff viewer & code comparison
│   │   ├── github/                     # GitHub connect cards, PR selector
│   │   ├── layout/                     # AppShell, TopBar, PublicHeader
│   │   ├── status/                     # EmptyState, StatusBadges, RiskMeter
│   │   └── ui/                         # Accessible primitives (Radix UI)
│   ├── hooks/                          # Reusable hooks (e.g. use-mobile)
│   ├── integrations/
│   │   └── supabase/                   # Supabase client, auth middleware, cron auth
│   ├── lib/                            # Shared domain logic (client & server)
│   │   ├── *.functions.ts              # TanStack serverFn definitions
│   │   ├── risk-engine.ts              # Deterministic risk engine (model 1.1.0)
│   │   ├── security-policy.ts          # Merge quality gate evaluation
│   │   ├── validation.ts               # Zod schemas for all requests and inputs
│   │   └── error-reporting.ts          # Console and optional Sentry capture
│   ├── routes/                         # TanStack Router type-safe file routes
│   │   ├── __root.tsx                  # Root layout, theme provider, header shell
│   │   ├── index.tsx                   # Studio landing page
│   │   ├── auth.tsx                    # Google, GitHub, and email sign-in
│   │   ├── docs.tsx                    # Technical documentation portal
│   │   ├── how-it-works.tsx            # Architectural breakdown page
│   │   ├── about.tsx                   # Engineering mission & principles
│   │   ├── oauth/github/return.tsx     # OAuth callback handler
│   │   └── _authenticated/             # Protected workspace routes
│   │       ├── dashboard.tsx           # Global risk telemetry and recent runs
│   │       ├── repositories.*.tsx      # Repository browsers & PR selectors
│   │       ├── analysis.$id.tsx        # In-depth PR triage detail & risk signals
│   │       ├── findings.*.tsx          # Finding registry, triage & automated fix
│   │       ├── tickets.tsx             # Issue tracker integration
│   │       ├── analytics.tsx           # Repository risk trends & metrics
│   │       └── settings.tsx            # Alert webhooks, security policy & tokens
│   ├── server/                         # Server-only modules (never shipped to client)
│   │   ├── aiReview.server.ts          # AI review orchestration & hunk validation
│   │   ├── analysis.server.ts          # 9-stage analysis execution pipeline
│   │   ├── appUserConnections.server.ts# Encrypted OAuth token storage
│   │   ├── connectionKeyCrypto.ts      # AES-256-GCM encryption for credentials
│   │   ├── dependencyScanner.server.ts # Manifest vulnerability & CVE detection
│   │   ├── diffCache.server.ts         # In-memory diff hashing & review cache
│   │   ├── github.server.ts            # GitHub REST client & rate limit handling
│   │   ├── logger.server.ts            # Structured JSON logger
│   │   ├── notificationWebhook.server.ts # Slack & Discord alert dispatcher
│   │   ├── prReviewBot.server.ts       # GitHub Reviews API inline comment bot
│   │   ├── queueWorker.server.ts       # Distributed queue worker & stale reaper
│   │   ├── rateLimit.server.ts         # Sliding window rate limiter
│   │   ├── sastScanner.server.ts       # OWASP Top 10 SAST engine
│   │   ├── secretScanner.server.ts     # High-entropy plaintext credential scanner
│   │   ├── webhook.server.ts           # GitHub Webhook handler
│   │   └── webhookSecurity.server.ts   # HMAC-SHA256 signature verification & sanitization
│   ├── router.tsx                      # TanStack Router configuration
│   ├── server.ts                       # Nitro server entry (REST & SSR dispatch)
│   └── styles.css                      # Tailwind CSS v4 & custom motion tokens
├── supabase-setup.sql                  # Canonical PostgreSQL schema, RLS & RPCs
└── drizzle.config.ts                   # Drizzle ORM schema configuration
```

---

## 3. Core Architectural Subsystems

### 3.1 Authentication & Authorization
Buggers maintains two strictly separated authentication mechanisms:
1. **User Identity (Supabase Auth):**
   - Users authenticate via Google OAuth, GitHub OAuth, or Email/Password managed by Supabase.
   - The client stores the Supabase session in `localStorage`.
   - On every TanStack `serverFn` invocation, the `auth-attacher` client middleware extracts the session access token and attaches it as an `Authorization: Bearer <JWT>` header.
   - The server middleware `requireSupabaseAuth` validates the token via `supabaseAdmin.auth.getUser(token)` and binds `context.userId` and `context.supabase` to the request lifecycle.
2. **GitHub API Authorization (Direct OAuth App):**
   - Independent from the login provider, users connect their GitHub account to permit repository access.
   - The connection uses a dedicated GitHub OAuth App requesting `read:user` and `repo` scopes.
   - OAuth CSRF state is protected by an encrypted, signed nonce with a 10-minute time-to-live (`createOAuthState` / `verifyOAuthState`).
   - GitHub access tokens are encrypted symmetrically at rest using **AES-256-GCM** via `APP_USER_CONNECTION_KEY_SECRET` before insertion into the `app_user_connections` table.
   - Row Level Security (RLS) restricts `app_user_connections` so that `authenticated` users have zero direct read access; only the backend `service_role` can decrypt tokens.

### 3.2 9-Stage Analysis Pipeline
Pull request analysis runs through a durable, staged pipeline implemented in `src/server/analysis.server.ts`:

1. `queued`: Initial queue state inserted by the webhook handler or UI request.
2. `fetching_pr`: Fetches PR metadata (title, body, author, branches, head SHA, additions/deletions) from GitHub REST API.
3. `fetching_commits`: Retrieves the commit history of the pull request to calculate commit frequency and conventional commit markers.
4. `fetching_files`: Downloads changed file patches and unified diffs.
5. `historical_analysis`: Queries the last 90 days of commit history for the modified files on the base branch. Calculates historical churn, defect density (`fix:`, `revert:`, issue closing references), and inception age.
6. `ai_review`:
   - Checks diff cache using SHA-256 diff hash.
   - Prepares prompt containing project context, changed file patches (up to 15 prioritized files), and historical churn notes.
   - Untrusted author metadata is wrapped in strict boundary delimiters.
   - Invokes the configured AI provider (OpenAI, Anthropic Claude, or Google Gemini).
7. `validating_findings`:
   - Runs `validateAiFindings`: verifies that every reported file exists in the diff, the cited line number exists in added/modified hunks, and finding evidence text matches actual diff substrings. Hallucinated findings are mathematically discarded.
   - Runs deterministic static scanners:
     - `scanFilesForSecrets`: scans diff patches for plaintext keys, tokens, and credentials.
     - `scanFilesForSast`: scans diff patches for OWASP Top 10 vulnerabilities.
     - `scanFilesForVulnerableDependencies`: scans manifest modifications for CVEs.
8. `risk_calculation`:
   - Passes observed metrics, file history, and validated findings into `computeRisk()`.
   - Computes weighted score (0–100), categorical risk level, confidence percentage, and top contributing risk factors.
   - Replaces analysis findings atomically in Postgres using the `replace_analysis_findings` stored procedure.
9. `completed`:
   - Finalizes analysis duration, token usage, and estimated AI cost.
   - Evaluates the repository Quality Gate policy.
   - Dispatches a GitHub commit status check (`pending` → `success` / `failure`).
   - Optionally posts inline review comments to the GitHub PR diff via `postPrReviewComments`.
   - Sends real-time Slack/Discord alerts if high/critical risk thresholds are triggered.

### 3.3 Distributed Queue Worker & Stale Reaper
To ensure resilience in serverless environments:
- Analyses include a `heartbeat_at` timestamp refreshed every 60 seconds while processing.
- A distributed lease (`lease_expires_at`, 5 minutes duration) prevents duplicate workers from picking up the same job.
- The cron worker endpoint (`/api/cron/worker`) periodically triggers `reapStaleAnalyses()`:
  - Any analysis in `processing` state without a heartbeat update for > 5 minutes is marked as abandoned.
  - If `attempt_count < max_attempts` (default 3), the job is re-queued with a clear diagnostic message.
  - If attempts are exhausted, the job is permanently failed.

### 3.4 Multi-Provider AI Architecture
Buggers interfaces with language models through the Vercel AI SDK (`ai`), providing provider flexibility and automatic fallback:
- **Primary Providers:** OpenAI (`OPENAI_API_KEY`), Anthropic (`ANTHROPIC_API_KEY`), Google Gemini (`GOOGLE_GENERATIVE_AI_API_KEY`).
- Configured via `AI_PROVIDER` environment variable with optional `AI_MODEL`, `AI_TIMEOUT_MS`, and `AI_MAX_TOKENS` overrides.
- Model candidates cascade cleanly on rate limit or timeout errors without crashing the request.
- Per-analysis token usage (`ai_prompt_tokens`, `ai_completion_tokens`) and estimated costs (`ai_estimated_cost_usd`) are persisted in the database.

---

## 4. Database Schema Overview

All tables are protected by PostgreSQL Row Level Security (RLS) in `supabase-setup.sql`:

| Table | Primary Key | Description | RLS Policy |
| :--- | :--- | :--- | :--- |
| `profiles` | `id` (UUID references `auth.users`) | User profile, GitHub login, avatar, timestamps | `auth.uid() = id` |
| `app_user_connections` | `id` (UUID) | Encrypted OAuth tokens (`connection_key_ciphertext`) | Service role only; no client read |
| `user_settings` | `user_id` (UUID) | Security thresholds, notification preferences | `auth.uid() = user_id` |
| `analyses` | `id` (UUID) | Analysis run records, PR metadata, risk score, stages | `auth.uid() = user_id` |
| `findings` | `id` (UUID) | Identified defects, line citations, severity, fixes | `auth.uid() = user_id` |
| `tickets` | `id` (UUID) | Tracked work items linked to findings | `auth.uid() = user_id` |
| `notifications` | `id` (UUID) | In-app alerts for completed or high-risk analyses | `auth.uid() = user_id` |

---

## 5. Security & Threat Mitigations

1. **Prompt Injection Defense:** Pull request titles and bodies are classified as untrusted input, enclosed in strict system delimiter blocks, and parsed as inert author text.
2. **Hallucination Rejection:** Every finding must cite a line present in the actual Git diff hunk. The system drops any finding citing lines outside the diff patch.
3. **AES-256-GCM Credential Encryption:** GitHub tokens and OAuth state nonces are encrypted using authenticated symmetric encryption with unique 12-byte IVs.
4. **Sliding Window Rate Limiting:** Enforces per-user request limits on resource-intensive endpoints (`startAnalysis`, `runAnalysis`) and per-IP limits on webhook ingestion.
5. **HMAC-SHA256 Webhook Verification:** Verifies GitHub webhook payloads against `GITHUB_WEBHOOK_SECRET` before parsing JSON.
