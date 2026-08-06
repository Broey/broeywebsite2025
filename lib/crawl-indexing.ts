import type { MetadataRoute } from "next";

type SitemapRelease = {
  path: string;
  releaseDate?: string;
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
    rules: { userAgent: "*", allow: "/" },
    sitemap: sitemapUrl,
  };
}

export function reliableReleaseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.includes("-00")) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : date;
}

export function createPublicSitemap(
  staticPaths: readonly string[],
  releases: readonly SitemapRelease[],
  toAbsoluteUrl: (path: string) => string,
): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    const url = toAbsoluteUrl(path);
    if (!seen.has(url)) {
      seen.add(url);
      entries.push({ url });
    }
  }

  for (const release of releases) {
    const url = toAbsoluteUrl(release.path);
    if (!seen.has(url)) {
      seen.add(url);
      const lastModified = reliableReleaseDate(release.releaseDate);
      entries.push(lastModified ? { url, lastModified } : { url });
    }
  }

  return entries;
}
