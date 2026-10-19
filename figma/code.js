// Buggers — Complete Product Design Project Generator for Figma
// Designed for College Evaluation, Technical Handoff, and Product Demonstration
// Team: Jaidev Yadav, Khushi Sharma, Madhvi Mishra, Kumkum · October 2026

async function main() {
  figma.notify("Building Buggers Complete Product Design System...", { timeout: 4000 });

  // 1. Preload fonts
  try {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  } catch (err) {
    console.warn("Could not load Inter, falling back to system fonts", err);
    await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
  }

  // Color Constants (OKLCH-mapped exact tokens)
  const C = {
    bgDark: { r: 0.035, g: 0.035, b: 0.043 }, // #09090b
    surfaceDark: { r: 0.07, g: 0.07, b: 0.08 }, // #121215
    surfaceCard: { r: 0.09, g: 0.09, b: 0.11 }, // #17171c
    pitchBlack: { r: 0, g: 0, b: 0 },
    white: { r: 1, g: 1, b: 1 },
    neutral300: { r: 0.85, g: 0.85, b: 0.88 },
    neutral400: { r: 0.63, g: 0.63, b: 0.68 },
    neutral500: { r: 0.45, g: 0.45, b: 0.5 },
    borderMuted: { r: 0.18, g: 0.18, b: 0.22 },
    primaryBlue: { r: 0.23, g: 0.51, b: 0.96 }, // #3b82f6
    emeraldAccent: { r: 0.06, g: 0.72, b: 0.5 }, // #10b981
    emeraldDark: { r: 0.01, g: 0.15, b: 0.08 },
    amberAccent: { r: 0.95, g: 0.6, b: 0.05 },
    amberDark: { r: 0.2, g: 0.1, b: 0.01 },
    roseAccent: { r: 0.95, g: 0.2, b: 0.35 },
    roseDark: { r: 0.2, g: 0.02, b: 0.05 },
    purpleAccent: { r: 0.65, g: 0.35, b: 0.95 },
  };

  // Helper: Create Text Node
  function createText(str, size = 14, weight = "Regular", color = C.white, fontStyle = "Regular") {
    const text = figma.createText();
    text.fontName = { family: "Inter", style: weight };
    text.characters = str;
    text.fontSize = size;
    text.fills = [{ type: "SOLID", color: color }];
    return text;
  }

  // Helper: Create AutoLayout Frame
  function createFrame(name, layout = "VERTICAL", padding = 24, spacing = 16, bg = C.surfaceDark, radius = 12) {
    const frame = figma.createFrame();
    frame.name = name;
    frame.layoutMode = layout;
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
    frame.paddingLeft = padding;
    frame.paddingRight = padding;
    frame.paddingTop = padding;
    frame.paddingBottom = padding;
    frame.itemSpacing = spacing;
    frame.cornerRadius = radius;
    frame.fills = bg ? [{ type: "SOLID", color: bg }] : [];
    frame.strokes = [{ type: "SOLID", color: C.borderMuted }];
    frame.strokeWeight = 1;
    return frame;
  }

  // Helper: Create Badge
  function createBadge(label, textColor = C.emeraldAccent, bgColor = C.emeraldDark) {
    const badge = figma.createFrame();
    badge.name = `Badge / ${label}`;
    badge.layoutMode = "HORIZONTAL";
    badge.primaryAxisSizingMode = "AUTO";
    badge.counterAxisSizingMode = "AUTO";
    badge.paddingLeft = 8;
    badge.paddingRight = 8;
    badge.paddingTop = 4;
    badge.paddingBottom = 4;
    badge.cornerRadius = 6;
    badge.fills = [{ type: "SOLID", color: bgColor }];
    badge.strokes = [{ type: "SOLID", color: textColor }];
    badge.strokeWeight = 1;
    const txt = createText(label, 11, "Medium", textColor);
    badge.appendChild(txt);
    return badge;
  }

  // Helper: Create Button
  function createButton(label, variant = "primary") {
    const btn = figma.createFrame();
    btn.name = `Button / ${variant} / ${label}`;
    btn.layoutMode = "HORIZONTAL";
    btn.primaryAxisSizingMode = "AUTO";
    btn.counterAxisSizingMode = "AUTO";
    btn.paddingLeft = 16;
    btn.paddingRight = 16;
    btn.paddingTop = 10;
    btn.paddingBottom = 10;
    btn.cornerRadius = 8;
    if (variant === "primary") {
      btn.fills = [{ type: "SOLID", color: C.white }];
      btn.appendChild(createText(label, 13, "Semi Bold", C.pitchBlack));
    } else if (variant === "emerald") {
      btn.fills = [{ type: "SOLID", color: C.emeraldAccent }];
      btn.appendChild(createText(label, 13, "Semi Bold", C.pitchBlack));
    } else {
      btn.fills = [{ type: "SOLID", color: C.surfaceCard }];
      btn.strokes = [{ type: "SOLID", color: C.borderMuted }];
      btn.appendChild(createText(label, 13, "Medium", C.white));
    }
    return btn;
  }

  // 12 Target Pages Definition
  const pagesList = [
    "00 — Cover & Project Overview",
    "01 — Product Architecture",
    "02 — Design System",
    "03 — Components & Variants",
    "04 — Application Screens",
    "05 — Security Findings & Remediation",
    "06 — User Flows",
    "07 — Interactive Prototype",
    "08 — Responsive Layouts",
    "09 — Error, Loading & Empty States",
    "10 — Developer Handoff",
    "11 — Academic Documentation",
  ];

  // Find or Create Pages
  const createdPages = {};
  for (const pageName of pagesList) {
    let p = figma.root.children.find((child) => child.name === pageName);
    if (!p) {
      p = figma.createPage();
      p.name = pageName;
    }
    createdPages[pageName] = p;
  }

  // Clean up default "Page 1" if present and empty
  const defaultPage = figma.root.children.find((child) => child.name === "Page 1");
  if (defaultPage && defaultPage.children.length === 0) {
    defaultPage.remove();
  }

  // =========================================================================
  // PAGE 00 — Cover & Project Overview
  // =========================================================================
  {
    const page = createdPages["00 — Cover & Project Overview"];
    figma.currentPage = page;

    const cover = figma.createFrame();
    cover.name = "Cover / 1920x1080 Academic Presentation";
    cover.resize(1920, 1080);
    cover.fills = [{ type: "SOLID", color: C.pitchBlack }];
    cover.layoutMode = "VERTICAL";
    cover.paddingLeft = 120;
    cover.paddingRight = 120;
    cover.paddingTop = 140;
    cover.paddingBottom = 140;
    cover.itemSpacing = 40;

    // Badges Row
    const badgeRow = figma.createFrame();
    badgeRow.layoutMode = "HORIZONTAL";
    badgeRow.itemSpacing = 16;
    badgeRow.fills = [];
    badgeRow.appendChild(createBadge("MAJOR PROJECT EVALUATION · 2026", C.emeraldAccent, C.emeraldDark));
    badgeRow.appendChild(createBadge("OFFICIAL RELEASE v1.2.0", C.primaryBlue, C.surfaceCard));
    badgeRow.appendChild(createBadge("BABU BANARASI DAS UNIVERSITY (BBDU)", C.amberAccent, C.amberDark));
    cover.appendChild(badgeRow);

    // Title Block
    const titleBlock = figma.createFrame();
    titleBlock.layoutMode = "VERTICAL";
    titleBlock.itemSpacing = 16;
    titleBlock.fills = [];
    titleBlock.appendChild(createText("Buggers", 72, "Bold", C.white));
    titleBlock.appendChild(
      createText(
        "Pull Request Security Reviewer, Vulnerability Scanner & In-Editor IDE Remediation Platform",
        28,
        "Medium",
        C.neutral300
      )
    );
    titleBlock.appendChild(
      createText(
        "A complete precision release intelligence engine grounding pull request triage in real AST syntax trees, deterministic OWASP risk scoring, and zero-trust in-editor VS Code patching.",
        18,
        "Regular",
        C.neutral400
      )
    );
    cover.appendChild(titleBlock);

    // Team Card
    const teamCard = createFrame("Project Team & Credits", "VERTICAL", 32, 20, C.surfaceCard, 16);
    teamCard.appendChild(createText("ENGINEERING TEAM CONTRIBUTORS", 12, "Bold", C.emeraldAccent));
    
    const teamList = figma.createFrame();
    teamList.layoutMode = "HORIZONTAL";
    teamList.itemSpacing = 40;
    teamList.fills = [];
    
    const members = [
      { name: "Jaidev Yadav", role: "Full-Stack & Systems Architecture" },
      { name: "Khushi Sharma", role: "Security Rule Engine & SAST Testing" },
      { name: "Madhvi Mishra", role: "AI Pipeline & Remediation Verification" },
      { name: "Kumkum", role: "UI/UX, Documentation & Quality Assurance" },
    ];

    for (const m of members) {
      const col = figma.createFrame();
      col.layoutMode = "VERTICAL";
      col.itemSpacing = 6;
      col.fills = [];
      col.appendChild(createText(m.name, 18, "Semi Bold", C.white));
      col.appendChild(createText(m.role, 13, "Regular", C.neutral400));
      teamList.appendChild(col);
    }
    teamCard.appendChild(teamList);
    cover.appendChild(teamCard);

    // Live URLs Row
    const urlsRow = figma.createFrame();
    urlsRow.layoutMode = "HORIZONTAL";
    urlsRow.itemSpacing = 32;
    urlsRow.fills = [];
    urlsRow.appendChild(createText("Production URL: https://buggers.dev", 14, "Medium", C.emeraldAccent));
    urlsRow.appendChild(createText("GitHub Repo: github.com/jaidevxr/buggers", 14, "Medium", C.neutral400));
    urlsRow.appendChild(createText("VS Code Marketplace: buggers-vscode v1.2.0", 14, "Medium", C.primaryBlue));
    cover.appendChild(urlsRow);

    page.appendChild(cover);
  }

  // =========================================================================
  // PAGE 01 — Product Architecture
  // =========================================================================
  {
    const page = createdPages["01 — Product Architecture"];
    figma.currentPage = page;

    const archFrame = createFrame("9-Stage End-to-End Pipeline Architecture", "VERTICAL", 48, 32, C.bgDark, 16);
    archFrame.resize(1600, 900);

    archFrame.appendChild(createText("BUGGERS SYSTEM ARCHITECTURE", 12, "Bold", C.emeraldAccent));
    archFrame.appendChild(createText("Deterministic Multi-Stage Review & Triage Engine", 32, "Bold", C.white));
    archFrame.appendChild(
      createText(
        "From pull request trigger or in-editor keystroke to grounded diff patch verification without phantom line hallucinations.",
        15,
        "Regular",
        C.neutral400
      )
    );

    const stagesGrid = figma.createFrame();
    stagesGrid.layoutMode = "HORIZONTAL";
    stagesGrid.itemSpacing = 20;
    stagesGrid.fills = [];

    const stages = [
      { step: "01", name: "Webhook Ingestion", desc: "HMAC SHA-256 signature validation & idempotent delivery dedup" },
      { step: "02", name: "Queue Worker", desc: "Postgres lease worker with exponential jitter backoff & crash safety" },
      { step: "03", name: "Diff Normalization", desc: "Line-numbered unified diff parsing and phantom path discarding" },
      { step: "04", name: "AST SAST Scanner", desc: "23 OWASP AST checkers running in-process without network latency" },
      { step: "05", name: "Secret Leak Engine", desc: "7 Shannon-entropy regex patterns catching AWS, Stripe, JWT, OpenAI tokens" },
      { step: "06", name: "AI Fallback Chain", desc: "Resilient fallback across Claude 3.5, Gemini 2.0 & OpenAI with injection guards" },
      { step: "07", name: "Churn & Risk Scoring", desc: "0-100 deterministic risk engine correlating past defect rollbacks" },
      { step: "08", name: "Check Run Gates", desc: "Automated GitHub Check Runs enforcing declarative .buggers.yml rules" },
      { step: "09", name: "VS Code Extension", desc: "Local AST engine, Webview Flaw Inspector & Git pre-commit hooks" },
    ];

    for (const s of stages) {
      const card = createFrame(`Stage ${s.step}`, "VERTICAL", 20, 12, C.surfaceCard, 12);
      card.resize(150, 300);
      card.appendChild(createText(s.step, 24, "Bold", C.emeraldAccent));
      card.appendChild(createText(s.name, 14, "Semi Bold", C.white));
      card.appendChild(createText(s.desc, 12, "Regular", C.neutral400));
      stagesGrid.appendChild(card);
    }
    archFrame.appendChild(stagesGrid);
    page.appendChild(archFrame);
  }

  // =========================================================================
  // PAGE 02 — Design System
  // =========================================================================
  {
    const page = createdPages["02 — Design System"];
    figma.currentPage = page;

    const dsFrame = createFrame("Design Tokens & Typography Foundation", "VERTICAL", 48, 36, C.bgDark, 16);
    dsFrame.resize(1600, 1100);

    dsFrame.appendChild(createText("DESIGN SYSTEM FOUNDATIONS", 12, "Bold", C.emeraldAccent));
    dsFrame.appendChild(createText("Color Tokens, Semantic Roles & Typography", 32, "Bold", C.white));

    // Color Swatches Grid
    const swatchSection = createFrame("Color Palette", "VERTICAL", 24, 16, C.surfaceCard, 12);
    swatchSection.appendChild(createText("SEMANTIC PALETTES", 14, "Semi Bold", C.white));

    const swatchesRow = figma.createFrame();
    swatchesRow.layoutMode = "HORIZONTAL";
    swatchesRow.itemSpacing = 24;
    swatchesRow.fills = [];

    const tokenDefs = [
      { name: "Pitch Black", hex: "#000000", col: C.pitchBlack },
      { name: "Dark Canvas", hex: "#09090B", col: C.bgDark },
      { name: "Dark Surface", hex: "#121215", col: C.surfaceDark },
      { name: "Primary Blue", hex: "#3B82F6", col: C.primaryBlue },
      { name: "Emerald Low/Safe", hex: "#10B981", col: C.emeraldAccent },
      { name: "Amber Medium Risk", hex: "#D97706", col: C.amberAccent },
      { name: "Rose Critical Risk", hex: "#E11D48", col: C.roseAccent },
      { name: "Purple AI Assist", hex: "#A855F7", col: C.purpleAccent },
    ];

    for (const t of tokenDefs) {
      const box = figma.createFrame();
      box.name = t.name;
      box.layoutMode = "VERTICAL";
      box.itemSpacing = 8;
      box.fills = [];

      const rect = figma.createRectangle();
      rect.resize(140, 80);
      rect.cornerRadius = 8;
      rect.fills = [{ type: "SOLID", color: t.col }];
      rect.strokes = [{ type: "SOLID", color: C.borderMuted }];
      box.appendChild(rect);
      box.appendChild(createText(t.name, 13, "Semi Bold", C.white));
      box.appendChild(createText(t.hex, 11, "Regular", C.neutral400));
      swatchesRow.appendChild(box);
    }
    swatchSection.appendChild(swatchesRow);
    dsFrame.appendChild(swatchSection);

    // Typography Scale
    const typeSection = createFrame("Typography Scale", "VERTICAL", 24, 16, C.surfaceCard, 12);
    typeSection.appendChild(createText("TYPOGRAPHY HIERARCHY", 14, "Semi Bold", C.white));

    const typeRows = [
      { role: "Display Hero", sample: "Shift left to your editor with Buggers", size: 48, weight: "Bold" },
      { role: "Heading 1", sample: "Security Overview & PR Triage", size: 32, weight: "Bold" },
      { role: "Heading 2", sample: "Timing Attack in Signature Check (CWE-208)", size: 20, weight: "Semi Bold" },
      { role: "Body Regular", sample: "Continuous AST vulnerability detection with zero cloud exfiltration.", size: 14, weight: "Regular" },
      { role: "Monospace Code", sample: "crypto.timingSafeEqual(userBuf, secretBuf);", size: 13, weight: "Regular" },
      { role: "Caption / Mono Tag", sample: "v1.2.0 STABLE · DIRECT INSTALL", size: 11, weight: "Medium" },
    ];

    for (const tr of typeRows) {
      const row = figma.createFrame();
      row.layoutMode = "HORIZONTAL";
      row.itemSpacing = 32;
      row.fills = [];
      const label = createText(tr.role, 12, "Medium", C.neutral400);
      label.resize(160, 24);
      row.appendChild(label);
      row.appendChild(createText(tr.sample, tr.size, tr.weight, C.white));
      typeSection.appendChild(row);
    }
    dsFrame.appendChild(typeSection);
    page.appendChild(dsFrame);
  }

  // =========================================================================
  // PAGE 03 — Components & Variants
  // =========================================================================
  {
    const page = createdPages["03 — Components & Variants"];
    figma.currentPage = page;

    const compFrame = createFrame("Core Reusable UI Components", "VERTICAL", 48, 36, C.bgDark, 16);
    compFrame.resize(1600, 1000);

    compFrame.appendChild(createText("UI COMPONENT LIBRARY", 12, "Bold", C.emeraldAccent));
    compFrame.appendChild(createText("Atomic Components & State Variants", 32, "Bold", C.white));

    // Row 1: Buttons
    const btnSection = createFrame("Buttons", "VERTICAL", 24, 16, C.surfaceCard, 12);
    btnSection.appendChild(createText("BUTTON VARIANTS", 14, "Semi Bold", C.white));
    const btnRow = figma.createFrame();
    btnRow.layoutMode = "HORIZONTAL";
    btnRow.itemSpacing = 16;
    btnRow.fills = [];
    btnRow.appendChild(createButton("Primary Action", "primary"));
    btnRow.appendChild(createButton("Apply Safe Auto-Fix", "emerald"));
    btnRow.appendChild(createButton("Secondary Action", "secondary"));
    btnRow.appendChild(createButton("Disabled State", "secondary"));
    btnSection.appendChild(btnRow);
    compFrame.appendChild(btnSection);

    // Row 2: Badges & Severity Chips
    const badgeSection = createFrame("Badges & Severity Chips", "VERTICAL", 24, 16, C.surfaceCard, 12);
    badgeSection.appendChild(createText("SEVERITY INDICATORS", 14, "Semi Bold", C.white));
    const badgeRow = figma.createFrame();
    badgeRow.layoutMode = "HORIZONTAL";
    badgeRow.itemSpacing = 16;
    badgeRow.fills = [];
    badgeRow.appendChild(createBadge("CRITICAL · CWE-208", C.roseAccent, C.roseDark));
    badgeRow.appendChild(createBadge("HIGH · CWE-89", C.amberAccent, C.amberDark));
    badgeRow.appendChild(createBadge("MEDIUM · CWE-1321", C.amberAccent, C.amberDark));
    badgeRow.appendChild(createBadge("LOW · CWE-703", C.emeraldAccent, C.emeraldDark));
    badgeRow.appendChild(createBadge("VERIFIED RESOLVED", C.emeraldAccent, C.emeraldDark));
    badgeSection.appendChild(badgeRow);
    compFrame.appendChild(badgeSection);

    // Row 3: Code Card Component
    const codeSection = createFrame("Code Excerpt & Diff Component", "VERTICAL", 24, 16, C.surfaceCard, 12);
    codeSection.appendChild(createText("DIFF PREVIEW CARDS", 14, "Semi Bold", C.white));

    const diffRow = figma.createFrame();
    diffRow.layoutMode = "HORIZONTAL";
    diffRow.itemSpacing = 24;
    diffRow.fills = [];

    const vulnBox = createFrame("Vulnerable Before", "VERTICAL", 16, 8, C.roseDark, 8);
    vulnBox.resize(450, 100);
    vulnBox.appendChild(createText("BEFORE (VULNERABLE) · Line 42", 11, "Bold", C.roseAccent));
    vulnBox.appendChild(createText("if (userProvidedToken === serverSecret) {", 12, "Regular", C.roseAccent));
    diffRow.appendChild(vulnBox);

    const fixBox = createFrame("Proposed Remedy", "VERTICAL", 16, 8, C.emeraldDark, 8);
    fixBox.resize(450, 100);
    fixBox.appendChild(createText("PROPOSED REMEDY (SAFE) · Patched", 11, "Bold", C.emeraldAccent));
    fixBox.appendChild(createText("if (crypto.timingSafeEqual(userBuf, secretBuf)) {", 12, "Regular", C.emeraldAccent));
    diffRow.appendChild(fixBox);

    codeSection.appendChild(diffRow);
    compFrame.appendChild(codeSection);

    page.appendChild(compFrame);
  }

  // =========================================================================
  // PAGE 04 — Application Screens
  // =========================================================================
  {
    const page = createdPages["04 — Application Screens"];
    figma.currentPage = page;

    const screenGrid = figma.createFrame();
    screenGrid.name = "Screen Grid / 1440px Production Screens";
    screenGrid.layoutMode = "VERTICAL";
    screenGrid.itemSpacing = 48;
    screenGrid.fills = [];

    const screens = [
      { name: "Screen 01 — Landing Studio Page (`/`)", subtitle: "Public Hero, Live AST Scanner Demo & Feature Specifications" },
      { name: "Screen 02 — Authentication (`/auth`)", subtitle: "GitHub OAuth Handshake, Email Auth & Security Tokens" },
      { name: "Screen 03 — Security Overview Dashboard (`/dashboard`)", subtitle: "Risk Velocity, Monitored Repositories & Critical Flaw Feeds" },
      { name: "Screen 04 — Repositories List (`/repositories`)", subtitle: "Connected GitHub Repositories, Quality Gates & Sync Status" },
      { name: "Screen 05 — Findings Explorer (`/findings`)", subtitle: "OWASP Vulnerability Matrix, Multi-Filter Triage & Severity Distribution" },
      { name: "Screen 06 — Finding Detail & Remediation (`/findings/:id`)", subtitle: "AST Code Highlighting, Side-by-Side Diff & 1-Click Fix Patch" },
      { name: "Screen 07 — Live Analysis Pipeline (`/analysis/:id`)", subtitle: "Real-time 9-Stage AST Scan Progress & Worker Telemetry" },
      { name: "Screen 08 — Executive Analytics (`/analytics`)", subtitle: "Defect Density Heatmaps, Rollback Churn Correlation & MTTR" },
      { name: "Screen 09 — Settings & Integrations (`/settings`)", subtitle: "GitHub Webhook Secrets, AI Fallback Keys & .buggers.yml Gate Rules" },
      { name: "Screen 10 — Technical Documentation Hub (`/docs`)", subtitle: "9 Specifications, Scanner Playground & VS Code In-Editor Extension" },
    ];

    for (const sc of screens) {
      const scr = createFrame(sc.name, "VERTICAL", 32, 20, C.bgDark, 16);
      scr.resize(1440, 400);
      scr.appendChild(createBadge("PRODUCTION ROUTE", C.primaryBlue, C.surfaceCard));
      scr.appendChild(createText(sc.name, 24, "Bold", C.white));
      scr.appendChild(createText(sc.subtitle, 14, "Regular", C.neutral400));
      
      const placeholderContent = createFrame("Mockup Canvas", "HORIZONTAL", 24, 24, C.surfaceCard, 12);
      placeholderContent.resize(1376, 240);
      placeholderContent.appendChild(createText("[Editable Screen Representation — Refer to Page 05 for Deep Detail]", 14, "Medium", C.neutral500));
      scr.appendChild(placeholderContent);
      screenGrid.appendChild(scr);
    }
    page.appendChild(screenGrid);
  }

  // =========================================================================
  // PAGE 05 — Security Findings & Remediation (Core Deep-Dive)
  // =========================================================================
  {
    const page = createdPages["05 — Security Findings & Remediation"];
    figma.currentPage = page;

    const detailScreen = createFrame("Finding Detail View (/findings/cwe-208)", "VERTICAL", 40, 24, C.bgDark, 16);
    detailScreen.resize(1440, 1050);

    // Top Navigation Breadcrumb
    const breadcrumb = figma.createFrame();
    breadcrumb.layoutMode = "HORIZONTAL";
    breadcrumb.itemSpacing = 8;
    breadcrumb.fills = [];
    breadcrumb.appendChild(createText("Findings", 13, "Regular", C.neutral400));
    breadcrumb.appendChild(createText("/", 13, "Regular", C.neutral500));
    breadcrumb.appendChild(createText("acme/payment-api", 13, "Regular", C.neutral400));
    breadcrumb.appendChild(createText("/", 13, "Regular", C.neutral500));
    breadcrumb.appendChild(createText("PR #42", 13, "Regular", C.primaryBlue));
    breadcrumb.appendChild(createText("/", 13, "Regular", C.neutral500));
    breadcrumb.appendChild(createText("CWE-208 Timing Attack", 13, "Medium", C.white));
    detailScreen.appendChild(breadcrumb);

    // Title Row
    const titleRow = figma.createFrame();
    titleRow.layoutMode = "HORIZONTAL";
    titleRow.itemSpacing = 16;
    titleRow.fills = [];
    titleRow.appendChild(createText("Timing Attack in Signature Check", 28, "Bold", C.white));
    titleRow.appendChild(createBadge("CRITICAL SEVERITY", C.roseAccent, C.roseDark));
    titleRow.appendChild(createBadge("1-CLICK FIX READY", C.emeraldAccent, C.emeraldDark));
    detailScreen.appendChild(titleRow);

    detailScreen.appendChild(
      createText(
        "File: src/auth/verify.ts:42 · Direct string equality comparison leaks byte-by-byte timing side-channel data on token mismatch.",
        14,
        "Regular",
        C.neutral300
      )
    );

    // Split Diff Preview
    const splitDiff = createFrame("Split Diff Viewer", "HORIZONTAL", 24, 24, C.surfaceCard, 12);
    splitDiff.resize(1360, 360);

    const leftCol = createFrame("Original Vulnerable", "VERTICAL", 20, 12, C.roseDark, 8);
    leftCol.resize(650, 310);
    leftCol.appendChild(createText("BEFORE (VULNERABLE FILE ON DISK)", 12, "Bold", C.roseAccent));
    leftCol.appendChild(
      createText(
        "39  export function verifyWebhookSignature(\n40    clientToken: string,\n41    serverSecret: string\n42  ): boolean {\n43 -  if (clientToken === serverSecret) {\n44      return true;\n45    }\n46    return false;\n47  }",
        12,
        "Regular",
        C.roseAccent
      )
    );
    splitDiff.appendChild(leftCol);

    const rightCol = createFrame("Proposed Safe Remedy", "VERTICAL", 20, 12, C.emeraldDark, 8);
    rightCol.resize(650, 310);
    rightCol.appendChild(createText("PROPOSED REMEDY (DETERMINISTIC PATCH)", 12, "Bold", C.emeraldAccent));
    rightCol.appendChild(
      createText(
        "39  export function verifyWebhookSignature(\n40    clientToken: string,\n41    serverSecret: string\n42  ): boolean {\n43 +  const clientBuf = Buffer.from(clientToken);\n44 +  const secretBuf = Buffer.from(serverSecret);\n45 +  if (clientBuf.length === secretBuf.length && \n46 +      crypto.timingSafeEqual(clientBuf, secretBuf)) {\n47      return true;\n48    }\n49    return false;\n50  }",
        12,
        "Regular",
        C.emeraldAccent
      )
    );
    splitDiff.appendChild(rightCol);
    detailScreen.appendChild(splitDiff);

    // Actions & Verification Bar
    const actionBar = createFrame("Remediation Action Bar", "HORIZONTAL", 20, 16, C.surfaceCard, 12);
    actionBar.resize(1360, 70);
    actionBar.appendChild(createButton("Apply Safe Auto-Fix to Pull Request", "emerald"));
    actionBar.appendChild(createButton("Create GitHub Issue Ticket", "primary"));
    actionBar.appendChild(createButton("Reject / Mark False Positive", "secondary"));
    actionBar.appendChild(createText("Status: Deterministic patch tested with 38 unit test suites (100% green).", 12, "Regular", C.neutral400));
    detailScreen.appendChild(actionBar);

    page.appendChild(detailScreen);
  }

  // =========================================================================
  // PAGE 06 — User Flows
  // =========================================================================
  {
    const page = createdPages["06 — User Flows"];
    figma.currentPage = page;

    const flowsFrame = createFrame("Core Product User Flows", "VERTICAL", 48, 36, C.bgDark, 16);
    flowsFrame.resize(1600, 1100);

    flowsFrame.appendChild(createText("INTERACTIVE USER FLOW ARCHITECTURE", 12, "Bold", C.emeraldAccent));
    flowsFrame.appendChild(createText("Step-by-Step State Transition Pathways", 32, "Bold", C.white));

    const flows = [
      {
        title: "Flow A — Scan, Detect & Triage",
        path: "Developer Opens Workspace ➔ Trigger AST Scan (Ctrl+Shift+B) ➔ Real-time Progress ➔ Findings Grouped by CWE/Severity ➔ Filter by Critical ➔ Select Finding ➔ Inspect Vulnerable AST Node.",
      },
      {
        title: "Flow B — In-Editor 1-Click Remediation",
        path: "Select CWE-208 Finding ➔ Webview Inspector Opens ➔ View Side-by-Side Unified Diff ➔ Review AI Explanation with Consent Gate ➔ Click 'Apply Auto-Fix' ➔ Re-scan Runs ➔ Verify 0 Remaining Defects.",
      },
      {
        title: "Flow C — GitHub CI/CD & Merge Gate Enforcer",
        path: "Git Commit Attempt ➔ Local Pre-Commit Hook Intercepts Leaked AWS Key ➔ Git Commit Blocked ➔ Developer Removes Key ➔ Git Push ➔ GitHub Webhook ➔ .buggers.yml Gate Evaluates ➔ Check Run Passes ➔ PR Merged.",
      },
      {
        title: "Flow D — AI Provider Resilient Fallback",
        path: "Primary AI Model Invocation ➔ Provider Returns 404/503 ➔ Fallback Router Engages ➔ Candidate 2 (Gemini Flash) Queried ➔ Sanitized AST Context Injected ➔ Validated JSON Returned ➔ Zero User Interruption.",
      },
    ];

    for (const f of flows) {
      const card = createFrame(f.title, "VERTICAL", 24, 12, C.surfaceCard, 12);
      card.resize(1500, 140);
      card.appendChild(createText(f.title, 18, "Semi Bold", C.white));
      card.appendChild(createText(f.path, 13, "Regular", C.neutral300));
      flowsFrame.appendChild(card);
    }
    page.appendChild(flowsFrame);
  }

  // =========================================================================
  // PAGE 07 — Interactive Prototype
  // =========================================================================
  {
    const page = createdPages["07 — Interactive Prototype"];
    figma.currentPage = page;

    const protoFrame = createFrame("Interactive Prototype Connections Map", "VERTICAL", 48, 24, C.bgDark, 16);
    protoFrame.resize(1400, 700);

    protoFrame.appendChild(createText("PROTOTYPE INTERACTION SPECIFICATION", 12, "Bold", C.emeraldAccent));
    protoFrame.appendChild(createText("Clickable Hotspots & Target Frames", 28, "Bold", C.white));
    protoFrame.appendChild(
      createText(
        "All frames on Page 04 and Page 05 are designed with standard 1440px desktop viewports, ready for Figma Prototype Smart Animate interactions from Dashboard to Finding Details to Remediation.",
        14,
        "Regular",
        C.neutral400
      )
    );
    page.appendChild(protoFrame);
  }

  // =========================================================================
  // PAGE 08 — Responsive Layouts
  // =========================================================================
  {
    const page = createdPages["08 — Responsive Layouts"];
    figma.currentPage = page;

    const respFrame = createFrame("Multi-Device Responsive Breakpoints", "VERTICAL", 48, 32, C.bgDark, 16);
    respFrame.resize(1600, 900);

    respFrame.appendChild(createText("RESPONSIVE DESIGN ADAPTATIONS", 12, "Bold", C.emeraldAccent));
    respFrame.appendChild(createText("Desktop (1440px), Tablet (768px), Mobile (375px), VS Code Panel (300px)", 28, "Bold", C.white));

    const bpRow = figma.createFrame();
    bpRow.layoutMode = "HORIZONTAL";
    bpRow.itemSpacing = 32;
    bpRow.fills = [];

    const bps = [
      { name: "Desktop Wide", w: 450, h: 500, desc: "Full split-diff view, collapsible navigation sidebar, multi-column analytics grid." },
      { name: "Tablet (768px)", w: 350, h: 500, desc: "Stacked metrics cards, collapsed icon-only sidebar, modal diff inspection." },
      { name: "Mobile (375px)", w: 250, h: 500, desc: "Drawer bottom-sheet navigation, full-width single-finding stack, tabbed Before/After diff." },
      { name: "VS Code Host Panel", w: 300, h: 500, desc: "Ultra-compact diagnostic tree, inline quick-fix buttons, native theme token inheritance." },
    ];

    for (const b of bps) {
      const box = createFrame(b.name, "VERTICAL", 20, 12, C.surfaceCard, 12);
      box.resize(b.w, b.h);
      box.appendChild(createText(b.name, 16, "Semi Bold", C.white));
      box.appendChild(createText(b.desc, 12, "Regular", C.neutral400));
      bpRow.appendChild(box);
    }
    respFrame.appendChild(bpRow);
    page.appendChild(respFrame);
  }

  // =========================================================================
  // PAGE 09 — Error, Loading & Empty States
  // =========================================================================
  {
    const page = createdPages["09 — Error, Loading & Empty States"];
    figma.currentPage = page;

    const stateFrame = createFrame("Edge Cases, Error Recovery & Loading States", "VERTICAL", 48, 32, C.bgDark, 16);
    stateFrame.resize(1600, 900);

    stateFrame.appendChild(createText("STATE HANDLING CATALOG", 12, "Bold", C.emeraldAccent));
    stateFrame.appendChild(createText("Resilient UI Feedback for Every Condition", 28, "Bold", C.white));

    const stateRow = figma.createFrame();
    stateRow.layoutMode = "HORIZONTAL";
    stateRow.itemSpacing = 24;
    stateRow.fills = [];

    const states = [
      { title: "Empty Findings (Clean Release)", badge: "SUCCESS 200", color: C.emeraldAccent, desc: "Zero security flaws detected. Clean release gate approved for merge." },
      { title: "Scan in Progress (Skeleton)", badge: "LOADING STATE", color: C.primaryBlue, desc: "Shimmer skeleton layout with pulsating progress indicator and stage counter." },
      { title: "Webhook Secret Missing (401)", badge: "AUTH ERROR", color: C.amberAccent, desc: "HMAC signature failed or GITHUB_WEBHOOK_SECRET missing in environment." },
      { title: "AI Chain Exhaustion (503)", badge: "RECOVERABLE ERROR", color: C.roseAccent, desc: "All 3 LLM providers failed. Local AST findings preserved, prompt retry enabled." },
    ];

    for (const st of states) {
      const b = createFrame(st.title, "VERTICAL", 24, 16, C.surfaceCard, 12);
      b.resize(340, 400);
      b.appendChild(createBadge(st.badge, st.color, C.surfaceDark));
      b.appendChild(createText(st.title, 16, "Semi Bold", C.white));
      b.appendChild(createText(st.desc, 13, "Regular", C.neutral400));
      stateRow.appendChild(b);
    }
    stateFrame.appendChild(stateRow);
    page.appendChild(stateFrame);
  }

  // =========================================================================
  // PAGE 10 — Developer Handoff
  // =========================================================================
  {
    const page = createdPages["10 — Developer Handoff"];
    figma.currentPage = page;

    const handoffFrame = createFrame("Developer Handoff & Technical Implementation Specs", "VERTICAL", 48, 24, C.bgDark, 16);
    handoffFrame.resize(1500, 800);

    handoffFrame.appendChild(createText("DEVELOPER HANDOFF SPECIFICATIONS", 12, "Bold", C.emeraldAccent));
    handoffFrame.appendChild(createText("Component Props, CSS Tokens & API Endpoints", 28, "Bold", C.white));

    const specText = [
      "• Frontend Stack: TanStack Start (Nitro server runtime), TanStack Router (File-based type-safe routes), Tailwind CSS v4, Lucide Icons.",
      "• State Management: TanStack Query v5 with server functions (createServerFn).",
      "• Design System Tokens: Mapped to OKLCH CSS variables in src/styles.css (--background, --surface, --primary, --risk-critical, etc.).",
      "• Key Server Endpoints: POST /api/scan, POST /api/webhook/github, POST /api/remediation/apply, GET /api/analytics/velocity.",
      "• Database: Supabase PostgreSQL with pgcrypto encrypted OAuth tokens and Row Level Security (RLS).",
      "• VS Code Extension: Pure VS Code Extension API running local AST parser without telemetry in extensions/buggers-vscode.",
    ];

    for (const line of specText) {
      handoffFrame.appendChild(createText(line, 14, "Regular", C.neutral300));
    }
    page.appendChild(handoffFrame);
  }

  // =========================================================================
  // PAGE 11 — Academic Documentation
  // =========================================================================
  {
    const page = createdPages["11 — Academic Documentation"];
    figma.currentPage = page;

    const acadFrame = createFrame("Academic College Project Presentation & Defense", "VERTICAL", 48, 24, C.bgDark, 16);
    acadFrame.resize(1500, 950);

    acadFrame.appendChild(createText("ACADEMIC PROJECT REPORT", 12, "Bold", C.emeraldAccent));
    acadFrame.appendChild(createText("Problem Statement, Methodology, Evaluation & Findings", 28, "Bold", C.white));

    const sections = [
      {
        head: "1. Problem Statement",
        body: "Modern code review suffers from a fundamental paradox: generic LLMs hallucinate phantom line numbers and generate noisy speculative comments, while human software engineers face severe burnout reviewing massive multi-thousand-line pull requests.",
      },
      {
        head: "2. Research Methodology & Solution",
        body: "Buggers solves this by grounding LLM analysis in deterministic AST (Abstract Syntax Tree) structures and historical git rollback churn metrics. Line numbers are mathematically verified against unified diff trees before any recommendation is published.",
      },
      {
        head: "3. Verification & Test Results",
        body: "Verified across 111 Vitest test suites (17 test files) and 38/38 VS Code extension test suites (100% green). Demonstrated 0 false positives on clean production patterns and 100% detection rate across 21 OWASP vulnerability categories.",
      },
      {
        head: "4. Project Attribution & Team",
        body: "Designed and engineered as a major project at Babu Banarasi Das University (BBDU) by team: Jaidev Yadav, Khushi Sharma, Madhvi Mishra, and Kumkum.",
      },
    ];

    for (const sec of sections) {
      const sBox = createFrame(sec.head, "VERTICAL", 20, 8, C.surfaceCard, 10);
      sBox.resize(1400, 110);
      sBox.appendChild(createText(sec.head, 16, "Semi Bold", C.emeraldAccent));
      sBox.appendChild(createText(sec.body, 13, "Regular", C.neutral300));
      acadFrame.appendChild(sBox);
    }
    page.appendChild(acadFrame);
  }

  // Set active page to Cover
  figma.currentPage = createdPages["00 — Cover & Project Overview"];
  figma.viewport.scrollAndZoomIntoView([createdPages["00 — Cover & Project Overview"].children[0]]);

  figma.notify("✅ Buggers Figma Project successfully generated with all 12 pages & components!", { timeout: 6000 });
}

main().catch((err) => {
  console.error("Figma Generator Error:", err);
  figma.notify("Error generating project: " + err.message, { error: true });
});
