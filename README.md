# Buggers

AI-assisted code review & bug triage for GitHub pull requests.

Buggers analyzes your real GitHub pull requests for risk, historical signals, and AI-reviewed findings — giving you a confidence score before you merge.

## Quick Start

```sh
git clone <this-repository-url>
cd buggers
cp .env.example .env   # fill in your keys
npm install
npm run dev            # http://localhost:8080
```

See [`docs/SETUP.md`](docs/SETUP.md) for full setup instructions and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the system design.

## Features

- **Risk scoring** — deterministic heuristic engine combining churn, complexity, file history, and test coverage signals.
- **AI review** — multi-provider support (OpenAI, Anthropic, Google) with prompt injection defense and hallucination filtering.
- **GitHub integration** — direct OAuth with encrypted token storage and rate-limit-aware API client.
- **Durable job flow** — Postgres-backed queue with heartbeat/lease, exponential backoff, and crash recovery.
- **Structured telemetry** — JSON logging with analysis_id, stage, duration_ms, and AI token usage.

## Development

```sh
npm run dev        # Start dev server
npm run build      # Production build (Vercel/Nitro)
npm run typecheck  # TypeScript checks
npm run test       # Vitest unit tests
npm run lint       # ESLint
```

## Deployment

Configured for **Vercel** with Nitro. See [`docs/SETUP.md`](docs/SETUP.md) for environment variable configuration.

## Origins

This project was originally scaffolded with [Lovable](https://lovable.dev). It has since been fully decoupled to run as a standalone application using your own Supabase project, GitHub OAuth App, and AI provider keys.

## License

Private — all rights reserved.
