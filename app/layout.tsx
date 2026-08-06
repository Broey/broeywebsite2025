import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { defaultSocialImage, twitterSocialImage } from "@/content/seo";
import { siteConfig } from "@/content/site";
import { siteOrigin } from "@/lib/site-origin";
import { isSitePrivate, privateRobotsMetadata } from "@/lib/site-visibility";

const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim();
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
const shouldLoadUmami =
  process.env.NODE_ENV === "production" &&
  !isSitePrivate() &&
  Boolean(umamiScriptUrl && umamiWebsiteId);

export const metadata: Metadata = {
  title: {
    default: siteConfig.seo.defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.seo.description,
  metadataBase: new URL(siteOrigin),
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteOrigin }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  manifest: "/manifest.webmanifest",
  robots: privateRobotsMetadata(),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.description,
    siteName: siteConfig.name,
    images: [defaultSocialImage],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.description,
    images: [twitterSocialImage],
    site: siteConfig.seo.twitterHandle,
    creator: siteConfig.seo.twitterHandle,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AudioPlayerProvider>
          <div className="site-shell">
            <Header />
            <main className="site-main">{children}</main>
            <Footer />
          </div>
        </AudioPlayerProvider>
        {shouldLoadUmami ? (
          <Script
            id="umami-analytics"
            src={umamiScriptUrl}
            data-website-id={umamiWebsiteId}
            data-domains="broey.net"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
