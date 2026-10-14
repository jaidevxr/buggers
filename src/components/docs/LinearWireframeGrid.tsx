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
        
        {/* FIG 0.1: Layered Isometric Prisms (Deterministic First) */}
        <div
          onMouseEnter={() => setActiveFig(1)}
          onMouseLeave={() => setActiveFig(null)}
          className="p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-transparent group transition-all duration-300 hover:bg-white/[0.02]"
        >
          {/* Wireframe Canvas */}
          <div className="h-52 w-full flex items-center justify-center relative">
            <span className="absolute top-0 left-0 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              FIG 0.1
            </span>
            <svg
              viewBox="0 0 200 160"
              className="w-44 h-36 transition-transform duration-500 ease-out group-hover:scale-105"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Layer 1 (Bottom) */}
              <path
                d="M100 135 L170 95 L170 105 L100 145 L30 105 L30 95 Z"
                stroke="white"
                strokeOpacity={activeFig === 1 ? "0.8" : "0.25"}
                strokeWidth="1"
                fill="rgba(255,255,255,0.02)"
              />
              {/* Layer 2 (Middle) */}
              <path
                d="M100 105 L170 65 L170 75 L100 115 L30 75 L30 65 Z"
                stroke="white"
                strokeOpacity={activeFig === 1 ? "0.9" : "0.35"}
                strokeWidth="1"
                fill="rgba(255,255,255,0.03)"
              />
              {/* Layer 3 (Top) */}
              <path
                d="M100 75 L170 35 L100 -5 L30 35 Z"
                stroke="white"
                strokeOpacity={activeFig === 1 ? "1" : "0.5"}
                strokeWidth="1.2"
                fill="rgba(255,255,255,0.05)"
              />
              <path
                d="M100 75 L170 35 L170 45 L100 85 L30 45 L30 35 Z"
                stroke="white"
                strokeOpacity={activeFig === 1 ? "1" : "0.5"}
                strokeWidth="1.2"
              />
              {/* Core Concentric Ring on Top */}
              <ellipse
                cx="100"
                cy="35"
                rx="28"
                ry="14"
                stroke="white"
                strokeOpacity={activeFig === 1 ? "0.9" : "0.4"}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
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

        {/* FIG 0.2: Isometric Cubes Array (Multi-Signal Model 1.1.0) */}
        <div
          onMouseEnter={() => setActiveFig(2)}
          onMouseLeave={() => setActiveFig(null)}
          className="p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-transparent group transition-all duration-300 hover:bg-white/[0.02]"
        >
          {/* Wireframe Canvas */}
          <div className="h-52 w-full flex items-center justify-center relative">
            <span className="absolute top-0 left-0 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              FIG 0.2
            </span>
            <svg
              viewBox="0 0 200 160"
              className="w-44 h-36 transition-transform duration-500 ease-out group-hover:scale-105"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back Cube Left */}
              <g stroke="white" strokeOpacity={activeFig === 2 ? "0.7" : "0.25"} strokeWidth="1">
                <path d="M60 40 L90 22 L120 40 L90 58 Z" />
                <path d="M60 40 L60 70 L90 88 L90 58 Z" />
                <path d="M120 40 L120 70 L90 88" />
              </g>
              {/* Elevated Center Cube */}
              <g stroke="white" strokeOpacity={activeFig === 2 ? "1" : "0.6"} strokeWidth="1.2">
                <path d="M100 65 L135 45 L170 65 L135 85 Z" fill="rgba(255,255,255,0.04)" />
                <path d="M100 65 L100 100 L135 120 L135 85 Z" fill="rgba(255,255,255,0.02)" />
                <path d="M170 65 L170 100 L135 120" />
              </g>
              {/* Front Cube Left */}
              <g stroke="white" strokeOpacity={activeFig === 2 ? "0.9" : "0.35"} strokeWidth="1">
                <path d="M35 85 L70 65 L105 85 L70 105 Z" fill="rgba(255,255,255,0.03)" />
                <path d="M35 85 L35 120 L70 140 L70 105 Z" />
                <path d="M105 85 L105 120 L70 140" />
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

        {/* FIG 0.3: Cascading Isometric Stairs (High-Assurance Speed) */}
        <div
          onMouseEnter={() => setActiveFig(3)}
          onMouseLeave={() => setActiveFig(null)}
          className="p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-transparent group transition-all duration-300 hover:bg-white/[0.02]"
        >
          {/* Wireframe Canvas */}
          <div className="h-52 w-full flex items-center justify-center relative">
            <span className="absolute top-0 left-0 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              FIG 0.3
            </span>
            <svg
              viewBox="0 0 200 160"
              className="w-44 h-36 transition-transform duration-500 ease-out group-hover:scale-105"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Cascading Isometric Architectural Stair Blades */}
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const xOffset = 30 + idx * 20;
                const yOffset = 130 - idx * 16;
                const height = 20 + idx * 14;
                const opacity = activeFig === 3 ? 0.3 + idx * 0.14 : 0.15 + idx * 0.1;
                return (
                  <g key={idx} stroke="white" strokeOpacity={opacity} strokeWidth="1">
                    <path
                      d={`M${xOffset} ${yOffset} L${xOffset + 25} ${yOffset - 14} L${xOffset + 25} ${
                        yOffset - 14 - height
                      } L${xOffset} ${yOffset - height} Z`}
                      fill="rgba(255,255,255,0.02)"
                    />
                    <path
                      d={`M${xOffset + 25} ${yOffset - 14 - height} L${xOffset + 45} ${
                        yOffset - 25 - height
                      } L${xOffset + 20} ${yOffset - 11 - height} L${xOffset} ${yOffset - height} Z`}
                    />
                  </g>
                );
              })}
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
