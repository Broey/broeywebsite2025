import type { MetadataRoute } from "next";
import { releaseDetailHref } from "@/content/release-actions";
import { showReleaseInSitemap } from "@/content/release-filters";
import { releases } from "@/content/releases";
import { siteUrl } from "@/content/seo";
import { isSitePrivate } from "@/lib/site-visibility";

const staticRoutes = ["/", "/music", "/about", "/contact", "/merch", "/press"];

const canonicalUrl = (path: string) => new URL(path, siteUrl).toString();

export default function sitemap(): MetadataRoute.Sitemap {
  if (isSitePrivate()) {
    return [];
  }

  const lastModified = new Date();
  const releaseRoutes = releases
    .filter(showReleaseInSitemap)
    .map((release) => releaseDetailHref(release));

  return [...staticRoutes, ...releaseRoutes].map((route) => ({
    url: canonicalUrl(route),
    lastModified,
  }));
}
