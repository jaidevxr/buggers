# Buggers — Setup & Deployment Guide

This guide covers everything required to deploy Buggers on your own infrastructure or run it locally for development.

---

## Prerequisites

- **Node.js**: `v20.x` or higher (LTS recommended)
- **npm**: `v10.x` or higher
- **Supabase Account**: For PostgreSQL database, Row Level Security, and user authentication
- **GitHub Account**: For creating an OAuth App (to inspect repositories and post review statuses)
- **AI Provider API Key**: OpenAI, Anthropic, or Google Gemini API key

---

## 1. Supabase Infrastructure Setup

### 1.1 Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com) and navigate to the Dashboard.
2. Click **New project**, select an organization, name your project (e.g. `buggers-prod`), configure a secure database password, and choose your hosting region.
3. Allow approximately 1 minute for the database instance to provision.

### 1.2 Retrieve API Credentials
1. In your Supabase project dashboard, navigate to **Project Settings → API**.
2. Note the following values for your `.env` file:
   - **Project URL** → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon / public key** → `SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role key** (Secret) → `SUPABASE_SERVICE_ROLE_KEY`

> [!WARNING]
> The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security. Never commit it to version control or expose it to client-side code (`VITE_*`).

### 1.3 Apply the Database Schema & RLS Policies
You can initialize the database using either the SQL Editor or Drizzle ORM:

**Option A: SQL Editor (Recommended)**
1. Open the **SQL Editor** in your Supabase dashboard.
2. Copy the entire contents of [`supabase-setup.sql`](../supabase-setup.sql) from the repository root.
3. Paste it into the editor and click **Run**.
4. Verify that tables (`profiles`, `analyses`, `findings`, `tickets`, `notifications`, `app_user_connections`, `user_settings`) and stored procedures (`replace_analysis_findings`) have been created.

**Option B: Drizzle Push**
1. Copy your pooled PostgreSQL connection string from **Project Settings → Database → Connection String → URI**.
2. Run the migration command:
   ```sh
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" npx drizzle-kit push
   ```

### 1.4 Configure Supabase Auth Redirects
1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to `https://buggers.dev`.
3. Add the following to **Redirect URLs**:
   - `http://localhost:8080/**`
   - `http://localhost:8081/**`
   - `https://buggers.dev/**`
   - `https://www.buggers.dev/**`
4. Enable your preferred sign-in providers under **Authentication → Providers** (Google, GitHub, and/or Email).

---

## 2. GitHub OAuth App Setup (API Access)

Buggers connects to GitHub via a dedicated OAuth App to read repository pull requests and post automated review feedback.

### 2.1 Register the OAuth Application
1. Go to your GitHub account **Settings → Developer settings → OAuth Apps** ([github.com/settings/developers](https://github.com/settings/developers)).
2. Click **New OAuth App** (or select your existing App).
3. Fill in the application details:
   - **Application name**: `Buggers Security Triage`
   - **Homepage URL**: `https://buggers.dev`
   - **Authorization callback URL**: `https://buggers.dev/oauth/github/return` (or `http://localhost:8080/oauth/github/return` for local testing)
4. Click **Register application** (or **Update application**).
5. Copy the **Client ID** → set as `GITHUB_CLIENT_ID` in `.env`.
6. Click **Generate a new client secret** → copy it → set as `GITHUB_CLIENT_SECRET` in `.env`.

> [!NOTE]
> GitHub OAuth Apps only support a single callback URL. For local and production environments, either create two separate OAuth Apps or configure `GITHUB_OAUTH_CALLBACK_URL` in `.env.local` to override the callback URL.

### 2.2 Scopes Requested
Buggers requests:
- `read:user`: To display the connected account's GitHub username and avatar.
- `repo`: To fetch pull request diffs, inspect commit history, and publish inline review comments and commit status checks.

---

## 3. Cryptographic Key Generation

Buggers encrypts all stored GitHub tokens at rest using AES-256-GCM.

Generate a 32-byte base64-encoded secret key:
```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Set the output as `APP_USER_CONNECTION_KEY_SECRET` in your `.env`.

---

## 4. AI Provider Configuration

Buggers uses the Vercel AI SDK to orchestrate pull request code reviews. Select at least one supported provider:

| Provider | `AI_PROVIDER` | Environment Variable | Key Format |
| :--- | :--- | :--- | :--- |
| **OpenAI** (Default) | `openai` | `OPENAI_API_KEY` | `sk-...` |
| **Anthropic Claude** | `anthropic` | `ANTHROPIC_API_KEY` | `sk-ant-...` |
| **Google Gemini** | `google` | `GOOGLE_GENERATIVE_AI_API_KEY` | `AIza...` |

Optional tuning parameters:
```env
AI_MODEL="gpt-4o"            # Override default model identifier
AI_TIMEOUT_MS="60000"         # Maximum provider request timeout (default 60s)
AI_MAX_TOKENS="8192"          # Maximum output token budget
```

---

## 5. Webhook Ingestion Configuration

To automatically trigger analyses whenever a pull request is opened or updated:

1. Generate a secure random webhook secret:
   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Set the secret as `GITHUB_WEBHOOK_SECRET` in `.env`.
3. In your GitHub repository or organization settings, go to **Webhooks → Add webhook**:
   - **Payload URL**: `https://buggers.dev/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Paste the same secret configured in `GITHUB_WEBHOOK_SECRET`
   - **Which events would you like to trigger this webhook?**: Select **Let me select individual events** and check **Pull requests** and **Pushes**.
4. Click **Add webhook**.

---

## 6. Cron Worker Setup (Stale Job Reaper)

To ensure analyses that abort unexpectedly are automatically re-queued:

1. Generate a cron secret:
   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Set `CRON_SECRET` in `.env`.
3. Configure a recurring job (e.g. Vercel Cron or GitHub Actions) to call `/api/cron/worker` every 5–10 minutes:
   ```sh
   curl -X POST https://buggers.dev/api/cron/worker \
     -H "Authorization: Bearer <CRON_SECRET>"
   ```
4. **Secret Rotation Support**: To rotate secrets with zero downtime, configure `CRON_SECRET_PREVIOUS` alongside `CRON_SECRET`. The worker endpoint verifies requests using constant-time digest comparison against both secrets.

---

## 7. Security Alert Webhooks (Slack / Discord)

To receive real-time notifications when a pull request fails the Quality Gate or contains critical vulnerabilities:

Set `ALERT_WEBHOOK_URL` in `.env`:
```env
# Slack Incoming Webhook
ALERT_WEBHOOK_URL="https://hooks.slack.com/services/T00/B00/XXXXX"

# Discord Webhook
ALERT_WEBHOOK_URL="https://discord.com/api/webhooks/12345/XXXXX"
```

---

## 8. Complete `.env` Specification

Create your `.env` file based on `.env.example`:

```env
# ─── Supabase Database & Auth ──────────────────────────────
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."

# ─── GitHub OAuth Connection ───────────────────────────────
GITHUB_CLIENT_ID="Ov23li..."
GITHUB_CLIENT_SECRET="abc123..."
# GITHUB_OAUTH_CALLBACK_URL="http://localhost:8080/oauth/github/return"

# ─── Webhook HMAC Secret ───────────────────────────────────
GITHUB_WEBHOOK_SECRET="hex-encoded-secret..."

# ─── Connection Encryption Key (32 bytes base64) ───────────
APP_USER_CONNECTION_KEY_SECRET="base64-32-byte-secret..."

# ─── AI Provider Configuration ─────────────────────────────
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
# ANTHROPIC_API_KEY="sk-ant-..."
# GOOGLE_GENERATIVE_AI_API_KEY="..."

# ─── Cron Authentication ───────────────────────────────────
CRON_SECRET="hex-encoded-secret..."
# CRON_SECRET_PREVIOUS="old-secret-during-rotation"

# ─── Real-Time Alerts (Optional) ───────────────────────────
# ALERT_WEBHOOK_URL="https://hooks.slack.com/services/..."

# ─── Error Telemetry (Optional) ────────────────────────────
# VITE_SENTRY_DSN="https://xxxx@o0.ingest.sentry.io/0"
```

---

## 9. Running Locally

```sh
# 1. Install dependencies
npm install

# 2. Run TypeScript type check
npm run typecheck

# 3. Execute unit and integration tests
npm run test

# 4. Launch development server
npm run dev
```

The application will be accessible at [http://localhost:8080](http://localhost:8080) (or `http://localhost:8081` if port 8080 is occupied).

---

## 10. Production Deployment (Vercel)

Buggers is pre-configured for Vercel deployment with TanStack Start and Nitro:

1. Push your repository to GitHub.
2. In Vercel, click **Add New → Project** and import the repository.
3. In **Settings → Environment Variables**, add every variable from your `.env` file.
4. Deploy the project.
5. After deployment, update:
   - Supabase **Redirect URLs** to include your Vercel production domain.
   - GitHub OAuth App **Authorization callback URL** to `https://<your-domain>/oauth/github/return`.
   - GitHub Webhook URL to `https://<your-domain>/api/webhooks/github`.
