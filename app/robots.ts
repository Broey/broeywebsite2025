import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-origin";
import { isSitePrivate } from "@/lib/site-visibility";

export default function robots(): MetadataRoute.Robots {
  if (isSitePrivate()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
