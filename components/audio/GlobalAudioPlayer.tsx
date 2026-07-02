"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";

type PlayerAccentStyle = CSSProperties & Record<`--player-${string}`, string>;

const DEFAULT_PLAYER_ACCENT = "#f0b64d";

const normalizeHexColor = (color?: string) => {
  if (!color) {
    return DEFAULT_PLAYER_ACCENT;
  }

  const normalized = color.trim();

  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized;
  }

  return DEFAULT_PLAYER_ACCENT;
};

const accentChannel = (hex: string, start: number) => Number.parseInt(hex.slice(start, start + 2), 16);

const alphaColor = (hex: string, alpha: number) =>
  `rgba(${accentChannel(hex, 1)}, ${accentChannel(hex, 3)}, ${accentChannel(hex, 5)}, ${alpha})`;

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const roundedSeconds = Math.floor(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export function GlobalAudioPlayer() {
  const {
    activeIndex,
    canGoNext,
    canGoPrevious,
    currentQueue,
    currentTrack,
    currentTime,
    duration,
    fallbackDuration,
    hasEnded,
    hasError,
    hasMetadata,
    isLoading,
    isMuted,
    isPlaying,
    playNext,
    playPrevious,
    seekTo,
    setPlayerVolume,
    toggleMute,
    togglePlayback,
    volume,
  } = useAudioPlayer();

  if (!currentTrack) {
    return null;
  }

  const queueLength = currentQueue?.tracks.length ?? 0;
  const hasQueueControls = queueLength > 1;
  const artistContext = currentQueue && currentQueue.queueTitle !== currentTrack.title
    ? `${currentTrack.artist} / ${currentQueue.queueTitle}`
    : currentTrack.artist;
  const resolvedDuration = hasMetadata ? duration : duration || fallbackDuration;
  const progress = resolvedDuration > 0 ? Math.min((currentTime / resolvedDuration) * 100, 100) : 0;
  const activeVolume = isMuted ? 0 : volume;
  const playerAccent = normalizeHexColor(currentTrack.playerAccent ?? currentQueue?.playerAccent);
  const playerAccentStyle: PlayerAccentStyle = {
    "--player-accent": playerAccent,
    "--player-accent-soft": alphaColor(playerAccent, 0.08),
    "--player-accent-border": alphaColor(playerAccent, 0.44),
    "--player-accent-glow": alphaColor(playerAccent, 0.12),
    "--player-accent-strong-glow": alphaColor(playerAccent, 0.2),
  };
  const status = hasError
    ? "Audio unavailable"
    : isLoading
      ? "Loading"
      : hasEnded
        ? "Ended"
        : isPlaying
          ? "Playing"
          : "Ready";
  const buttonLabel = hasEnded
    ? `Replay ${currentTrack.title}`
    : isPlaying
      ? `Pause ${currentTrack.title}`
      : `Play ${currentTrack.title}`;
  const content = (
    <>
      <div className="global-audio-player__artwork" aria-hidden="true">
        {currentTrack.artwork ? (
          <Image
            src={currentTrack.artwork}
            alt=""
            fill
            sizes="4rem"
            className="global-audio-player__artwork-image"
          />
        ) : (
          <span>{currentTrack.title.slice(0, 1)}</span>
        )}
      </div>

      <div className="global-audio-player__meta">
        <p className="global-audio-player__title">{currentTrack.title}</p>
        <p className="global-audio-player__artist">{artistContext}</p>
      </div>
    </>
  );

  return (
    <aside
      className="global-audio-player"
      aria-label="Site audio player"
      style={playerAccentStyle}
    >
      <div className="global-audio-player__inner">
        {currentTrack.releaseUrl ? (
          <Link href={currentTrack.releaseUrl} className="global-audio-player__release-link">
            {content}
          </Link>
        ) : (
          <div className="global-audio-player__release-link">{content}</div>
        )}

        <div className="global-audio-player__deck">
          <p className="sr-only" aria-live="polite">{status}</p>
          <div className="global-audio-player__transport">
            {hasQueueControls ? (
              <button
                type="button"
                className="global-audio-player__skip global-audio-player__skip--previous"
                aria-label="Play previous track"
                disabled={!canGoPrevious || hasError}
                onClick={playPrevious}
              >
                <span aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              className="global-audio-player__play"
              data-state={isPlaying ? "playing" : hasEnded ? "ended" : "paused"}
              aria-label={buttonLabel}
              disabled={hasError}
              onClick={togglePlayback}
            >
              <span aria-hidden="true" />
            </button>
            {hasQueueControls ? (
              <button
                type="button"
                className="global-audio-player__skip global-audio-player__skip--next"
                aria-label="Play next track"
                disabled={!canGoNext || hasError}
                onClick={playNext}
              >
                <span aria-hidden="true" />
              </button>
            ) : null}
            {hasQueueControls ? (
              <span className="sr-only" aria-label={`Track ${activeIndex + 1} of ${queueLength}`}>
                Track {activeIndex + 1} of {queueLength}
              </span>
            ) : null}
          </div>
          <div className="global-audio-player__timeline">
            <span className="global-audio-player__time">{formatTime(currentTime)}</span>
            <label className="global-audio-player__seek">
              <span className="sr-only">Seek through {currentTrack.title}</span>
              <input
                type="range"
                min="0"
                max={resolvedDuration || 0}
                step="0.01"
                value={Math.min(currentTime, resolvedDuration || 0)}
                disabled={hasError || !resolvedDuration}
                aria-label={`Seek through ${currentTrack.title}`}
                onChange={(event) => seekTo(Number(event.currentTarget.value))}
                style={{
                  background: `linear-gradient(90deg, var(--player-accent) ${progress}%, rgba(240, 236, 225, 0.16) ${progress}%)`,
                }}
              />
            </label>
            <span className="global-audio-player__time">{formatTime(resolvedDuration)}</span>
          </div>
        </div>

        <div className="global-audio-player__volume">
          <button
            type="button"
            className="global-audio-player__mute"
            data-muted={isMuted || volume === 0}
            aria-label={isMuted ? `Unmute ${currentTrack.title}` : `Mute ${currentTrack.title}`}
            disabled={hasError}
            onClick={toggleMute}
          >
            <span aria-hidden="true" />
          </button>
          <label className="global-audio-player__volume-range">
            <span className="sr-only">Volume for {currentTrack.title}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={activeVolume}
              disabled={hasError}
              aria-label={`Volume for ${currentTrack.title}`}
              onChange={(event) => setPlayerVolume(Number(event.currentTarget.value))}
              style={{
                background: `linear-gradient(90deg, rgba(238, 242, 248, 0.58) ${activeVolume * 100}%, rgba(240, 236, 225, 0.16) ${activeVolume * 100}%)`,
              }}
            />
          </label>
        </div>
      </div>
    </aside>
  );
}
