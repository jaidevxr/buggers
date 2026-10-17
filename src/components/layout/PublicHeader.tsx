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
        className="public-header-pill pointer-events-auto flex items-center gap-2 sm:gap-7 rounded-full bg-[#0a0a0a]/90 backdrop-blur-md px-3 sm:px-6 py-1.5 sm:py-2 shadow-[0_12px_32px_rgba(0,0,0,0.7)] border border-white/[0.08] text-xs font-medium text-neutral-300 transition-colors duration-200"
        style={{ viewTransitionName: "none" }}
      >
        {/* Buggers Logo */}
        <Link
          to="/"
          preload="intent"
          className="flex items-center gap-1.5 sm:gap-2 font-semibold text-white transition-opacity duration-150 hover:opacity-80 shrink-0"
        >
          <BugMark className="h-4 w-4 text-white fill-white shrink-0" />
          <span className="tracking-tight text-xs sm:text-sm font-semibold text-white">
            Buggers
          </span>
        </Link>

        {/* Navigation items — stable font-medium widths with subtle pill highlights */}
        <nav className="flex items-center gap-0.5 sm:gap-1.5 font-medium text-[11px] sm:text-xs">
          <Link
            to="/"
            preload="intent"
            className={`rounded-full px-2.5 sm:px-3 py-1 transition-all duration-200 cursor-pointer ${
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
            className={`rounded-full px-2.5 sm:px-3 py-1 transition-all duration-200 cursor-pointer ${
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
            className={`rounded-full px-2.5 sm:px-3 py-1 transition-all duration-200 cursor-pointer ${
              pathname === "/about"
                ? "text-white bg-white/[0.08]"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            About
          </Link>
          <a
            href="https://github.com/jaidevxr/buggers"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-2.5 sm:px-3 py-1 text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            aria-label="GitHub Repository"
          >
            <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>

        {/* Login Action Pill — stable dimensions */}
        <Link
          to="/auth"
          preload="intent"
          className={`rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer ${
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

