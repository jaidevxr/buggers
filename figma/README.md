# Buggers — Figma Design Project & Plugin Generator

This directory contains the automated Figma project generator for **Buggers**, designed for college evaluation, product demonstration, and developer handoff.

---

## 🚀 How to Run in Figma (1-Click Setup)

Because you have **Figma Premium** (with your college education email `jaiy9956@bbdu.ac.in`):

### Option 1: Load as Development Plugin in Figma Desktop or Figma Web

1. Open **Figma** (either the desktop app or [figma.com](https://figma.com)).
2. Create a new design file: **`Buggers — Complete Product Design System`**.
3. In Figma, open the Main Menu (Figma icon in top-left) ➔ **Plugins** ➔ **Development** ➔ **Import plugin from manifest...**.
4. Select the [`c:\Major project\v3\buggers\figma\manifest.json`](manifest.json) file.
5. In the menu, go to **Plugins** ➔ **Development** ➔ **Buggers — Complete Product Design Generator**.
6. The plugin will execute immediately, automatically building all **12 pages**, color tokens, typography styles, component cards, screen layouts, user flows, and academic presentation frames with editable Auto Layout layers!

### Option 2: Run via Figma Console / DevTools (Browser or Desktop)

1. Open your Figma design file.
2. Press `Ctrl + Shift + I` (or `Cmd + Option + I` on Mac) to open DevTools.
3. Switch to the **Console** tab.
4. Copy and paste the entire code from [`code.js`](code.js) and press **Enter**.
5. All 12 pages and design elements will be generated in your file instantly.

---

## 📑 12-Page Project Structure Generated

1. `00 — Cover & Project Overview`: 1920x1080 academic title frame, team credits, badges, and project metadata.
2. `01 — Product Architecture`: 9-stage end-to-end AST triage pipeline diagram from webhook ingestion to in-editor fix.
3. `02 — Design System`: Color palette swatches (OKLCH tokens, pitch black, dark canvas, emerald, amber, rose, purple), typography scale, and layout rules.
4. `03 — Components & Variants`: Reusable buttons, severity badges, diff preview boxes, and code cards.
5. `04 — Application Screens`: 10 key production application screens mapped to actual routes.
6. `05 — Security Findings & Remediation`: Deep-dive into Finding Detail (`/findings/cwe-208`), side-by-side unified diff, and 1-click remediation actions.
7. `06 — User Flows`: Step-by-step transition cards for Flow A (Scan & Triage), Flow B (Remediation), Flow C (GitHub Gate Enforcer), and Flow D (AI Fallback).
8. `07 — Interactive Prototype`: Flow connection mapping and hotspot architecture.
9. `08 — Responsive Layouts`: Desktop (1440px), Tablet (768px), Mobile (375px), and VS Code Panel (300px).
10. `09 — Error, Loading & Empty States`: Clean release state, skeleton shimmer, webhook auth errors, and AI fallback recovery.
11. `10 — Developer Handoff`: Tech stack details (TanStack Start, Nitro, Supabase, Tailwind, TypeScript) and API endpoints.
12. `11 — Academic Documentation`: Formal academic report sections covering Problem Statement, Methodology, Verification, and Team Attribution.

---

## 👥 Team Attribution
- **Jaidev Yadav**
- **Khushi Sharma**
- **Madhvi Mishra**
- **Kumkum**
- **Institution**: Babu Banarasi Das University (BBDU)
