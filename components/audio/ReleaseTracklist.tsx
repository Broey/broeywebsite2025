"use client";

import Link from "next/link";
import { releaseAudioQueue } from "@/components/audio/releaseAudioQueue";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import type { ReleaseEntry } from "@/content/releases";

type ReleaseTracklistProps = {
  release: ReleaseEntry;
  trackLinks?: Array<{
    title: string;
    slug?: string;
    href: string;
  }>;
};

const trackTitle = (track: NonNullable<ReleaseEntry["tracklist"]>[number]) =>
  typeof track === "string" ? track : track.title;

const trackArtist = (track: NonNullable<ReleaseEntry["tracklist"]>[number]) =>
  typeof track === "string" ? undefined : track.artist;

const trackDuration = (track: NonNullable<ReleaseEntry["tracklist"]>[number]) =>
  typeof track === "string" ? undefined : track.duration;

const trackSlug = (track: NonNullable<ReleaseEntry["tracklist"]>[number]) =>
  typeof track === "string" ? undefined : track.slug;

const trackAudioKey = (track: NonNullable<ReleaseEntry["tracklist"]>[number]) =>
  typeof track === "string" ? undefined : track.audioKey;

const comparableTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!]/g, "")
    .trim();

const titlesMatch = (left: string, right: string) => {
  const normalizedLeft = comparableTitle(left);
  const normalizedRight = comparableTitle(right);

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.startsWith(`${normalizedRight} (`) ||
    normalizedRight.startsWith(`${normalizedLeft} (`)
  );
};

const keysMatch = (left?: string, right?: string) =>
  Boolean(left && right && comparableTitle(left) === comparableTitle(right));

export function ReleaseTracklist({ release, trackLinks = [] }: ReleaseTracklistProps) {
  const queue = releaseAudioQueue(release);
  const { activeIndex, currentQueue, hasEnded, isPlaying, playQueue } = useAudioPlayer();
  const tracks = release.tracklist ?? release.audio?.tracks ?? [];

  return (
    <ol className="release-detail-tracklist">
      {tracks.map((track, index) => {
        const title = trackTitle(track);
        const slug = trackSlug(track);
        const audioKey = trackAudioKey(track);
        const keyMatchedIndex = queue?.tracks.findIndex((audioTrack) =>
          keysMatch(audioTrack.audioKey, audioKey) ||
          keysMatch(audioTrack.slug, slug) ||
          keysMatch(audioTrack.audioKey, slug) ||
          keysMatch(audioTrack.slug, audioKey),
        ) ?? -1;
        const titleMatchedIndex = queue?.tracks.findIndex((audioTrack) =>
          titlesMatch(audioTrack.title, title),
        ) ?? -1;
        const queueTrackIndex = keyMatchedIndex >= 0 ? keyMatchedIndex : titleMatchedIndex;
        const trackLink = trackLinks.find((link) =>
          keysMatch(link.slug, slug) || keysMatch(link.slug, audioKey) || titlesMatch(link.title, title),
        );
        const audioTrack = queueTrackIndex >= 0 ? queue?.tracks[queueTrackIndex] : undefined;
        const detail = [trackArtist(track), trackDuration(track) ?? audioTrack?.duration]
          .filter(Boolean)
          .join(" / ");
        const isActiveTrack =
          currentQueue?.queueId === queue?.queueId && activeIndex === queueTrackIndex;
        const actionLabel = isActiveTrack && isPlaying
          ? "Playing"
          : isActiveTrack && hasEnded
            ? "Replay"
            : "Play";

        return (
          <li
            key={`${title}-${index}`}
            className="release-detail-track"
            data-playable={audioTrack ? "true" : "false"}
            data-active={isActiveTrack ? "true" : "false"}
          >
            <span className="release-detail-track-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="release-detail-track-title">{title}</span>
            {detail ? <span className="release-detail-track-detail">{detail}</span> : null}
            {queue && audioTrack ? (
              <button
                type="button"
                className="release-detail-track-play"
                aria-label={`Play ${audioTrack.title} from ${queue.queueTitle}`}
                onClick={() => playQueue(queue, queueTrackIndex)}
              >
                {actionLabel}
              </button>
            ) : null}
            {trackLink ? (
              <Link href={trackLink.href} className="release-detail-track-link">
                View Track
              </Link>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
