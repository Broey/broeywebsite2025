import { releaseDetailHref } from "@/content/release-actions";
import { archiveReleases, sortReleasesNewestFirst } from "@/content/release-filters";
import type { ReleaseEntry } from "@/content/releases";
import type {
  GlobalAudioPlayContext,
  GlobalAudioQueue,
} from "@/components/audio/useAudioPlayer";

export const releaseArtistName = (release: ReleaseEntry) => release.artistName ?? "Broey.";

export const releaseQueueArtwork = (release: ReleaseEntry) =>
  release.audio?.artwork ?? release.coverImage;

export const isStandaloneAudioRelease = (release: ReleaseEntry) =>
  !release.isProjectTrack &&
  (release.type === "single" || release.type === "remix") &&
  release.audio?.type === "single" &&
  release.audio.tracks.length === 1;

export const isSinglesQueueAudioRelease = (release: ReleaseEntry) =>
  !release.isProjectTrack &&
  (release.type === "single" || release.type === "remix") &&
  release.catalogSource?.suggestedTileType !== "collectionTile" &&
  Boolean(release.audio?.tracks.length);

export const releaseAudioQueue = (release: ReleaseEntry): GlobalAudioQueue | undefined => {
  const tracks = release.audio?.tracks;

  if (!tracks?.length) {
    return undefined;
  }

  const queueArtist = release.audio?.artist ?? releaseArtistName(release);
  const queueArtwork = releaseQueueArtwork(release);
  const releaseUrl = releaseDetailHref(release);

  return {
    queueId: release.slug,
    queueTitle: release.audio?.title ?? release.title,
    queueArtist,
    queueArtwork,
    releaseUrl,
    playContext: release.audio?.type === "project" ? "project" : "single",
    tracks: tracks.map((track) => ({
      title: track.title,
      slug: track.slug,
      audioKey: track.audioKey,
      artist: track.artist ?? queueArtist,
      src: track.src,
      duration: track.duration,
      artwork: queueArtwork,
      releaseUrl,
    })),
    activeIndex: 0,
  };
};

const singlesQueueAudioQueue = (release: ReleaseEntry): GlobalAudioQueue | undefined => {
  const queue = releaseAudioQueue(release);
  const firstTrack = queue?.tracks[0];

  if (!queue || !firstTrack) {
    return undefined;
  }

  return {
    ...queue,
    playContext: "single",
    tracks: [firstTrack],
    activeIndex: 0,
  };
};

const highlightedPlayableReleases = (releaseList: ReleaseEntry[]) =>
  releaseList.filter((release) => release.carouselEnabled && isSinglesQueueAudioRelease(release));

const archivePlayableReleases = (releaseList: ReleaseEntry[]) =>
  sortReleasesNewestFirst(archiveReleases(releaseList)).filter(isSinglesQueueAudioRelease);

const queueMeta: Record<Exclude<GlobalAudioPlayContext, "project" | "single">, {
  queueId: string;
  queueTitle: string;
}> = {
  highlighted: {
    queueId: "highlighted-releases",
    queueTitle: "Highlighted Releases",
  },
  archive: {
    queueId: "music-archive",
    queueTitle: "Selected Releases",
  },
};

const releaseCollectionAudioQueue = (
  release: ReleaseEntry,
  releaseList: ReleaseEntry[],
  playContext: "highlighted" | "archive",
): GlobalAudioQueue | undefined => {
  const queuedReleases = releaseList.reduce<Array<{
    release: ReleaseEntry;
    queue: GlobalAudioQueue;
  }>>((collection, entry) => {
    const queue = singlesQueueAudioQueue(entry);

    if (queue) {
      collection.push({ release: entry, queue });
    }

    return collection;
  }, []);
  const selectedQueueIndex = queuedReleases.findIndex((entry) => entry.release.slug === release.slug);

  if (selectedQueueIndex < 0) {
    return undefined;
  }

  const activeIndex = queuedReleases
    .slice(0, selectedQueueIndex)
    .reduce((trackCount, entry) => trackCount + entry.queue.tracks.length, 0);
  const selectedQueue = queuedReleases[selectedQueueIndex].queue;
  const meta = queueMeta[playContext];

  return {
    queueId: meta.queueId,
    queueTitle: meta.queueTitle,
    queueArtist: "Broey.",
    queueArtwork: releaseQueueArtwork(release) ?? selectedQueue.queueArtwork,
    releaseUrl: releaseDetailHref(release),
    playContext,
    tracks: queuedReleases.flatMap((entry) => entry.queue.tracks),
    activeIndex,
  };
};

export const releaseAudioQueueForContext = (
  release: ReleaseEntry,
  releaseList: ReleaseEntry[],
  playContext: GlobalAudioPlayContext,
): GlobalAudioQueue | undefined => {
  const ownQueue = releaseAudioQueue(release);

  if (playContext === "project" || !isSinglesQueueAudioRelease(release)) {
    return ownQueue;
  }

  if (playContext === "highlighted") {
    return releaseCollectionAudioQueue(
      release,
      highlightedPlayableReleases(releaseList),
      "highlighted",
    ) ?? ownQueue;
  }

  if (playContext === "archive") {
    return releaseCollectionAudioQueue(
      release,
      archivePlayableReleases(releaseList),
      "archive",
    ) ?? ownQueue;
  }

  return releaseCollectionAudioQueue(
    release,
    highlightedPlayableReleases(releaseList),
    "highlighted",
  ) ?? releaseCollectionAudioQueue(
    release,
    archivePlayableReleases(releaseList),
    "archive",
  ) ?? ownQueue;
};

export const releaseHasProjectAudio = (release: ReleaseEntry) =>
  Boolean(release.audio && release.audio.type === "project" && release.audio.tracks.length > 1);

export const releasePlayLabel = (release: ReleaseEntry) =>
  releaseHasProjectAudio(release) && release.type !== "single" ? "Play Project" : "Play";
