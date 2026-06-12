"use client";

import Image from "next/image";
import Link from "next/link";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";

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
    ? `${currentTrack.artist} · ${currentQueue.queueTitle}`
    : currentTrack.artist;
  const resolvedDuration = hasMetadata ? duration : duration || fallbackDuration;
  const progress = resolvedDuration > 0 ? Math.min((currentTime / resolvedDuration) * 100, 100) : 0;
  const activeVolume = isMuted ? 0 : volume;
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
    <aside className="global-audio-player" aria-label="Site audio player">
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
              <span className="global-audio-player__queue-count" aria-label={`Track ${activeIndex + 1} of ${queueLength}`}>
                {activeIndex + 1} / {queueLength}
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
                  background: `linear-gradient(90deg, var(--color-cyan) ${progress}%, rgba(240, 236, 225, 0.16) ${progress}%)`,
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
                background: `linear-gradient(90deg, var(--color-amber) ${activeVolume * 100}%, rgba(240, 236, 225, 0.18) ${activeVolume * 100}%)`,
              }}
            />
          </label>
        </div>
      </div>
    </aside>
  );
}
