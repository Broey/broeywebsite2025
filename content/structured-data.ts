import { normalizedGenres } from "./genres.ts";
import { staticPageMetadata } from "./page-metadata.ts";
import { releaseDetailHref } from "./release-actions.ts";
import {
  trackRegistryByReleaseSlug,
  type GeneratedTrackRegistry,
} from "./musicRegistry.generated.ts";
import { releaseDisplayArtist, releaseFactualDescription } from "./release-metadata.ts";
import { releases, type ReleaseEntry } from "./releases.ts";
import { siteConfig } from "./site.ts";
import { officialArtistSameAs } from "./socials.ts";
import { shouldUseFallbackArtwork } from "../lib/release-artwork.ts";
import { productionSiteOrigin } from "../lib/site-origin.ts";

export const schemaContext = "https://schema.org";
export const artistEntityId = `${productionSiteOrigin}/#artist`;
export const websiteEntityId = `${productionSiteOrigin}/#website`;

type JsonLdEntity = Record<string, unknown>;

const canonicalUrl = (path = "/") =>
  new URL(path, `${productionSiteOrigin}/`).toString();

const releaseUrl = (release: ReleaseEntry) =>
  canonicalUrl(releaseDetailHref(release));

export const releaseEntityId = (release: ReleaseEntry) =>
  `${releaseUrl(release)}#release`;

export const serializeJsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");

export const createArtistStructuredData = (): JsonLdEntity => ({
  "@context": schemaContext,
  "@type": "Person",
  "@id": artistEntityId,
  name: "Joe Montaro",
  alternateName: siteConfig.name,
  url: canonicalUrl("/about"),
  image: canonicalUrl(staticPageMetadata.about.image.url),
  description: siteConfig.positioning,
  jobTitle: ["Electronic artist", "Producer", "Audio engineer"],
  homeLocation: {
    "@type": "Place",
    name: siteConfig.location,
  },
  sameAs: officialArtistSameAs,
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": canonicalUrl("/about"),
    url: canonicalUrl("/about"),
    isPartOf: { "@id": websiteEntityId },
  },
});

export const createWebsiteStructuredData = (): JsonLdEntity => ({
  "@context": schemaContext,
  "@type": "WebSite",
  "@id": websiteEntityId,
  url: canonicalUrl("/"),
  name: siteConfig.name,
  alternateName: "Broey",
  description: staticPageMetadata.home.description,
  publisher: { "@id": artistEntityId },
});

const normalizedArtistName = (name: string) =>
  name.toLowerCase().replace(/[.]/g, "").trim();

const isBroeyName = (name: string) => normalizedArtistName(name) === "broey";

const namedMusicArtist = (name: string): JsonLdEntity =>
  isBroeyName(name)
    ? { "@id": artistEntityId }
    : { "@type": "MusicGroup", name: name.trim() };

const splitArtistCredit = (value: string) =>
  value
    .replace(/\s+feat\.?\s+/gi, ",")
    .split(/\s*(?:&|,|\+)\s*/)
    .map((name) => name.trim())
    .filter(Boolean);

const uniqueNames = (names: readonly string[]) =>
  names.filter(
    (name, index) =>
      names.findIndex(
        (candidate) => normalizedArtistName(candidate) === normalizedArtistName(name),
      ) === index,
  );

const artistEntities = (names: readonly string[]): JsonLdEntity | JsonLdEntity[] => {
  const entities = uniqueNames(names).map(namedMusicArtist);
  return entities.length === 1 ? entities[0] : entities;
};

const directRegistryTracks = (releaseSlug: string): readonly GeneratedTrackRegistry[] =>
  (trackRegistryByReleaseSlug as Record<
    string,
    readonly GeneratedTrackRegistry[] | undefined
  >)[releaseSlug] ?? [];

const registryTracksForRelease = (release: ReleaseEntry): readonly GeneratedTrackRegistry[] => {
  const directTracks = directRegistryTracks(release.slug);

  if (directTracks.length || !release.parentReleaseSlug) {
    return directTracks;
  }

  return directRegistryTracks(release.parentReleaseSlug).filter(
    (track) => track.trackSlug === release.slug,
  );
};

const primaryArtistNames = (
  release: ReleaseEntry,
  registryTrack?: GeneratedTrackRegistry,
) => {
  if (registryTrack?.artistList?.length) {
    const nonRemixers = registryTrack.artistList.filter(
      (artist) =>
        !registryTrack.remixers.some(
          (remixer) => normalizedArtistName(remixer) === normalizedArtistName(artist),
        ),
    );
    return nonRemixers.length ? nonRemixers : registryTrack.artistList;
  }

  return splitArtistCredit(releaseDisplayArtist(release));
};

const validDatePublished = (release: ReleaseEntry) => {
  if (release.status === "unreleased") {
    return undefined;
  }

  if (release.releaseDate && !release.releaseDate.includes("-00-")) {
    return release.releaseDate;
  }

  return release.year ? String(release.year) : undefined;
};

const durationToIso = (duration?: string) => {
  if (!duration) return undefined;
  if (/^PT/i.test(duration)) return duration.toUpperCase();

  const parts = duration.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return undefined;

  if (parts.length === 2) {
    return `PT${parts[0]}M${parts[1]}S`;
  }

  if (parts.length === 3) {
    return `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
  }

  return undefined;
};

const publicCoverUrl = (release: ReleaseEntry) =>
  release.coverImage && !shouldUseFallbackArtwork(release.coverImage)
    ? canonicalUrl(release.coverImage)
    : undefined;

const releaseSameAs = (release: ReleaseEntry) => {
  const urls = [...(release.links ?? []), ...(release.platformLinks ?? [])]
    .filter((link) => link.kind === "streaming" || link.kind === "video")
    .map((link) => link.url)
    .filter((url) => /^https:\/\//.test(url));

  return [...new Set(urls)];
};

const explicitProducers = (release: ReleaseEntry) =>
  uniqueNames(
    (release.credits ?? [])
      .filter((credit) => credit.role.trim().toLowerCase() === "producer")
      .map((credit) => credit.name),
  ).map((name) => (isBroeyName(name) || name === "Joe Montaro"
    ? { "@id": artistEntityId }
    : { "@type": "Person", name }));

const trackTitle = (track: NonNullable<ReleaseEntry["tracklist"]>[number]) =>
  typeof track === "string" ? track : track.title;

const matchingChildRelease = (
  release: ReleaseEntry,
  title: string,
  trackSlug?: string,
) =>
  releases.find(
    (candidate) =>
      candidate.slug !== release.slug &&
      (candidate.parentReleaseSlug === release.slug || candidate.slug === trackSlug) &&
      normalizedArtistName(candidate.title) === normalizedArtistName(title),
  );

const createAlbumTracks = (release: ReleaseEntry) => {
  const registryTracks = registryTracksForRelease(release);
  const sourceTracks = registryTracks.length
    ? registryTracks.map((track) => ({
        title: track.title,
        duration: track.duration,
        artists: primaryArtistNames(release, track),
        contributors: [...track.remixers, ...track.featuredArtists],
        isrc: track.isrc,
        trackSlug: track.trackSlug,
      }))
    : (release.tracklist ?? []).map((track) => ({
        title: trackTitle(track),
        duration: typeof track === "string" ? undefined : track.duration,
        artists: typeof track === "string"
          ? primaryArtistNames(release)
          : splitArtistCredit(track.artist ?? releaseDisplayArtist(release)),
        contributors: [] as string[],
        isrc: undefined,
        trackSlug: typeof track === "string" ? undefined : track.slug,
      }));

  return sourceTracks.map((track, index) => {
    const childRelease = matchingChildRelease(release, track.title, track.trackSlug);
    const childId = childRelease
      ? releaseEntityId(childRelease)
      : `${releaseEntityId(release)}/track/${track.trackSlug ?? index + 1}`;
    const contributors = uniqueNames(track.contributors).map(namedMusicArtist);

    return {
      "@type": "MusicRecording",
      "@id": childId,
      position: index + 1,
      name: track.title,
      byArtist: artistEntities(track.artists),
      duration: durationToIso(track.duration),
      isrcCode: track.isrc,
      inAlbum: { "@id": releaseEntityId(release) },
      contributor: contributors.length ? contributors : undefined,
    };
  });
};

const isAlbumRelease = (release: ReleaseEntry) =>
  release.type === "ep" ||
  release.type === "mix" ||
  release.type === "set" ||
  release.catalogSource?.suggestedTileType === "collectionTile";

export const createReleaseStructuredData = (release: ReleaseEntry): JsonLdEntity => {
  const registryTracks = registryTracksForRelease(release);
  const album = isAlbumRelease(release);
  const releaseTracks = album ? createAlbumTracks(release) : undefined;
  const singleTrack = album ? undefined : registryTracks[0];
  const audioTrack = album ? undefined : release.audio?.tracks[0];
  const sameAs = releaseSameAs(release);
  const producers = explicitProducers(release);
  const parentRelease = release.parentReleaseSlug
    ? releases.find((candidate) => candidate.slug === release.parentReleaseSlug)
    : undefined;
  const pageUrl = releaseUrl(release);
  const genres = normalizedGenres(release);
  const singleContributors = singleTrack
    ? uniqueNames([...singleTrack.remixers, ...singleTrack.featuredArtists]).map(namedMusicArtist)
    : [];
  const registryIdentifiesJoeAsProducer = Boolean(
    singleTrack?.credits &&
      /\bJoseph Montaro\b/i.test(singleTrack.credits) &&
      /\bProducer\b/i.test(singleTrack.credits),
  );
  const resolvedProducers = producers.length
    ? producers
    : registryIdentifiesJoeAsProducer
      ? [{ "@id": artistEntityId }]
      : [];

  return {
    "@context": schemaContext,
    "@type": album ? "MusicAlbum" : "MusicRecording",
    "@id": releaseEntityId(release),
    name: release.title,
    url: pageUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
      url: pageUrl,
      isPartOf: { "@id": websiteEntityId },
    },
    byArtist: artistEntities(primaryArtistNames(release, singleTrack)),
    datePublished: validDatePublished(release),
    description: releaseFactualDescription(release),
    genre: genres.length ? genres : undefined,
    image: publicCoverUrl(release),
    sameAs: sameAs.length ? sameAs : undefined,
    producer: resolvedProducers.length === 1
      ? resolvedProducers[0]
      : resolvedProducers.length
        ? resolvedProducers
        : undefined,
    contributor: singleContributors.length ? singleContributors : undefined,
    isrcCode: !album ? singleTrack?.isrc : undefined,
    duration: !album
      ? durationToIso(singleTrack?.duration ?? audioTrack?.duration)
      : undefined,
    audio: audioTrack
      ? {
          "@type": "AudioObject",
          contentUrl: canonicalUrl(audioTrack.src),
          duration: durationToIso(audioTrack.duration),
        }
      : undefined,
    inAlbum: parentRelease ? { "@id": releaseEntityId(parentRelease) } : undefined,
    numTracks: album && releaseTracks?.length ? releaseTracks.length : undefined,
    track: album && releaseTracks?.length ? releaseTracks : undefined,
  };
};

export const createReleaseBreadcrumbStructuredData = (
  release: ReleaseEntry,
): JsonLdEntity => ({
  "@context": schemaContext,
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalUrl("/"),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Music",
      item: canonicalUrl("/music"),
    },
    {
      "@type": "ListItem",
      position: 3,
      name: release.title,
      item: releaseUrl(release),
    },
  ],
});
