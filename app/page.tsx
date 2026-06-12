import type { Metadata } from "next";
import { HomepageMusicArchiveSection } from "@/components/sections/HomepageMusicArchiveSection";
import { MusicCarouselHero } from "@/components/sections/MusicCarouselHero";
import { PressMentionsPreview } from "@/components/sections/PressMentionsPreview";
import { createPageMetadata } from "@/content/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Home",
  description:
    "Broey. is a genre-fluid electronic artist, producer, audio engineer, and self-taught multi-instrumentalist from Scranton, PA, blending house, UK garage, jungle, drum and bass, sax, guitar, and raw emotional production.",
  path: "/",
  image: {
    url: "/assets/cover-art/latest-release.png",
    width: 1200,
    height: 1200,
    alt: "Current Broey. release artwork",
  },
});

export default function HomePage() {
  return (
    <>
      <MusicCarouselHero />
      <HomepageMusicArchiveSection />
      <PressMentionsPreview />
    </>
  );
}
