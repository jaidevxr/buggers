import { useState } from "react";

export function LinearWireframeGrid() {
  const [activeFig, setActiveFig] = useState<number | null>(null);

  return (
    <section className="w-full pt-8 sm:pt-12 pb-10 sm:pb-14">
      {/* Structured Editorial Headline */}
      <div className="max-w-3xl mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/[0.08] px-3.5 py-1 text-xs font-mono text-[#8a8f98]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="uppercase text-[10px] tracking-widest text-neutral-300">Core Architecture</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-[1.12]">
          Purpose-built for release confidence.
        </h2>
        
        <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
          Engineered from first principles with deterministic AST scanners, orthogonal Shannon entropy tensors, and sub-second diff verification.
        </p>
      </div>

      {/* 3-Column Isometric Wireframe Grid with Hairline Dividers (Linear Aesthetic) */}
      <div className="grid grid-cols-1 md:grid-cols-3 rounded-2xl border border-white/[0.08] overflow-hidden bg-[#090a0d] divide-y md:divide-y-0 md:divide-x divide-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
        
        {/* ============================================================== */}
        {/* FIG 0.1: Layered Isometric Prisms (Deterministic First) */}
        {/* ============================================================== */}
        <div
          onMouseEnter={() => setActiveFig(1)}
          onMouseLeave={() => setActiveFig(null)}
          className="p-7 sm:p-9 flex flex-col justify-between space-y-7 bg-transparent group transition-colors duration-300 hover:bg-white/[0.015] cursor-default"
        >
          {/* Wireframe Canvas: strictly bounded with overflow-hidden & calibrated geometry */}
          <div className="h-64 w-full flex items-center justify-center relative overflow-hidden rounded-xl bg-black/40 border border-white/[0.04]">
            <span className="absolute top-3.5 left-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest z-10 select-none">
              FIG 0.1 · AST DECONSTRUCTION
            </span>

            <svg
              viewBox="0 0 240 190"
              className="w-60 h-48 select-none pointer-events-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="laserBeamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="50%" stopColor="rgba(52,211,153,0.9)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,1)" />
                </linearGradient>
                <linearGradient id="facetHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                </linearGradient>
              </defs>

              {/* Central Optical Axis Beam */}
              <line
                x1="120"
                y1="175"
                x2="120"
                y2="30"
                stroke="url(#laserBeamGrad)"
                strokeWidth={activeFig === 1 ? "1.5" : "1"}
                strokeDasharray="4 3"
                className={activeFig === 1 ? "animate-laser-dash opacity-90" : "opacity-30"}
                style={{ transition: "stroke-width 400ms, opacity 400ms" }}
              />

              {/* Layer 1 (Bottom Plate) */}
              <g
                style={{
                  transform: activeFig === 1 ? "translateY(6px)" : "translateY(0px)",
                  transition: "transform 550ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms",
                }}
              >
                <ellipse cx="120" cy="155" rx="55" ry="16" fill="rgba(0,0,0,0.5)" className="blur-xs" />
                <path
                  d="M120 150 L180 120 L180 128 L120 158 L60 128 L60 120 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.75" : "0.3"}
                  strokeWidth="1"
                  fill="url(#facetHighlight)"
                />
                <path
                  d="M120 150 L180 120 L120 90 L60 120 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.5" : "0.2"}
                  strokeWidth="0.8"
                  fill="rgba(255,255,255,0.015)"
                />
                <text
                  x="185"
                  y="126"
                  fill="white"
                  fillOpacity={activeFig === 1 ? "0.6" : "0"}
                  fontSize="7.5"
                  fontFamily="monospace"
                  style={{ transition: "fill-opacity 400ms" }}
                >
                  L1 · DIFF
                </text>
              </g>

              {/* Layer 2 (Middle Plate) */}
              <g
                style={{
                  transform: activeFig === 1 ? "translateY(-4px)" : "translateY(0px)",
                  transition: "transform 550ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms",
                }}
              >
                <path
                  d="M120 122 L180 92 L180 100 L120 130 L60 100 L60 92 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.85" : "0.38"}
                  strokeWidth="1"
                  fill="rgba(255,255,255,0.03)"
                />
                <path
                  d="M120 122 L180 92 L120 62 L60 92 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.6" : "0.25"}
                  strokeWidth="0.8"
                  fill="rgba(255,255,255,0.02)"
                />
                {activeFig === 1 && (
                  <line
                    x1="85"
                    y1="105"
                    x2="155"
                    y2="75"
                    stroke="rgba(52,211,153,0.8)"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    className="animate-laser-dash"
                  />
                )}
                <text
                  x="185"
                  y="98"
                  fill="white"
                  fillOpacity={activeFig === 1 ? "0.7" : "0"}
                  fontSize="7.5"
                  fontFamily="monospace"
                  style={{ transition: "fill-opacity 400ms" }}
                >
                  L2 · AST
                </text>
              </g>

              {/* Layer 3 (Top Plate) */}
              <g
                style={{
                  transform: activeFig === 1 ? "translateY(-12px)" : "translateY(0px)",
                  transition: "transform 550ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms",
                }}
              >
                <path
                  d="M120 94 L180 64 L180 72 L120 102 L60 72 L60 64 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "1" : "0.5"}
                  strokeWidth="1.2"
                  fill="rgba(255,255,255,0.05)"
                />
                <path
                  d="M120 94 L180 64 L120 34 L60 64 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.8" : "0.35"}
                  strokeWidth="0.9"
                  fill="url(#facetHighlight)"
                />
                <ellipse
                  cx="120"
                  cy="64"
                  rx="14"
                  ry="7"
                  stroke={activeFig === 1 ? "rgba(52,211,153,0.9)" : "rgba(255,255,255,0.4)"}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  fill="rgba(52,211,153,0.05)"
                />
                <circle
                  cx="120"
                  cy="64"
                  r={activeFig === 1 ? "3" : "2"}
                  fill={activeFig === 1 ? "#34d399" : "white"}
                />
                <text
                  x="185"
                  y="70"
                  fill="#34d399"
                  fillOpacity={activeFig === 1 ? "0.9" : "0"}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="600"
                  style={{ transition: "fill-opacity 400ms" }}
                >
                  L3 · INFERENCE
                </text>
              </g>
            </svg>
          </div>

          {/* Structured Text & Telemetry Pill */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white tracking-tight">
              Deterministic-first triage
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed">
              Zero-overhead regex scanners and AST verification execute in-process before invoking LLMs, ensuring zero hallucination on critical file coordinates.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                Zero-runtime AST
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FIG 0.2: Orthogonal Risk Coordinate System (Tensor Cubes) */}
        {/* ============================================================== */}
        <div
          onMouseEnter={() => setActiveFig(2)}
          onMouseLeave={() => setActiveFig(null)}
          className="p-7 sm:p-9 flex flex-col justify-between space-y-7 bg-transparent group transition-colors duration-300 hover:bg-white/[0.015] cursor-default"
        >
          {/* Wireframe Canvas: strictly bounded with overflow-hidden & calibrated geometry */}
          <div className="h-64 w-full flex items-center justify-center relative overflow-hidden rounded-xl bg-black/40 border border-white/[0.04]">
            <span className="absolute top-3.5 left-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest z-10 select-none">
              FIG 0.2 · SIGNAL TENSOR
            </span>

            <svg
              viewBox="0 0 240 190"
              className="w-60 h-48 select-none pointer-events-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Isometric Coordinate System Axes */}
              <g stroke="white" strokeOpacity={activeFig === 2 ? "0.25" : "0.1"} strokeWidth="1">
                <line x1="120" y1="165" x2="120" y2="40" strokeDasharray="3 3" />
                <line x1="120" y1="165" x2="35" y2="120" />
                <line x1="120" y1="165" x2="205" y2="120" />
              </g>

              {/* Dynamic Connecting Tensor Lines */}
              <g
                stroke={activeFig === 2 ? "rgba(52,211,153,0.7)" : "rgba(255,255,255,0.15)"}
                strokeWidth={activeFig === 2 ? "1.2" : "0.8"}
                strokeDasharray={activeFig === 2 ? "3 2" : "2 3"}
                className={activeFig === 2 ? "animate-laser-dash" : ""}
                style={{ transition: "stroke 400ms, stroke-width 400ms" }}
              >
                <line x1="85" y1="95" x2="155" y2="78" />
                <line x1="85" y1="95" x2="120" y2="130" />
                <line x1="155" y1="78" x2="120" y2="130" />
              </g>

              {/* Cube 1 (Back Left) */}
              <g
                style={{
                  transform: activeFig === 2 ? "translate(-5px, -5px)" : "translate(0, 0)",
                  transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <g stroke="white" strokeOpacity={activeFig === 2 ? "0.85" : "0.45"} strokeWidth="1">
                  <path d="M55 92 L85 75 L115 92 L85 109 Z" fill="rgba(255,255,255,0.03)" />
                  <path d="M55 92 L55 122 L85 139 L85 109 Z" fill="rgba(255,255,255,0.02)" />
                  <path d="M115 92 L115 122 L85 139" />
                </g>
                <circle cx="85" cy="92" r={activeFig === 2 ? "2.5" : "1.5"} fill={activeFig === 2 ? "#34d399" : "white"} />
              </g>

              {/* Cube 2 (Summit Right Tensor - Elevated) */}
              <g
                style={{
                  transform: activeFig === 2 ? "translate(6px, -8px)" : "translate(0, 0)",
                  transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <line x1="155" y1="98" x2="155" y2="150" stroke="rgba(52,211,153,0.6)" strokeOpacity={activeFig === 2 ? "0.5" : "0.1"} strokeDasharray="2 2" />
                <g
                  stroke="white"
                  strokeOpacity={activeFig === 2 ? "1" : "0.6"}
                  strokeWidth={activeFig === 2 ? "1.3" : "1.1"}
                >
                  <path d="M125 58 L155 41 L185 58 L155 75 Z" fill="rgba(255,255,255,0.08)" />
                  <path d="M125 58 L125 88 L155 105 L155 75 Z" fill="rgba(255,255,255,0.04)" />
                  <path d="M185 58 L185 88 L155 105" fill="rgba(255,255,255,0.02)" />
                </g>
                <circle cx="155" cy="58" r={activeFig === 2 ? "3" : "1.8"} fill={activeFig === 2 ? "#34d399" : "white"} />
              </g>

              {/* Cube 3 (Front Center) */}
              <g
                style={{
                  transform: activeFig === 2 ? "translate(6px, -2px)" : "translate(0, 0)",
                  transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <g stroke="white" strokeOpacity={activeFig === 2 ? "0.9" : "0.4"} strokeWidth="1">
                  <path d="M90 120 L120 103 L150 120 L120 137 Z" fill="rgba(255,255,255,0.03)" />
                  <path d="M90 120 L90 150 L120 167 L120 137 Z" fill="rgba(255,255,255,0.02)" />
                  <path d="M150 120 L150 150 L120 167" />
                </g>
              </g>
            </svg>
          </div>

          {/* Structured Text & Telemetry Pill */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white tracking-tight">
              Mathematical risk synthesis
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed">
              Combines 8 orthogonal signals—churn volume, Shannon diffusion entropy, test ratios, and author unfamiliarity—into a calibrated score between 0 and 100.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400/90 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                <span className="h-1 w-1 rounded-full bg-cyan-400" />
                8 orthogonal tensors
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FIG 0.3: Cascading Isometric Stairs (High-Assurance Speed) */}
        {/* Perfectly bounded & calibrated geometry (Zero out-of-frame leak) */}
        {/* ============================================================== */}
        <div
          onMouseEnter={() => setActiveFig(3)}
          onMouseLeave={() => setActiveFig(null)}
          className="p-7 sm:p-9 flex flex-col justify-between space-y-7 bg-transparent group transition-colors duration-300 hover:bg-white/[0.015] cursor-default"
        >
          {/* Wireframe Canvas: strictly bounded with overflow-hidden & calibrated geometry */}
          <div className="h-64 w-full flex items-center justify-center relative overflow-hidden rounded-xl bg-black/40 border border-white/[0.04]">
            <span className="absolute top-3.5 left-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest z-10 select-none">
              FIG 0.3 · VELOCITY PIPELINE
            </span>

            <svg
              viewBox="0 0 240 190"
              className="w-60 h-48 select-none pointer-events-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Ground baseline trace */}
              <line x1="24" y1="165" x2="216" y2="165" stroke="white" strokeOpacity="0.08" strokeWidth="0.8" />

              {/* Summit Velocity Laser Trace Line connecting peaks */}
              <path
                d="M48 140 L76 124 L104 108 L132 92 L160 76"
                stroke={activeFig === 3 ? "rgba(52,211,153,0.85)" : "rgba(255,255,255,0.2)"}
                strokeWidth={activeFig === 3 ? "1.5" : "0.8"}
                strokeDasharray={activeFig === 3 ? "3 3" : "none"}
                className={activeFig === 3 ? "animate-laser-dash" : ""}
                style={{ transition: "stroke 400ms, stroke-width 400ms" }}
              />

              {/* Cascading 5 Isometric Architectural Blades strictly contained in frame */}
              {[0, 1, 2, 3, 4].map((idx) => {
                const xOffset = 36 + idx * 28;
                const baseY = 162;
                const height = 22 + idx * 16;
                const summitY = baseY - height;
                
                // Controlled subtle elevation lift on hover (max 7px for summit blade)
                const elevationLift = activeFig === 3 ? (idx + 1) * 1.5 : 0;
                const opacity = activeFig === 3 ? 0.35 + idx * 0.14 : 0.18 + idx * 0.11;

                return (
                  <g
                    key={idx}
                    stroke="white"
                    strokeOpacity={opacity}
                    strokeWidth={activeFig === 3 && idx >= 3 ? "1.2" : "1"}
                    style={{
                      transform: `translateY(-${elevationLift}px)`,
                      transition: `transform 500ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 35}ms`,
                    }}
                  >
                    {/* Vertical Side Face */}
                    <path
                      d={`M${xOffset} ${baseY} L${xOffset + 18} ${baseY - 10} L${xOffset + 18} ${summitY - 10} L${xOffset} ${summitY} Z`}
                      fill={activeFig === 3 && idx === 4 ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.02)"}
                    />
                    {/* Top Diamond Tread Facet */}
                    <path
                      d={`M${xOffset + 18} ${summitY - 10} L${xOffset + 32} ${summitY - 18} L${xOffset + 14} ${summitY - 8} L${xOffset} ${summitY} Z`}
                      fill={activeFig === 3 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}
                    />
                  </g>
                );
              })}

              {/* Peak Summit Telemetry Badge (illuminates on hover, perfectly contained inside viewBox with generous headroom) */}
              <g
                style={{
                  transform: activeFig === 3 ? "translateY(-7px)" : "translateY(0px)",
                  opacity: activeFig === 3 ? 1 : 0,
                  transition: "transform 500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms",
                }}
              >
                <circle cx="160" cy="76" r="3" fill="#34d399" />
                <rect
                  x="170"
                  y="62"
                  width="44"
                  height="18"
                  rx="4"
                  fill="#000000"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="0.8"
                />
                <text
                  x="176"
                  y="74"
                  fill="#34d399"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  140ms
                </text>
              </g>
            </svg>
          </div>

          {/* Structured Text & Telemetry Pill */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white tracking-tight">
              Designed for high velocity
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed">
              Engineered with Nitro SSR, Vinxi, and Supabase RLS for sub-second page transitions, instant diff caching, and zero developer review fatigue.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                <span className="h-1 w-1 rounded-full bg-amber-400" />
                140ms p95 latency
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
