import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function AtmosphericBackdrop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAtmospheric = pathname === "/" || pathname === "/auth";
  const isAuth = pathname === "/auth";
  const [mousePos, setMousePos] = useState({ x: 50, y: 55 });
  const [scrollY, setScrollY] = useState(0);

  // Natural subtle cursor filament tracking and smooth scroll parallax
  useEffect(() => {
    if (!isAtmospheric) return;
    function handleMouseMove(e: MouseEvent) {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    }
    function handleScroll() {
      // On auth route, keep scroll anchored at 0 to avoid backdrop translation jump
      if (window.location.pathname === "/auth") {
        setScrollY(0);
      } else {
        setScrollY(window.scrollY);
      }
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isAtmospheric]);

  // Subtle parallax translation factors (zero on /auth for a rock-solid, calm canvas)
  const effectiveScrollY = isAuth ? 0 : scrollY;
  const parallaxOffset = Math.round(effectiveScrollY * 0.22);
  const lampParallax = Math.round(effectiveScrollY * 0.14);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 ease-in-out overflow-hidden ${
        isAtmospheric ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Background artwork with smooth parallax scroll translation at uncompressed 1:1 pixel fidelity */}
      <div
        className={`absolute inset-x-0 -top-8 -bottom-36 will-change-transform ${
          isAuth ? "transition-none" : "transition-transform duration-100 ease-out"
        }`}
        style={{
          transform: `translate3d(0, ${-parallaxOffset}px, 0)`,
          backgroundImage: `url('/landing-bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Consistent, seamless atmospheric night vignette overlay across / and /auth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/60 pointer-events-none" />

      {/* Persistent warm ambient desk lamp breathing animation with parallax depth */}
      <div
        className={`pointer-events-none absolute left-[38%] bottom-[28%] -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl animate-lamp-breathe will-change-transform ${
          isAuth ? "transition-none" : "transition-transform duration-100 ease-out"
        }`}
        style={{ transform: `translate3d(0, ${-lampParallax}px, 0)` }}
      />

      {/* Persistent organic lakeside cottage twinkling lights with parallax */}
      <div
        className={`pointer-events-none absolute left-[49%] top-[48%] h-1.5 w-1.5 rounded-full bg-amber-200/60 blur-[0.5px] animate-soft-twinkle-1 will-change-transform ${
          isAuth ? "transition-none" : "transition-transform duration-100 ease-out"
        }`}
        style={{ transform: `translate3d(0, ${-parallaxOffset}px, 0)` }}
      />
      <div
        className={`pointer-events-none absolute left-[53%] top-[50%] h-1 w-1 rounded-full bg-amber-100/70 blur-[0.5px] animate-soft-twinkle-2 will-change-transform ${
          isAuth ? "transition-none" : "transition-transform duration-100 ease-out"
        }`}
        style={{ transform: `translate3d(0, ${-parallaxOffset}px, 0)` }}
      />
      <div
        className={`pointer-events-none absolute left-[56%] top-[49%] h-1.5 w-1.5 rounded-full bg-amber-300/60 blur-[0.5px] animate-soft-twinkle-3 will-change-transform ${
          isAuth ? "transition-none" : "transition-transform duration-100 ease-out"
        }`}
        style={{ transform: `translate3d(0, ${-parallaxOffset}px, 0)` }}
      />

      {/* Natural warm filament cursor ambient follow */}
      <div
        className="pointer-events-none absolute h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.04] blur-3xl transition-all duration-700 ease-out"
        style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
      />
    </div>
  );
}
