import type { MetadataRoute } from "next";
import { releaseDetailHref } from "@/content/release-actions";
import { showReleaseInSitemap } from "@/content/release-filters";
import { releases } from "@/content/releases";
import { absoluteUrl } from "@/lib/site-origin";
import { isSitePrivate } from "@/lib/site-visibility";
import { createPublicSitemap } from "@/lib/crawl-indexing";

const staticRoutes = ["/", "/music", "/about", "/contact", "/merch", "/press", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  if (isSitePrivate()) {
    return [];
  }

  const releaseRoutes = releases
    .filter(showReleaseInSitemap)
    .map((release) => ({
      path: releaseDetailHref(release),
      releaseDate: release.releaseDate,
    }));

  return createPublicSitemap(staticRoutes, releaseRoutes, absoluteUrl);
}
