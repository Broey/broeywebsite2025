import type { MetadataRoute } from "next";
import { isSitePrivate } from "@/lib/site-visibility";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://broey.com";

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
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
