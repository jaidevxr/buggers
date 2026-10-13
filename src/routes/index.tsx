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

  // Very subtle cursor ambient drift (pure natural warmth, no neon, no harsh glow)
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#07090e] text-slate-100 antialiased overflow-x-hidden selection:bg-white/20">
      {/* Floating Pill Header — Clean, focused, only useful options, official BugMark logo */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <div className="flex items-center gap-6 sm:gap-8 rounded-full bg-black/75 backdrop-blur-md px-6 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-white/10 text-xs font-medium text-slate-200 transition-all duration-300">
          {/* Official Buggers Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-white transition-opacity duration-200 hover:opacity-85">
            <BugMark className="h-5 w-5 text-white fill-white" />
            <span className="tracking-tight text-sm font-bold text-white">Buggers</span>
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

      {/* Main Full-Bleed Atmospheric Night Studio Hero Section (4K Uncompressed Background) */}
      <section
        id="hero"
        className="relative min-h-screen w-full bg-cover bg-center flex flex-col justify-center items-center px-4 sm:px-6 py-24"
        style={{ backgroundImage: `url('/landing-bg.png')` }}
      >
        {/* Soft atmospheric night vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/60 pointer-events-none" />

        {/* Natural Ambient Lamp Breathing Animation (Positioned near the warm desk lamp) */}
        <div className="pointer-events-none absolute left-[38%] bottom-[28%] -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl animate-lamp-breathe" />

        {/* Subtle, Organic Lakeside Light Twinkling (Distant cottage reflections on the water) */}
        <div className="pointer-events-none absolute left-[49%] top-[48%] h-1.5 w-1.5 rounded-full bg-amber-200/60 blur-[0.5px] animate-soft-twinkle-1" />
        <div className="pointer-events-none absolute left-[53%] top-[50%] h-1 w-1 rounded-full bg-amber-100/70 blur-[0.5px] animate-soft-twinkle-2" />
        <div className="pointer-events-none absolute left-[56%] top-[49%] h-1.5 w-1.5 rounded-full bg-amber-300/60 blur-[0.5px] animate-soft-twinkle-3" />

        {/* Gentle, Natural Warm Filament Accent Following Cursor (Zero neon, zero harsh bloom) */}
        <div
          className="pointer-events-none absolute h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.04] blur-3xl transition-all duration-700 ease-out"
          style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
        />

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
      </section>

      {/* Minimal Dark Footer */}
      <footer className="bg-black py-10 px-4 sm:px-6 text-xs text-slate-500 border-t border-white/10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-slate-300 font-medium">
            <BugMark className="h-4 w-4 text-white fill-white" />
            <span>Buggers</span>
            <span className="text-slate-500 text-[11px]">&copy; 2026 Buggers, Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/how-it-works" className="hover:text-white transition-colors duration-200">
              How it works
            </Link>
            <Link to="/auth" className="hover:text-white transition-colors duration-200">
              Sign In
            </Link>
            <span className="text-emerald-400 font-mono text-[11px]">All Systems Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
