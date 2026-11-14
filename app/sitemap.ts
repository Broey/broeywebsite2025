import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { releaseDetailHref } from "@/content/release-actions";
import { showReleaseInSitemap } from "@/content/release-filters";
import { releases } from "@/content/releases";
import { staticSitemapPages } from "@/content/page-metadata";
import { absoluteUrl } from "@/lib/site-origin";
import { isSitePrivate } from "@/lib/site-visibility";
import { createPublicSitemap } from "@/lib/crawl-indexing";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isSitePrivate()) {
    return [];
  }

  const releaseRoutes = releases
    .filter(showReleaseInSitemap)
    .map((release) => ({
      path: releaseDetailHref(release),
      lastModified: release.lastModified,
    }));

  return createPublicSitemap(staticSitemapPages, releaseRoutes, absoluteUrl);
}
