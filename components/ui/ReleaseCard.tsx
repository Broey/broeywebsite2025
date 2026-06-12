import Link from "next/link";
import { ReleasePlayButton } from "@/components/audio/ReleasePlayButton";
import type { GlobalAudioQueue } from "@/components/audio/useAudioPlayer";
import { ReleaseArtwork } from "@/components/ui/ReleaseArtwork";
import { releaseDetailHref } from "@/content/release-actions";
import type { ReleaseEntry } from "@/content/releases";

type Props = {
  release: ReleaseEntry;
  featured?: boolean;
  hidePendingLinks?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  audioQueue?: GlobalAudioQueue;
  playLabel?: string;
};

const releaseTypeLabel: Record<ReleaseEntry["type"], string> = {
  single: "Single",
  ep: "EP",
  remix: "Remix",
  mix: "Mix",
  set: "Set",
};

export function ReleaseCard({
  release,
  featured = false,
  ctaLabel,
  ctaHref,
  audioQueue,
  playLabel,
}: Props) {
  const releaseMeta = release.year
    ? `${releaseTypeLabel[release.type]} / ${release.year}`
    : releaseTypeLabel[release.type];
  const resolvedCtaHref = ctaHref ?? releaseDetailHref(release);
  const resolvedCtaLabel = ctaLabel ?? "View Release";
  const playSubject = audioQueue && audioQueue.queueTitle !== release.title
    ? `${release.title} from ${audioQueue.queueTitle}`
    : release.title;

  return (
    <article
      className={`release-grid-card group ${featured ? "release-grid-card--featured" : ""}`}
    >
      <ReleaseArtwork release={release} className="release-grid-card-artwork aspect-square" />
      <div className="release-grid-card-copy">
        <p className="release-grid-card-meta">{releaseMeta}</p>
        <h3 className="release-grid-card-title">{release.title}</h3>
        <p className="release-grid-card-description">{release.description}</p>
        <div className="release-grid-card-actions">
          {audioQueue ? (
            <ReleasePlayButton
              queue={audioQueue}
              label={playLabel ?? "Play"}
              ariaLabelSubject={playSubject}
              className="release-detail-track-play"
            />
          ) : null}
          <Link
            href={resolvedCtaHref}
            className="release-grid-card-action"
          >
            <span>{resolvedCtaLabel}</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
