import type { MetadataRoute } from "next";
import { createRobotsPolicy } from "@/lib/crawl-indexing";
import { absoluteUrl } from "@/lib/site-origin";
import { isSitePrivate } from "@/lib/site-visibility";

export default function robots(): MetadataRoute.Robots {
  return createRobotsPolicy(isSitePrivate(), absoluteUrl("/sitemap.xml"));
}
