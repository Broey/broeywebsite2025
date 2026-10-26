import { releaseAudioQueueForContext } from "@/components/audio/releaseAudioQueue";
import { ReleaseCarousel } from "@/components/ui/ReleaseCarousel";
import {
  ReleaseCarouselTile,
  type CarouselRelease,
} from "@/components/ui/ReleaseCarouselTile";
import { shouldUseFallbackArtwork } from "@/components/ui/ReleaseArtwork";
import { releases, type ReleaseEntry } from "@/content/releases";
import { isOnlyUReleased } from "@/content/only-u-campaign";
import { currentFocusRelease } from "@/content/release-focus";

const buildCarouselOrder = (releaseList: ReleaseEntry[]) => {
  const orderedReleases = releaseList
    .filter((release) => release.carouselEnabled)
    .sort((a, b) => (a.carouselPriority ?? Number.MAX_SAFE_INTEGER) - (b.carouselPriority ?? Number.MAX_SAFE_INTEGER));
  const focus = currentFocusRelease(releaseList);
  const upcoming = orderedReleases.find(release => release.availableAt && Date.now() < Date.parse(release.availableAt));
  // Honor the owner's carousel priorities independently of current-release badges.
  const leadSlug = upcoming?.slug ?? orderedReleases[0]?.slug;
  orderedReleases.sort((a, b) => Number(b.slug === leadSlug) - Number(a.slug === leadSlug));

  return {
    orderedReleases,
    initialIndex: 0,
    focusSlug: focus?.slug,
  };
};

const prepareCarouselRelease = (release: ReleaseEntry, focusSlug?: string): CarouselRelease => ({
  title: release.title,
  artistName: release.artistName,
  slug: release.slug,
  type: release.type,
  year: release.year,
  releaseDate: release.releaseDate,
  availableAt: release.availableAt,
  releasedAtRender: !release.availableAt || Date.now() >= Date.parse(release.availableAt),
  coverImage: shouldUseFallbackArtwork(release.coverImage) ? undefined : release.coverImage,
  coverAlt: release.coverAlt,
  artworkPresentation: release.artworkPresentation,
  featured: release.slug === focusSlug,
  releaseTypeDisplay: release.registry?.releaseTypeDisplay,
  tileKind:
    release.catalogSource?.suggestedTileType === "collectionTile" ? "collection" : "single",
});

export function MusicCarouselHero() {
  const carouselTitleId = "home-music-carousel-title";
  const { orderedReleases, initialIndex, focusSlug } = buildCarouselOrder(releases);
  const carouselItems = orderedReleases.map((release) => ({
    release: prepareCarouselRelease(release, focusSlug),
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
          Broey. — Electronic Artist &amp; Producer
        </h1>

        <ReleaseCarousel
          labelledBy={carouselTitleId}
          initialIndex={initialIndex}
          autoAdvance={isOnlyUReleased()}
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
