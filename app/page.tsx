import type { Metadata } from "next";
import { HomepageMusicArchiveSection } from "@/components/sections/HomepageMusicArchiveSection";
import { MusicCarouselHero } from "@/components/sections/MusicCarouselHero";
import { PressMentionsPreview } from "@/components/sections/PressMentionsPreview";
import { staticPageMetadata } from "@/content/page-metadata";
import { createPageMetadata } from "@/content/seo";

export const metadata: Metadata = createPageMetadata(staticPageMetadata.home);

export default function HomePage() {
  return (
    <>
      <MusicCarouselHero />
      <HomepageMusicArchiveSection />
      <PressMentionsPreview />
    </>
  );
}
