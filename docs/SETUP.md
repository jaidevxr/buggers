# Setup Guide

Step-by-step guide to run Buggers on your own infrastructure.

## Prerequisites

- **Node.js** ≥ 20 (LTS recommended)
- **npm** ≥ 10
- A **Google account** (for configuring Google OAuth in Supabase)
- A **GitHub account** (for creating an OAuth App)
- An AI provider API key (OpenAI, Anthropic, or Google)

---

## 1. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
2. Choose your organization (or create one), enter a **Project name** (e.g. `buggers`), set a strong **Database Password**, pick your **Region**, and click **Create new project**.
3. Wait for provisioning (≈ 60 seconds).
4. Once ready, go to **Project Settings → API** (left sidebar → gear icon → API).
5. Copy these three values into your `.env`:

| Dashboard label | `.env` variable (server) | `.env` variable (client) |
| --- | --- | --- |
| **Project URL** | `SUPABASE_URL` | `VITE_SUPABASE_URL` |
| **anon / public** key | `SUPABASE_PUBLISHABLE_KEY` | `VITE_SUPABASE_PUBLISHABLE_KEY` |
| **service_role** key (click "Reveal") | `SUPABASE_SERVICE_ROLE_KEY` | — |

> [!IMPORTANT]
> The `service_role` key bypasses Row Level Security. Never expose it to the client.

---

## 2. Apply the Database Migration

The project uses Drizzle ORM for schema management.

1. In the Supabase dashboard, go to **Project Settings → Database**.
2. Under **Connection string → URI**, click **Copy**. It will look like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
3. Run the migration:
   ```sh
   DATABASE_URL="<paste-the-connection-string>" npx drizzle-kit push
   ```
4. Verify in the Supabase **Table Editor** that the tables (`profiles`, `analyses`, `findings`, `app_user_connections`, `user_settings`, `tickets`, `notifications`) now exist.

---

## 3. Enable Google Sign-In in Supabase

Buggers uses **Supabase Auth with Google** for user sign-in. This is completely separate from the GitHub connection (which uses a direct GitHub OAuth App for API access).

### 3a. Create Google OAuth Credentials

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
2. Select or create a project.
3. Click **+ CREATE CREDENTIALS → OAuth client ID**.
4. Application type: **Web application**.
5. Name: `Buggers` (or any name).
6. Under **Authorized redirect URIs**, add **both**:
   - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
   - (For local dev, Supabase handles the redirect itself — you don't need a localhost entry here.)
7. Click **Create**. Copy the **Client ID** and **Client secret**.

### 3b. Enable Google in Supabase Auth

1. In the Supabase dashboard, go to **Authentication → Providers** (left sidebar).
2. Find **Google** and toggle it **ON**.
3. Paste the **Client ID** and **Client Secret** from step 3a.
4. Click **Save**.

### 3c. Configure Supabase URL Settings

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to your production URL (e.g. `https://buggers.vercel.app`).
3. Under **Redirect URLs**, add:
   - `http://localhost:8080/**` (for local development)
   - `https://buggers.vercel.app/**` (for production — use your actual domain)
4. Click **Save**.

---

## 4. Create a GitHub OAuth App (for API access)

This is the **GitHub connection** OAuth App — separate from Google sign-in. It gives Buggers permission to read repositories and pull requests via the GitHub API.

1. Go to [github.com/settings/developers](https://github.com/settings/developers).
2. Click **OAuth Apps → New OAuth App**.
3. Fill in:
   - **Application name**: `Buggers`
   - **Homepage URL**: `https://buggers.vercel.app` (or `http://localhost:8080` for local-only)
   - **Authorization callback URL**: `http://localhost:8080/oauth/github/return`
4. Click **Register application**.
5. Copy the **Client ID** → set as `GITHUB_CLIENT_ID` in `.env`.
6. Click **Generate a new client secret** → copy it → set as `GITHUB_CLIENT_SECRET` in `.env`.

> [!TIP]
> For production, update the **Authorization callback URL** to `https://buggers.vercel.app/oauth/github/return`.
>
> If you need both local and production, GitHub OAuth Apps only support one callback URL. Either:
> - Create **two OAuth Apps** (one for local, one for production), or
> - Set the production URL and use `GITHUB_OAUTH_CALLBACK_URL` env var to override locally.

### GitHub OAuth Scopes

Buggers requests `read:user` and `repo` scopes.

The `repo` scope grants full read/write access to repositories. This is broader than ideal for Buggers, which only reads PR metadata, diffs, and commit history. Unfortunately, GitHub's classic OAuth scopes do not offer a read-only alternative for private repositories. The narrower `public_repo` scope only works for public repositories, and fine-grained personal access tokens (which do support read-only repository access) are not available for OAuth Apps — only for GitHub Apps and user-generated PATs. This is a **known limitation** of GitHub's OAuth scope model. Buggers never writes to repositories; the `repo` scope is requested solely to read private repository data.

---

## 5. Generate the Connection Encryption Key

GitHub tokens are stored encrypted at rest using AES-256-GCM.

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Set the output as `APP_USER_CONNECTION_KEY_SECRET` in `.env`.

---

## 6. Configure an AI Provider

Pick **one** provider and set the corresponding environment variables:

| Provider | `AI_PROVIDER` value | API key env var | Sign up |
| --- | --- | --- | --- |
| OpenAI | `openai` | `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| Google | `google` | `GOOGLE_GENERATIVE_AI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |

Optional overrides:
- `AI_MODEL` — model identifier (default varies by provider)
- `AI_TIMEOUT_MS` — request timeout in milliseconds (default: `60000`)
- `AI_MAX_TOKENS` — max output tokens (default: `4096`)

---

## 7. Generate a Cron Secret

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set this as `CRON_SECRET` in `.env`. During secret rotation, set the old value as `CRON_SECRET_PREVIOUS` — both are accepted for a grace period.

---

## 8. Complete `.env` File

```sh
cp .env.example .env
```

Fill in every value. Your `.env` should contain:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
GITHUB_CLIENT_ID=Ov23li...
GITHUB_CLIENT_SECRET=abc123...
APP_USER_CONNECTION_KEY_SECRET=base64...
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
CRON_SECRET=hex...
```

---

## 9. Local Development

```sh
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). Sign in with Google, then connect GitHub from the dashboard.

---

## 10. Vercel Deployment

1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel auto-detects the Vite + Nitro setup. The defaults are correct.
4. Go to **Settings → Environment Variables** and add every variable from your `.env` file.
5. Click **Deploy**.
6. After deployment, update:
   - Supabase **Site URL** and **Redirect URLs** to your Vercel domain.
   - GitHub OAuth App **callback URL** to `https://<your-domain>/oauth/github/return`.

---

## 11. Error Tracking (Optional)

To enable Sentry:

1. `npm install @sentry/browser`
2. Initialize Sentry in your app entry point with your DSN.
3. Set `VITE_SENTRY_DSN` in `.env`.

Without Sentry, all errors are logged to the browser console via `reportError()`.

---

## Auth Flow Summary

Buggers has two independent auth flows:

| Flow | Provider | Purpose | Token storage |
| --- | --- | --- | --- |
| **Sign-in** | Supabase Auth (GitHub, Google, or Email) | Authenticate the user, create a session | Supabase manages the JWT; stored in `localStorage` |
| **GitHub connect** | Direct GitHub OAuth App | Read repos, PRs, diffs, commits via GitHub API | Encrypted in `app_user_connections` table (AES-256-GCM) |

A user can sign in without connecting GitHub (they'll see a prompt to connect). Connecting GitHub requires being signed in first (the `requireSupabaseAuth` middleware protects the connect endpoints).
