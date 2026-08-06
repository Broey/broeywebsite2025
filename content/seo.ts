import type { Metadata } from "next";
import { siteConfig } from "@/content/site";
import { absoluteUrl, canonicalPath } from "@/lib/site-origin";
import { privateRobotsMetadata } from "@/lib/site-visibility";

export const defaultSocialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Broey electronic artist and producer",
};

export const twitterSocialImage = defaultSocialImage.url;

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
  indexable?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  image,
  indexable = true,
}: PageMetadataOptions): Metadata {
  const resolvedCanonicalPath = canonicalPath(path.startsWith("/") ? path : `/${path}`);
  const canonicalUrl = absoluteUrl(resolvedCanonicalPath);
  const socialImage = image ?? defaultSocialImage;

  return {
    title: title === "Home" ? { absolute: siteConfig.seo.defaultTitle } : title,
    description,
    robots: indexable
      ? privateRobotsMetadata()
      : { index: false, follow: false },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: title === "Home" ? siteConfig.seo.defaultTitle : `${title} | ${siteConfig.name}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: [socialImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title === "Home" ? siteConfig.seo.defaultTitle : `${title} | ${siteConfig.name}`,
      description,
      images: [image?.url ?? twitterSocialImage],
      site: siteConfig.seo.twitterHandle,
      creator: siteConfig.seo.twitterHandle,
    },
  };
}
