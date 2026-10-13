import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Sparkles, Info } from "lucide-react";
import { BugMark } from "@/components/brand/BugMark";

export function PublicHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4 pointer-events-auto">
      <div className="public-header-pill flex items-center gap-5 sm:gap-7 rounded-full bg-black/80 backdrop-blur-md px-6 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.65)] border border-white/10 text-xs font-medium text-slate-200">
        {/* Buggers Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold text-white transition-opacity duration-150 hover:opacity-85"
        >
          <BugMark className="h-5 w-5 text-white fill-white" />
          <span className="tracking-tight text-sm font-bold text-white">
            Buggers
          </span>
        </Link>

        {/* Navigation items */}
        <nav className="flex items-center gap-5 text-slate-300 font-medium">
          <Link
            to="/"
            className={`transition-colors duration-150 hover:text-white ${
              pathname === "/" ? "text-white font-semibold" : "text-slate-300"
            }`}
          >
            Home
          </Link>
          <Link
            to="/how-it-works"
            className={`flex items-center gap-1.5 transition-colors duration-150 hover:text-white ${
              pathname === "/how-it-works"
                ? "text-white font-semibold"
                : "text-slate-300"
            }`}
          >
            <Sparkles
              className={`h-3.5 w-3.5 ${
                pathname === "/how-it-works" ? "text-amber-400" : "text-zinc-500"
              }`}
            />
            <span>How it works</span>
          </Link>
          <Link
            to="/docs"
            className={`flex items-center gap-1.5 transition-colors duration-150 hover:text-white ${
              pathname === "/docs"
                ? "text-white font-semibold"
                : "text-slate-300"
            }`}
          >
            <BookOpen
              className={`h-3.5 w-3.5 ${
                pathname === "/docs" ? "text-amber-400" : "text-zinc-500"
              }`}
            />
            <span>Docs</span>
          </Link>
          <Link
            to="/about"
            className={`flex items-center gap-1.5 transition-colors duration-150 hover:text-white ${
              pathname === "/about"
                ? "text-white font-semibold"
                : "text-slate-300"
            }`}
          >
            <Info
              className={`h-3.5 w-3.5 ${
                pathname === "/about" ? "text-amber-400" : "text-zinc-500"
              }`}
            />
            <span>About</span>
          </Link>
        </nav>

        {/* Login Action Pill */}
        <Link
          to="/auth"
          className="rounded-full bg-white text-black px-5 py-1.5 text-xs font-semibold hover:bg-slate-200 transition-all duration-150 shadow-xs active:scale-[0.985]"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
