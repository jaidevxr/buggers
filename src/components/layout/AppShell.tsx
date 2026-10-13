import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Bell,
  FolderGit2,
  GitPullRequest,
  LayoutDashboard,
  ListChecks,
  LineChart,
  Menu,
  Settings as SettingsIcon,
  Ticket,
  LogOut,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { BuggersWordmark } from "@/components/brand/BugMark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { getGitHubConnection } from "@/lib/github.functions";
import { getDashboardSummary, markNotificationsRead } from "@/lib/analysis.functions";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/repositories", label: "Repositories", icon: FolderGit2 },
  { to: "/pull-requests", label: "Pull requests", icon: GitPullRequest },
  { to: "/findings", label: "Findings", icon: ListChecks },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-150">
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[2.5px] overflow-hidden bg-primary/20 pointer-events-none">
          <div className="h-full bg-primary animate-indeterminate-bar w-2/5" />
        </div>
      )}
      <TopBar onToggleMenu={() => setMobileOpen((v) => !v)} />
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full">
        <aside
          className={cn(
            "w-64 shrink-0 border-r border-sidebar-border bg-sidebar px-3 py-5 md:block",
            mobileOpen ? "fixed inset-y-14 left-0 z-40 block overflow-y-auto" : "hidden",
          )}
        >
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.985]",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-6 py-6 lg:px-8 xl:px-10">
          <ErrorBoundary>
            <div key={pathname} className="page-container w-full">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function TopBar({ onToggleMenu }: { onToggleMenu: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const connection = useQuery({
    queryKey: ["github-connection"],
    queryFn: () => getGitHubConnection(),
  });
  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: () => getDashboardSummary() });
  const unread = (summary.data?.notifications ?? []).filter((n) => !n.read);

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center gap-3 border-b border-border bg-background/95 px-4 lg:px-6 backdrop-blur">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMenu} aria-label="Toggle navigation">
        <Menu className="h-5 w-5" />
      </Button>
      <Link to="/dashboard" className="shrink-0">
        <BuggersWordmark />
      </Link>
      <div className="ml-auto flex items-center gap-1.5">
        {/* Quick Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          title={`Current: ${theme} (${resolvedTheme}) — click to toggle`}
          className="text-muted-foreground hover:text-foreground"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-4 w-4" />
              {unread.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unread.length > 0 && (
                <button
                  className="text-xs font-normal text-muted-foreground hover:underline"
                  onClick={async () => {
                    await markNotificationsRead();
                    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
                  }}
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(summary.data?.notifications ?? []).length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              (summary.data?.notifications ?? []).slice(0, 8).map((n) => (
                <DropdownMenuItem key={n.id} asChild>
                  <Link to={n.link ?? "/dashboard"} className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.body}</span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Account & Theme Preferences */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              {connection.data?.avatarUrl ? (
                <img
                  src={connection.data.avatarUrl}
                  alt=""
                  className="h-6 w-6 rounded-full border border-border"
                />
              ) : (
                <span className="h-6 w-6 rounded-full bg-muted" />
              )}
              <span className="hidden text-sm sm:inline">
                {connection.data?.login ?? "Account"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {connection.data?.connected
                ? `GitHub: ${connection.data.login}`
                : "GitHub not connected"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Appearance</div>
            <div className="grid grid-cols-3 gap-1 px-2 py-1">
              <Button
                variant={theme === "light" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-1.5 text-xs font-normal"
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-1 h-3 w-3" /> Light
              </Button>
              <Button
                variant={theme === "dark" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-1.5 text-xs font-normal"
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-1 h-3 w-3" /> Dark
              </Button>
              <Button
                variant={theme === "system" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-1.5 text-xs font-normal"
                onClick={() => setTheme("system")}
              >
                <Laptop className="mr-1 h-3 w-3" /> Auto
              </Button>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
