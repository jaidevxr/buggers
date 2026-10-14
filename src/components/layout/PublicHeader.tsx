import { Link, useRouterState } from "@tanstack/react-router";
import { BugMark } from "@/components/brand/BugMark";

export function PublicHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header
      className="public-header-island fixed top-5 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
      style={{ viewTransitionName: "none" }}
    >
      <div
        className="public-header-pill pointer-events-auto flex items-center gap-6 sm:gap-7 rounded-full bg-[#0a0a0a]/90 backdrop-blur-md px-5 sm:px-6 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.7)] border border-white/[0.08] text-xs font-medium text-neutral-300 transition-colors duration-200"
        style={{ viewTransitionName: "none" }}
      >
        {/* Buggers Logo */}
        <Link
          to="/"
          preload="intent"
          className="flex items-center gap-2 font-semibold text-white transition-opacity duration-150 hover:opacity-80"
        >
          <BugMark className="h-4 w-4 text-white fill-white" />
          <span className="tracking-tight text-xs sm:text-sm font-semibold text-white">
            Buggers
          </span>
        </Link>

        {/* Navigation items — stable font-medium widths with subtle pill highlights */}
        <nav className="flex items-center gap-1 sm:gap-1.5 font-medium text-xs">
          <Link
            to="/"
            preload="intent"
            className={`rounded-full px-3 py-1 transition-all duration-200 cursor-pointer ${
              pathname === "/"
                ? "text-white bg-white/[0.08]"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Home
          </Link>
          <Link
            to="/docs"
            preload="intent"
            className={`rounded-full px-3 py-1 transition-all duration-200 cursor-pointer ${
              pathname === "/docs"
                ? "text-white bg-white/[0.08]"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Docs
          </Link>
          <Link
            to="/about"
            preload="intent"
            className={`rounded-full px-3 py-1 transition-all duration-200 cursor-pointer ${
              pathname === "/about"
                ? "text-white bg-white/[0.08]"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            About
          </Link>
        </nav>

        {/* Login Action Pill — stable dimensions */}
        <Link
          to="/auth"
          preload="intent"
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer ${
            pathname === "/auth"
              ? "bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.25)] ring-2 ring-white/30"
              : "bg-white text-black hover:bg-neutral-100 hover:shadow-[0_0_16px_rgba(255,255,255,0.15)]"
          }`}
        >
          Login
        </Link>
      </div>
    </header>
  );
}

