import { releaseAudioQueueForContext } from "@/components/audio/releaseAudioQueue";
import { ReleaseCarousel } from "@/components/ui/ReleaseCarousel";
import { ReleaseCarouselTile } from "@/components/ui/ReleaseCarouselTile";
import { shouldUseFallbackArtwork } from "@/components/ui/ReleaseArtwork";
import { releases, type ReleaseEntry } from "@/content/releases";

const buildCarouselOrder = (releaseList: ReleaseEntry[]) => {
  const orderedReleases = releaseList
    .filter((release) => release.carouselEnabled)
    .sort((a, b) => (a.carouselPriority ?? Number.MAX_SAFE_INTEGER) - (b.carouselPriority ?? Number.MAX_SAFE_INTEGER));
  const featuredIndex = orderedReleases.findIndex((release) => release.featured);

  return {
    orderedReleases,
    initialIndex: featuredIndex >= 0 ? featuredIndex : 0,
  };
};

const prepareCarouselRelease = (release: ReleaseEntry): ReleaseEntry => ({
  ...release,
  coverImage: shouldUseFallbackArtwork(release.coverImage) ? undefined : release.coverImage,
  description: "",
  mood: undefined,
});

export function MusicCarouselHero() {
  const carouselTitleId = "home-music-carousel-title";
  const { orderedReleases, initialIndex } = buildCarouselOrder(releases);
  const carouselItems = orderedReleases.map((release) => ({
    release: prepareCarouselRelease(release),
    audioQueue: releaseAudioQueueForContext(release, releases, "highlighted"),
  }));
  const featured = carouselItems[initialIndex]?.release;

  return (
    <section
      aria-labelledby={carouselTitleId}
      className="music-carousel-hero-bleed music-carousel-hero mb-0 border-b border-white/10"
    >
      <div className="music-carousel-hero-inner mx-auto flex w-full max-w-none flex-col px-[clamp(1rem,3vw,2.75rem)] py-2 md:py-3">
        <h1 id={carouselTitleId} className="sr-only">
          Highlighted Releases
        </h1>

        <div className="music-carousel-label-row" aria-hidden="true">
          <p>/ Broey</p>
          <span>/ Now out</span>
        </div>

        <ReleaseCarousel
          labelledBy={carouselTitleId}
          initialIndex={initialIndex}
          releaseCount={carouselItems.length}
          initialTitle={featured?.title ?? "Release"}
          releaseTitles={carouselItems.map((item) => item.release.title)}
        >
          {carouselItems.map(({ release, audioQueue }, index) => (
            <ReleaseCarouselTile
              key={release.slug}
              release={release}
              audioQueue={audioQueue}
              index={index}
            />
          ))}
        </ReleaseCarousel>
      </div>
    </section>
  );
}
