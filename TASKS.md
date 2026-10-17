# Buggers Engineering Tasks (Ralph Loop Task Tracker)

<!-- Loop: PRD-to-Implementation -->

## Active Milestone: Production Launch & Search Engine Discoverability

### Phase 1: Technical SEO & Discoverability
- [x] Configure centralized production domain resolution (`src/lib/seo.ts`)
- [x] Implement XML Sitemap with changefreq & priorities (`public/sitemap.xml`)
- [x] Implement crawler rules, bot user-agents & sitemap reference (`public/robots.txt`)
- [x] Implement Web App Manifest (`public/site.webmanifest` & `public/manifest.json`)
- [x] Inject Schema.org JSON-LD (WebSite, SoftwareApplication, Organization)
- [x] Synchronize route-level Open Graph, Twitter cards, and canonical tags
- [x] Add automated Vitest SEO regression suite (`src/test/seo.test.ts`)
- [x] Establish internal crawlable navigation across Header & Footer

### Phase 2: Autonomous Tooling & Agent Workflow Integrations
- [x] Configure CodeRabbit lint & review profile (`.coderabbit.yaml`)
- [x] Configure Roo Code / Cline workspace guidelines (`.clinerules`)
- [x] Configure Ralph Loop task & memory externalization (`PRD.md`, `TASKS.md`)
- [x] Configure GSD Mission Control dashboard (`.gsd/STATE.md`, `.gsd/ROADMAP.md`)

### Phase 3: Verification & Security Testing
- [x] Pass 100% Vitest unit, security, and SEO tests (110 tests passed)
- [x] Pass TypeScript strict typechecking (`tsc --noEmit`)
- [x] Pass production build (`vite build`)
- [ ] Staging pull request evaluation with synthetic test vulnerabilities on `buggers-test-vulnerable-app`
