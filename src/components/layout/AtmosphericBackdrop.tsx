import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";

export function AtmosphericBackdrop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAtmospheric = pathname === "/" || pathname === "/auth";
  const isAuth = pathname === "/auth";
  const [mousePos, setMousePos] = useState({ x: 50, y: 55 });
  const [isLoaded, setIsLoaded] = useState(false);

  const bgRef = useRef<HTMLDivElement>(null);
  const lampRef = useRef<HTMLDivElement>(null);
  const twinklesRef = useRef<HTMLDivElement>(null);
  const targetScrollY = useRef(0);
  const currentScrollY = useRef(0);
  const rafId = useRef<number | null>(null);

  // Pre-decode original artwork in memory to eliminate partial/striped progressive loading
  useEffect(() => {
    if (!isAtmospheric) return;
    const img = new Image();
    img.src = "/landing-bg.png";
    if (img.complete) {
      setIsLoaded(true);
    } else {
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsLoaded(true); // Graceful fallback
    }
  }, [isAtmospheric]);

  // Subtle natural cursor filament tracking
  useEffect(() => {
    if (!isAtmospheric) return;
    function handleMouseMove(e: MouseEvent) {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isAtmospheric]);

  // Ultra-fluid 60/120fps RAF linear-interpolation parallax scrolling engine
  useEffect(() => {
    if (!isAtmospheric) return;

    targetScrollY.current = isAuth ? 0 : window.scrollY;

    function handleScroll() {
      targetScrollY.current = window.location.pathname === "/auth" ? 0 : window.scrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    let active = true;
    function rafLoop() {
      if (!active) return;
      const target = isAuth ? 0 : targetScrollY.current;
      const diff = target - currentScrollY.current;

      if (Math.abs(diff) > 0.05) {
        currentScrollY.current += diff * 0.09;
        const parallaxOffset = currentScrollY.current * 0.22;
        const lampParallax = currentScrollY.current * 0.14;

        if (bgRef.current) {
          bgRef.current.style.transform = `translate3d(0, ${-parallaxOffset}px, 0)`;
        }
        if (lampRef.current) {
          lampRef.current.style.transform = `translate3d(0, ${-lampParallax}px, 0)`;
        }
        if (twinklesRef.current) {
          twinklesRef.current.style.transform = `translate3d(0, ${-parallaxOffset}px, 0)`;
        }
      }

      rafId.current = requestAnimationFrame(rafLoop);
    }

    rafId.current = requestAnimationFrame(rafLoop);

    return () => {
      active = false;
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isAtmospheric, isAuth]);

  return (
    <div
      aria-hidden="true"
      style={{ viewTransitionName: "none" }}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-500 ease-out overflow-hidden ${
        isAtmospheric && isLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Background artwork with buttery smooth RAF parallax scroll translation */}
      <div
        ref={bgRef}
        className="absolute inset-x-0 -top-8 -bottom-36 will-change-transform"
        style={{
          transform: "translate3d(0, 0px, 0)",
          backgroundImage: `url('/landing-bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Consistent, seamless atmospheric night vignette overlay across / and /auth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 via-60% to-black/45 pointer-events-none" />

      {/* Consistent, permanent feathered bottom fade into #000000 across both home and auth */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.75) 20%, rgba(0, 0, 0, 0.45) 45%, rgba(0, 0, 0, 0.15) 75%, transparent 100%)",
        }}
      />

      {/* Persistent warm ambient desk lamp breathing animation with parallax depth */}
      <div
        ref={lampRef}
        className="pointer-events-none absolute left-[38%] bottom-[28%] -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl animate-lamp-breathe will-change-transform"
        style={{ transform: "translate3d(0, 0px, 0)" }}
      />

      {/* Persistent organic lakeside cottage twinkling lights container with smooth parallax */}
      <div ref={twinklesRef} className="pointer-events-none absolute inset-0 will-change-transform" style={{ transform: "translate3d(0, 0px, 0)" }}>
        <div className="absolute left-[49%] top-[48%] h-1.5 w-1.5 rounded-full bg-amber-200/60 blur-[0.5px] animate-soft-twinkle-1" />
        <div className="absolute left-[53%] top-[50%] h-1 w-1 rounded-full bg-amber-100/70 blur-[0.5px] animate-soft-twinkle-2" />
        <div className="absolute left-[56%] top-[49%] h-1.5 w-1.5 rounded-full bg-amber-300/60 blur-[0.5px] animate-soft-twinkle-3" />
      </div>

      {/* Natural warm filament cursor ambient follow */}
      <div
        className="pointer-events-none absolute h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.04] blur-3xl transition-all duration-700 ease-out"
        style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
      />
    </div>
  );
}
