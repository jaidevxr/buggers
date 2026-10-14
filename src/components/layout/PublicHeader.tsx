import { Link, useRouterState } from "@tanstack/react-router";
import { BugMark } from "@/components/brand/BugMark";

export function PublicHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="public-header-island fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4 pointer-events-auto">
      <div className="public-header-pill flex items-center gap-6 sm:gap-8 rounded-full bg-[#08090a]/85 backdrop-blur-md px-6 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.7)] border border-white/[0.08] text-xs font-medium text-slate-200">
        {/* Buggers Logo — Only icon allowed in header/island */}
        <Link
          to="/"
          preload="intent"
          className="flex items-center gap-2.5 font-semibold text-white transition-opacity duration-150 hover:opacity-85 active:scale-95"
        >
          <BugMark className="h-5 w-5 text-white fill-white" />
          <span className="tracking-tight text-sm font-bold text-white">
            Buggers
          </span>
        </Link>

        {/* Navigation items — pure text, zero icon clutter */}
        <nav className="flex items-center gap-6 text-slate-300 font-medium">
          <Link
            to="/"
            preload="intent"
            className={`transition-colors duration-150 hover:text-white active:scale-95 ${
              pathname === "/" ? "text-white font-semibold" : "text-slate-300"
            }`}
          >
            Home
          </Link>
          <Link
            to="/docs"
            preload="intent"
            className={`transition-colors duration-150 hover:text-white active:scale-95 ${
              pathname === "/docs"
                ? "text-white font-semibold"
                : "text-slate-300"
            }`}
          >
            Docs
          </Link>
          <Link
            to="/about"
            preload="intent"
            className={`transition-colors duration-150 hover:text-white active:scale-95 ${
              pathname === "/about"
                ? "text-white font-semibold"
                : "text-slate-300"
            }`}
          >
            About
          </Link>
        </nav>

        {/* Login / Signup Action Pill */}
        <Link
          to="/auth"
          preload="intent"
          className={`rounded-full px-5 py-1.5 text-xs font-semibold transition-all duration-150 shadow-xs active:scale-[0.97] cursor-pointer ${
            pathname === "/auth"
              ? "bg-white text-black ring-2 ring-white/30"
              : "bg-white text-black hover:bg-neutral-200"
          }`}
        >
          Login
        </Link>
      </div>
    </header>
  );
}
