import { useState } from "react";

export function LinearWireframeGrid() {
  const [activeFig, setActiveFig] = useState<number | null>(null);

  return (
    <section className="w-full my-24 border-t border-white/[0.08] pt-20">
      {/* Top Banner Headline */}
      <div className="max-w-4xl mb-16 space-y-4">
        <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-[1.12]">
          A new species of code review tool.{" "}
          <span className="text-neutral-400 font-normal">
            Purpose-built for modern engineering teams with deterministic risk models at its core, Buggers sets a new standard for release confidence.
          </span>
        </h2>
      </div>

      {/* 3-Column Isometric Wireframe Grid with Hairline Dividers (Linear Open Hairline) */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-y border-white/[0.08] divide-y md:divide-y-0 md:divide-x divide-white/[0.08] bg-[#08090a]">
        
        {/* ============================================================== */}
        {/* FIG 0.1: Layered Isometric Prisms (Deterministic First) */}
        {/* Layer-by-layer smooth 3D deconstruction & separation */}
        {/* ============================================================== */}
        <div
          onMouseEnter={() => setActiveFig(1)}
          onMouseLeave={() => setActiveFig(null)}
          className="p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-transparent group transition-colors duration-300 hover:bg-white/[0.015] cursor-default"
        >
          {/* Wireframe Canvas */}
          <div className="h-56 w-full flex items-center justify-center relative overflow-visible">
            <span className="absolute top-0 left-0 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              FIG 0.1 / AST DECONSTRUCTION
            </span>

            <svg
              viewBox="0 0 220 180"
              className="w-52 h-44 overflow-visible"
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

              {/* Central Optical Axis Beam (connects all 3 plates) */}
              <line
                x1="110"
                y1="160"
                x2="110"
                y2="20"
                stroke="url(#laserBeamGrad)"
                strokeWidth={activeFig === 1 ? "1.5" : "1"}
                strokeDasharray="4 3"
                className={activeFig === 1 ? "animate-laser-dash opacity-90" : "opacity-30"}
                style={{ transition: "stroke-width 400ms, opacity 400ms" }}
              />

              {/* ---------------------------------------------------- */}
              {/* Layer 1 (Bottom Plate: Raw Unified Diff Context) */}
              {/* Translates downward on active to separate stack */}
              {/* ---------------------------------------------------- */}
              <g
                style={{
                  transform: activeFig === 1 ? "translateY(10px)" : "translateY(0px)",
                  transition: "transform 550ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms",
                }}
              >
                {/* Floor Ground Grid Shadow */}
                <ellipse
                  cx="110"
                  cy="148"
                  rx="65"
                  ry="24"
                  fill="rgba(0,0,0,0.5)"
                  className="blur-xs"
                />
                {/* Bottom Slab Body */}
                <path
                  d="M110 135 L180 95 L180 105 L110 145 L40 105 L40 95 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.75" : "0.3"}
                  strokeWidth="1"
                  fill="url(#facetHighlight)"
                />
                {/* Bottom Slab Top Rim */}
                <path
                  d="M110 135 L180 95 L110 55 L40 95 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.5" : "0.2"}
                  strokeWidth="0.8"
                  fill="rgba(255,255,255,0.015)"
                />
                {/* Layer 1 Micro-Tag */}
                <text
                  x="185"
                  y="108"
                  fill="white"
                  fillOpacity={activeFig === 1 ? "0.6" : "0"}
                  fontSize="7.5"
                  fontFamily="monospace"
                  style={{ transition: "fill-opacity 400ms" }}
                >
                  L1 · DIFF
                </text>
              </g>

              {/* ---------------------------------------------------- */}
              {/* Layer 2 (Middle Plate: Deterministic AST Scanners) */}
              {/* Translates slightly upward to float midway */}
              {/* ---------------------------------------------------- */}
              <g
                style={{
                  transform: activeFig === 1 ? "translateY(-3px)" : "translateY(0px)",
                  transition: "transform 550ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms",
                }}
              >
                {/* Middle Slab Body */}
                <path
                  d="M110 105 L180 65 L180 75 L110 115 L40 75 L40 65 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.85" : "0.38"}
                  strokeWidth="1"
                  fill="rgba(255,255,255,0.03)"
                />
                {/* Middle Slab Top Rim */}
                <path
                  d="M110 105 L180 65 L110 25 L40 65 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.6" : "0.25"}
                  strokeWidth="0.8"
                  fill="rgba(255,255,255,0.02)"
                />
                {/* Internal Laser Scanner Wave on Middle Plate */}
                {activeFig === 1 && (
                  <line
                    x1="75"
                    y1="85"
                    x2="145"
                    y2="45"
                    stroke="rgba(52,211,153,0.8)"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    className="animate-laser-dash"
                  />
                )}
                {/* Layer 2 Micro-Tag */}
                <text
                  x="185"
                  y="78"
                  fill="white"
                  fillOpacity={activeFig === 1 ? "0.7" : "0"}
                  fontSize="7.5"
                  fontFamily="monospace"
                  style={{ transition: "fill-opacity 400ms" }}
                >
                  L2 · AST
                </text>
              </g>

              {/* ---------------------------------------------------- */}
              {/* Layer 3 (Top Plate: Release Gate & Model Verification) */}
              {/* Floats high in air on active with specular highlight */}
              {/* ---------------------------------------------------- */}
              <g
                style={{
                  transform: activeFig === 1 ? "translateY(-16px)" : "translateY(0px)",
                  transition: "transform 550ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms",
                }}
              >
                {/* Top Plate Body */}
                <path
                  d="M110 75 L180 35 L180 45 L110 85 L40 45 L40 35 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "1" : "0.5"}
                  strokeWidth={activeFig === 1 ? "1.4" : "1.1"}
                  fill="rgba(255,255,255,0.05)"
                />
                {/* Top Diamond Facet */}
                <path
                  d="M110 75 L180 35 L110 -5 L40 35 Z"
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "1" : "0.6"}
                  strokeWidth={activeFig === 1 ? "1.4" : "1.1"}
                  fill="url(#facetHighlight)"
                />
                {/* Concentric Radar Ring on Top Summit */}
                <ellipse
                  cx="110"
                  cy="35"
                  rx={activeFig === 1 ? "32" : "26"}
                  ry={activeFig === 1 ? "16" : "13"}
                  stroke="white"
                  strokeOpacity={activeFig === 1 ? "0.9" : "0.35"}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className={activeFig === 1 ? "animate-laser-dash" : ""}
                  style={{ transition: "rx 500ms, ry 500ms, stroke-opacity 400ms" }}
                />
                {/* Center Core Node */}
                <circle
                  cx="110"
                  cy="35"
                  r={activeFig === 1 ? "3.5" : "2"}
                  fill={activeFig === 1 ? "#34d399" : "white"}
                  fillOpacity={activeFig === 1 ? "1" : "0.7"}
                  style={{ transition: "r 400ms, fill 400ms" }}
                />
                {/* Layer 3 Micro-Tag */}
                <text
                  x="185"
                  y="48"
                  fill="white"
                  fillOpacity={activeFig === 1 ? "0.85" : "0"}
                  fontSize="7.5"
                  fontFamily="monospace"
                  style={{ transition: "fill-opacity 400ms" }}
                >
                  L3 · GATE
                </text>
              </g>
            </svg>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white tracking-tight">
              Deterministic-first triage
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed">
              Zero-overhead regex scanners and AST verification execute in-process before invoking LLMs, ensuring zero hallucination on critical file coordinates.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FIG 0.2: Isometric Cubes Array (Multi-Signal Model 1.1.0) */}
        {/* Dynamic 3D coordinate elevation & vector conduits */}
        {/* ============================================================== */}
        <div
          onMouseEnter={() => setActiveFig(2)}
          onMouseLeave={() => setActiveFig(null)}
          className="p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-transparent group transition-colors duration-300 hover:bg-white/[0.015] cursor-default"
        >
          {/* Wireframe Canvas */}
          <div className="h-56 w-full flex items-center justify-center relative overflow-visible">
            <span className="absolute top-0 left-0 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              FIG 0.2 / SIGNAL TENSOR
            </span>

            <svg
              viewBox="0 0 220 180"
              className="w-52 h-44 overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Isometric Ground Grid Lines */}
              <g stroke="white" strokeOpacity="0.08" strokeWidth="0.8">
                <line x1="20" y1="130" x2="200" y2="130" />
                <line x1="50" y1="150" x2="170" y2="110" />
                <line x1="170" y1="150" x2="50" y2="110" />
              </g>

              {/* Connecting Vector Lines between Cube Centroids */}
              <g
                stroke={activeFig === 2 ? "rgba(52,211,153,0.7)" : "rgba(255,255,255,0.15)"}
                strokeWidth={activeFig === 2 ? "1.2" : "0.8"}
                strokeDasharray={activeFig === 2 ? "3 3" : "none"}
                className={activeFig === 2 ? "animate-laser-dash" : ""}
                style={{ transition: "stroke 400ms, stroke-width 400ms" }}
              >
                {/* Conduits dynamically drawn between cubes */}
                <line x1="75" y1="65" x2="145" y2="70" />
                <line x1="75" y1="65" x2="65" y2="115" />
                <line x1="65" y1="115" x2="145" y2="70" />
              </g>

              {/* ---------------------------------------------------- */}
              {/* Cube 1 (Back Left: Churn & Entropy Signal) */}
              {/* Translates left and back on active */}
              {/* ---------------------------------------------------- */}
              <g
                style={{
                  transform: activeFig === 2 ? "translate(-8px, 4px)" : "translate(0, 0)",
                  transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Vertical Altitude Plumb Line */}
                <line
                  x1="75"
                  y1="80"
                  x2="75"
                  y2="135"
                  stroke="white"
                  strokeOpacity={activeFig === 2 ? "0.2" : "0.06"}
                  strokeDasharray="2 2"
                />
                <g stroke="white" strokeOpacity={activeFig === 2 ? "0.8" : "0.3"} strokeWidth="1">
                  {/* Top face */}
                  <path d="M45 42 L75 25 L105 42 L75 59 Z" fill="rgba(255,255,255,0.02)" />
                  {/* Left face */}
                  <path d="M45 42 L45 72 L75 89 L75 59 Z" fill="rgba(255,255,255,0.01)" />
                  {/* Right face */}
                  <path d="M105 42 L105 72 L75 89" />
                </g>
              </g>

              {/* ---------------------------------------------------- */}
              {/* Cube 2 (Center Elevated: Multi-Signal Calibrator) */}
              {/* Elevates significantly upward with high specular glow */}
              {/* ---------------------------------------------------- */}
              <g
                style={{
                  transform: activeFig === 2 ? "translate(0px, -18px)" : "translate(0, 0)",
                  transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Vertical Altitude Plumb Line */}
                <line
                  x1="145"
                  y1="105"
                  x2="145"
                  y2="155"
                  stroke="rgba(52,211,153,0.6)"
                  strokeOpacity={activeFig === 2 ? "0.5" : "0.1"}
                  strokeDasharray="2 2"
                />
                <g
                  stroke="white"
                  strokeOpacity={activeFig === 2 ? "1" : "0.6"}
                  strokeWidth={activeFig === 2 ? "1.3" : "1.1"}
                >
                  {/* Top face with bright highlight */}
                  <path d="M110 52 L145 32 L180 52 L145 72 Z" fill="rgba(255,255,255,0.08)" />
                  {/* Left face */}
                  <path d="M110 52 L110 87 L145 107 L145 72 Z" fill="rgba(255,255,255,0.04)" />
                  {/* Right face */}
                  <path d="M180 52 L180 87 L145 107" fill="rgba(255,255,255,0.02)" />
                </g>
                {/* Active summit node */}
                <circle
                  cx="145"
                  cy="52"
                  r={activeFig === 2 ? "3" : "1.8"}
                  fill={activeFig === 2 ? "#34d399" : "white"}
                />
              </g>

              {/* ---------------------------------------------------- */}
              {/* Cube 3 (Front Left: Author Volatility Tensor) */}
              {/* Steps forward and right on active */}
              {/* ---------------------------------------------------- */}
              <g
                style={{
                  transform: activeFig === 2 ? "translate(10px, -2px)" : "translate(0, 0)",
                  transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Vertical Altitude Plumb Line */}
                <line
                  x1="65"
                  y1="130"
                  x2="65"
                  y2="155"
                  stroke="white"
                  strokeOpacity={activeFig === 2 ? "0.2" : "0.06"}
                  strokeDasharray="2 2"
                />
                <g stroke="white" strokeOpacity={activeFig === 2 ? "0.9" : "0.4"} strokeWidth="1">
                  {/* Top face */}
                  <path d="M30 85 L65 65 L100 85 L65 105 Z" fill="rgba(255,255,255,0.03)" />
                  {/* Left face */}
                  <path d="M30 85 L30 120 L65 140 L65 105 Z" fill="rgba(255,255,255,0.02)" />
                  {/* Right face */}
                  <path d="M100 85 L100 120 L65 140" />
                </g>
              </g>
            </svg>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white tracking-tight">
              Mathematical risk synthesis
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed">
              Combines 8 orthogonal signals—churn volume, Shannon diffusion entropy, test ratios, and author unfamiliarity—into a calibrated score between 0 and 100.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FIG 0.3: Cascading Isometric Stairs (High-Assurance Speed) */}
        {/* Layer-by-layer sequential ascension & summit velocity beam */}
        {/* ============================================================== */}
        <div
          onMouseEnter={() => setActiveFig(3)}
          onMouseLeave={() => setActiveFig(null)}
          className="p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-transparent group transition-colors duration-300 hover:bg-white/[0.015] cursor-default"
        >
          {/* Wireframe Canvas */}
          <div className="h-56 w-full flex items-center justify-center relative overflow-visible">
            <span className="absolute top-0 left-0 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              FIG 0.3 / VELOCITY PIPELINE
            </span>

            <svg
              viewBox="0 0 220 180"
              className="w-52 h-44 overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Summit Velocity Laser Trace Line connecting peaks */}
              <path
                d="M40 120 L62 104 L84 88 L106 72 L128 56 L150 40"
                stroke={activeFig === 3 ? "rgba(52,211,153,0.85)" : "rgba(255,255,255,0.15)"}
                strokeWidth={activeFig === 3 ? "1.5" : "0.8"}
                strokeDasharray={activeFig === 3 ? "3 3" : "none"}
                className={activeFig === 3 ? "animate-laser-dash" : ""}
                style={{ transition: "stroke 400ms, stroke-width 400ms" }}
              />

              {/* Cascading 6 Isometric Architectural Blades with Staggered Elevation */}
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const xOffset = 26 + idx * 22;
                const yOffset = 135 - idx * 16;
                const height = 18 + idx * 14;
                
                // Staggered vertical displacement on hover
                const elevationLift = activeFig === 3 ? (idx + 1) * 5 : 0;
                const opacity = activeFig === 3 ? 0.35 + idx * 0.13 : 0.18 + idx * 0.09;

                return (
                  <g
                    key={idx}
                    stroke="white"
                    strokeOpacity={opacity}
                    strokeWidth={activeFig === 3 && idx >= 4 ? "1.2" : "1"}
                    style={{
                      transform: `translateY(-${elevationLift}px)`,
                      transition: `transform 500ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 40}ms`,
                    }}
                  >
                    {/* Vertical Side Blade Face */}
                    <path
                      d={`M${xOffset} ${yOffset} L${xOffset + 24} ${yOffset - 14} L${xOffset + 24} ${
                        yOffset - 14 - height
                      } L${xOffset} ${yOffset - height} Z`}
                      fill={activeFig === 3 && idx === 5 ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.02)"}
                    />
                    {/* Top Diamond Tread Facet */}
                    <path
                      d={`M${xOffset + 24} ${yOffset - 14 - height} L${xOffset + 44} ${
                        yOffset - 25 - height
                      } L${xOffset + 20} ${yOffset - 11 - height} L${xOffset} ${yOffset - height} Z`}
                      fill={activeFig === 3 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}
                    />
                  </g>
                );
              })}

              {/* Peak Summit Telemetry Badge (illuminates on hover) */}
              <g
                style={{
                  transform: activeFig === 3 ? "translateY(-30px)" : "translateY(0px)",
                  opacity: activeFig === 3 ? 1 : 0,
                  transition: "transform 550ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms",
                }}
              >
                <circle cx="150" cy="40" r="3.5" fill="#34d399" />
                <rect
                  x="160"
                  y="30"
                  width="44"
                  height="16"
                  rx="3"
                  fill="#08090a"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.8"
                />
                <text
                  x="165"
                  y="41"
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

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white tracking-tight">
              Designed for high velocity
            </h3>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed">
              Engineered with Nitro SSR, Vinxi, and Supabase RLS for sub-second page transitions, instant diff caching, and zero developer review fatigue.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
