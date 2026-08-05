import type { Metadata } from "next";
import Link from "next/link";
import { ReleasePlayButton } from "@/components/audio/ReleasePlayButton";
import {
  releaseAudioQueueForContext,
  releasePlayLabel,
} from "@/components/audio/releaseAudioQueue";
import {
  MusicCatalogFilter,
  type MusicCatalogSection,
} from "@/components/music/MusicCatalogFilter";
import { ReleaseCard } from "@/components/ui/ReleaseCard";
import { ReleaseArtwork } from "@/components/ui/ReleaseArtwork";
import { PageIntro } from "@/components/ui/PageIntro";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  curatedGenreFilters,
  curatedGenreFiltersForRelease,
  normalizedGenres,
} from "@/content/genres";
import { releaseDetailHref } from "@/content/release-actions";
import { releases, type ReleaseEntry } from "@/content/releases";
import { createPageMetadata } from "@/content/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Selected Catalog",
  description:
    "Explore selected Broey releases, including Fragments, dancing dumpster fire, STEREO LUV, blu., FREE, and more.",
  path: "/music",
  image: {
    url: "/assets/cover-art/latest-release.png",
    width: 1200,
    height: 1200,
    alt: "Latest Broey release artwork",
  },
});

const releaseTypeLabel = {
  single: "Single",
  ep: "EP",
  remix: "Remix",
  mix: "Mix",
  set: "Set",
} as const;

const currentEraReleaseSlugs = [
  "free",
  "blu",
  "stereo-luv",
  "dancing-dumpster-fire",
  "i-cant-wait-for-love",
  "mean-something",
  "4u",
  "fragments-remixes",
  "fragments-ep",
];

const transitionReleaseSlugs = [
  "contrast",
  "warning",
  "hold-on",
  "hysteria",
];

const findRelease = (slug: string) =>
  releases.find((release) => release.slug === slug);

const selectedReleases = (slugs: string[]) =>
  slugs
    .map(findRelease)
    .filter(
      (release): release is ReleaseEntry =>
        Boolean(release) && release?.visibility !== "draft",
    );

export default function MusicPage() {
  const currentEraReleases = selectedReleases(currentEraReleaseSlugs);
  const transitionReleases = selectedReleases(transitionReleaseSlugs);
  const featured = findRelease("free") ?? currentEraReleases[0];
  const featuredType = featured.registry?.releaseTypeDisplay ?? releaseTypeLabel[featured.type];
  const featuredMeta = [featuredType, featured.year].filter(Boolean).join(" / ");
  const featuredQueue = releaseAudioQueueForContext(featured, releases, "archive");
  const featuredPlaySubject = featuredQueue && featuredQueue.queueTitle !== featured.title
    ? `${featured.title} from ${featuredQueue.queueTitle}`
    : featured.title;
  const featuredGenres = normalizedGenres(featured);
  const catalogSections: MusicCatalogSection[] = [
    {
      id: "selected-catalog",
      className: "mt-8 border-t border-white/10 pt-5",
      header: (
        <SectionHeader
          title="Selected Catalog"
          description="Singles, EPs, remixes, and recent catalog highlights."
        />
      ),
      gridClassName: "mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3",
      releases: currentEraReleases.map((release) => {
        const audioQueue = releaseAudioQueueForContext(release, releases, "archive");

        return {
          id: release.slug,
          filterGroups: curatedGenreFiltersForRelease(release),
          card: (
            <ReleaseCard
              release={release}
              hidePendingLinks
              ctaHref={releaseDetailHref(release)}
              ctaLabel="View Release"
              audioQueue={audioQueue}
              playLabel={releasePlayLabel(release)}
            />
          ),
        };
      }),
    },
    {
      id: "out-of-lo-fi",
      className: "mt-12",
      header: (
        <SectionHeader
          eyebrow="Bridge"
          title="Out of lo-fi"
          description="Tracks from the shift toward drum and bass, club production, and collaborations."
        />
      ),
      gridClassName: "mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3",
      releases: transitionReleases.map((release) => {
        const audioQueue = releaseAudioQueueForContext(release, releases, "archive");

        return {
          id: release.slug,
          filterGroups: curatedGenreFiltersForRelease(release),
          card: (
            <ReleaseCard
              release={release}
              hidePendingLinks
              ctaHref={releaseDetailHref(release)}
              ctaLabel="View Release"
              audioQueue={audioQueue}
              playLabel={releasePlayLabel(release)}
            />
          ),
        };
      }),
    },
  ];

  return (
    <section className="inner-page" aria-labelledby="music-page-title">
      <PageIntro
        eyebrow="/ music"
        title="Broey. Selects"
        titleId="music-page-title"
        description="Selected Broey releases across house, UKG, breakbeats, drum and bass, remixes, and catalog notes."
      />

      <section className="hero-panel music-featured-release" aria-labelledby="music-featured-title">
        <div className="music-featured-release-header">
          <p className="release-detail-section-kicker">Featured release</p>
          <p className="music-featured-meta">{featuredMeta}</p>
        </div>

        <div className="music-featured-release-grid">
          <ReleaseArtwork release={featured} className="music-featured-artwork aspect-square" />
          <div className="music-featured-copy-column">
            <div className="music-featured-summary">
              <p className="release-detail-section-kicker">Current focus</p>
              <h2 id="music-featured-title" className="music-featured-title">
                {featured.title}
              </h2>
              {featuredGenres.length ? (
                <div className="release-detail-tag-row" aria-label={`Genres for ${featured.title}`}>
                  {featuredGenres.map((genre) => (
                    <span key={genre} className="release-detail-tag">
                      {genre}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="music-featured-actions">
              {featuredQueue ? (
                <ReleasePlayButton
                  queue={featuredQueue}
                  label="Listen to Latest Release"
                  ariaLabelSubject={featuredPlaySubject}
                  className="release-detail-primary-cta"
                />
              ) : null}
              <Link
                href={releaseDetailHref(featured)}
                className={featuredQueue ? "release-detail-secondary-cta" : "release-detail-primary-cta"}
              >
                View Release
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MusicCatalogFilter filters={curatedGenreFilters} sections={catalogSections} />

      <section className="release-detail-section mt-12" aria-labelledby="music-foundations-title">
        <SectionHeader
          eyebrow="Foundations"
          title="Where the instincts started"
          titleId="music-foundations-title"
        />
        <div className="release-detail-copy">
          <p>
            Broey&apos;s earliest releases lived in lo-fi, chillhop, and instrumental hip-hop: warm guitars, vinyl haze, jazz lines, dusty drums, and wordless scenes. That music is not the center of this catalog, but it shaped the production behind it.
          </p>
        </div>
      </section>
    </section>
  );
}
