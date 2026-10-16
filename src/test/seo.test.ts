import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  SITE_ORIGIN,
  getCanonicalUrl,
  createRouteSeo,
  getWebSiteJsonLd,
  getSoftwareApplicationJsonLd,
  getOrganizationJsonLd,
  getTechArticleJsonLd,
  getBreadcrumbJsonLd,
} from "../lib/seo";

describe("Technical SEO: Architecture & Canonical Domain", () => {
  it("resolves a clean canonical origin without trailing slashes", () => {
    expect(SITE_ORIGIN).toMatch(/^https?:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?$/);
    expect(SITE_ORIGIN.endsWith("/")).toBe(false);
  });

  it("normalizes canonical URLs correctly for root and nested paths", () => {
    expect(getCanonicalUrl("/")).toBe(`${SITE_ORIGIN}/`);
    expect(getCanonicalUrl("")).toBe(`${SITE_ORIGIN}/`);
    expect(getCanonicalUrl("/docs")).toBe(`${SITE_ORIGIN}/docs`);
    expect(getCanonicalUrl("/docs/")).toBe(`${SITE_ORIGIN}/docs`);
    expect(getCanonicalUrl("/how-it-works")).toBe(`${SITE_ORIGIN}/how-it-works`);
    expect(getCanonicalUrl("/about")).toBe(`${SITE_ORIGIN}/about`);
  });

  it("generates complete, standards-compliant route metadata", () => {
    const seo = createRouteSeo({
      path: "/docs",
      title: "Buggers Documentation – SAST Rules & Risk Scoring",
      description: "Engineering specifications and scanner playground for Buggers.",
      keywords: ["Buggers", "SAST", "AST Triage"],
    });

    // Check meta tags
    const titleMeta = seo.meta.find((m) => m["title"]);
    expect(titleMeta?.["title"]).toBe("Buggers Documentation – SAST Rules & Risk Scoring");

    const descMeta = seo.meta.find((m) => m["name"] === "description");
    expect(descMeta?.["content"]).toBe("Engineering specifications and scanner playground for Buggers.");

    const robotsMeta = seo.meta.find((m) => m["name"] === "robots");
    expect(robotsMeta?.["content"]).toContain("index, follow");
    expect(robotsMeta?.["content"]).toContain("max-image-preview:large");

    const ogTitle = seo.meta.find((m) => m["property"] === "og:title");
    expect(ogTitle?.["content"]).toBe("Buggers Documentation – SAST Rules & Risk Scoring");

    const ogUrl = seo.meta.find((m) => m["property"] === "og:url");
    expect(ogUrl?.["content"]).toBe(`${SITE_ORIGIN}/docs`);

    const ogImage = seo.meta.find((m) => m["property"] === "og:image");
    expect(ogImage?.["content"]).toContain(`${SITE_ORIGIN}/landing-bg.png`);

    const twitterCard = seo.meta.find((m) => m["name"] === "twitter:card");
    expect(twitterCard?.["content"]).toBe("summary_large_image");

    const canonicalLink = seo.links.find((l) => l["rel"] === "canonical");
    expect(canonicalLink?.["href"]).toBe(`${SITE_ORIGIN}/docs`);
  });

  it("generates valid Schema.org JSON-LD structured data for WebSite and SoftwareApplication", () => {
    const websiteSchema = getWebSiteJsonLd();
    expect(websiteSchema["@context"]).toBe("https://schema.org");
    expect(websiteSchema["@type"]).toBe("WebSite");
    expect(websiteSchema.url).toBe(`${SITE_ORIGIN}/`);
    expect(websiteSchema.potentialAction["@type"]).toBe("SearchAction");

    const softwareSchema = getSoftwareApplicationJsonLd();
    expect(softwareSchema["@context"]).toBe("https://schema.org");
    expect(softwareSchema["@type"]).toBe("SoftwareApplication");
    expect(softwareSchema.applicationCategory).toBe("DeveloperApplication");
    expect(softwareSchema.featureList.length).toBeGreaterThan(3);

    const orgSchema = getOrganizationJsonLd();
    expect(orgSchema["@context"]).toBe("https://schema.org");
    expect(orgSchema["@type"]).toBe("Organization");
    expect(orgSchema.logo).toContain("/favicon.svg");

    const breadcrumbSchema = getBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Documentation", path: "/docs" },
    ]);
    expect(breadcrumbSchema["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbSchema.itemListElement).toHaveLength(2);
    expect(breadcrumbSchema.itemListElement[1]?.item).toBe(`${SITE_ORIGIN}/docs`);
  });
});

describe("Technical SEO: Static Crawl Assets", () => {
  const publicDir = path.resolve(__dirname, "../../public");

  it("ensures robots.txt allows public pages and blocks private authenticated endpoints", () => {
    const robotsPath = path.join(publicDir, "robots.txt");
    expect(fs.existsSync(robotsPath)).toBe(true);

    const robotsContent = fs.readFileSync(robotsPath, "utf-8");
    expect(robotsContent).toContain("User-agent: Googlebot");
    expect(robotsContent).toContain("Allow: /");
    expect(robotsContent).toContain("Disallow: /dashboard");
    expect(robotsContent).toContain("Disallow: /settings");
    expect(robotsContent).toContain("Disallow: /api/");
    expect(robotsContent).toContain("Disallow: /oauth/");
    expect(robotsContent).toContain("Sitemap: https://buggers.vercel.app/sitemap.xml");
  });

  it("ensures sitemap.xml exists, is valid XML, and contains only indexable public URLs", () => {
    const sitemapPath = path.join(publicDir, "sitemap.xml");
    expect(fs.existsSync(sitemapPath)).toBe(true);

    const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
    expect(sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(sitemapContent).toContain("<urlset");
    expect(sitemapContent).toContain("<loc>https://buggers.vercel.app/</loc>");
    expect(sitemapContent).toContain("<loc>https://buggers.vercel.app/how-it-works</loc>");
    expect(sitemapContent).toContain("<loc>https://buggers.vercel.app/docs</loc>");
    expect(sitemapContent).toContain("<loc>https://buggers.vercel.app/about</loc>");

    // Ensure NO private, auth, or authenticated routes are exposed in the sitemap
    expect(sitemapContent).not.toContain("/auth");
    expect(sitemapContent).not.toContain("/dashboard");
    expect(sitemapContent).not.toContain("/settings");
    expect(sitemapContent).not.toContain("/pull-requests");
    expect(sitemapContent).not.toContain("/findings");
    expect(sitemapContent).not.toContain("/analytics");
    expect(sitemapContent).not.toContain("/api/");
    expect(sitemapContent).not.toContain("/oauth/");
  });

  it("ensures web manifest files exist and are valid JSON", () => {
    const webmanifestPath = path.join(publicDir, "site.webmanifest");
    const manifestPath = path.join(publicDir, "manifest.json");

    expect(fs.existsSync(webmanifestPath)).toBe(true);
    expect(fs.existsSync(manifestPath)).toBe(true);

    const parsed = JSON.parse(fs.readFileSync(webmanifestPath, "utf-8"));
    expect(parsed.name).toContain("Buggers");
    expect(parsed.short_name).toBe("Buggers");
    expect(parsed.start_url).toBe("/");
    expect(parsed.icons.length).toBeGreaterThan(0);
  });

  it("verifies public Open Graph social preview image exists", () => {
    const ogImagePath = path.join(publicDir, "landing-bg.png");
    expect(fs.existsSync(ogImagePath)).toBe(true);
    const stats = fs.statSync(ogImagePath);
    expect(stats.size).toBeGreaterThan(1000);
  });

  it("verifies Google Search Console HTML verification file exists with exact required content", () => {
    const gscFilePath = path.join(publicDir, "googlee2c4489e515e7c89.html");
    expect(fs.existsSync(gscFilePath)).toBe(true);
    const content = fs.readFileSync(gscFilePath, "utf-8").trim();
    expect(content).toBe("google-site-verification: googlee2c4489e515e7c89.html");
  });
});
