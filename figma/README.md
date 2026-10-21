# Buggers — Interactive Figma Prototype & 31-Screen Generator

This directory contains the automated Figma generator that creates all **31 screens** of Buggers with **100% interactive, clickable prototyping connections** (`ON_CLICK -> NAVIGATE`).

---

## ⚡ How to Run in Figma (Takes 10 Seconds)

### Method 1: Run via Figma Console / DevTools (Fastest & Easiest)
1. Open your Figma design file: [Buggers in Figma](https://www.figma.com/design/lY2eWSJAuEWDhgP2nEz1MB/Buggers-%E2%80%94-Complete-Product-Design-System).
2. Press **`Ctrl + Shift + I`** (Windows) or **`Cmd + Option + I`** (Mac) to open the browser / desktop DevTools.
3. Switch to the **Console** tab.
4. Open [`code.js`](code.js), copy the entire code, paste it into the console, and press **Enter**.
5. Wait 3 seconds — Figma will automatically generate all **31 screens**, position them in an organized 5-row grid, wire up all prototype links, and set the Flow Starting Point to the Landing Page.

### Method 2: Load as Local Plugin
1. In Figma, click the main Figma menu (top-left) ➔ **Plugins** ➔ **Development** ➔ **Import plugin from manifest...**.
2. Select [`manifest.json`](manifest.json).
3. In the Figma menu, click **Plugins** ➔ **Development** ➔ **Buggers — Complete Product Design Generator**.
4. The generator will run and notify you when all 31 screens are ready.

---

## 🗺️ Complete Route-to-Frame Mapping Table (All 31 Screens)

| Screen # | Screen / Frame Name | Actual Route / Destination | Parent Page | Entry Point | Exit / Interactive Connections | Prototype Status |
|:---|:---|:---|:---|:---|:---|:---:|
| **01** | `Screen 01 — Landing Page` | `/` | Root | Direct entry / Logo | Header tabs, Hero CTAs, Code scanner fix, PR #184 row | ✅ Connected |
| **02** | `Screen 02 — Auth & Sign In` | `/auth` | Root | "Login" header button | Sign in button ➔ Dashboard, Sign up link ➔ Screen 03 | ✅ Connected |
| **03** | `Screen 03 — Auth & Sign Up` | `/auth?mode=signup` | `/auth` | "Sign up" link | Create account ➔ Dashboard, Sign in link ➔ Screen 02 | ✅ Connected |
| **04** | `Screen 04 — OAuth Callback` | `/oauth/github/return` | `/auth` | "Continue with GitHub" | "Continue to Overview" ➔ Dashboard | ✅ Connected |
| **05** | `Screen 05 — Documentation` | `/docs` | Root | "Docs" nav tab / Sidebar | Search, VS Code extension download, Pipeline visualizer | ✅ Connected |
| **06** | `Screen 06 — How It Works` | `/how-it-works` | Root | "How It Works" nav tab | 4 Architecture steps, Threat model diagram | ✅ Connected |
| **07** | `Screen 07 — About & Team` | `/about` | Root | "About" nav tab | Academic BBDU credits, "Launch Demo" ➔ Dashboard | ✅ Connected |
| **08** | `Screen 08 — Dashboard Overview` | `/dashboard` | Authenticated | Login / OAuth / Sidebar | PR #184 row ➔ Finding Detail, "View All" ➔ PRs | ✅ Connected |
| **09** | `Screen 09 — Repositories Hub` | `/repositories` | Authenticated | Sidebar "Repositories" | "+ Connect Repo" ➔ Modal 22, `jaidevxr/buggers` ➔ Screen 17 | ✅ Connected |
| **10** | `Screen 10 — Findings Hub` | `/findings` | Authenticated | Sidebar "Findings" | Finding CWE-208 ➔ Screen 19, Finding CWE-89 ➔ Screen 20 | ✅ Connected |
| **11** | `Screen 11 — Pull Requests Hub` | `/pull-requests` | Authenticated | Sidebar "Pull Requests" | "View Analysis" ➔ Screen 18, "Inspect" ➔ Screen 19 | ✅ Connected |
| **12** | `Screen 12 — Analytics & Velocity`| `/analytics` | Authenticated | Sidebar "Analytics" | Executive metrics, Risk velocity chart, Churn hotspots | ✅ Connected |
| **13** | `Screen 13 — Tickets & Issues` | `/tickets` | Authenticated | Sidebar "Tickets" | "+ Create Ticket" ➔ Modal 23, Row BUG-208 ➔ Screen 19 | ✅ Connected |
| **14** | `Screen 14 — Settings General` | `/settings` | Authenticated | Sidebar "Settings" | "Quality Gates" tab ➔ Screen 15, "Webhooks" ➔ Screen 16 | ✅ Connected |
| **15** | `Screen 15 — Settings Quality Gates`| `/settings?tab=gates` | `/settings` | Settings Tabs | "General" tab ➔ Screen 14, "Save" ➔ Dashboard | ✅ Connected |
| **16** | `Screen 16 — Settings Webhooks` | `/settings?tab=webhooks`| `/settings` | Settings Tabs | "Test Ping" HMAC, Copy Payload URL, Settings tabs | ✅ Connected |
| **17** | `Screen 17 — Repository Detail` | `/repositories/$owner/$repo` | `/repositories` | Repo Card click | "← Back to Repos", PR #184 ➔ Analysis Screen 18 | ✅ Connected |
| **18** | `Screen 18 — Analysis Run Detail`| `/analysis/$id` | `/pull-requests` | PR "View Analysis" | "Batch Auto-Fix" ➔ Screen 21, "Re-run" ➔ Screen 27 | ✅ Connected |
| **19** | `Screen 19 — Finding Detail CWE-208`| `/findings/$id` | `/findings` | Finding row click | "Apply Fix" ➔ Screen 21, "Create Ticket" ➔ Modal 23 | ✅ Connected |
| **20** | `Screen 20 — Finding Detail CWE-89` | `/findings/$id` | `/findings` | Finding row 2 click | "Apply Fix" ➔ Screen 21, "← Back to Findings" | ✅ Connected |
| **21** | `Screen 21 — Remediated Gate Pass` | Post-fix state | `/findings/$id` | "Apply 1-Click Auto-Fix" | "Return to Dashboard", "View Findings", "Check PRs" | ✅ Connected |
| **22** | `Screen 22 — Modal Connect Repo` | Modal Overlay | `/repositories` | "+ Connect New Repo" | "✕" / "Cancel" / "Save" ➔ Screen 09 Repositories | ✅ Connected |
| **23** | `Screen 23 — Modal Create Ticket` | Modal Overlay | `/findings/$id` | "🎫 Create Ticket" | "✕" / "Cancel" ➔ Screen 19, "Submit" ➔ Screen 13 | ✅ Connected |
| **24** | `Screen 24 — Modal Dismiss Finding` | Modal Overlay | `/findings/$id` | "🚫 Dismiss False Pos"| "✕" / "Cancel" ➔ Screen 19, "Confirm" ➔ Screen 10 | ✅ Connected |
| **25** | `Screen 25 — Repositories Empty` | `/repositories` (empty) | Authenticated | Filter/Zero state | "+ Connect Repo" ➔ Modal 22, "← Back to Hub" | ✅ Connected |
| **26** | `Screen 26 — Findings Clean Gate` | `/findings` (clean) | Authenticated | 0 flaws state | "Check Monitored PRs" ➔ Screen 11 Pull Requests | ✅ Connected |
| **27** | `Screen 27 — Analysis In-Progress`| `/analysis/$id` (running)| Authenticated | "Auto-analyze" / "Re-run" | "View Completed Analysis" ➔ Screen 18 | ✅ Connected |
| **28** | `Screen 28 — Gate Blocked PR Check`| GitHub Check Run | Authenticated | PR webhook check | "Open in Buggers to Remediate" ➔ Screen 19 | ✅ Connected |
| **29** | `Screen 29 — Mobile Landing` | `/` (390px Viewport) | Root | Mobile responsive | "Login" ➔ Screen 02, "Inspect PR" ➔ Screen 31 | ✅ Connected |
| **30** | `Screen 30 — Mobile Dashboard` | `/dashboard` (390px) | Authenticated | Mobile responsive | "Home" ➔ Screen 29, "Inspect PR" ➔ Screen 31 | ✅ Connected |
| **31** | `Screen 31 — Mobile Finding Diff` | `/findings/$id` (390px) | Authenticated | Mobile responsive | "← Dashboard" ➔ Screen 30, "Apply Patch" ➔ Screen 21 | ✅ Connected |

---

## 🎮 Verified User Journeys in Prototype Mode

1. **Journey 1: Public Discovery & Auth Onboarding**
   - Starts on `Screen 01 (Landing Page)`.
   - Click **"Login"** ➔ Opens `Screen 02 (Sign In)`.
   - Click **"Don't have an account? Sign up"** ➔ Opens `Screen 03 (Sign Up)`.
   - Click **"Continue with GitHub"** ➔ Opens `Screen 04 (OAuth Callback)`.
   - Click **"Continue to Overview Dashboard"** ➔ Opens `Screen 08 (Dashboard)`.

2. **Journey 2: Direct AST Triage & 1-Click Remediation**
   - On `Screen 08 (Dashboard)`, click **PR #184: Implement HMAC signature validation**.
   - Directly navigates to `Screen 19 (Finding Detail CWE-208)` showing the red/green split diff.
   - Click **"⚡ Apply 1-Click Safe Auto-Fix"**.
   - Transitions to `Screen 21 (Remediated Gate Pass State)` with risk score reduced to 0/100 and unblocked gate.
   - Click **"Return to Dashboard"** or **"View Findings Queue"**.

3. **Journey 3: Repository Deep Dive & Analysis Run**
   - Click **"Repositories"** in the sidebar ➔ Opens `Screen 09 (Repositories Hub)`.
   - Click `jaidevxr/buggers` ➔ Opens `Screen 17 (Repository Detail View)`.
   - Click **"View Analysis" on PR #184** ➔ Opens `Screen 18 (Analysis Run Detail View)`.
   - View 9-stage pipeline progress bar and signal breakdown.
   - Click **"⚡ Batch Auto-Fix All Findings"** ➔ Opens `Screen 21 (Remediated Gate Pass)`.

4. **Journey 4: Ticket Creation & Management**
   - On `Screen 19 (Finding Detail)`, click **"🎫 Create Ticket"**.
   - Opens `Screen 23 (Modal Create Ticket)`.
   - Click **"Create & Sync Ticket"** ➔ Navigates to `Screen 13 (Tickets Hub)` showing `[BUG-208]`.

5. **Journey 5: CI Quality Gates & Webhook Configuration**
   - Click **"Settings"** in the sidebar ➔ Opens `Screen 14 (Settings General)`.
   - Click **"CI Quality Gates" tab** ➔ Opens `Screen 15 (Settings Quality Gates)`.
   - Click **"Webhooks & CI/CD" tab** ➔ Opens `Screen 16 (Settings Webhooks)`.

6. **Journey 6: Responsive Mobile Experience**
   - Open `Screen 29 (Mobile Landing)`.
   - Tap **"Inspect Live PR"** ➔ Opens `Screen 31 (Mobile Finding Diff)`.
   - Tap **"⚡ Apply 1-Click Patch"** ➔ Transitions to `Screen 21 (Remediated Gate Pass)`.

---

## 👥 Academic Credits (BBDU)
- **Jaidev Yadav** — Full Stack Lead & AST Architect
- **Khushi Sharma** — Frontend & UI Systems Lead
- **Madhvi Mishra** — Security & Vulnerability Lead
- **Kumkum** — QA, Evaluation & Release Lead
- **Institution**: Babu Banarasi Das University (BBDU)
