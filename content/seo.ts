import type { Metadata } from "next";
import type { PageMetadataDefinition } from "./page-metadata.ts";
import { siteConfig } from "./site.ts";
import { absoluteUrl, canonicalPath } from "../lib/site-origin.ts";
import { privateRobotsMetadata } from "../lib/site-visibility.ts";

export const defaultSocialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Broey electronic artist and producer",
};

export function createPageMetadata({
  title,
  description,
  path,
  image,
  absoluteTitle = false,
  indexable = true,
}: PageMetadataDefinition): Metadata {
  const resolvedCanonicalPath = canonicalPath(path.startsWith("/") ? path : `/${path}`);
  const canonicalUrl = absoluteUrl(resolvedCanonicalPath);
  const socialImage = image ?? defaultSocialImage;
  const resolvedTitle = title === "Home" ? siteConfig.seo.defaultTitle : title;
  const shouldUseAbsoluteTitle = title === "Home" || absoluteTitle;
  const socialTitle = shouldUseAbsoluteTitle
    ? resolvedTitle
    : `${resolvedTitle} | ${siteConfig.name}`;

  return {
    title: shouldUseAbsoluteTitle ? { absolute: resolvedTitle } : resolvedTitle,
    description,
    robots: indexable
      ? privateRobotsMetadata()
      : { index: false, follow: false },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: [socialImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
      site: siteConfig.seo.twitterHandle,
      creator: siteConfig.seo.twitterHandle,
    },
  };
}
