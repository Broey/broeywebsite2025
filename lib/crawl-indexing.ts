import type { MetadataRoute } from "next";

type SitemapPage = {
  path: string;
  lastModified?: string;
};

export function createRobotsPolicy(
  isPrivate: boolean,
  sitemapUrl: string,
): MetadataRoute.Robots {
  if (isPrivate) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // Training crawlers only; search and user-directed retrieval retain public access.
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
    ],
    sitemap: sitemapUrl,
  };
}

export function reliableSitemapDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.includes("-00")) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : date;
}

export function createPublicSitemap(
  staticPages: readonly SitemapPage[],
  releases: readonly SitemapPage[],
  toAbsoluteUrl: (path: string) => string,
): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of [...staticPages, ...releases]) {
    const url = toAbsoluteUrl(page.path);
    if (!seen.has(url)) {
      seen.add(url);
      // Publication dates and request/build times do not establish page updates.
      const lastModified = reliableSitemapDate(page.lastModified);
      entries.push(lastModified ? { url, lastModified } : { url });
    }
  }

  return entries;
}
