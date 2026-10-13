import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buggers — Review with ease" },
      {
        name: "description",
        content:
          "Review smarter with AI that understands your repository. So you can take a breath.",
      },
      { property: "og:title", content: "Buggers — Review with ease" },
      {
        property: "og:description",
        content:
          "AI-assisted code review and bug triage powered by your GitHub repository history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

export function Landing() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 55 });
  const [lampMode, setLampMode] = useState<"cozy" | "bright" | "dim">("cozy");
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [monitorScanned, setMonitorScanned] = useState(false);
  const [hudOpen, setHudOpen] = useState(true);

  // Play realistic analog tactile switch sound for lamp
  const playClickSound = (targetMode: "cozy" | "bright" | "dim") => {
    if (!sfxEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const freq = targetMode === "bright" ? 820 : targetMode === "dim" ? 440 : 620;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // AudioContext blocked or not supported
    }
  };

  const handleToggleLamp = () => {
    setLampMode((prev) => {
      const next = prev === "cozy" ? "bright" : prev === "bright" ? "dim" : "cozy";
      playClickSound(next);
      return next;
    });
  };

  const handleScanMonitor = () => {
    if (sfxEnabled && typeof window !== "undefined") {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(520, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.09);
        }
      } catch {}
    }
    setMonitorScanned(true);
    setTimeout(() => setMonitorScanned(false), 2400);
  };

  // Cursor tracking for real-time proximity calculation and subtle 2.5D tilt
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Lamp hotspot coordinates on the 16:9 canvas
  const LAMP_X = 38.2;
  const LAMP_Y = 57.5;
  const dx = mousePos.x - LAMP_X;
  const dy = mousePos.y - LAMP_Y;
  const distance = Math.hypot(dx, dy);

  // Proximity ranges from 0 (far) to 1 (directly near the lamp)
  const proximity = Math.max(0, Math.min(1, 1 - distance / 32));

  // Multiplier based on current wattage mode
  const modeMultiplier =
    lampMode === "bright" ? 1.55 : lampMode === "dim" ? 0.45 : 1.0;

  // Dynamic warmth opacity, size, and desk highlight (strictly warm tungsten, zero neon)
  const lampOpacity = Math.min(0.92, (0.16 + proximity * 0.64) * modeMultiplier);
  const lampRadius = Math.round(
    (190 + proximity * 180) *
      (lampMode === "bright" ? 1.25 : lampMode === "dim" ? 0.75 : 1)
  );
  const deskPoolOpacity = Math.min(
    0.85,
    (0.12 + proximity * 0.52) * modeMultiplier
  );
  const deskWidth = Math.round((210 + proximity * 150) * modeMultiplier);
  const deskHeight = Math.round((85 + proximity * 65) * modeMultiplier);
  const coneOpacity = Math.min(0.6, (0.06 + proximity * 0.44) * modeMultiplier);

  return (
    <div className="relative min-h-screen w-full bg-[#07090e] text-slate-100 antialiased overflow-x-hidden selection:bg-white/20">
      {/* Floating Pill Header — Clean, focused, only useful options, official BugMark logo */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <div className="flex items-center gap-6 sm:gap-8 rounded-full bg-black/75 backdrop-blur-md px-6 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-white/10 text-xs font-medium text-slate-200 transition-all duration-300">
          {/* Official Buggers Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold text-white transition-opacity duration-200 hover:opacity-85"
          >
            <BugMark className="h-5 w-5 text-white fill-white" />
            <span className="tracking-tight text-sm font-bold text-white">
              Buggers
            </span>
          </Link>

          {/* Useful Header Navigation */}
          <nav className="flex items-center gap-6 text-slate-300 font-medium">
            <Link
              to="/how-it-works"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors duration-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>How it works</span>
            </Link>
          </nav>

          {/* Login Pill Button */}
          <Link
            to="/auth"
            className="rounded-full bg-white text-black px-5 py-1.5 text-xs font-semibold hover:bg-slate-200 transition-all duration-200 shadow-xs active:scale-[0.985]"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Main Full-Bleed Atmospheric Night Studio Hero Section (4K Uncompressed Background + Gamified Interactive Elements) */}
      <section
        id="hero"
        className="relative min-h-screen w-full bg-cover bg-center flex flex-col justify-center items-center px-4 sm:px-6 py-24 overflow-hidden"
        style={{
          backgroundImage: `url('/landing-bg.png')`,
        }}
      >
        {/* Soft atmospheric night vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/60 pointer-events-none" />

        {/* ======================================================== */}
        {/* GAMIFIED ELEMENT 1: PROXIMITY-CONTROLLED TUNGSTEN DESK LAMP */}
        {/* ======================================================== */}

        {/* 1A. Primary Radial Tungsten Bulb Glow (Brightens smoothly as cursor approaches lamp) */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-200 ease-out"
          style={{
            left: `${LAMP_X}%`,
            top: `${LAMP_Y}%`,
            width: `${lampRadius}px`,
            height: `${lampRadius}px`,
            backgroundColor: `rgba(245, 158, 11, ${lampOpacity})`,
          }}
        />

        {/* 1B. Inner Hot Filament Core Glow (Warm amber-gold incandescent) */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl transition-all duration-200 ease-out"
          style={{
            left: `${LAMP_X}%`,
            top: `${LAMP_Y}%`,
            width: `${Math.round(lampRadius * 0.45)}px`,
            height: `${Math.round(lampRadius * 0.45)}px`,
            backgroundColor: `rgba(251, 191, 36, ${Math.min(0.85, lampOpacity * 1.15)})`,
          }}
        />

        {/* 1C. Directional Downward Light Cone from Lamp Shade toward Desk */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 transition-all duration-200 ease-out"
          style={{
            left: `${LAMP_X + 0.8}%`,
            top: `${LAMP_Y}%`,
            width: `${Math.round(deskWidth * 0.9)}px`,
            height: "140px",
            clipPath: "polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)",
            background: `linear-gradient(to bottom, rgba(251, 191, 36, ${coneOpacity * 1.2}), rgba(245, 158, 11, ${coneOpacity * 0.3}) 70%, transparent 100%)`,
          }}
        />

        {/* 1D. Physical Desk Light Pool on the Wooden Table Surface */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-2xl transition-all duration-200 ease-out"
          style={{
            left: "39.2%",
            top: "67.5%",
            width: `${deskWidth}px`,
            height: `${deskHeight}px`,
            backgroundColor: `rgba(217, 119, 6, ${deskPoolOpacity})`,
          }}
        />

        {/* 1E. Luminous Dust Motes Drifting through the Warm Light Beam */}
        <div
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-amber-200/90 blur-[0.3px] animate-mote-1 transition-opacity duration-300"
          style={{
            left: "38.8%",
            top: "61%",
            opacity: Math.max(0.15, proximity * 0.95),
          }}
        />
        <div
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-amber-100/80 blur-[0.3px] animate-mote-2 transition-opacity duration-300"
          style={{
            left: "40.2%",
            top: "64.5%",
            opacity: Math.max(0.1, proximity * 0.85),
          }}
        />
        <div
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-amber-300/80 blur-[0.3px] animate-mote-3 transition-opacity duration-300"
          style={{
            left: "37.5%",
            top: "63%",
            opacity: Math.max(0.15, proximity * 0.9),
          }}
        />

        {/* ======================================================== */}
        {/* GAMIFIED ELEMENT 2: INTERACTIVE HOTSPOTS ON THE VOXEL ART */}
        {/* ======================================================== */}

        {/* Hotspot 2A: The Vintage Anglepoise Lamp (Clickable Wattage Switch) */}
        <div
          onClick={handleToggleLamp}
          onMouseEnter={() => setActiveHotspot("lamp")}
          onMouseLeave={() => setActiveHotspot(null)}
          title="Click to toggle desk lamp wattage"
          className="absolute z-20 cursor-pointer rounded-xl group transition-all duration-200"
          style={{
            left: "35.5%",
            top: "52%",
            width: "6.5%",
            height: "12%",
          }}
        >
          {/* Subtle hover beacon ring */}
          <div
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-400/90 flex items-center justify-center text-[8px] font-bold text-black shadow-md transition-transform duration-200 group-hover:scale-125"
            style={{ opacity: proximity > 0.4 ? 1 : 0.65 }}
          >
            💡
          </div>

          {/* Interactive Tooltip Badge */}
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-amber-500/30 text-[11px] font-mono text-amber-200 shadow-xl whitespace-nowrap transition-all duration-200 pointer-events-none ${
              activeHotspot === "lamp"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-1"
            }`}
          >
            <div className="font-semibold text-white">
              Desk Lamp · {lampMode === "cozy" ? "Cozy (40W)" : lampMode === "bright" ? "Focus (100W)" : "Night (15W)"}
            </div>
            <div className="text-[10px] text-amber-300/80">
              Click to toggle mode · Proximity: {Math.round(proximity * 100)}%
            </div>
          </div>
        </div>

        {/* Hotspot 2B: Developer Workstation Monitor (Center Screen) */}
        <div
          onClick={handleScanMonitor}
          onMouseEnter={() => setActiveHotspot("monitor")}
          onMouseLeave={() => setActiveHotspot(null)}
          title="Developer Workstation: Click to run AI code review scan"
          className="absolute z-20 cursor-pointer rounded-lg group transition-all duration-200"
          style={{
            left: "45%",
            top: "59%",
            width: "7.2%",
            height: "9.5%",
          }}
        >
          {/* Soft Screen Illumination on Hover (Natural soft neutral light) */}
          <div className="absolute inset-0 rounded bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Screen Wake Tooltip / Live Review Badge */}
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-black/90 backdrop-blur-md border border-white/15 text-[11px] font-mono text-slate-200 shadow-2xl whitespace-nowrap transition-all duration-200 pointer-events-none ${
              activeHotspot === "monitor" || monitorScanned
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-1"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">
                PR #184: payment-service
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {monitorScanned ? (
                <span className="text-emerald-300 font-semibold">
                  ✓ AI Scan Complete · 0 regressions detected
                </span>
              ) : (
                "14 tests passing · Click to trigger AI review"
              )}
            </div>
          </div>
        </div>

        {/* Hotspot 2C: Retro CRT Monitor on the Right Shelf */}
        <div
          onMouseEnter={() => setActiveHotspot("crt")}
          onMouseLeave={() => setActiveHotspot(null)}
          className="absolute z-20 cursor-pointer rounded-lg group transition-all duration-200"
          style={{
            left: "82.5%",
            top: "50%",
            width: "5.8%",
            height: "10.5%",
          }}
        >
          {/* Scanline subtle overlay */}
          <div className="absolute inset-0 scanline-overlay opacity-30 group-hover:opacity-60 transition-opacity duration-200 pointer-events-none rounded" />

          {/* Retro Tooltip */}
          <div
            className={`absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md border border-white/15 text-[11px] font-mono text-slate-300 shadow-xl whitespace-nowrap transition-all duration-200 pointer-events-none ${
              activeHotspot === "crt"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-1"
            }`}
          >
            <div className="font-semibold text-white">Retro CRT Terminal</div>
            <div className="text-[10px] text-amber-300/80">
              Buggers Engine v3.4 · 60 FPS
            </div>
          </div>
        </div>

        {/* Hotspot 2D: Lakeside Panoramic Window */}
        <div
          onMouseEnter={() => setActiveHotspot("window")}
          onMouseLeave={() => setActiveHotspot(null)}
          className="absolute z-10 cursor-default rounded-xl transition-all duration-200"
          style={{
            left: "41%",
            top: "41%",
            width: "20%",
            height: "13%",
          }}
        >
          {/* Lake Horizon Tooltip */}
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 shadow-xl whitespace-nowrap transition-all duration-200 pointer-events-none ${
              activeHotspot === "window"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1"
            }`}
          >
            🌌 Lake Pine Valley · 11:42 PM · Still Waters
          </div>
        </div>

        {/* Subtle, Organic Lakeside Light Twinkling (Distant cottage reflections on the water) */}
        <div className="pointer-events-none absolute left-[49%] top-[48%] h-1.5 w-1.5 rounded-full bg-amber-200/60 blur-[0.5px] animate-soft-twinkle-1" />
        <div className="pointer-events-none absolute left-[53%] top-[50%] h-1 w-1 rounded-full bg-amber-100/70 blur-[0.5px] animate-soft-twinkle-2" />
        <div className="pointer-events-none absolute left-[56%] top-[49%] h-1.5 w-1.5 rounded-full bg-amber-300/60 blur-[0.5px] animate-soft-twinkle-3" />

        {/* Centered Hero Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Main Heading: Buggers */}
          <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
            Buggers
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            Review smarter with AI that understands your repository. <br />
            So you can take a breath.
          </p>

          {/* Action Buttons with silky smooth micro-interactions */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/auth"
              className="rounded-full bg-white text-black px-8 py-3.5 text-xs sm:text-sm font-semibold shadow-xl shadow-black/40 hover:bg-slate-200 transition-all duration-300 active:scale-[0.985] flex items-center gap-2 hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/how-it-works"
              className="rounded-full bg-black/40 backdrop-blur-md px-7 py-3.5 text-xs sm:text-sm font-medium text-white hover:bg-black/65 border border-white/15 transition-all duration-300 flex items-center gap-2 active:scale-[0.985] hover:-translate-y-0.5"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>See How it Works</span>
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* GAMIFIED STUDIO HUD: BOTTOM-RIGHT INTERACTIVE CONTROLLER */}
        {/* ======================================================== */}
        <aside
          aria-label="Studio controls"
          className="fixed bottom-6 right-6 z-40 hidden sm:flex flex-col items-end gap-2"
        >
          {hudOpen ? (
            <div className="flex flex-col gap-2.5 rounded-2xl bg-black/80 backdrop-blur-lg border border-white/15 p-3.5 shadow-2xl text-xs text-slate-200 w-64 transition-all duration-300">
              {/* HUD Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Interactive Studio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSfxEnabled(!sfxEnabled)}
                    title={sfxEnabled ? "Mute switch SFX" : "Enable switch SFX"}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    {sfxEnabled ? "🔊" : "🔇"}
                  </button>
                  <button
                    onClick={() => setHudOpen(false)}
                    title="Minimize HUD"
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Lamp Proximity Live Meter */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Lamp Proximity</span>
                  <span className="text-amber-400 font-semibold">
                    {Math.round(proximity * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-150"
                    style={{ width: `${Math.round(proximity * 100)}%` }}
                  />
                </div>
              </div>

              {/* Quick Lamp Mode Selector */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {(
                  [
                    { id: "dim", label: "15W", tip: "Night" },
                    { id: "cozy", label: "40W", tip: "Cozy" },
                    { id: "bright", label: "100W", tip: "Focus" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setLampMode(m.id);
                      playClickSound(m.id);
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono font-medium transition-all duration-200 ${
                      lampMode === m.id
                        ? "bg-amber-500/25 border border-amber-400/50 text-amber-200 shadow-xs"
                        : "bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Interactive Gameplay Guide */}
              <div className="text-[10px] text-slate-400 pt-0.5 border-t border-white/5 leading-snug">
                Move cursor near lamp to brighten • Click lamp or monitor on desk
              </div>
            </div>
          ) : (
            <button
              onClick={() => setHudOpen(true)}
              className="flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-md border border-white/15 px-4 py-2 text-xs font-medium text-slate-300 shadow-xl hover:text-white hover:border-amber-500/40 transition-all duration-200"
            >
              <span>💡</span>
              <span>Lamp: {lampMode} ({Math.round(proximity * 100)}%)</span>
            </button>
          )}
        </aside>
      </section>

      {/* Minimal Dark Footer */}
      <footer className="bg-black py-10 px-4 sm:px-6 text-xs text-slate-500 border-t border-white/10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-slate-300 font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-slate-500 text-[11px]">
              &copy; 2026 Buggers, Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/how-it-works"
              className="hover:text-white transition-colors duration-200"
            >
              How it works
            </Link>
            <Link
              to="/auth"
              className="hover:text-white transition-colors duration-200"
            >
              Sign In
            </Link>
            <span className="text-emerald-400 font-mono text-[11px]">
              All Systems Normal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
