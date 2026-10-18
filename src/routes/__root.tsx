import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  ScrollRestoration,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { AtmosphericBackdrop } from "@/components/layout/AtmosphericBackdrop";
import { cn } from "@/lib/utils";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-7xl font-extrabold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

import {
  SITE_ORIGIN,
  GOOGLE_SITE_VERIFICATION,
  GA_MEASUREMENT_ID,
  getWebSiteJsonLd,
  getSoftwareApplicationJsonLd,
  getOrganizationJsonLd,
} from "@/lib/seo";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const meta: Array<Record<string, string>> = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Buggers" },
      {
        name: "description",
        content:
          "Buggers is an intelligent code security and review platform. Real-time AST vulnerability scanning in VS Code, automated GitHub PR risk triage, and deterministic OWASP remediation.",
      },
      {
        name: "keywords",
        content:
          "Buggers, Buggers AI, buggers github, AI code review, pull request security scanner, automated PR review, vulnerability scanner, DevSecOps, AST static analysis, code risk velocity, VS Code extension, vsix download, in-editor security scanner",
      },
      { name: "author", content: "Buggers Team" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { name: "theme-color", content: "#09090b" },
      { property: "og:site_name", content: "Buggers" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_ORIGIN}/` },
      { property: "og:title", content: "Buggers" },
      {
        property: "og:description",
        content:
          "Continuous AI-assisted code review, in-editor VS Code vulnerability detection, and pull request risk triage for modern engineering teams.",
      },
      { property: "og:image", content: `${SITE_ORIGIN}/og-image.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Buggers Code Review & Security Platform with VS Code Extension" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Buggers" },
      {
        name: "twitter:description",
        content:
          "Continuous AI-assisted code review, in-editor VS Code vulnerability detection, and pull request risk triage for modern engineering teams.",
      },
      { name: "twitter:image", content: `${SITE_ORIGIN}/og-image.png` },
    ];

    const googleVerificationCode = GOOGLE_SITE_VERIFICATION || "googlee2c4489e515e7c89.html";
    meta.push({ name: "google-site-verification", content: googleVerificationCode });
    meta.push({ name: "google-site-verification", content: "google74ee40ccde796f62" });
    meta.push({ name: "google-site-verification", content: "google74ee40ccde796f62.html" });
    meta.push({ name: "google-site-verification", content: "google2bd01b49369e896d" });
    meta.push({ name: "google-site-verification", content: "google2bd01b49369e896d.html" });

    return {
      meta,
      links: [
        { rel: "canonical", href: `${SITE_ORIGIN}/` },
        { rel: "manifest", href: `${SITE_ORIGIN}/site.webmanifest` },
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "preload",
          as: "style",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
          media: "print",
          onLoad: "this.media='all'",
        },
        { rel: "preload", href: "/landing-bg.webp", as: "image", type: "image/webp", fetchPriority: "high" },
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "icon", href: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
        { rel: "icon", href: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
        { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { rel: "icon", href: "/icon-512.png", type: "image/png", sizes: "512x512" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
        { rel: "shortcut icon", href: "/favicon.ico" },
        { rel: "alternate icon", href: "/favicon.ico" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const jsonLdWebSite = getWebSiteJsonLd();
  const jsonLdSoftwareApp = getSoftwareApplicationJsonLd();
  const jsonLdOrg = getOrganizationJsonLd();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem("buggers-theme") || "dark";
                const d = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                if (d) document.documentElement.classList.add("dark");
                else document.documentElement.classList.remove("dark");
              } catch (e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        {GA_MEASUREMENT_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
                (function() {
                  function loadGtag() {
                    if (window.__gtagLoaded) return;
                    window.__gtagLoaded = true;
                    var s = document.createElement('script');
                    s.async = true;
                    s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}';
                    document.head.appendChild(s);
                  }
                  if (document.readyState === 'complete') {
                    setTimeout(loadGtag, 1500);
                  } else {
                    window.addEventListener('load', function() {
                      setTimeout(loadGtag, 1500);
                    }, { once: true });
                  }
                })();
              `,
            }}
          />
        )}
        <HeadContent />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/repositories") ||
    pathname.startsWith("/pull-requests") ||
    pathname.startsWith("/findings") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/tickets") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/analysis");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-[100.1vh] w-full bg-[#000000] text-neutral-100 flex flex-col selection:bg-white/20 relative">
          {!isDashboardRoute && <AtmosphericBackdrop />}
          {!isDashboardRoute && <PublicHeader />}
          <div className="flex-1 w-full flex flex-col relative z-10">
            <Outlet />
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
