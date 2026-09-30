# Architecture

Buggers is a full-stack TypeScript application built with TanStack Start (React + Vite + Nitro SSR) and Supabase (Postgres + Auth).

## High-Level Diagram

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│  React (TanStack Router) + Supabase Auth        │
│  └─ auth-attacher middleware → Bearer token     │
└───────────────────┬─────────────────────────────┘
                    │ HTTPS (serverFn RPCs)
┌───────────────────▼─────────────────────────────┐
│              Nitro Server (Vercel)               │
│                                                  │
│  ┌─────────────┐  ┌──────────────┐              │
│  │ auth-middle  │  │ rate-limiter │              │
│  │ ware (JWT)   │  │ (per-user)   │              │
│  └──────┬──────┘  └──────┬───────┘              │
│         ▼                ▼                       │
│  ┌──────────────────────────────────┐           │
│  │        Server Functions          │           │
│  │  analysis · findings · github    │           │
│  │  settings · connections          │           │
│  └────────┬─────────┬──────────────┘            │
│           │         │                            │
│     ┌─────▼───┐ ┌───▼──────┐                   │
│     │ GitHub  │ │ AI       │                    │
│     │ REST    │ │ Provider │                    │
│     │ API     │ │ (Vercel  │                    │
│     │         │ │  AI SDK) │                    │
│     └─────────┘ └──────────┘                    │
└───────────────────┬─────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Supabase Postgres  │
         │  (RLS-protected)    │
         │                     │
         │  Tables:            │
         │  · profiles         │
         │  · analyses         │
         │  · findings         │
         │  · app_user_conn.   │
         │  · user_settings    │
         │  · tickets          │
         │  · notifications    │
         └─────────────────────┘
```

## Directory Structure

```
src/
├── components/          # React UI components
│   ├── brand/           # Logo / wordmark
│   ├── diff/            # Diff viewer
│   ├── github/          # GitHub connect card, PR list
│   ├── layout/          # AppShell, PageHeader
│   ├── status/          # EmptyState, StatusBadges
│   └── ui/              # shadcn/ui primitives
├── hooks/               # React hooks (use-mobile)
├── integrations/
│   └── supabase/        # Supabase client, auth middleware, cron auth
├── lib/                 # Shared logic
│   ├── *.functions.ts   # TanStack serverFn definitions (client+server)
│   ├── risk-engine.ts   # Deterministic risk scoring
│   ├── validation.ts    # Zod schemas
│   ├── error-reporting  # Generic error capture
│   └── github-connect-client.ts  # OAuth flow client-side
├── routes/              # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout
│   ├── auth.tsx         # Sign-in page
│   ├── index.tsx        # Landing page
│   ├── oauth/github/    # GitHub OAuth callback
│   └── _authenticated/  # Protected routes (dashboard, analysis, etc.)
├── server/              # Server-only modules (never shipped to client)
│   ├── aiReview.server.ts         # AI review orchestration
│   ├── analysis.server.ts         # Analysis pipeline / queue
│   ├── appUserConnections.server  # GitHub token storage
│   ├── connectionKeyCrypto.ts     # AES-256-GCM encryption
│   ├── github.server.ts           # Direct GitHub REST client
│   ├── logger.server.ts           # Structured JSON logging
│   └── rateLimit.server.ts        # Sliding window rate limiter
├── router.tsx           # Router configuration
├── server.ts            # Nitro server entry
└── start.ts             # TanStack Start entry
```

## Key Design Decisions

### Authentication
- **Client:** Supabase Auth with `localStorage` for session persistence.
- **Server:** `requireSupabaseAuth` middleware validates the JWT from the `Authorization` header on every serverFn call. The `auth-attacher` middleware on the client automatically attaches the bearer token.
- **Cron:** Separate `authenticateCronRequest` using SHA-256 digest comparison with constant-time equality and rotation support.

### GitHub Integration
- Direct OAuth flow with encrypted CSRF state tokens (AES-256-GCM).
- GitHub tokens are stored encrypted in Supabase (`app_user_connections` table) using `APP_USER_CONNECTION_KEY_SECRET`.
- API calls use the user's own OAuth token, respecting GitHub's per-token rate limits.

### AI Review
- `StandaloneAiProvider` supports OpenAI, Anthropic, and Google via the Vercel AI SDK.
- Provider selection via `AI_PROVIDER` env var with graceful fallback when unconfigured.
- Prompt injection defense: untrusted PR content is delimited and validated.
- All AI findings are verified against actual diff hunks before persisting.

### Risk Engine
- Pure deterministic scoring: no AI dependency for the risk score itself.
- Signals: file churn, complexity, author history, test coverage, commit patterns, AI findings.
- Each signal produces a weighted score; the aggregate determines the risk tier.

### Durable Job Flow
- Postgres-backed queue with `status` lifecycle (`pending` → `processing` → `completed` / `failed`).
- Heartbeat/lease mechanism detects crashed runs.
- Reaper marks stuck analyses (processing > N minutes) as failed.
- Transactional findings upsert via Postgres function — no partial data on crash.

### Error Handling
- Client: `reportError()` logs to console; optionally captures to Sentry when `VITE_SENTRY_DSN` is set.
- Server: structured JSON logs with `analysis_id`, `stage`, `duration_ms`, and error stack traces.
