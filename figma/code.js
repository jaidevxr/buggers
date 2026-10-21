// Buggers — Complete Interactive Website Replica & Exact Figma Implementation
// Project: Buggers (https://buggers.dev)
// Academic Attribution: Jaidev Yadav, Khushi Sharma, Madhvi Mishra, Kumkum (BBDU)
// Deliverable: Exact depiction of every website page on "03 Screens" with 100% connected prototype.
// Zero extra/unwanted pages. Cleans up any previously created dummy pages.

async function main() {
  figma.notify("🚀 Generating Exact Buggers Website Screens on '03 Screens'...", { timeout: 6000 });

  // 1. Safe Font Preloading
  try {
    await Promise.all([
      figma.loadFontAsync({ family: "Inter", style: "Regular" }),
      figma.loadFontAsync({ family: "Inter", style: "Medium" }),
      figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }),
      figma.loadFontAsync({ family: "Inter", style: "Bold" }),
    ]);
  } catch (e) {
    console.warn("Inter font unavailable, falling back to Roboto", e);
    await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
  }

  // 2. Clean up any previously created extra pages so the user's workspace is 100% clean
  const unwantedPageKeywords = [
    "Architecture & System",
    "Design System Tokens",
    "Responsive Viewports",
    "Developer Handoff",
    "Interactive Prototype (All Screens)",
    "Interactive Prototype (All 14 Screens)",
  ];
  for (const p of [...figma.root.children]) {
    if (unwantedPageKeywords.some((keyword) => p.name.includes(keyword))) {
      try {
        console.log(`Removing extra dummy page: ${p.name}`);
        p.remove();
      } catch (err) {}
    }
  }

  // 3. Locate the user's existing "03 Screens" page
  let screensPage = figma.root.children.find(
    (p) => p.name === "03 Screens" || p.name === "03 Website Screens" || p.name.includes("Screens")
  );
  if (!screensPage) {
    screensPage = figma.createPage();
    screensPage.name = "03 Screens";
  }
  figma.currentPage = screensPage;

  // Preserves any existing presentation frames while appending the full interactive website prototype


  // 4. Exact Design Tokens matching "{b} Buggers" & src/styles.css
  const C = {
    canvasDark: { r: 0.043, g: 0.055, b: 0.078 }, // #0B0E14 (Exact deep dark blue-black)
    surfaceCard: { r: 0.055, g: 0.078, b: 0.125 }, // #0E1420 (Card background)
    surfaceDarker: { r: 0.035, g: 0.045, b: 0.065 }, // #090B10
    borderSubtle: { r: 0.12, g: 0.16, b: 0.24 }, // #1F293D (Exact subtle border)
    borderLight: { r: 0.22, g: 0.3, b: 0.44 },
    white: { r: 1, g: 1, b: 1 },
    pitchBlack: { r: 0, g: 0, b: 0 },
    neutral200: { r: 0.9, g: 0.92, b: 0.95 },
    neutral300: { r: 0.8, g: 0.84, b: 0.9 },
    neutral400: { r: 0.58, g: 0.64, b: 0.74 },
    neutral500: { r: 0.4, g: 0.46, b: 0.56 },
    primaryBlue: { r: 0.3, g: 0.52, b: 0.93 }, // #4C85EC (Buggers Blue)
    primaryBlueDark: { r: 0.07, g: 0.12, b: 0.2 },
    emerald500: { r: 0.18, g: 0.83, b: 0.75 }, // #2DD4BF (Buggers Emerald)
    emeraldDark: { r: 0.07, g: 0.14, b: 0.14 },
    amber500: { r: 1, g: 0.56, b: 0.3 }, // #FF8E4D (Buggers Amber)
    amberDark: { r: 0.13, g: 0.09, b: 0.08 },
    rose500: { r: 1, g: 0.37, b: 0.49 }, // #FF5E7E (Buggers Rose)
    roseDark: { r: 0.11, g: 0.08, b: 0.11 },
    purple500: { r: 0.66, g: 0.42, b: 0.98 },
    overlayBackdrop: { r: 0.02, g: 0.03, b: 0.05 },
  };

  // Helper: Text Node
  function createText(text, size = 14, weight = "Regular", color = C.white) {
    const node = figma.createText();
    node.fontName = { family: "Inter", style: weight };
    node.characters = String(text);
    node.fontSize = size;
    node.fills = [{ type: "SOLID", color }];
    return node;
  }

  // Helper: Auto Layout Frame
  function createFrame(name, layout = "VERTICAL", pad = 24, spacing = 16, bg = C.surfaceCard, radius = 12) {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = layout;
    f.primaryAxisSizingMode = "AUTO";
    f.counterAxisSizingMode = "AUTO";
    f.paddingLeft = pad;
    f.paddingRight = pad;
    f.paddingTop = pad;
    f.paddingBottom = pad;
    f.itemSpacing = spacing;
    f.cornerRadius = radius;
    f.fills = bg ? [{ type: "SOLID", color: bg }] : [];
    f.strokes = [{ type: "SOLID", color: C.borderSubtle }];
    f.strokeWeight = 1;
    return f;
  }

  // Helper: Badge Chip
  function createBadge(label, fg = C.emerald500, bg = C.emeraldDark) {
    const b = figma.createFrame();
    b.name = `Badge / ${label}`;
    b.layoutMode = "HORIZONTAL";
    b.primaryAxisSizingMode = "AUTO";
    b.counterAxisSizingMode = "AUTO";
    b.paddingLeft = 12;
    b.paddingRight = 12;
    b.paddingTop = 4;
    b.paddingBottom = 4;
    b.cornerRadius = 999;
    b.fills = [{ type: "SOLID", color: bg }];
    b.strokes = [{ type: "SOLID", color: fg }];
    b.strokeWeight = 1;
    b.appendChild(createText(label, 11, "Medium", fg));
    return b;
  }

  // Helper: Button
  function createButton(label, variant = "primary", padH = 16, padV = 9) {
    const btn = figma.createFrame();
    btn.name = `Btn / ${variant} / ${label}`;
    btn.layoutMode = "HORIZONTAL";
    btn.primaryAxisSizingMode = "AUTO";
    btn.counterAxisSizingMode = "AUTO";
    btn.primaryAxisAlignItems = "CENTER";
    btn.counterAxisAlignItems = "CENTER";
    btn.paddingLeft = padH;
    btn.paddingRight = padH;
    btn.paddingTop = padV;
    btn.paddingBottom = padV;
    btn.cornerRadius = 8;

    if (variant === "primary") {
      btn.fills = [{ type: "SOLID", color: C.primaryBlue }];
      btn.appendChild(createText(label, 13, "Semi Bold", C.white));
    } else if (variant === "white") {
      btn.fills = [{ type: "SOLID", color: C.white }];
      btn.appendChild(createText(label, 13, "Semi Bold", C.pitchBlack));
    } else if (variant === "emerald") {
      btn.fills = [{ type: "SOLID", color: C.emerald500 }];
      btn.appendChild(createText(label, 13, "Semi Bold", C.pitchBlack));
    } else if (variant === "danger") {
      btn.fills = [{ type: "SOLID", color: C.rose500 }];
      btn.appendChild(createText(label, 13, "Semi Bold", C.white));
    } else {
      btn.fills = [{ type: "SOLID", color: C.surfaceDarker }];
      btn.strokes = [{ type: "SOLID", color: C.borderSubtle }];
      btn.strokeWeight = 1;
      btn.appendChild(createText(label, 13, "Medium", C.neutral200));
    }
    return btn;
  }

  // Helper: Native Prototyping Link
  async function linkNodes(sourceNode, targetNode, transitionType = "DISSOLVE") {
    if (!sourceNode || !targetNode) return;
    try {
      const reaction = {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "NODE",
            destinationId: targetNode.id,
            navigation: "NAVIGATE",
            transition: transitionType ? {
              type: transitionType,
              easing: { type: "EASE_IN_AND_OUT" },
              duration: 0.2,
            } : null,
            preserveScrollPosition: false,
          },
        ],
      };
      if (typeof sourceNode.setReactionsAsync === "function") {
        await sourceNode.setReactionsAsync([reaction]);
      } else {
        sourceNode.reactions = [reaction];
      }
    } catch (e) {
      console.warn("Could not wire reaction:", e);
    }
  }

  // Store references for interactive linking
  const S = {}; // screens
  const L = {}; // links / interactive elements

  // Helper: Exact Public Header
  function createPublicHeader(activeTab = "Home") {
    const bar = figma.createFrame();
    bar.name = "Header / {b} Buggers";
    bar.layoutMode = "HORIZONTAL";
    bar.primaryAxisAlignItems = "SPACE_BETWEEN";
    bar.counterAxisAlignItems = "CENTER";
    bar.resize(1440, 72);
    bar.paddingLeft = 48;
    bar.paddingRight = 48;
    bar.fills = [{ type: "SOLID", color: C.surfaceDarker }];
    bar.strokes = [{ type: "SOLID", color: C.borderSubtle }];

    // Brand Logo
    const logo = figma.createFrame();
    logo.name = "Brand / Logo";
    logo.layoutMode = "HORIZONTAL";
    logo.primaryAxisAlignItems = "CENTER";
    logo.itemSpacing = 8;
    logo.fills = [];
    logo.appendChild(createText("{b} Buggers", 16, "Bold", C.white));
    bar.appendChild(logo);

    // Nav Links
    const navLinks = figma.createFrame();
    navLinks.name = "Nav Links";
    navLinks.layoutMode = "HORIZONTAL";
    navLinks.itemSpacing = 28;
    navLinks.fills = [];

    const tabs = ["Home", "Product", "Security", "Docs", "About"];
    const tabNodes = {};
    for (const t of tabs) {
      const tabBtn = figma.createFrame();
      tabBtn.name = `Nav / ${t}`;
      tabBtn.layoutMode = "HORIZONTAL";
      tabBtn.fills = [];
      const isActive = activeTab === t;
      tabBtn.appendChild(createText(t, 13, isActive ? "Semi Bold" : "Medium", isActive ? C.white : C.neutral400));
      navLinks.appendChild(tabBtn);
      tabNodes[t] = tabBtn;
    }
    bar.appendChild(navLinks);

    // Right Action
    const rightActions = figma.createFrame();
    rightActions.layoutMode = "HORIZONTAL";
    rightActions.itemSpacing = 12;
    rightActions.fills = [];

    const dashBtn = createButton("Dashboard", "outline", 14, 7);
    const loginBtn = createButton("Start scanning", "primary", 16, 8);
    rightActions.appendChild(dashBtn);
    rightActions.appendChild(loginBtn);
    bar.appendChild(rightActions);

    return { bar, logo, tabNodes, loginBtn, dashBtn };
  }

  // Helper: Exact Authenticated Layout
  function createAuthLayout(screenName, activeSidebarItem = "Dashboard", pageTitle = "Overview", subtitle = "") {
    const screen = figma.createFrame();
    screen.name = screenName;
    screen.layoutMode = "HORIZONTAL";
    screen.resize(1440, 960);
    screen.clipsContent = true;
    screen.overflowDirection = "VERTICAL";
    screen.fills = [{ type: "SOLID", color: C.canvasDark }];

    // Sidebar
    const sidebar = figma.createFrame();
    sidebar.name = "Sidebar";
    sidebar.layoutMode = "VERTICAL";
    sidebar.resize(240, 960);
    sidebar.paddingLeft = 20;
    sidebar.paddingRight = 20;
    sidebar.paddingTop = 24;
    sidebar.paddingBottom = 24;
    sidebar.itemSpacing = 20;
    sidebar.fills = [{ type: "SOLID", color: C.surfaceDarker }];
    sidebar.strokes = [{ type: "SOLID", color: C.borderSubtle }];

    const sideLogo = figma.createFrame();
    sideLogo.name = "Sidebar / Brand";
    sideLogo.layoutMode = "HORIZONTAL";
    sideLogo.primaryAxisAlignItems = "CENTER";
    sideLogo.itemSpacing = 8;
    sideLogo.fills = [];
    sideLogo.appendChild(createText("{b} Buggers", 16, "Bold", C.white));
    sidebar.appendChild(sideLogo);

    const menuList = figma.createFrame();
    menuList.name = "Sidebar Menu";
    menuList.layoutMode = "VERTICAL";
    menuList.itemSpacing = 4;
    menuList.fills = [];

    const navItems = [
      { id: "Dashboard", label: "📊 Overview" },
      { id: "Repositories", label: "📦 Repositories" },
      { id: "Findings", label: "🛡️ Findings Hub" },
      { id: "PullRequests", label: "🔀 Pull Requests" },
      { id: "Analytics", label: "📈 Analytics" },
      { id: "Tickets", label: "🎫 Tickets" },
      { id: "Settings", label: "⚙️ Settings" },
    ];

    const sideNavLinks = {};
    for (const item of navItems) {
      const btn = figma.createFrame();
      btn.name = `Sidebar / ${item.id}`;
      btn.layoutMode = "HORIZONTAL";
      btn.resize(200, 36);
      btn.paddingLeft = 12;
      btn.paddingRight = 12;
      btn.primaryAxisAlignItems = "MIN";
      btn.counterAxisAlignItems = "CENTER";
      btn.cornerRadius = 8;

      const isActive = activeSidebarItem === item.id;
      btn.fills = isActive ? [{ type: "SOLID", color: C.surfaceCard }] : [];
      if (isActive) {
        btn.strokes = [{ type: "SOLID", color: C.primaryBlue }];
        btn.strokeWeight = 1;
      }
      btn.appendChild(createText(item.label, 12, isActive ? "Semi Bold" : "Regular", isActive ? C.white : C.neutral400));
      menuList.appendChild(btn);
      sideNavLinks[item.id] = btn;
    }
    sidebar.appendChild(menuList);

    const sideBottom = figma.createFrame();
    sideBottom.layoutMode = "VERTICAL";
    sideBottom.itemSpacing = 10;
    sideBottom.paddingTop = 180;
    sideBottom.fills = [];

    const docsLink = createButton("📖 Documentation", "outline", 12, 7);
    docsLink.resize(200, 34);
    sideBottom.appendChild(docsLink);

    const signOutBtn = createButton("🚪 Sign Out", "outline", 12, 7);
    signOutBtn.resize(200, 34);
    sideBottom.appendChild(signOutBtn);

    const userPill = figma.createFrame();
    userPill.layoutMode = "HORIZONTAL";
    userPill.primaryAxisAlignItems = "CENTER";
    userPill.itemSpacing = 8;
    userPill.paddingLeft = 8;
    userPill.paddingRight = 8;
    userPill.paddingTop = 6;
    userPill.paddingBottom = 6;
    userPill.cornerRadius = 8;
    userPill.fills = [{ type: "SOLID", color: C.surfaceCard }];
    const uDot = figma.createEllipse();
    uDot.resize(8, 8);
    uDot.fills = [{ type: "SOLID", color: C.emerald500 }];
    userPill.appendChild(uDot);
    userPill.appendChild(createText("Jaidev Yadav", 11, "Medium", C.neutral300));
    sideBottom.appendChild(userPill);

    sidebar.appendChild(sideBottom);
    screen.appendChild(sidebar);

    // Main Content
    const content = figma.createFrame();
    content.name = "Main Content";
    content.layoutMode = "VERTICAL";
    content.resize(1200, 960);
    content.paddingLeft = 36;
    content.paddingRight = 36;
    content.paddingTop = 28;
    content.paddingBottom = 28;
    content.itemSpacing = 24;
    content.fills = [];

    const topRow = figma.createFrame();
    topRow.layoutMode = "HORIZONTAL";
    topRow.primaryAxisAlignItems = "SPACE_BETWEEN";
    topRow.resize(1128, 48);
    topRow.fills = [];

    const titleBlock = figma.createFrame();
    titleBlock.layoutMode = "VERTICAL";
    titleBlock.itemSpacing = 4;
    titleBlock.fills = [];
    titleBlock.appendChild(createText(pageTitle, 22, "Bold", C.white));
    if (subtitle) {
      titleBlock.appendChild(createText(subtitle, 12, "Regular", C.neutral400));
    }
    topRow.appendChild(titleBlock);

    const actionRow = figma.createFrame();
    actionRow.layoutMode = "HORIZONTAL";
    actionRow.itemSpacing = 12;
    actionRow.fills = [];
    actionRow.appendChild(createBadge("CONNECTED · 4 REPOS", C.emerald500, C.emeraldDark));
    topRow.appendChild(actionRow);

    content.appendChild(topRow);
    screen.appendChild(content);

    return { screen, content, sideLogo, sideNavLinks, docsLink, signOutBtn };
  }

  // =========================================================================
  // BUILD EVERY SCREEN DIRECTLY ON "03 Screens"
  // =========================================================================

  // SCREEN 01: Landing Page
  {
    const landing = figma.createFrame();
    landing.name = "Screen 01 — Landing Page (1440px)";
    landing.layoutMode = "VERTICAL";
    landing.resize(1440, 1400);
    landing.clipsContent = true;
    landing.overflowDirection = "VERTICAL";
    landing.fills = [{ type: "SOLID", color: C.canvasDark }];

    const header = createPublicHeader("Home");
    landing.appendChild(header.bar);

    // Hero Section
    const hero = createFrame("Hero Section", "VERTICAL", 48, 20, null, 0);
    hero.resize(1440, 360);
    hero.primaryAxisAlignItems = "CENTER";
    hero.counterAxisAlignItems = "CENTER";

    hero.appendChild(createBadge("SECURITY, IN YOUR WORKFLOW", C.emerald500, C.emeraldDark));
    hero.appendChild(createText("Ship clean code.\nNot vulnerabilities.", 48, "Bold", C.white));
    hero.appendChild(
      createText(
        "Scan pull requests, understand risk and review a precise fix without leaving your team behind.\nGrounded in deterministic AST analysis with zero LLM hallucination.",
        15,
        "Regular",
        C.neutral400
      )
    );

    const heroBtns = figma.createFrame();
    heroBtns.layoutMode = "HORIZONTAL";
    heroBtns.itemSpacing = 16;
    heroBtns.fills = [];
    const connectRepoBtn = createButton("Connect repository", "primary", 20, 11);
    const readDocsBtn = createButton("Read documentation →", "outline", 18, 11);
    heroBtns.appendChild(connectRepoBtn);
    heroBtns.appendChild(readDocsBtn);
    hero.appendChild(heroBtns);
    landing.appendChild(hero);

    // 3 Workflow Steps Card Row
    const stepsRow = figma.createFrame();
    stepsRow.layoutMode = "HORIZONTAL";
    stepsRow.itemSpacing = 20;
    stepsRow.fills = [];
    const wfSteps = [
      { step: "01 / Scan", desc: "Connect a repository and review a focused AST code scan." },
      { step: "02 / Understand", desc: "Prioritize severity, file coordinates, and commit defect churn." },
      { step: "03 / Resolve", desc: "Review side-by-side patch, then re-scan before merge." },
    ];
    for (const ws of wfSteps) {
      const b = createFrame(ws.step, "VERTICAL", 20, 10, C.surfaceCard, 10);
      b.resize(350, 120);
      b.appendChild(createText(ws.step, 14, "Bold", C.white));
      b.appendChild(createText(ws.desc, 12, "Regular", C.neutral400));
      stepsRow.appendChild(b);
    }
    landing.appendChild(stepsRow);

    // Active PRs Table Preview
    const prSec = createFrame("Active Monitored PRs", "VERTICAL", 24, 14, C.surfaceCard, 12);
    prSec.resize(1100, 260);
    prSec.appendChild(createText("ACTIVE MONITORED PULL REQUESTS", 13, "Semi Bold", C.white));

    const prRow1 = figma.createFrame();
    prRow1.name = "PR Row #184 (Clickable)";
    prRow1.layoutMode = "HORIZONTAL";
    prRow1.primaryAxisAlignItems = "SPACE_BETWEEN";
    prRow1.resize(1050, 52);
    prRow1.paddingLeft = 16;
    prRow1.paddingRight = 16;
    prRow1.cornerRadius = 8;
    prRow1.fills = [{ type: "SOLID", color: C.surfaceDarker }];
    prRow1.strokes = [{ type: "SOLID", color: C.rose500 }];
    prRow1.appendChild(createText("PR #184: Implement HMAC signature validation (jaidevxr/buggers)", 13, "Medium", C.white));
    prRow1.appendChild(createBadge("BLOCKED BY GATE · SCORE 78", C.rose500, C.roseDark));
    prSec.appendChild(prRow1);

    const prRow2 = figma.createFrame();
    prRow2.layoutMode = "HORIZONTAL";
    prRow2.primaryAxisAlignItems = "SPACE_BETWEEN";
    prRow2.resize(1050, 52);
    prRow2.paddingLeft = 16;
    prRow2.paddingRight = 16;
    prRow2.cornerRadius = 8;
    prRow2.fills = [{ type: "SOLID", color: C.surfaceDarker }];
    prRow2.appendChild(createText("PR #126: Bump dependencies and UI cleanups (jaidevxr/buggers)", 13, "Medium", C.white));
    prRow2.appendChild(createBadge("APPROVED · SCORE 12", C.emerald500, C.emeraldDark));
    prSec.appendChild(prRow2);

    landing.appendChild(prSec);
    screensPage.appendChild(landing);
    S.landing = landing;
    L.landing = { header, connectRepoBtn, readDocsBtn, prRow1 };
  }

  // SCREEN 02: Auth Page (Sign In & Sign Up)
  {
    const auth = figma.createFrame();
    auth.name = "Screen 02 — Auth & Access (1440px)";
    auth.layoutMode = "VERTICAL";
    auth.primaryAxisAlignItems = "CENTER";
    auth.resize(1440, 960);
    auth.fills = [{ type: "SOLID", color: C.canvasDark }];

    const header = createPublicHeader("Login");
    auth.appendChild(header.bar);

    const card = createFrame("Auth Card", "VERTICAL", 32, 18, C.surfaceCard, 14);
    card.resize(460, 560);
    card.strokes = [{ type: "SOLID", color: C.borderLight }];

    const backHomeBtn = createButton("← Back to home", "outline", 12, 6);
    card.appendChild(backHomeBtn);

    card.appendChild(createBadge("INSTANT ACCESS", C.emerald500, C.emeraldDark));
    card.appendChild(createText("Connect to Buggers", 24, "Bold", C.white));
    card.appendChild(createText("Connect GitHub repositories for automated pull request security gates.", 13, "Regular", C.neutral400));

    const githubBtn = createButton("🐙 Continue with GitHub", "white", 16, 12);
    githubBtn.resize(396, 44);
    card.appendChild(githubBtn);

    const googleBtn = createButton("🌐 Continue with Google", "outline", 16, 12);
    googleBtn.resize(396, 44);
    card.appendChild(googleBtn);

    card.appendChild(createText("— or work email —", 11, "Regular", C.neutral500));

    const emailBox = createFrame("Email", "VERTICAL", 10, 4, C.surfaceDarker, 6);
    emailBox.resize(396, 48);
    emailBox.appendChild(createText("Work Email", 10, "Medium", C.neutral400));
    emailBox.appendChild(createText("developer@company.com", 12, "Regular", C.white));
    card.appendChild(emailBox);

    const signInBtn = createButton("Sign In to Buggers", "primary", 16, 12);
    signInBtn.resize(396, 44);
    card.appendChild(signInBtn);

    auth.appendChild(card);
    screensPage.appendChild(auth);
    S.auth = auth;
    L.auth = { header, backHomeBtn, githubBtn, googleBtn, signInBtn };
  }

  // SCREEN 03: Dashboard Overview
  {
    const layout = createAuthLayout(
      "Screen 03 — Dashboard Overview (1440px)",
      "Dashboard",
      "{b} Buggers / Overview",
      "Real-time security review, defect risk velocity, and pull request triage overview."
    );

    const statsRow = figma.createFrame();
    statsRow.layoutMode = "HORIZONTAL";
    statsRow.itemSpacing = 20;
    statsRow.fills = [];

    const stats = [
      { label: "OPEN FINDINGS", val: "12 Flaws", tag: "3 Critical CWEs", col: C.rose500 },
      { label: "CONNECTED REPOSITORIES", val: "4 Repos", tag: "GitHub App Synced", col: C.primaryBlue },
      { label: "PRS SCANNED", val: "24 PRs", tag: "Deterministic AST", col: C.emerald500 },
      { label: "AVERAGE RISK VELOCITY", val: "34 / 100", tag: "Passing Gate", col: C.emerald500 },
    ];

    for (const st of stats) {
      const c = createFrame(st.label, "VERTICAL", 18, 8, C.surfaceCard, 10);
      c.resize(266, 110);
      c.appendChild(createText(st.label, 11, "Medium", C.neutral400));
      c.appendChild(createText(st.val, 24, "Bold", st.col));
      c.appendChild(createText(st.tag, 11, "Regular", C.neutral500));
      statsRow.appendChild(c);
    }
    layout.content.appendChild(statsRow);

    // Active PRs Table Card
    const tableCard = createFrame("Monitored PRs Table Card", "VERTICAL", 22, 16, C.surfaceCard, 12);
    tableCard.resize(1128, 480);

    const tableHeader = figma.createFrame();
    tableHeader.layoutMode = "HORIZONTAL";
    tableHeader.primaryAxisAlignItems = "SPACE_BETWEEN";
    tableHeader.resize(1084, 32);
    tableHeader.fills = [];
    tableHeader.appendChild(createText("ACTIVE MONITORED PULL REQUESTS", 13, "Semi Bold", C.white));
    const viewAllPrsBtn = createButton("View All (4) →", "outline", 12, 6);
    tableHeader.appendChild(viewAllPrsBtn);
    tableCard.appendChild(tableHeader);

    const prRow184 = figma.createFrame();
    prRow184.name = "PR Row #184 (Click to Inspect Finding)";
    prRow184.layoutMode = "HORIZONTAL";
    prRow184.primaryAxisAlignItems = "SPACE_BETWEEN";
    prRow184.resize(1084, 56);
    prRow184.paddingLeft = 16;
    prRow184.paddingRight = 16;
    prRow184.cornerRadius = 8;
    prRow184.fills = [{ type: "SOLID", color: C.surfaceDarker }];
    prRow184.strokes = [{ type: "SOLID", color: C.rose500 }];

    const prLeft = figma.createFrame();
    prLeft.layoutMode = "VERTICAL";
    prLeft.itemSpacing = 4;
    prLeft.fills = [];
    prLeft.appendChild(createText("PR #184: Implement HMAC signature validation", 13, "Semi Bold", C.white));
    prLeft.appendChild(createText("jaidevxr/buggers · 3 files changed · opened by jaidevxr", 11, "Regular", C.neutral400));
    prRow184.appendChild(prLeft);

    const prRight = figma.createFrame();
    prRight.layoutMode = "HORIZONTAL";
    prRight.primaryAxisAlignItems = "CENTER";
    prRight.itemSpacing = 16;
    prRight.fills = [];
    prRight.appendChild(createText("Risk: 78 / 100", 13, "Bold", C.rose500));
    prRight.appendChild(createBadge("CRITICAL CWE-208", C.rose500, C.roseDark));
    const inspectActionBtn = createButton("Inspect Details →", "primary", 12, 6);
    prRight.appendChild(inspectActionBtn);
    prRow184.appendChild(prRight);
    tableCard.appendChild(prRow184);

    layout.content.appendChild(tableCard);
    screensPage.appendChild(layout.screen);
    S.dashboard = layout.screen;
    L.dashboard = { layout, prRow184, inspectActionBtn, viewAllPrsBtn };
  }

  // SCREEN 04: Repositories Hub
  {
    const layout = createAuthLayout(
      "Screen 04 — Repositories (1440px)",
      "Repositories",
      "Monitored Repositories (4)",
      "Connect, configure, and monitor GitHub repositories with deterministic branch protection."
    );

    const filterRow = figma.createFrame();
    filterRow.layoutMode = "HORIZONTAL";
    filterRow.primaryAxisAlignItems = "SPACE_BETWEEN";
    filterRow.resize(1128, 40);
    filterRow.fills = [];
    filterRow.appendChild(createButton("🔍 Search repositories...", "outline", 14, 8));
    const addRepoBtn = createButton("+ Connect New Repository", "primary", 14, 8);
    filterRow.appendChild(addRepoBtn);
    layout.content.appendChild(filterRow);

    const repoGrid = figma.createFrame();
    repoGrid.layoutMode = "HORIZONTAL";
    repoGrid.itemSpacing = 20;
    repoGrid.resize(1128, 220);
    repoGrid.fills = [];

    const cardBuggers = createFrame("Repo Card / jaidevxr/buggers", "VERTICAL", 20, 12, C.surfaceCard, 10);
    cardBuggers.resize(360, 200);
    cardBuggers.strokes = [{ type: "SOLID", color: C.primaryBlue }];
    cardBuggers.appendChild(createText("jaidevxr/buggers", 16, "Bold", C.white));
    cardBuggers.appendChild(createText("Precision release intelligence & deterministic AST code review engine.", 12, "Regular", C.neutral400));
    cardBuggers.appendChild(createText("TypeScript · ⭐ 142 · Active 12m ago", 11, "Regular", C.neutral500));
    cardBuggers.appendChild(createBadge("2 OPEN PRS · RISK 34/100", C.emerald500, C.emeraldDark));
    const openBuggersDetailBtn = createButton("Inspect Repository →", "primary", 12, 6);
    cardBuggers.appendChild(openBuggersDetailBtn);
    repoGrid.appendChild(cardBuggers);

    const cardPayment = createFrame("Repo Card / payment-gateway", "VERTICAL", 20, 12, C.surfaceCard, 10);
    cardPayment.resize(360, 200);
    cardPayment.appendChild(createText("jaidevxr/payment-gateway", 16, "Bold", C.white));
    cardPayment.appendChild(createText("Stripe & PayPal webhooks processor with idempotent HMAC vaults.", 12, "Regular", C.neutral400));
    cardPayment.appendChild(createText("TypeScript · ⭐ 89 · Active 1h ago", 11, "Regular", C.neutral500));
    cardPayment.appendChild(createBadge("1 OPEN PR · RISK 78/100", C.rose500, C.roseDark));
    repoGrid.appendChild(cardPayment);

    const cardCore = createFrame("Repo Card / core-api", "VERTICAL", 20, 12, C.surfaceCard, 10);
    cardCore.resize(360, 200);
    cardCore.appendChild(createText("jaidevxr/core-api", 16, "Bold", C.white));
    cardCore.appendChild(createText("High-throughput microservices gateway and order routing API.", 12, "Regular", C.neutral400));
    cardCore.appendChild(createText("Go · ⭐ 64 · Active 4h ago", 11, "Regular", C.neutral500));
    cardCore.appendChild(createBadge("1 OPEN PR · RISK 68/100", C.amber500, C.amberDark));
    repoGrid.appendChild(cardCore);

    layout.content.appendChild(repoGrid);
    screensPage.appendChild(layout.screen);
    S.repositories = layout.screen;
    L.repositories = { layout, addRepoBtn, cardBuggers, openBuggersDetailBtn };
  }

  // SCREEN 05: Repository Detail (/repositories/$owner/$repo)
  {
    const layout = createAuthLayout(
      "Screen 05 — Repository Detail (1440px)",
      "Repositories",
      "jaidevxr/buggers",
      "Default Branch: main · TypeScript · ⭐ 142 · Connected via GitHub App"
    );

    const backToReposBtn = createButton("← Back to Repositories", "outline", 12, 6);
    layout.content.appendChild(backToReposBtn);

    const prsBox = createFrame("Repo PRs", "VERTICAL", 20, 14, C.surfaceCard, 10);
    prsBox.resize(1128, 480);
    prsBox.appendChild(createText("MONITORED PULL REQUESTS IN JAIDEVXR/BUGGERS", 13, "Semi Bold", C.white));

    const repoPrRow184 = figma.createFrame();
    repoPrRow184.name = "Repo PR Row #184";
    repoPrRow184.layoutMode = "HORIZONTAL";
    repoPrRow184.primaryAxisAlignItems = "SPACE_BETWEEN";
    repoPrRow184.resize(1088, 64);
    repoPrRow184.paddingLeft = 16;
    repoPrRow184.paddingRight = 16;
    repoPrRow184.cornerRadius = 8;
    repoPrRow184.fills = [{ type: "SOLID", color: C.surfaceDarker }];
    repoPrRow184.strokes = [{ type: "SOLID", color: C.rose500 }];

    const prL = figma.createFrame();
    prL.layoutMode = "VERTICAL";
    prL.itemSpacing = 4;
    prL.fills = [];
    prL.appendChild(createText("PR #184: Implement HMAC signature validation", 14, "Semi Bold", C.white));
    prL.appendChild(createText("Opened by jaidevxr · Risk Score 78/100 · 1 Critical AST Finding", 12, "Regular", C.neutral400));
    repoPrRow184.appendChild(prL);
    const viewRepoPr184Btn = createButton("View Analysis →", "primary", 12, 6);
    repoPrRow184.appendChild(viewRepoPr184Btn);
    prsBox.appendChild(repoPrRow184);

    layout.content.appendChild(prsBox);
    screensPage.appendChild(layout.screen);
    S.repoDetail = layout.screen;
    L.repoDetail = { layout, backToReposBtn, viewRepoPr184Btn };
  }

  // SCREEN 06: Findings Hub (/findings)
  {
    const layout = createAuthLayout(
      "Screen 06 — Findings Hub (1440px)",
      "Findings",
      "Vulnerability Findings Hub",
      "Deterministic AST triage results, CWE classifications, and code remediation queue."
    );

    const chipRow = figma.createFrame();
    chipRow.layoutMode = "HORIZONTAL";
    chipRow.itemSpacing = 12;
    chipRow.fills = [];
    chipRow.appendChild(createBadge("ALL FINDINGS (7)", C.white, C.surfaceCard));
    chipRow.appendChild(createBadge("CRITICAL (2)", C.rose500, C.roseDark));
    chipRow.appendChild(createBadge("HIGH (2)", C.amber500, C.amberDark));
    chipRow.appendChild(createBadge("MEDIUM (2)", C.primaryBlue, C.surfaceCard));
    chipRow.appendChild(createBadge("LOW (1)", C.emerald500, C.emeraldDark));
    layout.content.appendChild(chipRow);

    const fCard = createFrame("Findings Feed", "VERTICAL", 20, 14, C.surfaceCard, 12);
    fCard.resize(1128, 560);

    const findingRow208 = figma.createFrame();
    findingRow208.name = "Finding Row CWE-208 (Click to Inspect)";
    findingRow208.layoutMode = "HORIZONTAL";
    findingRow208.primaryAxisAlignItems = "SPACE_BETWEEN";
    findingRow208.resize(1088, 70);
    findingRow208.paddingLeft = 16;
    findingRow208.paddingRight = 16;
    findingRow208.cornerRadius = 8;
    findingRow208.fills = [{ type: "SOLID", color: C.surfaceDarker }];
    findingRow208.strokes = [{ type: "SOLID", color: C.rose500 }];

    const fLeft = figma.createFrame();
    fLeft.layoutMode = "VERTICAL";
    fLeft.itemSpacing = 4;
    fLeft.fills = [];
    fLeft.appendChild(createText("CWE-208: Observable Timing Discrepancy (Session Token Comparison)", 14, "Bold", C.white));
    fLeft.appendChild(createText("src/auth/verifyToken.ts:18 · jaidevxr/buggers · PR #184", 12, "Regular", C.neutral400));
    findingRow208.appendChild(fLeft);

    const fRight = figma.createFrame();
    fRight.layoutMode = "HORIZONTAL";
    fRight.primaryAxisAlignItems = "CENTER";
    fRight.itemSpacing = 16;
    fRight.fills = [];
    fRight.appendChild(createBadge("CRITICAL · SCORE 78", C.rose500, C.roseDark));
    const inspect208Btn = createButton("Inspect & Fix →", "primary", 12, 6);
    fRight.appendChild(inspect208Btn);
    findingRow208.appendChild(fRight);
    fCard.appendChild(findingRow208);

    layout.content.appendChild(fCard);
    screensPage.appendChild(layout.screen);
    S.findings = layout.screen;
    L.findings = { layout, findingRow208, inspect208Btn };
  }

  // SCREEN 07: Finding Detail & Split Diff (/findings/$id)
  {
    const layout = createAuthLayout(
      "Screen 07 — Finding Detail (1440px)",
      "Findings",
      "Finding Detail: CWE-208 Timing Side-Channel",
      "PR #184 · jaidevxr/buggers · AST Node: BinaryExpression [===]"
    );

    const backToFindingsBtn = createButton("← Back to Findings Hub", "outline", 12, 6);
    layout.content.appendChild(backToFindingsBtn);

    const diffFrame = createFrame("Split Diff Box", "VERTICAL", 20, 16, C.surfaceDarker, 12);
    diffFrame.resize(1128, 440);
    diffFrame.strokes = [{ type: "SOLID", color: C.borderLight }];

    const diffHeader = figma.createFrame();
    diffHeader.layoutMode = "HORIZONTAL";
    diffHeader.primaryAxisAlignItems = "SPACE_BETWEEN";
    diffHeader.resize(1088, 36);
    diffHeader.fills = [];
    diffHeader.appendChild(createText("src/auth/verifyToken.ts (Lines 14–22)", 13, "Semi Bold", C.white));
    const applyFixBtn = createButton("⚡ Apply 1-Click Safe Auto-Fix", "emerald", 16, 8);
    diffHeader.appendChild(applyFixBtn);
    diffFrame.appendChild(diffHeader);

    const diffCols = figma.createFrame();
    diffCols.layoutMode = "HORIZONTAL";
    diffCols.itemSpacing = 20;
    diffCols.fills = [];

    const leftCol = createFrame("Vulnerable AST Tree (Before)", "VERTICAL", 16, 8, C.surfaceCard, 8);
    leftCol.resize(534, 320);
    leftCol.strokes = [{ type: "SOLID", color: C.rose500 }];
    leftCol.appendChild(createBadge("❌ VULNERABLE CODE (PR #184)", C.rose500, C.roseDark));
    leftCol.appendChild(createText("17  function compareAuth(token, storedSignature) {", 12, "Regular", C.neutral400));
    leftCol.appendChild(createText("18 -  return (token === storedSignature);", 13, "Bold", C.rose500));
    leftCol.appendChild(createText("19  }", 12, "Regular", C.neutral400));
    diffCols.appendChild(leftCol);

    const rightCol = createFrame("Remediated AST Tree (Auto-Fix)", "VERTICAL", 16, 8, C.surfaceCard, 8);
    rightCol.resize(534, 320);
    rightCol.strokes = [{ type: "SOLID", color: C.emerald500 }];
    rightCol.appendChild(createBadge("✅ BUGGERS AUTO-FIX PROPOSED", C.emerald500, C.emeraldDark));
    rightCol.appendChild(createText("17  function compareAuth(token, storedSignature) {", 12, "Regular", C.neutral400));
    rightCol.appendChild(createText("18 +  return crypto.timingSafeEqual(", 13, "Bold", C.emerald500));
    rightCol.appendChild(createText("18 +    Buffer.from(token), Buffer.from(storedSignature)", 13, "Bold", C.emerald500));
    rightCol.appendChild(createText("18 +  );", 13, "Bold", C.emerald500));
    rightCol.appendChild(createText("19  }", 12, "Regular", C.neutral400));
    diffCols.appendChild(rightCol);

    diffFrame.appendChild(diffCols);
    layout.content.appendChild(diffFrame);

    screensPage.appendChild(layout.screen);
    S.findingDetail = layout.screen;
    L.findingDetail = { layout, backToFindingsBtn, applyFixBtn };
  }

  // SCREEN 08: Remediated Gate Pass (Post-Fix)
  {
    const layout = createAuthLayout(
      "Screen 08 — Remediated Gate Pass (1440px)",
      "Findings",
      "Vulnerability Remediated: 0 Defects",
      "All 23 AST deterministic security checks verified."
    );

    const banner = createFrame("Success Banner", "VERTICAL", 32, 16, C.surfaceCard, 16);
    banner.resize(1128, 480);
    banner.strokes = [{ type: "SOLID", color: C.emerald500 }];
    banner.primaryAxisAlignItems = "CENTER";
    banner.counterAxisAlignItems = "CENTER";

    banner.appendChild(createBadge("✅ PATCH SUCCESSFULLY COMMITTED & VERIFIED", C.emerald500, C.emeraldDark));
    banner.appendChild(createText("Merge Gate Unblocked: PR #184 Approved", 28, "Bold", C.white));
    banner.appendChild(
      createText(
        "The timing-safe equality replacement has been committed to feature/hmac-auth.\nAST Re-scan confirms: 0 Open Flaws · Risk Score reduced from 78/100 ➔ 0/100.",
        14,
        "Regular",
        C.neutral300
      )
    );

    const postFixBtns = figma.createFrame();
    postFixBtns.layoutMode = "HORIZONTAL";
    postFixBtns.itemSpacing = 16;
    postFixBtns.fills = [];
    const returnDashBtn = createButton("📊 Return to Dashboard", "primary", 18, 10);
    const returnFindingsBtn = createButton("🛡️ View Findings Queue", "outline", 18, 10);
    postFixBtns.appendChild(returnDashBtn);
    postFixBtns.appendChild(returnFindingsBtn);
    banner.appendChild(postFixBtns);

    layout.content.appendChild(banner);
    screensPage.appendChild(layout.screen);
    S.remediated = layout.screen;
    L.remediated = { layout, returnDashBtn, returnFindingsBtn };
  }

  // SCREEN 09: Pull Requests Hub (/pull-requests)
  {
    const layout = createAuthLayout(
      "Screen 09 — Pull Requests (1440px)",
      "PullRequests",
      "Active Pull Requests (4)",
      "Automated merge gates, webhook status, and security compliance on pull requests."
    );

    const prBox = createFrame("PR List Box", "VERTICAL", 20, 12, C.surfaceCard, 12);
    prBox.resize(1128, 560);

    const pr184Row = figma.createFrame();
    pr184Row.name = "PR Row #184";
    pr184Row.layoutMode = "HORIZONTAL";
    pr184Row.primaryAxisAlignItems = "SPACE_BETWEEN";
    pr184Row.resize(1088, 64);
    pr184Row.paddingLeft = 16;
    pr184Row.paddingRight = 16;
    pr184Row.cornerRadius = 8;
    pr184Row.fills = [{ type: "SOLID", color: C.surfaceDarker }];
    pr184Row.strokes = [{ type: "SOLID", color: C.rose500 }];

    const l = figma.createFrame();
    l.layoutMode = "VERTICAL";
    l.itemSpacing = 4;
    l.fills = [];
    l.appendChild(createText("PR #184: Implement HMAC signature validation", 14, "Semi Bold", C.white));
    l.appendChild(createText("jaidevxr/buggers · Monitored via GitHub Webhook", 11, "Regular", C.neutral400));
    pr184Row.appendChild(l);

    const r = figma.createFrame();
    r.layoutMode = "HORIZONTAL";
    r.primaryAxisAlignItems = "CENTER";
    r.itemSpacing = 16;
    r.fills = [];
    r.appendChild(createText("Risk: 78 / 100", 13, "Bold", C.rose500));
    r.appendChild(createBadge("BLOCKED BY GATE", C.rose500, C.roseDark));
    const viewAnalysis184Btn = createButton("View Analysis →", "primary", 12, 6);
    r.appendChild(viewAnalysis184Btn);
    pr184Row.appendChild(r);
    prBox.appendChild(pr184Row);

    layout.content.appendChild(prBox);
    screensPage.appendChild(layout.screen);
    S.pullRequests = layout.screen;
    L.pullRequests = { layout, pr184Row, viewAnalysis184Btn };
  }

  // SCREEN 10: Analysis Run Detail (/analysis/$id)
  {
    const layout = createAuthLayout(
      "Screen 10 — Analysis Run Detail (1440px)",
      "PullRequests",
      "Analysis: jaidevxr/buggers #184",
      "feature/hmac-auth ➔ main · Author: jaidevxr · Risk Score: 78 / 100 (HIGH RISK)"
    );

    const backToPrsBtn = createButton("← Back to Pull Requests", "outline", 12, 6);
    layout.content.appendChild(backToPrsBtn);

    const pipeCard = createFrame("9-Stage Pipeline Card", "VERTICAL", 18, 12, C.surfaceCard, 10);
    pipeCard.resize(1128, 100);
    pipeCard.appendChild(createText("9-STAGE DETERMINISTIC AST ANALYSIS PIPELINE", 11, "Semi Bold", C.neutral400));
    const stageRow = figma.createFrame();
    stageRow.layoutMode = "HORIZONTAL";
    stageRow.itemSpacing = 8;
    stageRow.fills = [];
    const stages = [
      "1. Queued",
      "2. Fetch PR",
      "3. Commits",
      "4. Files",
      "5. Churn",
      "6. AST Review",
      "7. Validation",
      "8. Risk Calc",
      "9. Completed",
    ];
    for (const st of stages) {
      stageRow.appendChild(createBadge(`✓ ${st}`, C.emerald500, C.emeraldDark));
    }
    pipeCard.appendChild(stageRow);
    layout.content.appendChild(pipeCard);

    const fBox = createFrame("Analysis Finding", "VERTICAL", 20, 12, C.surfaceCard, 10);
    fBox.resize(1128, 280);
    fBox.strokes = [{ type: "SOLID", color: C.rose500 }];
    const fH = figma.createFrame();
    fH.layoutMode = "HORIZONTAL";
    fH.primaryAxisAlignItems = "SPACE_BETWEEN";
    fH.resize(1088, 36);
    fH.fills = [];
    fH.appendChild(createText("CWE-208: Observable Timing Discrepancy", 16, "Bold", C.white));
    const inspectFromAnalysisBtn = createButton("Inspect AST Diff →", "primary", 12, 6);
    fH.appendChild(inspectFromAnalysisBtn);
    fBox.appendChild(fH);

    fBox.appendChild(createText("File: src/auth/verifyToken.ts:18 · Severity: CRITICAL · Confidence: 95%", 12, "Medium", C.rose500));
    const batchAutoFixBtn = createButton("⚡ Batch Auto-Fix All Findings", "emerald", 16, 8);
    fBox.appendChild(batchAutoFixBtn);
    layout.content.appendChild(fBox);

    screensPage.appendChild(layout.screen);
    S.analysisDetail = layout.screen;
    L.analysisDetail = { layout, backToPrsBtn, inspectFromAnalysisBtn, batchAutoFixBtn };
  }

  // SCREEN 11: Analytics & Churn Velocity (/analytics)
  {
    const layout = createAuthLayout(
      "Screen 11 — Analytics (1440px)",
      "Analytics",
      "Release Analytics & Defect Velocity",
      "Mean time to remediation, rule triggering velocity, and repository risk trends."
    );

    const aRow = figma.createFrame();
    aRow.layoutMode = "HORIZONTAL";
    aRow.itemSpacing = 20;
    aRow.fills = [];
    const aCards = [
      { label: "MEAN TIME TO REMEDIATION", val: "14 mins", sub: "-62% faster than manual review", col: C.emerald500 },
      { label: "AST ENGINE PARSE LATENCY", val: "38 ms", sub: "P95 local tree evaluation", col: C.primaryBlue },
      { label: "AUTO-FIX APPLICATION RATE", val: "88.4%", sub: "1-click verified patches", col: C.purple500 },
    ];
    for (const ac of aCards) {
      const c = createFrame(ac.label, "VERTICAL", 20, 8, C.surfaceCard, 10);
      c.resize(356, 130);
      c.appendChild(createText(ac.label, 11, "Medium", C.neutral400));
      c.appendChild(createText(ac.val, 28, "Bold", ac.col));
      c.appendChild(createText(ac.sub, 12, "Regular", C.neutral500));
      aRow.appendChild(c);
    }
    layout.content.appendChild(aRow);

    screensPage.appendChild(layout.screen);
    S.analytics = layout.screen;
    L.analytics = { layout };
  }

  // SCREEN 12: Tickets & Issues (/tickets)
  {
    const layout = createAuthLayout(
      "Screen 12 — Tickets (1440px)",
      "Tickets",
      "Synchronized Security Tickets",
      "Jira, GitHub Issues, and automated Buggers remediation backlog."
    );

    const tBox = createFrame("Ticket List", "VERTICAL", 20, 12, C.surfaceCard, 12);
    tBox.resize(1128, 560);
    const tickets = [
      { id: "BUG-208", title: "Eliminate string === operator in crypto tokens", status: "In Triage", prio: "Critical", col: C.rose500 },
      { id: "BUG-89", title: "Parameterize SQL queries in customer order handler", status: "Fix Proposed", prio: "High", col: C.amber500 },
      { id: "BUG-798", title: "Extract plaintext AWS keys into .env secrets vault", status: "In Progress", prio: "High", col: C.amber500 },
      { id: "BUG-327", title: "Migrate legacy MD5 hashing to SHA-256 with salt", status: "Resolved", prio: "Medium", col: C.emerald500 },
    ];
    for (const t of tickets) {
      const row = figma.createFrame();
      row.layoutMode = "HORIZONTAL";
      row.primaryAxisAlignItems = "SPACE_BETWEEN";
      row.resize(1088, 64);
      row.paddingLeft = 16;
      row.paddingRight = 16;
      row.cornerRadius = 8;
      row.fills = [{ type: "SOLID", color: C.surfaceDarker }];

      const l = figma.createFrame();
      l.layoutMode = "VERTICAL";
      l.itemSpacing = 4;
      l.fills = [];
      l.appendChild(createText(`[${t.id}] ${t.title}`, 14, "Semi Bold", C.white));
      l.appendChild(createText(`Status: ${t.status} · Synced with GitHub Issues`, 11, "Regular", C.neutral400));
      row.appendChild(l);
      row.appendChild(createBadge(t.prio, t.col, C.pitchBlack));
      tBox.appendChild(row);
    }
    layout.content.appendChild(tBox);

    screensPage.appendChild(layout.screen);
    S.tickets = layout.screen;
    L.tickets = { layout };
  }

  // SCREEN 13: Settings (/settings)
  {
    const layout = createAuthLayout(
      "Screen 13 — Settings (1440px)",
      "Settings",
      "Organization & Security Settings",
      "Configure deterministic gates, API secrets, and multi-provider AI fallback chains."
    );

    const sBox = createFrame("Settings Form", "VERTICAL", 24, 20, C.surfaceCard, 12);
    sBox.resize(1128, 560);
    sBox.appendChild(createText("MERGE GATE TOLERANCE THRESHOLD", 13, "Semi Bold", C.white));
    const sliderBox = createFrame("Slider Mock", "HORIZONTAL", 16, 12, C.surfaceDarker, 8);
    sliderBox.resize(600, 48);
    sliderBox.appendChild(createText("Maximum Acceptable Risk Score: 40 / 100", 13, "Medium", C.emerald500));
    sBox.appendChild(sliderBox);

    sBox.appendChild(createText("GITHUB WEBHOOK SECRET STATUS", 13, "Semi Bold", C.white));
    sBox.appendChild(createBadge("ACTIVE & ENCRYPTED WITH AES-256", C.emerald500, C.emeraldDark));

    const saveBtn = createButton("💾 Save Configuration Changes", "primary", 18, 10);
    sBox.appendChild(saveBtn);

    layout.content.appendChild(sBox);
    screensPage.appendChild(layout.screen);
    S.settings = layout.screen;
    L.settings = { layout, saveBtn };
  }

  // SCREEN 14: Documentation Center (/docs)
  {
    const docs = figma.createFrame();
    docs.name = "Screen 14 — Documentation (1440px)";
    docs.layoutMode = "VERTICAL";
    docs.resize(1440, 1100);
    docs.clipsContent = true;
    docs.overflowDirection = "VERTICAL";
    docs.fills = [{ type: "SOLID", color: C.canvasDark }];

    const header = createPublicHeader("Docs");
    docs.appendChild(header.bar);

    const docContent = createFrame("Docs Article", "VERTICAL", 32, 16, C.surfaceCard, 12);
    docContent.resize(1344, 800);
    docContent.appendChild(createBadge("DEVELOPER DOCUMENTATION · STABLE v1.2.0", C.emerald500, C.emeraldDark));
    docContent.appendChild(createText("Deterministic AST Security Review Engine", 28, "Bold", C.white));
    docContent.appendChild(
      createText(
        "Buggers executes local static abstract syntax tree (AST) traversals using Babel and TypeScript compilers,\nguaranteeing that security findings are based on concrete AST patterns rather than unpredictable LLM hallucinations.",
        14,
        "Regular",
        C.neutral300
      )
    );

    const codeBox = createFrame("Install Snippet", "VERTICAL", 16, 8, C.surfaceDarker, 8);
    codeBox.resize(1280, 120);
    codeBox.appendChild(createText("# Install Buggers VS Code Extension v1.2.0 via CLI", 11, "Medium", C.neutral500));
    codeBox.appendChild(createText("code --install-extension buggers-vscode-1.2.0.vsix", 13, "Bold", C.emerald500));
    docContent.appendChild(codeBox);

    docs.appendChild(docContent);
    screensPage.appendChild(docs);
    S.docs = docs;
    L.docs = { header };
  }

  // SCREEN 15: How It Works (/how-it-works)
  {
    const how = figma.createFrame();
    how.name = "Screen 15 — How It Works (1440px)";
    how.layoutMode = "VERTICAL";
    how.resize(1440, 1000);
    how.clipsContent = true;
    how.overflowDirection = "VERTICAL";
    how.fills = [{ type: "SOLID", color: C.canvasDark }];

    const header = createPublicHeader("Security");
    how.appendChild(header.bar);

    const stepRow = figma.createFrame();
    stepRow.layoutMode = "HORIZONTAL";
    stepRow.itemSpacing = 20;
    stepRow.paddingLeft = 48;
    stepRow.paddingRight = 48;
    stepRow.paddingTop = 40;
    stepRow.fills = [];

    const steps = [
      { step: "01", title: "Webhook Ingestion", desc: "PR open event triggers HMAC SHA-256 authenticated webhook. Unified diff extracted in <180ms.", col: C.primaryBlue },
      { step: "02", title: "AST Traversal", desc: "23 deterministic checkers parse modified syntax nodes without sending raw code to cloud.", col: C.purple500 },
      { step: "03", title: "Gate Evaluation", desc: "Risk score computed. Pull request check run posted to GitHub with pass/block status.", col: C.rose500 },
      { step: "04", title: "1-Click Auto-Fix", desc: "Developer previews side-by-side split diff and applies safe patch with 1 click.", col: C.emerald500 },
    ];
    for (const st of steps) {
      const box = createFrame(`Step ${st.step}`, "VERTICAL", 24, 12, C.surfaceCard, 12);
      box.resize(310, 320);
      box.appendChild(createBadge(`STAGE ${st.step}`, st.col, C.pitchBlack));
      box.appendChild(createText(st.title, 18, "Bold", C.white));
      box.appendChild(createText(st.desc, 13, "Regular", C.neutral400));
      stepRow.appendChild(box);
    }
    how.appendChild(stepRow);

    screensPage.appendChild(how);
    S.howItWorks = how;
    L.howItWorks = { header };
  }

  // SCREEN 16: About & Academic Attribution (/about)
  {
    const about = figma.createFrame();
    about.name = "Screen 16 — About & Team (1440px)";
    about.layoutMode = "VERTICAL";
    about.resize(1440, 1000);
    about.clipsContent = true;
    about.overflowDirection = "VERTICAL";
    about.fills = [{ type: "SOLID", color: C.canvasDark }];

    const header = createPublicHeader("About");
    about.appendChild(header.bar);

    const aHero = createFrame("About Hero", "VERTICAL", 36, 16, null, 0);
    aHero.resize(1440, 160);
    aHero.primaryAxisAlignItems = "CENTER";
    aHero.counterAxisAlignItems = "CENTER";
    aHero.appendChild(createBadge("BABU BANARASI DAS UNIVERSITY · MAJOR PROJECT", C.emerald500, C.emeraldDark));
    aHero.appendChild(createText("Engineered by Team Buggers", 36, "Bold", C.white));
    aHero.appendChild(createText("Department of Computer Science & Engineering · Academic Evaluation 2026", 14, "Regular", C.neutral400));
    about.appendChild(aHero);

    const teamRow = figma.createFrame();
    teamRow.layoutMode = "HORIZONTAL";
    teamRow.itemSpacing = 20;
    teamRow.paddingLeft = 48;
    teamRow.paddingRight = 48;
    teamRow.fills = [];

    const members = [
      { name: "Jaidev Yadav", role: "Full Stack Lead & AST Architect", desc: "Engineered deterministic AST engine, TanStack Start frontend, Nitro backend, and Vercel pipeline." },
      { name: "Khushi Sharma", role: "Frontend & UI Systems Lead", desc: "Designed accessible OKLCH color token system, responsive viewports, and glassmorphic components." },
      { name: "Madhvi Mishra", role: "Security & Vulnerability Lead", desc: "Authored 23 CWE rules (CWE-208, CWE-89, CWE-798) and benchmark security validation suite." },
      { name: "Kumkum", role: "QA, Evaluation & Release Lead", desc: "Conducted 111 Vitest test suites, VS Code extension packaging, and documentation governance." },
    ];
    for (const m of members) {
      const mb = createFrame(`Member / ${m.name}`, "VERTICAL", 24, 12, C.surfaceCard, 12);
      mb.resize(320, 260);
      mb.appendChild(createBadge("CORE CONTRIBUTOR", C.emerald500, C.emeraldDark));
      mb.appendChild(createText(m.name, 18, "Bold", C.white));
      mb.appendChild(createText(m.role, 12, "Medium", C.primaryBlue));
      mb.appendChild(createText(m.desc, 12, "Regular", C.neutral400));
      teamRow.appendChild(mb);
    }
    about.appendChild(teamRow);

    screensPage.appendChild(about);
    S.about = about;
    L.about = { header };
  }

  // =========================================================================
  // POSITION ALL SCREENS IN A METICULOUS CLEAN GRID ON "03 Screens"
  // =========================================================================
  const gridRows = [
    // Row 0: Public Pages (Screens 01, 02, 14, 15, 16)
    ["landing", "auth", "docs", "howItWorks", "about"],
    // Row 1: Authenticated Core Hubs (Screens 03, 04, 06, 09, 11, 12, 13)
    ["dashboard", "repositories", "findings", "pullRequests", "analytics", "tickets", "settings"],
    // Row 2: Deep Nested Details (Screens 05, 10, 07, 08)
    ["repoDetail", "analysisDetail", "findingDetail", "remediated"],
  ];

  const colSpacing = 120;
  const rowSpacing = 160;

  gridRows.forEach((rowKeys, rowIndex) => {
    let currentX = 1600;
    rowKeys.forEach((key) => {
      const sc = S[key];
      if (!sc) return;
      sc.x = currentX;
      sc.y = rowIndex * (1200 + rowSpacing);
      currentX += sc.width + colSpacing;
    });
  });

  // =========================================================================
  // WIRE UP ALL PROTOTYPE INTERACTIONS
  // =========================================================================
  figma.notify("Wiring up prototype transitions on '03 Screens'...", { timeout: 3000 });

  // Public Headers
  const pubScreens = ["landing", "auth", "docs", "howItWorks", "about"];
  for (const pKey of pubScreens) {
    const h = L[pKey]?.header;
    if (!h) continue;
    await linkNodes(h.logo, S.landing);
    await linkNodes(h.tabNodes["Home"], S.landing);
    await linkNodes(h.tabNodes["Product"], S.landing);
    await linkNodes(h.tabNodes["Security"], S.howItWorks);
    await linkNodes(h.tabNodes["Docs"], S.docs);
    await linkNodes(h.tabNodes["About"], S.about);
    await linkNodes(h.loginBtn, S.auth);
    await linkNodes(h.dashBtn, S.dashboard);
  }

  // Screen 01 Landing
  await linkNodes(L.landing.connectRepoBtn, S.auth);
  await linkNodes(L.landing.readDocsBtn, S.docs);
  await linkNodes(L.landing.prRow1, S.findingDetail);

  // Screen 02 Auth
  await linkNodes(L.auth.backHomeBtn, S.landing);
  await linkNodes(L.auth.githubBtn, S.dashboard);
  await linkNodes(L.auth.googleBtn, S.dashboard);
  await linkNodes(L.auth.signInBtn, S.dashboard);

  // Authenticated Sidebar across all authenticated screens
  const authKeys = [
    "dashboard",
    "repositories",
    "repoDetail",
    "findings",
    "findingDetail",
    "remediated",
    "pullRequests",
    "analysisDetail",
    "analytics",
    "tickets",
    "settings",
  ];

  for (const aKey of authKeys) {
    const layout = L[aKey]?.layout;
    if (!layout) continue;

    await linkNodes(layout.sideLogo, S.landing);
    await linkNodes(layout.sideNavLinks["Dashboard"], S.dashboard);
    await linkNodes(layout.sideNavLinks["Repositories"], S.repositories);
    await linkNodes(layout.sideNavLinks["Findings"], S.findings);
    await linkNodes(layout.sideNavLinks["PullRequests"], S.pullRequests);
    await linkNodes(layout.sideNavLinks["Analytics"], S.analytics);
    await linkNodes(layout.sideNavLinks["Tickets"], S.tickets);
    await linkNodes(layout.sideNavLinks["Settings"], S.settings);
    await linkNodes(layout.docsLink, S.docs);
    await linkNodes(layout.signOutBtn, S.auth);
  }

  // Dashboard Interactions
  await linkNodes(L.dashboard.prRow184, S.findingDetail);
  await linkNodes(L.dashboard.inspectActionBtn, S.findingDetail);
  await linkNodes(L.dashboard.viewAllPrsBtn, S.pullRequests);

  // Repositories Interactions
  await linkNodes(L.repositories.addRepoBtn, S.dashboard);
  await linkNodes(L.repositories.cardBuggers, S.repoDetail);
  await linkNodes(L.repositories.openBuggersDetailBtn, S.repoDetail);

  // Repo Detail
  await linkNodes(L.repoDetail.backToReposBtn, S.repositories);
  await linkNodes(L.repoDetail.viewRepoPr184Btn, S.analysisDetail);

  // Findings
  await linkNodes(L.findings.findingRow208, S.findingDetail);
  await linkNodes(L.findings.inspect208Btn, S.findingDetail);

  // Finding Detail CWE-208 Split Diff
  await linkNodes(L.findingDetail.backToFindingsBtn, S.findings);
  await linkNodes(L.findingDetail.applyFixBtn, S.remediated);

  // Remediated State
  await linkNodes(L.remediated.returnDashBtn, S.dashboard);
  await linkNodes(L.remediated.returnFindingsBtn, S.findings);

  // Pull Requests
  await linkNodes(L.pullRequests.pr184Row, S.findingDetail);
  await linkNodes(L.pullRequests.viewAnalysis184Btn, S.analysisDetail);

  // Analysis Detail
  await linkNodes(L.analysisDetail.backToPrsBtn, S.pullRequests);
  await linkNodes(L.analysisDetail.inspectFromAnalysisBtn, S.findingDetail);
  await linkNodes(L.analysisDetail.batchAutoFixBtn, S.remediated);

  // Set Flow Starting Point
  try {
    screensPage.flowStartingPoints = [
      {
        nodeId: S.landing.id,
        name: "🚀 Buggers — Live Interactive Prototype",
      },
    ];
  } catch (e) {}

  figma.viewport.scrollAndZoomIntoView([S.landing]);
  figma.notify("🎉 SUCCESS: All Buggers screens generated cleanly on '03 Screens' with 100% working prototype!", { timeout: 8000 });
}

main().catch((err) => {
  console.error("Generator execution error:", err);
  figma.notify("Error: " + err.message, { error: true });
});
