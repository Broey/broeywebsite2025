"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { releaseAudioQueue } from "@/components/audio/releaseAudioQueue";
import { useAudioPlayer, type GlobalAudioQueue } from "@/components/audio/useAudioPlayer";
import { PendingArtwork } from "@/components/ui/PendingArtwork";
import { releaseDetailHref } from "@/content/release-actions";
import type { ReleaseEntry } from "@/content/releases";
import type { CSSProperties, ReactNode } from "react";
import type { CarouselMetrics, CarouselPointer } from "@/components/ui/ReleaseCarousel";

type ReleaseCarouselTileProps = {
  release: ReleaseEntry;
  index: number;
  audioQueue?: GlobalAudioQueue;
  activeIndex?: number;
  activePosition?: number;
  displayPosition?: number;
  releaseCount?: number;
  metrics?: CarouselMetrics;
  motionEnergy?: number;
  pointer?: CarouselPointer;
  onSelect?: (index: number) => void;
  suppressCardClick?: () => boolean;
};

type CarouselTileStyle = CSSProperties & Record<`--${string}`, string | number>;

type VisualState = {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotateX: number;
  rotateY: number;
  opacity: number;
  saturation: number;
  brightness: number;
  contrast: number;
  width: number;
  zIndex: number;
  glowX: number;
  glowY: number;
  glowOpacity: number;
  focusWeight: number;
};

const releaseTypeLabel: Record<ReleaseEntry["type"], string> = {
  single: "Single",
  ep: "EP",
  remix: "Remix",
  mix: "Mix",
  set: "Set",
};

const tileKind = (release: ReleaseEntry) =>
  release.catalogSource?.suggestedTileType === "collectionTile" ? "collection" : "single";

const releaseDateLabel = (release: ReleaseEntry) => {
  if (release.year) return String(release.year);
  if (release.releaseDate) return release.releaseDate.slice(0, 4);

  return undefined;
};

const fallbackMetrics: CarouselMetrics = {
  activeWidth: 520,
  sideWidth: 420,
  sideOffset: 420,
  farOffset: 760,
  sideScale: 0.64,
  farScale: 0.48,
  rem: 16,
  dragDistance: 300,
};

const fallbackPointer: CarouselPointer = { x: 0.5, y: 0.42 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const smoothstep = (progress: number) => progress * progress * (3 - 2 * progress);

const softstep = (progress: number) => lerp(progress, smoothstep(progress), 0.5);

const rgba = (red: number, green: number, blue: number, alpha: number) =>
  `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;

const circularOffset = (index: number, activePosition: number, releaseCount: number) => {
  const rawOffset = index - activePosition;
  const half = releaseCount / 2;

  return ((((rawOffset + half) % releaseCount) + releaseCount) % releaseCount) - half;
};

const distanceBucket = (distance: number) => {
  if (distance < 0.5) return 0;
  if (distance < 1.5) return 1;
  if (distance < 2.5) return 2;

  return 3;
};

const visualStateForOffset = (
  offset: number,
  metrics: CarouselMetrics,
  pointer: CarouselPointer,
  motionEnergy: number,
): VisualState => {
  const sign = offset < 0 ? -1 : offset > 0 ? 1 : 0;
  const distance = Math.abs(offset);
  const nearProgress = softstep(clamp(distance, 0, 1));
  const farProgress = softstep(clamp(distance - 1, 0, 1));
  const offstageProgress = softstep(clamp(distance - 2, 0, 1));
  const focusWeight = 1 - softstep(clamp(distance, 0, 1));
  const hoverWeight = clamp(1 - distance * 0.88, 0, 1);
  const sideScale = metrics.sideScale || fallbackMetrics.sideScale;
  const farScale = metrics.farScale || fallbackMetrics.farScale;
  const xAbs =
    distance <= 1
      ? metrics.sideOffset * nearProgress
      : metrics.sideOffset +
        (metrics.farOffset - metrics.sideOffset) * farProgress +
        metrics.sideOffset * 0.42 * offstageProgress;
  const z =
    distance <= 1
      ? -metrics.rem * 7 * nearProgress
      : -metrics.rem * 7 -
        metrics.rem * 7 * farProgress -
        metrics.rem * 6 * offstageProgress;
  const scale =
    distance <= 1
      ? lerp(1, sideScale, nearProgress)
      : lerp(sideScale, farScale, farProgress) * (1 - offstageProgress * 0.16);
  const opacity =
    distance <= 1
      ? lerp(1, 0.66, nearProgress)
      : distance <= 2
        ? lerp(0.66, 0.24, farProgress)
        : lerp(0.24, 0, offstageProgress);
  const pointerX = pointer.x - 0.5;
  const pointerY = pointer.y - 0.5;
  const rotateY =
    -sign * lerp(0, 15, smoothstep(clamp(distance / 2, 0, 1))) +
    pointerX * 10.5 * hoverWeight;
  const rotateX = -pointerY * 8.5 * hoverWeight;

  return {
    x: sign * xAbs,
    y: -motionEnergy * 12 * focusWeight - Math.abs(pointerX) * 5 * hoverWeight,
    z,
    scale,
    rotateX,
    rotateY,
    opacity,
    saturation:
      distance <= 1 ? lerp(1.12, 0.9, nearProgress) : lerp(0.9, 0.72, farProgress),
    brightness:
      distance <= 1 ? lerp(1.07, 0.78, nearProgress) : lerp(0.78, 0.58, farProgress),
    contrast: lerp(1.03, 1, clamp(distance, 0, 1)),
    width: lerp(metrics.activeWidth, metrics.sideWidth, nearProgress),
    zIndex: Math.max(1, 1000 - Math.round(distance * 100)),
    glowX: clamp(pointer.x * 100, 12, 88),
    glowY: clamp(pointer.y * 100, 10, 82),
    glowOpacity: clamp(0.08 + focusWeight * (0.62 + motionEnergy * 0.42), 0, 0.95),
    focusWeight,
  };
};

function CarouselArtwork({ release, children }: { release: ReleaseEntry; children?: ReactNode }) {
  const alt = release.coverAlt ?? `${release.title} cover art`;
  const fallbackEyebrow =
    release.catalogStatus === "pending-tidal"
      ? "Broey."
      : release.catalogStatus === "draft"
        ? "Draft tile"
        : "Artwork pending";

  if (!release.coverImage) {
    return (
      <div className="music-release-artwork relative aspect-square overflow-hidden rounded-md">
        <PendingArtwork
          alt={alt}
          eyebrow={fallbackEyebrow}
          label={release.title}
          className="h-full w-full"
        />
        {children}
      </div>
    );
  }

  return (
    <div className="music-release-artwork relative aspect-square overflow-hidden rounded-md border border-white/[0.08] bg-black/30 shadow-2xl shadow-black/25">
      <Image
        src={release.coverImage}
        alt={alt}
        fill
        draggable={false}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 82vw"
        className="pointer-events-none select-none object-cover object-center"
      />
      <div className="music-release-artwork-shade" aria-hidden="true" />
      {children}
    </div>
  );
}

function CarouselPlayAction({
  isActive,
  queue,
  releaseTitle,
}: {
  isActive: boolean;
  queue: GlobalAudioQueue;
  releaseTitle: string;
}) {
  const { currentQueue, hasEnded, isPlaying, playQueue } = useAudioPlayer();
  const isCurrentQueueTrack =
    currentQueue?.queueId === queue.queueId && currentQueue.activeIndex === queue.activeIndex;
  const isQueuedReplayState = isCurrentQueueTrack && hasEnded;
  const state = isQueuedReplayState ? "replay" : "play";
  const label = state === "replay" ? "Replay" : "Play";

  return (
    <button
      type="button"
      tabIndex={isActive ? 0 : -1}
      className="music-release-play-action"
      data-state={state}
      data-current={isCurrentQueueTrack ? "true" : "false"}
      data-playing={isCurrentQueueTrack && isPlaying ? "true" : "false"}
      aria-label={`${label} ${releaseTitle} from ${queue.queueTitle}`}
      onClick={(event) => {
        event.stopPropagation();

        playQueue(queue, queue.activeIndex);
      }}
    >
      <span className="music-release-play-action-icon" aria-hidden="true">
        <span className="music-release-play-action-triangle-icon" />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function ReleaseCarouselTile({
  release,
  index,
  audioQueue: contextualAudioQueue,
  activeIndex = 0,
  activePosition = activeIndex,
  displayPosition = activePosition,
  releaseCount = 1,
  metrics = fallbackMetrics,
  motionEnergy = 0,
  pointer = fallbackPointer,
  onSelect,
  suppressCardClick,
}: ReleaseCarouselTileProps) {
  const router = useRouter();
  const safeReleaseCount = Math.max(releaseCount, 1);
  const offset = circularOffset(index, displayPosition, safeReleaseCount);
  const distance = Math.abs(offset);
  const isActive = activeIndex === index;
  const meta = [releaseTypeLabel[release.type], releaseDateLabel(release)].filter(Boolean).join(" / ");
  const detailHref = releaseDetailHref(release);
  const audioQueue = contextualAudioQueue ?? releaseAudioQueue(release);
  const side = distance < 0.001 ? "center" : offset < 0 ? "left" : "right";
  const isCurrent = Boolean(release.featured);
  const visualState = visualStateForOffset(offset, metrics, pointer, motionEnergy);
  const accentColor = isCurrent ? [211, 169, 91] : [63, 177, 217];
  const focusWeight = visualState.focusWeight;
  const style: CarouselTileStyle = {
    "--carousel-x": `${visualState.x}px`,
    "--carousel-y": `${visualState.y}px`,
    "--carousel-z": `${visualState.z}px`,
    "--carousel-scale": visualState.scale.toFixed(4),
    "--carousel-rotate-x": `${visualState.rotateX.toFixed(3)}deg`,
    "--carousel-rotate-y": `${visualState.rotateY.toFixed(3)}deg`,
    "--carousel-opacity": visualState.opacity.toFixed(4),
    "--carousel-inactive-opacity": isActive ? "1" : "0.35",
    "--carousel-inactive-scale": isActive ? "1" : "0.88",
    "--carousel-saturation": visualState.saturation.toFixed(4),
    "--carousel-brightness": visualState.brightness.toFixed(4),
    "--carousel-contrast": visualState.contrast.toFixed(4),
    "--carousel-card-width": `${visualState.width}px`,
    "--carousel-glow-x": `${visualState.glowX}%`,
    "--carousel-glow-y": `${visualState.glowY}%`,
    "--carousel-glow-opacity": visualState.glowOpacity.toFixed(4),
    background: `
      linear-gradient(145deg, ${rgba(255, 255, 255, 0.045 + focusWeight * 0.095)}, ${rgba(255, 255, 255, 0.018 + focusWeight * 0.017)} 45%),
      rgba(10, 12, 16, ${(0.48 + focusWeight * 0.22).toFixed(3)})
    `,
    borderColor: rgba(
      accentColor[0],
      accentColor[1],
      accentColor[2],
      (0.12 + focusWeight * (isCurrent ? 0.58 : 0.38)),
    ),
    boxShadow: `
      0 ${(22 + focusWeight * 24).toFixed(2)}px ${(60 + focusWeight * 64).toFixed(2)}px ${rgba(0, 0, 0, 0.34 + focusWeight * 0.38)},
      0 0 0 1px ${rgba(211, 169, 91, (isCurrent ? 0.1 : 0.04) + focusWeight * 0.24)},
      0 0 ${(18 + focusWeight * 58).toFixed(2)}px ${rgba(accentColor[0], accentColor[1], accentColor[2], 0.05 + focusWeight * 0.15)},
      inset 0 1px 0 ${rgba(255, 255, 255, 0.04 + focusWeight * 0.12)}
    `,
    zIndex: visualState.zIndex,
  };

  return (
    <article
      style={style}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a, button")) {
          return;
        }

        if (suppressCardClick?.()) {
          return;
        }

        if (isActive) {
          router.push(detailHref);
          return;
        }

        onSelect?.(index);
      }}
      onDragStart={(event) => event.preventDefault()}
      data-carousel-card
      data-active={isActive ? "true" : "false"}
      data-current={isCurrent ? "true" : "false"}
      data-tile-kind={tileKind(release)}
      data-side={side}
      data-distance={distanceBucket(distance)}
      data-release-title={release.title}
      aria-current={isActive ? "true" : undefined}
      className="music-release-card group relative flex shrink-0 snap-center flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.045]"
    >
      <div className="music-release-card-glow" aria-hidden="true" />
      <div className="music-release-card-body relative z-10 flex h-full flex-col gap-2.5 p-2.5 sm:p-3">
        <CarouselArtwork release={release}>
          {audioQueue ? (
            <CarouselPlayAction
              isActive={isActive}
              queue={audioQueue}
              releaseTitle={release.title}
            />
          ) : null}
        </CarouselArtwork>
        <div className="music-release-card-panel">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {meta}
            </p>
            <div className="music-release-badge-stack">
              {isCurrent ? <span className="music-release-status-badge">Current</span> : null}
            </div>
          </div>
          <h2 className="site-heading break-words text-3xl font-semibold leading-[0.98] text-white sm:text-4xl">
            {release.title}
          </h2>
          <div className="music-release-action-row">
            <Link
              href={detailHref}
              aria-label={`View ${release.title} release page`}
              className="music-release-view-cta"
              onClick={(event) => event.stopPropagation()}
            >
              Open <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
