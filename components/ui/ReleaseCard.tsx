import { TrackedReleaseLink } from "@/components/analytics/TrackedLinks";
import { ReleasePlayButton } from "@/components/audio/ReleasePlayButton";
import type { GlobalAudioQueue } from "@/components/audio/useAudioPlayer";
import { ReleaseArtwork } from "@/components/ui/ReleaseArtwork";
import { normalizedGenres } from "@/content/genres";
import { releaseDetailHref } from "@/content/release-actions";
import type { ReleaseEntry } from "@/content/releases";
import type { AnalyticsSourceSurface } from "@/lib/analytics";

type Props = {
  release: ReleaseEntry;
  featured?: boolean;
  hidePendingLinks?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  audioQueue?: GlobalAudioQueue;
  playLabel?: string;
  sourceSurface: AnalyticsSourceSurface;
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
  sourceSurface,
}: Props) {
  const releaseTypeDisplay = release.registry?.releaseTypeDisplay ?? releaseTypeLabel[release.type];
  const releaseMeta = release.year
    ? `${releaseTypeDisplay} / ${release.year}`
    : releaseTypeDisplay;
  const resolvedCtaHref = ctaHref ?? releaseDetailHref(release);
  const resolvedCtaLabel = ctaLabel ?? "View Release";
  const genres = normalizedGenres(release);
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
        {genres.length ? (
          <div className="release-grid-card-tags" aria-label={`Genres for ${release.title}`}>
            {genres.map((genre) => (
              <span key={genre}>{genre}</span>
            ))}
          </div>
        ) : null}
        <div className="release-grid-card-actions">
          {audioQueue ? (
            <ReleasePlayButton
              queue={audioQueue}
              label={playLabel ?? "Play"}
              ariaLabelSubject={playSubject}
              className="release-detail-track-play"
            />
          ) : null}
          <TrackedReleaseLink
            href={resolvedCtaHref}
            releaseSlug={release.slug}
            sourceSurface={sourceSurface}
            className="release-grid-card-action"
          >
            <span>{resolvedCtaLabel}</span>
            <span aria-hidden="true">&rarr;</span>
          </TrackedReleaseLink>
        </div>
      </div>
    </article>
  );
}
