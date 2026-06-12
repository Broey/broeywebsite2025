import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReleasePlayButton } from "@/components/audio/ReleasePlayButton";
import {
  releaseAudioQueue,
  releaseAudioQueueForContext,
  releasePlayLabel,
} from "@/components/audio/releaseAudioQueue";
import { ReleaseTracklist } from "@/components/audio/ReleaseTracklist";
import { PlatformLinkList } from "@/components/ui/PlatformLinkList";
import { PendingArtwork } from "@/components/ui/PendingArtwork";
import { ReleaseArtwork, shouldUseFallbackArtwork } from "@/components/ui/ReleaseArtwork";
import { ShareReleaseButton } from "@/components/ui/ShareReleaseButton";
import {
  releaseDetailHref,
  releasePlatformLinks,
} from "@/content/release-actions";
import { sortedArchiveReleases } from "@/content/release-filters";
import { createPageMetadata, siteUrl } from "@/content/seo";
import { releases, type ReleaseCredit, type ReleaseDetail, type ReleaseEntry } from "@/content/releases";

type PageProps = {
  params: {
    slug: string;
  };
};

const releaseTypeLabel: Record<ReleaseEntry["type"], string> = {
  single: "Single",
  ep: "EP",
  remix: "Remix",
  mix: "Mix",
  set: "Set",
};

const releaseBySlug = (slug: string) =>
  releases.find((release) => release.slug === slug);

const parentReleaseFor = (release: ReleaseEntry) =>
  release.parentReleaseSlug ? releaseBySlug(release.parentReleaseSlug) : undefined;

const comparableTrackTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!]/g, "")
    .trim();

const trackTitlesMatch = (left: string, right: string) => {
  const normalizedLeft = comparableTrackTitle(left);
  const normalizedRight = comparableTrackTitle(right);

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.startsWith(`${normalizedRight} (`) ||
    normalizedRight.startsWith(`${normalizedLeft} (`)
  );
};

const trackKeysMatch = (left?: string, right?: string) =>
  Boolean(left && right && comparableTrackTitle(left) === comparableTrackTitle(right));

const releaseHeroAudioQueue = (release: ReleaseEntry, parentRelease?: ReleaseEntry) => {
  const ownQueue = releaseAudioQueueForContext(release, releases, "single");

  if (!release.isProjectTrack || !parentRelease) {
    return ownQueue;
  }

  const parentQueue = releaseAudioQueue(parentRelease);

  if (!parentQueue) {
    return ownQueue;
  }

  const ownTrackTitle = release.audio?.tracks[0]?.title ?? release.title;
  const ownTrack = release.audio?.tracks[0];
  const parentTrackIndex = parentQueue.tracks.findIndex((track) =>
    trackKeysMatch(track.audioKey, ownTrack?.audioKey ?? release.slug) ||
    trackKeysMatch(track.slug, ownTrack?.slug ?? release.slug) ||
    trackTitlesMatch(track.title, ownTrackTitle),
  );

  if (parentTrackIndex < 0) {
    return ownQueue;
  }

  return {
    ...parentQueue,
    activeIndex: parentTrackIndex,
  };
};

const projectTrackLinksFor = (release: ReleaseEntry) =>
  releases
    .filter((entry) => entry.parentReleaseSlug === release.slug)
    .map((entry) => ({
      title: entry.title,
      slug: entry.slug,
      href: releaseDetailHref(entry),
    }));

const releaseAudioTrackCount = (release: ReleaseEntry) => release.audio?.tracks.length ?? 0;

const hasMultipleAudioTracks = (release: ReleaseEntry) => releaseAudioTrackCount(release) > 1;

const sortedReleases = () =>
  sortedArchiveReleases(releases);

const moreMusicReleases = (release: ReleaseEntry) =>
  sortedReleases()
    .filter((entry) => entry.slug !== release.slug)
    .slice(0, 3);

const formatReleaseDate = (releaseDate?: string) => {
  if (!releaseDate) {
    return undefined;
  }

  const placeholderDate = /^\d{4}-00-00$/.test(releaseDate);

  if (placeholderDate) {
    return "Release date TBA";
  }

  const date = new Date(`${releaseDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return releaseDate;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const releaseArtistName = (release: ReleaseEntry) =>
  release.artistName ?? release.catalogSource?.artistName ?? "Broey.";

const releaseHeroDate = (release: ReleaseEntry) =>
  release.year ? String(release.year) : formatReleaseDate(release.releaseDate);

const releaseHeroMeta = (release: ReleaseEntry) =>
  [releaseTypeLabel[release.type], releaseHeroDate(release)].filter(Boolean).join(" / ");

const releaseTags = (release: ReleaseEntry) =>
  (release.tags?.length ? release.tags : [releaseTypeLabel[release.type], "Broey.", "Electronic"])
    .filter(Boolean)
    .slice(0, 3);

const normalizeAboutCopy = (about?: string | string[]) => {
  if (!about) {
    return [];
  }

  return Array.isArray(about) ? about.filter(Boolean) : [about];
};

const lowerLead = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);

const withoutSentenceEnd = (value: string) => value.replace(/[.!?]+$/, "");

const releaseAboutParagraphs = (release: ReleaseEntry) => {
  const authoredCopy = normalizeAboutCopy(release.about);

  if (authoredCopy.length) {
    return authoredCopy;
  }

  const releaseTexture = withoutSentenceEnd(lowerLead(release.mood ?? release.description)).replace(
    /\s+with\s+/,
    " and ",
  );
  const releaseMotion =
    release.type === "ep" || release.type === "mix" || release.type === "set"
      ? "moves through"
      : "moves with";
  const releaseContext = release.year
    ? `Released in ${release.year}, it sits in the selected Broey. catalog.`
    : "It sits in the selected Broey. catalog.";

  return [
    `${release.title} ${releaseMotion} ${releaseTexture}.`,
    releaseContext,
  ];
};

const isMultiTrackProject = (release: ReleaseEntry) => {
  if (
    release.catalogSource?.isCollection === false ||
    release.catalogSource?.suggestedTileType === "trackTile"
  ) {
    return false;
  }

  if (release.type === "ep" || release.type === "mix" || release.type === "set") {
    return true;
  }

  return release.catalogSource?.suggestedTileType === "collectionTile";
};

const releaseDetailRows = (release: ReleaseEntry): ReleaseDetail[] => {
  const audioTrackCount = releaseAudioTrackCount(release);
  const trackCount = audioTrackCount || release.catalogSource?.trackCount || release.tracklist?.length;
  const releaseDate = formatReleaseDate(release.releaseDate);
  const showTrackCount = trackCount && trackCount > 1 && release.type !== "single";
  const showVersionsCount = trackCount && trackCount > 1 && release.type === "single";
  const baseDetails: ReleaseDetail[] = [
    { label: "Artist", value: releaseArtistName(release) },
    { label: "Release type", value: releaseTypeLabel[release.type] },
    releaseDate
      ? { label: "Release date", value: releaseDate }
      : release.year
        ? { label: "Year", value: String(release.year) }
        : undefined,
    showTrackCount ? { label: "Tracks", value: String(trackCount) } : undefined,
    showVersionsCount ? { label: "Versions", value: String(trackCount) } : undefined,
  ].filter((row): row is ReleaseDetail => Boolean(row));

  return [...baseDetails, ...(release.details ?? [])];
};

const releaseCreditRows = (release: ReleaseEntry): ReleaseCredit[] => {
  if (release.credits?.length) {
    return release.credits;
  }

  return [
    { role: "Artist", name: releaseArtistName(release) },
    { role: "Release", name: "Broey." },
    { role: "Label", name: "Independent" },
  ];
};

const releaseDiscoEmbed = (release: ReleaseEntry) => {
  if (release.embed?.provider === "disco" && (release.embed.src || release.embed.embedUrl)) {
    return release.embed;
  }

  return undefined;
};

const hasLocalAudio = (release: ReleaseEntry) =>
  Boolean(release.audio?.tracks?.length);

const hasDiscoFallbackPlayer = (release: ReleaseEntry) =>
  !hasLocalAudio(release) && Boolean(releaseDiscoEmbed(release));

const shouldAttachPlayerToHero = (release: ReleaseEntry) =>
  hasDiscoFallbackPlayer(release) && !isMultiTrackProject(release);

const absoluteReleaseUrl = (release: ReleaseEntry) =>
  new URL(releaseDetailHref(release), siteUrl).toString();

const absoluteAssetUrl = (assetPath?: string) =>
  assetPath ? new URL(assetPath, siteUrl).toString() : undefined;

const verifiedCoverImage = (release: ReleaseEntry) =>
  release.coverImage && !shouldUseFallbackArtwork(release.coverImage)
    ? release.coverImage
    : undefined;

const releaseMetadataImage = (release: ReleaseEntry) => {
  const coverImage = verifiedCoverImage(release);

  if (!coverImage) {
    return undefined;
  }

  return {
    url: coverImage,
    width: 1200,
    height: 1200,
    alt: release.coverAlt ?? `${release.title} cover art`,
  };
};

const releaseJsonLd = (release: ReleaseEntry) => {
  const isSingle = release.type === "single" || release.type === "remix";
  const coverImage = verifiedCoverImage(release);

  return {
    "@context": "https://schema.org",
    "@type": isSingle ? "MusicRecording" : "MusicAlbum",
    name: release.title,
    byArtist: {
      "@type": "MusicGroup",
      name: releaseArtistName(release),
    },
    datePublished: release.releaseDate && !release.releaseDate.includes("-00-")
      ? release.releaseDate
      : release.year
        ? String(release.year)
      : undefined,
    description: release.seoDescription ?? release.description,
    genre: releaseTags(release),
    image: absoluteAssetUrl(coverImage),
    url: absoluteReleaseUrl(release),
  };
};

const releaseBreadcrumbJsonLd = (release: ReleaseEntry) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: new URL("/", siteUrl).toString(),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Music",
      item: new URL("/music", siteUrl).toString(),
    },
    {
      "@type": "ListItem",
      position: 3,
      name: release.title,
      item: absoluteReleaseUrl(release),
    },
  ],
});

const serializeJsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");

function ReleaseBreadcrumbs({ release }: { release: ReleaseEntry }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[var(--color-muted)]"
    >
      <Link href="/" className="uppercase transition hover:text-white">
        Home
      </Link>
      <span aria-hidden="true">/</span>
      <Link href="/music" className="uppercase transition hover:text-white">
        Music
      </Link>
      <span aria-hidden="true">/</span>
      <span className="text-[var(--color-amber)]">{release.title}</span>
    </nav>
  );
}

function ReleaseDetailArtwork({ release }: { release: ReleaseEntry }) {
  const alt = release.coverAlt ?? `${release.title} cover art`;

  if (!release.coverImage || shouldUseFallbackArtwork(release.coverImage)) {
    return (
      <div className="release-detail-artwork-panel">
        <PendingArtwork
          alt={alt}
          eyebrow="Artwork"
          label={release.title}
          className="release-detail-artwork-frame"
        />
      </div>
    );
  }

  return (
    <div className="release-detail-artwork-panel">
      <Image
        src={release.coverImage}
        alt=""
        fill
        sizes="(min-width: 1024px) 42vw, 92vw"
        aria-hidden="true"
        className="release-detail-artwork-glow"
        priority
      />
      <div className="release-detail-artwork-frame">
        <Image
          src={release.coverImage}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 36vw, 86vw"
          className="release-detail-artwork-image"
          priority
        />
      </div>
    </div>
  );
}

function ReleaseDiscoPlayerFrame({
  release,
  className,
}: {
  release: ReleaseEntry;
  className?: string;
}) {
  const embed = releaseDiscoEmbed(release);
  const embedSrc = embed?.src ?? embed?.embedUrl;

  const trackId = embed?.disco?.trackId ?? release.slug;
  const width = embed?.disco?.width ?? 480;
  const height = embed?.disco?.height ?? embed?.height ?? 235;

  return (
    <div className={["release-detail-disco-frame", className].filter(Boolean).join(" ")}>
      {embedSrc ? (
        <iframe
          id={`disco-track-${trackId}`}
          name={`disco-track-${trackId}`}
          allowFullScreen
          frameBorder="0"
          className="disco-embed"
          src={embedSrc}
          title={embed?.title ?? `${release.title} player`}
          width={width}
          height={height}
        />
      ) : (
        <div className="release-detail-player-pending">
          <p className="text-sm font-semibold text-white">{release.title}</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Official player coming soon.
          </p>
        </div>
      )}
    </div>
  );
}

function ReleaseHeroPlayer({ release }: { release: ReleaseEntry }) {
  return (
    <div id="player" className="release-detail-hero-player" aria-label={`Stream ${release.title}`}>
      <ReleasePlayer release={release} className="release-detail-hero-player-frame" />
    </div>
  );
}

function ReleasePlayer({ release, className }: { release: ReleaseEntry; className?: string }) {
  if (releaseDiscoEmbed(release)) {
    return <ReleaseDiscoPlayerFrame release={release} className={className} />;
  }

  return null;
}

function ReleasePlayerModule({ release }: { release: ReleaseEntry }) {
  const playerTitle = isMultiTrackProject(release) ? "Stream the project" : `Stream ${release.title}`;
  const playerKicker = hasLocalAudio(release)
    ? "player"
    : isMultiTrackProject(release)
      ? "project player"
      : "player";

  return (
    <section
      id="player"
      className="release-detail-player-section"
      aria-labelledby="release-player-title"
    >
      <div className="release-detail-embed-heading">
        <p className="release-detail-section-kicker">
          {playerKicker}
        </p>
        <h2 id="release-player-title" className="site-heading text-2xl font-semibold text-white">
          {playerTitle}
        </h2>
      </div>
      <ReleasePlayer release={release} />
    </section>
  );
}

function FindYourPlatformSection({ release }: { release: ReleaseEntry }) {
  const platformLinks = releasePlatformLinks(release);

  if (!platformLinks.length) {
    return null;
  }

  const hasMultiplePlatforms = platformLinks.length > 1;
  const heading = hasMultiplePlatforms ? "find your platform" : "available elsewhere";

  return (
    <section className="release-detail-section" aria-labelledby="release-platforms-title">
      <div className="release-detail-section-header">
        <div>
          <h2 id="release-platforms-title" className="release-detail-section-kicker">
            {heading}
          </h2>
          {hasMultiplePlatforms ? (
            <p className="release-detail-platform-copy">
              Save, playlist, or stream wherever you listen.
            </p>
          ) : null}
        </div>
      </div>
      <PlatformLinkList links={platformLinks} hidePending showActionLabel={false} />
    </section>
  );
}

function ReleaseAboutSection({ release }: { release: ReleaseEntry }) {
  const paragraphs = releaseAboutParagraphs(release);

  return (
    <section className="release-detail-section" aria-labelledby="release-about-title">
      <div className="release-detail-section-header">
        <h2 id="release-about-title" className="release-detail-section-kicker">
          about this release
        </h2>
      </div>
      <div className="release-detail-copy">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

function ReleaseFactsSection({ release }: { release: ReleaseEntry }) {
  const details = releaseDetailRows(release);
  const credits = releaseCreditRows(release);

  return (
    <div className="release-detail-facts-grid">
      <section className="release-detail-section" aria-labelledby="release-details-title">
        <div className="release-detail-section-header">
          <h2 id="release-details-title" className="release-detail-section-kicker">
            release details
          </h2>
        </div>
        <dl className="release-detail-definition-list">
          {details.map((detail) => (
            <div key={`${detail.label}-${detail.value}`}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="release-detail-section" aria-labelledby="release-credits-title">
        <div className="release-detail-section-header">
          <h2 id="release-credits-title" className="release-detail-section-kicker">
            credits
          </h2>
        </div>
        <dl className="release-detail-definition-list">
          {credits.map((credit) => (
            <div key={`${credit.role}-${credit.name}`}>
              <dt>{credit.role}</dt>
              <dd>{credit.name}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function ParentProjectContext({
  parentRelease,
}: {
  parentRelease?: ReleaseEntry;
}) {
  if (!parentRelease) {
    return null;
  }

  return (
    <div className="release-detail-parent-context">
      <p>Part of {parentRelease.title}</p>
      <Link href={releaseDetailHref(parentRelease)}>
        View Project
      </Link>
    </div>
  );
}

function MoreMusicSection({ release }: { release: ReleaseEntry }) {
  const moreReleases = moreMusicReleases(release);

  if (!moreReleases.length) {
    return null;
  }

  return (
    <section className="release-detail-section" aria-labelledby="release-more-title">
      <div className="release-detail-section-header">
        <h2 id="release-more-title" className="release-detail-section-kicker">
          more from broey
        </h2>
        <Link href="/music" className="release-detail-inline-link">
          Selected Releases
        </Link>
      </div>
      <div className="release-detail-more-grid">
        {moreReleases.map((entry) => (
          <Link
            key={entry.slug}
            href={releaseDetailHref(entry)}
            className="release-detail-more-card"
          >
            <ReleaseArtwork release={entry} className="release-detail-more-artwork" />
            <div className="min-w-0">
              <p>{releaseHeroMeta(entry)}</p>
              <h3>{entry.title}</h3>
              <span>{entry.mood ?? entry.description}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function generateStaticParams() {
  return releases.map((release) => ({
    slug: release.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const release = releaseBySlug(params.slug);

  if (!release) {
    return createPageMetadata({
      title: "Release Not Found",
      description: "The requested Broey. release could not be found.",
      path: `/music/${params.slug}`,
    });
  }

  return createPageMetadata({
    title: release.seoTitle ?? release.title,
    description: release.seoDescription ?? release.description,
    path: releaseDetailHref(release),
    image: releaseMetadataImage(release),
  });
}

export default function ReleaseDetailPage({ params }: PageProps) {
  const release = releaseBySlug(params.slug);

  if (!release) {
    notFound();
  }

  const hasTracklist = (isMultiTrackProject(release) || hasMultipleAudioTracks(release)) &&
    Boolean(release.tracklist?.length || release.audio?.tracks.length);
  const tracklistHeading = release.type === "single" && hasMultipleAudioTracks(release)
    ? "versions"
    : "tracklist";
  const heroMeta = releaseHeroMeta(release);
  const artistName = releaseArtistName(release);
  const tags = releaseTags(release);
  const shareUrl = absoluteReleaseUrl(release);
  const jsonLd = releaseJsonLd(release);
  const breadcrumbJsonLd = releaseBreadcrumbJsonLd(release);
  const attachPlayerToHero = shouldAttachPlayerToHero(release);
  const parentRelease = parentReleaseFor(release);
  const audioQueue = releaseHeroAudioQueue(release, parentRelease);
  const heroPlayLabel = release.isProjectTrack ? "Play" : releasePlayLabel(release);
  const heroPlayLabelSubject = release.isProjectTrack && parentRelease
    ? `${release.title} from ${parentRelease.title}`
    : release.title;
  const projectTrackLinks = projectTrackLinksFor(release);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <section className="release-detail-shell">
        <ReleaseBreadcrumbs release={release} />

        <div className="release-detail-kicker-row">
          <Link href="/music" className="release-detail-kicker">
            / music
          </Link>
          {release.featured ? <span className="release-detail-status">Current</span> : null}
        </div>

        <div className="release-detail-hero">
          <ReleaseDetailArtwork release={release} />

          <article className="release-detail-info-panel">
            <div>
              <p className="release-detail-eyebrow">Broey. release</p>
              <h1 className="release-detail-title">{release.title}</h1>
              <p className="release-detail-artist">{artistName}</p>
              {heroMeta ? <p className="release-detail-hero-meta">{heroMeta}</p> : null}
            </div>

            {release.mood || release.description ? (
              <p className="release-detail-description">
                {release.mood ?? release.description}
              </p>
            ) : null}

            {tags.length ? (
              <div className="release-detail-tag-row" aria-label="Release tags">
                {tags.map((tag) => (
                  <span key={tag} className="release-detail-tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <ParentProjectContext parentRelease={parentRelease} />

            <div className="release-detail-cta-row">
              {audioQueue ? (
                <ReleasePlayButton
                  queue={audioQueue}
                  label={heroPlayLabel}
                  ariaLabelSubject={heroPlayLabelSubject}
                  className="release-detail-primary-cta"
                />
              ) : null}
              <ShareReleaseButton
                title={`${release.title} by ${artistName}`}
                text={`Stream ${release.title} by ${artistName}`}
                url={shareUrl}
                className={audioQueue ? "release-detail-secondary-cta" : "release-detail-primary-cta"}
              />
              <Link href="/music" className="release-detail-secondary-cta">
                Back to Selected Releases
              </Link>
            </div>
          </article>

          {attachPlayerToHero ? <ReleaseHeroPlayer release={release} /> : null}
        </div>

        <div className="release-detail-lower-grid">
          {!attachPlayerToHero && hasDiscoFallbackPlayer(release) ? (
            <ReleasePlayerModule release={release} />
          ) : null}

          <FindYourPlatformSection release={release} />

          <ReleaseAboutSection release={release} />

          <ReleaseFactsSection release={release} />

          {hasTracklist ? (
            <section className="release-detail-section" aria-labelledby="release-tracklist-title">
              <div className="release-detail-section-header">
                <h2 id="release-tracklist-title" className="release-detail-section-kicker">
                  {tracklistHeading}
                </h2>
              </div>
              <ReleaseTracklist release={release} trackLinks={projectTrackLinks} />
            </section>
          ) : null}

          <MoreMusicSection release={release} />

          <div className="release-detail-back-row">
            <Link href="/music" className="release-detail-nav-center">
              Back to Selected Releases
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
