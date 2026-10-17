/**
 * Buggers Technical SEO Configuration & Metadata Engine
 *
 * Centralized, production-grade SEO module providing:
 * - Single authoritative canonical base URL with environment variable overrides
 * - Route-specific meta tag & link generators (OpenGraph, Twitter, Canonical, Robots)
 * - Valid Schema.org JSON-LD structured data (WebSite, SoftwareApplication, Organization, TechArticle, BreadcrumbList)
 * - Safe preview/staging isolation to prevent indexing pollution
 */

// Production domain fallback (strictly matching verified Google Search domain)
const DEFAULT_SITE_URL = "https://buggers.dev";

function resolveBaseUrl(): string {
  let url = DEFAULT_SITE_URL;

  if (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SITE_URL"]) {
    url = import.meta.env["VITE_SITE_URL"];
  } else if (typeof process !== "undefined" && process.env?.["VITE_SITE_URL"]) {
    url = process.env["VITE_SITE_URL"];
  } else if (typeof process !== "undefined" && process.env?.["SITE_URL"]) {
    url = process.env["SITE_URL"];
  }

  // Strip trailing slashes for strictly canonical URLs
  return url.replace(/\/+$/, "");
}

export const SITE_ORIGIN = resolveBaseUrl();
export const SITE_NAME = "Buggers";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

export const GOOGLE_SITE_VERIFICATION =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_GOOGLE_SITE_VERIFICATION"]) ||
  (typeof process !== "undefined" && process.env?.["VITE_GOOGLE_SITE_VERIFICATION"]) ||
  "";

/**
 * Returns a normalized, absolute canonical URL for a given path.
 */
export function getCanonicalUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/") {
    return `${SITE_ORIGIN}/`;
  }
  return `${SITE_ORIGIN}${cleanPath.replace(/\/+$/, "")}`;
}

export interface RouteSeoOptions {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
}

/**
 * Generates TanStack Router compliant `head` metadata and links for a specific route.
 */
export function createRouteSeo(options: RouteSeoOptions) {
  const canonicalUrl = getCanonicalUrl(options.path);
  const ogImage = options.ogImage || DEFAULT_OG_IMAGE;
  const ogType = options.ogType || "website";

  const robotsDirective = options.noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const meta: Array<Record<string, string>> = [
    { title: options.title },
    { name: "description", content: options.description },
    { name: "robots", content: robotsDirective },
    { name: "googlebot", content: robotsDirective },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: options.title },
    { property: "og:description", content: options.description },
    { property: "og:type", content: ogType },
    { property: "og:url", content: canonicalUrl },
    { property: "og:image", content: ogImage },
    { property: "og:image:alt", content: `${SITE_NAME} – ${options.title}` },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: options.title },
    { name: "twitter:description", content: options.description },
    { name: "twitter:image", content: ogImage },
  ];

  if (options.keywords && options.keywords.length > 0) {
    meta.push({ name: "keywords", content: options.keywords.join(", ") });
  }

  if (GOOGLE_SITE_VERIFICATION) {
    meta.push({ name: "google-site-verification", content: GOOGLE_SITE_VERIFICATION });
  }

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: canonicalUrl },
  ];

  return { meta, links };
}

/**
 * Structured Data (Schema.org) for WebSite entity with SearchAction.
 */
export function getWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Buggers",
    alternateName: ["Buggers", "buggers", "Buggers Dev", "buggers.dev", "Buggers AI"],
    url: `${SITE_ORIGIN}/`,
    description:
      "Buggers is an automated GitHub pull request code review, security vulnerability scanner, and continuous risk triage platform.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_ORIGIN}/docs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Structured Data (Schema.org) for SoftwareApplication entity.
 */
export function getSoftwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Buggers",
    alternateName: ["Buggers AI", "Buggers Security Scanner"],
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cloud, GitHub",
    url: `${SITE_ORIGIN}/`,
    image: `${SITE_ORIGIN}/icon-512.png`,
    author: {
      "@type": "Organization",
      name: "Buggers Team",
      url: `${SITE_ORIGIN}/`,
    },
    description:
      "Buggers automatically scans GitHub pull requests for security flaws, tracks risk velocity across repositories, and triages bugs using deterministic AST analysis.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/OnlineOnly",
    },
    featureList: [
      "Automated GitHub Pull Request Reviews",
      "Risk Velocity & Churn Analysis",
      "Grounded AST Vulnerability Detection",
      "Interactive SAST Scanner Playground",
      "Linear-styled Executive Analytics",
      "Multi-Provider AI Analysis (Claude, OpenAI, Gemini)",
    ],
  };
}

/**
 * Structured Data (Schema.org) for Organization entity.
 */
export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Buggers",
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/icon-512.png`,
    sameAs: [
      "https://github.com/jaidevxr/buggers",
    ],
  };
}

/**
 * Structured Data (Schema.org) for Technical Documentation / Article.
 */
export function getTechArticleJsonLd(params: {
  headline: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: params.headline,
    description: params.description,
    url: getCanonicalUrl(params.path),
    image: DEFAULT_OG_IMAGE,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_ORIGIN}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": getCanonicalUrl(params.path),
    },
    inLanguage: "en-US",
  };
}

/**
 * Structured Data (Schema.org) for Breadcrumbs.
 */
export function getBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}
