# Setup Guide

This guide walks you through setting up Buggers on your own infrastructure.

## Prerequisites

- **Node.js** ≥ 20 (LTS recommended)
- **npm** ≥ 10
- A **Supabase** project (free tier works)
- A **GitHub OAuth App**
- An AI provider API key (OpenAI, Anthropic, or Google)

## 1. Supabase Project

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon/public key** → `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Enable **Google OAuth** under **Authentication → Providers** if you want Google sign-in.
4. Set the **Site URL** to your deployment URL (e.g., `https://buggers.vercel.app`) and add `http://localhost:8080` as a redirect URL for local dev.

## 2. GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Set:
   - **Homepage URL**: your deployment URL
   - **Authorization callback URL**: `<your-url>/oauth/github/return`
3. Copy the **Client ID** → `GITHUB_CLIENT_ID` and generate a **Client Secret** → `GITHUB_CLIENT_SECRET`.

## 3. Connection Encryption Key

Generate a 32-byte base64 key for encrypting stored GitHub tokens:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Set this as `APP_USER_CONNECTION_KEY_SECRET`.

## 4. AI Provider

Pick one provider and set the corresponding API key:

| Provider   | Env Variable                    | Sign up                                     |
| ---------- | ------------------------------- | ------------------------------------------- |
| OpenAI     | `OPENAI_API_KEY`                | [platform.openai.com](https://platform.openai.com) |
| Anthropic  | `ANTHROPIC_API_KEY`             | [console.anthropic.com](https://console.anthropic.com) |
| Google     | `GOOGLE_GENERATIVE_AI_API_KEY`  | [aistudio.google.com](https://aistudio.google.com) |

Set `AI_PROVIDER` to `"openai"`, `"anthropic"`, or `"google"`.

## 5. Cron Secret

Generate a secret for authenticating cron job requests:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set this as `CRON_SECRET`. During rotation, set the old value as `CRON_SECRET_PREVIOUS`.

## 6. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```sh
cp .env.example .env
```

## 7. Database Migrations

Run Drizzle migrations against your Supabase Postgres:

```sh
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres" npx drizzle-kit push
```

## 8. Local Development

```sh
npm install
npm run dev
```

The app starts at `http://localhost:8080`.

## 9. Vercel Deployment

1. Import the repository on [vercel.com](https://vercel.com).
2. Set **all** environment variables from `.env.example` in the Vercel dashboard (Settings → Environment Variables).
3. Set the **Build Command** to `npm run build` and **Output Directory** to `.vercel/output`.
4. Deploy.

## 10. Error Tracking (Optional)

To enable Sentry error tracking:

1. Install `@sentry/browser` as a dependency.
2. Initialize Sentry in your entry point.
3. Set `VITE_SENTRY_DSN` in your environment.

Without Sentry, errors are logged to the browser console.
