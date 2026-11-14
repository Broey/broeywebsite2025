import { TrackedReleaseLink } from "@/components/analytics/TrackedLinks";
import { ReleasePlayButton } from "@/components/audio/ReleasePlayButton";
import type { GlobalAudioQueue } from "@/components/audio/useAudioPlayer";
import { ReleaseArtwork } from "@/components/ui/ReleaseArtwork";
import { ReleaseStatusMeta } from "@/components/ui/ReleaseStatusMeta";
import { normalizedGenres } from "@/content/genres";
import { releaseDetailHref } from "@/content/release-actions";
import type { ReleaseEntry } from "@/content/releases";
import type { AnalyticsSourceSurface } from "@/lib/analytics";
import type { RecommendationContext } from "@/lib/recommendation-analytics";
import { RecommendationImpression } from "@/components/analytics/RecommendationImpression";

type Props = {
  release: ReleaseEntry;
  featured?: boolean;
  hidePendingLinks?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  audioQueue?: GlobalAudioQueue;
  playLabel?: string;
  sourceSurface: AnalyticsSourceSurface;
  recommendation?: RecommendationContext;
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
  recommendation,
}: Props) {
  const releaseTypeDisplay = release.registry?.releaseTypeDisplay ?? releaseTypeLabel[release.type];
  const releaseMeta = release.year
    ? `${releaseTypeDisplay} / ${release.year}`
    : releaseTypeDisplay;
  const resolvedCtaHref = ctaHref ?? releaseDetailHref(release);
  const resolvedCtaLabel = ctaLabel ?? `View ${release.title}`;
  const genres = normalizedGenres(release);
  const playSubject = audioQueue && audioQueue.queueTitle !== release.title
    ? `${release.title} from ${audioQueue.queueTitle}`
    : release.title;

  return (
    <article
      className={`release-grid-card group ${featured ? "release-grid-card--featured" : ""}`}
    >
      {recommendation ? <RecommendationImpression context={recommendation} /> : null}
      <ReleaseArtwork release={release} className="release-grid-card-artwork aspect-square" />
      <div className="release-grid-card-copy">
        <p className="release-grid-card-meta">{releaseMeta}</p>
        <h3 className="release-grid-card-title">{release.title}</h3>
        <ReleaseStatusMeta
          release={release}
          className="release-grid-card-status"
          showEra={false}
        />
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
              recommendation={recommendation}
              label={playLabel ?? "Play"}
              ariaLabelSubject={playSubject}
              className="release-detail-track-play"
            />
          ) : null}
          <TrackedReleaseLink
            href={resolvedCtaHref}
            releaseSlug={release.slug}
            sourceSurface={sourceSurface}
            recommendation={recommendation}
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
