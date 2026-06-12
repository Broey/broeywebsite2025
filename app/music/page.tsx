import type { Metadata } from "next";
import Link from "next/link";
import { ReleasePlayButton } from "@/components/audio/ReleasePlayButton";
import {
  releaseAudioQueueForContext,
  releasePlayLabel,
} from "@/components/audio/releaseAudioQueue";
import { ReleaseCard } from "@/components/ui/ReleaseCard";
import { ReleaseArtwork } from "@/components/ui/ReleaseArtwork";
import { PageIntro } from "@/components/ui/PageIntro";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { releaseDetailHref } from "@/content/release-actions";
import { releases, type ReleaseEntry } from "@/content/releases";
import { createPageMetadata } from "@/content/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Selected Releases",
  description:
    "Explore selected Broey. releases from the current electronic era, including Fragments, dancing dumpster fire, STEREO LUV, blu., FREE, and more.",
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
  "link",
  "dancing-dumpster-fire",
  "i-cant-wait-for-love",
  "mean-something",
  "4u",
  "fragments-ep",
  "fragments-remixes",
];

const transitionReleaseSlugs = [
  "warning",
  "hold-on",
  "hysteria",
];

const findRelease = (slug: string) =>
  releases.find((release) => release.slug === slug);

const selectedReleases = (slugs: string[]) =>
  slugs
    .map(findRelease)
    .filter((release): release is ReleaseEntry => Boolean(release));

export default function MusicPage() {
  const currentEraReleases = selectedReleases(currentEraReleaseSlugs);
  const transitionReleases = selectedReleases(transitionReleaseSlugs);
  const featured = findRelease("free") ?? currentEraReleases[0];
  const featuredMeta = [releaseTypeLabel[featured.type], featured.year].filter(Boolean).join(" / ");
  const featuredQueue = releaseAudioQueueForContext(featured, releases, "archive");
  const featuredPlaySubject = featuredQueue && featuredQueue.queueTitle !== featured.title
    ? `${featured.title} from ${featuredQueue.queueTitle}`
    : featured.title;

  return (
    <section className="inner-page" aria-labelledby="music-page-title">
      <PageIntro
        eyebrow="/ music"
        title="Selected Releases"
        titleId="music-page-title"
        description="Broey.'s selected catalog focuses on the current era: emotionally driven electronic music shaped by house, UK garage, jungle, drum and bass, sax, guitar, vocal texture, and restless production instincts. Earlier lofi work remains part of the story, but this collection highlights the sound and direction that define Broey. now."
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
              <p>{featured.mood ?? featured.description}</p>
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

      <div className="mt-8">
        <SectionHeader
          eyebrow="Selected catalog"
          title="Current Era"
          description="The newest Broey. releases push feeling-first production into house, bass, UKG, jungle, and raw electronic forms."
          meta={`${currentEraReleases.length} releases`}
        />
        <div className="mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {currentEraReleases.map((release) => {
            const audioQueue = releaseAudioQueueForContext(release, releases, "archive");

            return (
              <ReleaseCard
                key={release.slug}
                release={release}
                hidePendingLinks
                ctaHref={releaseDetailHref(release)}
                ctaLabel="View Release"
                audioQueue={audioQueue}
                playLabel={releasePlayLabel(release)}
              />
            );
          })}
        </div>
      </div>

      {transitionReleases.length ? (
        <div className="mt-12">
          <SectionHeader
            eyebrow="Context"
            title="Transition Works"
            description="Before the current era fully arrived, Broey. began moving away from lofi roots and toward faster, more physical electronic music."
            meta={`${transitionReleases.length} releases`}
          />
          <div className="mt-5 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {transitionReleases.map((release) => {
              const audioQueue = releaseAudioQueueForContext(release, releases, "archive");

              return (
                <ReleaseCard
                  key={release.slug}
                  release={release}
                  hidePendingLinks
                  ctaHref={releaseDetailHref(release)}
                  ctaLabel="View Release"
                  audioQueue={audioQueue}
                  playLabel={releasePlayLabel(release)}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      <section className="release-detail-section mt-12" aria-labelledby="music-foundations-title">
        <SectionHeader
          eyebrow="Foundations"
          title="Where the instincts started"
          titleId="music-foundations-title"
        />
        <div className="release-detail-copy">
          <p>
            Broey.&apos;s earliest releases lived in a lofi, chillhop, and instrumental hip-hop world: warm guitars, vinyl haze, jazz textures, and wordless emotional scenes. That music is not the center of the current Broey. catalog, but it shaped the instincts behind it: mood first, texture always, and space for the listener to build their own world inside the track.
          </p>
        </div>
      </section>
    </section>
  );
}
