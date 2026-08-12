import type { Metadata } from "next";
import { HomepageMusicArchiveSection } from "@/components/sections/HomepageMusicArchiveSection";
import { MusicCarouselHero } from "@/components/sections/MusicCarouselHero";
import { PressMentionsPreview } from "@/components/sections/PressMentionsPreview";
import { staticPageMetadata } from "@/content/page-metadata";
import { createPageMetadata } from "@/content/seo";
import {
  createWebsiteStructuredData,
  serializeJsonLd,
} from "@/content/structured-data";

export const metadata: Metadata = createPageMetadata(staticPageMetadata.home);

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(createWebsiteStructuredData()),
        }}
      />
      <MusicCarouselHero />
      <HomepageMusicArchiveSection />
      <PressMentionsPreview />
    </>
  );
}
