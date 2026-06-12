import type { Metadata } from "next";
import { siteConfig } from "@/content/site";
import { privateRobotsMetadata } from "@/lib/site-visibility";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://broey.com";

export const defaultSocialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Broey. genre-fluid electronic artist and producer",
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
};

export function createPageMetadata({
  title,
  description,
  path,
  image,
}: PageMetadataOptions): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const socialImage = image ?? defaultSocialImage;

  return {
    title: title === "Home" ? { absolute: siteConfig.seo.defaultTitle } : title,
    description,
    robots: privateRobotsMetadata(),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: title === "Home" ? siteConfig.seo.defaultTitle : `${title} | ${siteConfig.name}`,
      description,
      url: canonicalPath,
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
