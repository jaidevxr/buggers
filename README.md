<p align="center">
  <a href="https://buggers.dev">
    <img src="https://buggers.dev/icon-192.png" width="96" height="96" alt="Buggers Logo" style="border-radius: 20px;" />
  </a>
</p>

<h1 align="center">Buggers — Pull Request Security Reviewer & Vulnerability Scanner</h1>

<p align="center">
  <b>Precision release intelligence & deterministic PR triage for modern engineering teams.</b><br />
  Built by <b>Jaidev Yadav</b>, <b>Khushi Sharma</b>, <b>Madhvi Mishra</b>, and <b>Kumkum</b>.<br />
  Live Platform: <a href="https://buggers.dev">https://buggers.dev</a>
</p>

<p align="center">
  <a href="https://buggers.dev"><img src="https://img.shields.io/badge/Live%20Platform-buggers.dev-000000?style=flat-square&logo=vercel" alt="Live App" /></a>
  <a href="extensions/buggers-vscode"><img src="https://img.shields.io/badge/VS%20Code%20Extension-v1.2.0-007acc?style=flat-square&logo=visual-studio-code" alt="VS Code Extension" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Proprietary-slate?style=flat-square" alt="License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Runtime-Node.js%2022-emerald?style=flat-square" alt="Runtime" /></a>
  <a href="https://tanstack.com/start"><img src="https://img.shields.io/badge/Framework-TanStack%20Start-blue?style=flat-square" alt="Framework" /></a>
</p>

---

## Overview

Modern code review suffers from a fundamental paradox: generic LLMs leave noisy, speculative comments, while human engineers burn out reviewing massive pull requests.

**Buggers** bridges this gap by grounding pull request analysis in **real repository history**:
- **Deterministic Churn Evaluation:** Correlates changed functions with past rollback commits and defect density.
- **Zero Phantom Lines:** Remediations only cite verified diff line numbers. Hallucinated file paths are mathematically discarded.
- **Merge Quality Gates:** Enforce declarative `.buggers.yml` threshold rules via automated GitHub Check Runs.

---

## Core Capabilities

- **AST-Grounded Risk Scoring:** Deterministic 0–100 risk score weighing cyclomatic complexity, test delta, and boundary mutations.
- **Multi-Provider AI Resilience:** Native fallback chain across OpenAI, Anthropic Claude, and Google Gemini with prompt injection defense.
- **Direct GitHub Integration:** Secure OAuth handshake with encrypted token storage (`pgcrypto`), fine-grained scoping, and rate-limit-aware retry backoff.
- **Durable Queue Worker:** Postgres-backed queue with heartbeat/lease mechanism, exponential jitter backoff, and crash recovery.
- **Real-Time SAST & Secret Scanning:** High-entropy regex and heuristic detection for exposed cloud credentials, JWTs, and API tokens.
- **Instant Preloaded Navigation:** Butter-smooth client-side routing powered by TanStack Router and a persistent anchored floating island header.

---

## Quick Start

### 1. Clone & Install

```sh
git clone https://github.com/jaidevxr/buggers.git
cd buggers
npm install
```

### 2. Configure Environment

Copy the example environment file and add your credentials:

```sh
cp .env.example .env
```

Key environment variables:
```env
# Supabase Database & Auth
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub OAuth & Webhooks
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# AI Providers (At least one required)
OPENROUTER_API_KEY=your-openrouter-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### 3. Launch Development Server

```sh
npm run dev
```

Visit [`http://localhost:8080`](http://localhost:8080) to access the Buggers application.

---

## Project Structure

```
buggers/
├── docs/                     # Engineering documentation suite
│   ├── ARCHITECTURE.md       # Pipeline stages, queue worker, database schema & AI orchestration
│   ├── SETUP.md              # Infrastructure provisioning, Supabase & GitHub OAuth setup
│   ├── API_REFERENCE.md      # Nitro REST endpoints and TanStack Start server functions
│   ├── RISK_AND_SCANNERS.md  # 0–100 deterministic risk engine, SAST & secret scanner rules
│   └── TROUBLESHOOTING.md    # Diagnostics, error codes, and operational recovery
├── SECURITY.md               # Threat model, prompt injection defense, and RLS policies
├── src/
│   ├── components/           # Reusable UI components & floating public island
│   │   ├── brand/            # Buggers brand marks & SVG wordmarks
│   │   ├── layout/           # AppShell, TopBar & PublicHeader
│   │   └── ui/               # Radix-UI primitive components
│   ├── integrations/         # Supabase client & database type bindings
│   ├── lib/                  # Shared utilities, risk engine & server functions
│   ├── routes/               # TanStack Router type-safe file routes
│   │   ├── _authenticated/   # Protected workspace pages (Dashboard, Repos, Findings)
│   │   ├── index.tsx         # Studio landing experience
│   │   ├── auth.tsx          # Clean OAuth sign-in & sign-up
│   │   ├── docs.tsx          # Interactive technical documentation
│   │   ├── how-it-works.tsx  # Pipeline deep-dive & architectural breakdown
│   │   └── about.tsx         # Engineering mission & core pillars
│   ├── server/               # Server-only AST scanners, queue worker & AI clients
│   └── styles.css            # GPU-accelerated motion system & design tokens
└── .buggers.yml              # Example declarative repository merge gate configuration
```

---

## Quality Gate Configuration (`.buggers.yml`)

Configure review thresholds directly in your repository root:

```yaml
version: 1

risk:
  threshold: 75             # Block pull request merge if score exceeds 75
  fail_on_critical: true     # Block merge if critical vulnerability is detected
  block_on_secrets: true     # Enforce hard block on leaked credentials

ignore:
  paths:
    - "docs/**"
    - "**/*.spec.ts"
    - "dist/**"
```

---

## Development Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local development server on port 8080 |
| `npm run build` | Compiles production assets and Nitro server bundle |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `npm run test` | Executes unit and integration test suite with Vitest |
| `npm run lint` | Runs ESLint for code quality and convention checks |

---

## Deployment

Buggers is optimized for production deployment on **Vercel** with Nitro runtime:

```sh
npm run build
npx vercel deploy --prebuilt --prod
```

Refer to [`docs/SETUP.md`](docs/SETUP.md) for complete production secrets and webhook configuration.

---

## Team & Credits

Buggers was designed and developed by:
- **Jaidev Yadav**
- **Khushi Sharma**
- **Madhvi Mishra**
- **Kumkum**

---

## License

Private — All rights reserved © 2026 Buggers Engineering.
