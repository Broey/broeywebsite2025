"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReleaseEntry } from "@/content/releases";

type BroeyAudioPlayerProps = {
  release: ReleaseEntry;
  className?: string;
};

const DEFAULT_VOLUME = 0.7;
const VOLUME_STORAGE_KEY = "broey-audio-volume";

const clampVolume = (value: number) => Math.min(Math.max(value, 0), 1);

const parseDuration = (duration?: string) => {
  if (!duration) {
    return 0;
  }

  const parts = duration.split(":").map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const roundedSeconds = Math.floor(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export function BroeyAudioPlayer({ release, className }: BroeyAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousVolumeRef = useRef(DEFAULT_VOLUME);
  const track = release.audio?.tracks[0];
  const fallbackDuration = useMemo(() => parseDuration(track?.duration), [track?.duration]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasMetadata, setHasMetadata] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(fallbackDuration);
    setHasMetadata(false);
    setHasEnded(false);
    setHasError(false);
    setIsLoading(false);
    setIsPlaying(false);
  }, [fallbackDuration, track?.src]);

  useEffect(() => {
    const audio = audioRef.current;
    const savedVolume = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    const parsedVolume = savedVolume === null ? DEFAULT_VOLUME : Number(savedVolume);
    const nextVolume = Number.isFinite(parsedVolume) ? clampVolume(parsedVolume) : DEFAULT_VOLUME;
    const nextMuted = nextVolume === 0;

    previousVolumeRef.current = nextVolume > 0 ? nextVolume : DEFAULT_VOLUME;
    setVolume(nextVolume);
    setIsMuted(nextMuted);

    if (audio) {
      audio.volume = nextVolume;
      audio.muted = nextMuted;
    }
  }, [track?.src]);

  if (!track) {
    return null;
  }

  const title = release.audio?.title ?? track.title;
  const artist = release.audio?.artist ?? track.artist ?? release.artistName ?? "Broey.";
  const resolvedDuration = hasMetadata ? duration : duration || fallbackDuration;
  const durationLabel = formatTime(resolvedDuration);
  const activeVolume = isMuted ? 0 : volume;
  const progress = resolvedDuration > 0 ? Math.min((currentTime / resolvedDuration) * 100, 100) : 0;
  const status = hasError
    ? "Audio unavailable"
    : isLoading
      ? "Loading"
      : hasEnded
        ? "Ended"
        : isPlaying
          ? "Playing"
          : "Ready";
  const buttonLabel = hasEnded ? `Replay ${title}` : isPlaying ? `Pause ${title}` : `Play ${title}`;
  const volumeLabel = isMuted ? `Unmute ${title}` : `Mute ${title}`;

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio || hasError) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      return;
    }

    document.querySelectorAll<HTMLAudioElement>("audio[data-broey-audio]").forEach((player) => {
      if (player !== audio) {
        player.pause();
      }
    });

    if (hasEnded) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setHasEnded(false);
    }

    audio.volume = volume;
    audio.muted = isMuted;
    setIsLoading(audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA);

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const seekTo = (value: string) => {
    const audio = audioRef.current;
    const nextTime = Number(value);

    if (!audio || Number.isNaN(nextTime)) {
      return;
    }

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
    setHasEnded(false);
  };

  const changeVolume = (value: string) => {
    const audio = audioRef.current;
    const nextVolume = clampVolume(Number(value));

    if (!Number.isFinite(nextVolume)) {
      return;
    }

    setVolume(nextVolume);
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(nextVolume));

    if (nextVolume > 0) {
      previousVolumeRef.current = nextVolume;
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }

    if (audio) {
      audio.volume = nextVolume;
      audio.muted = nextVolume === 0;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;

    if (isMuted) {
      const restoredVolume = previousVolumeRef.current || DEFAULT_VOLUME;

      setVolume(restoredVolume);
      setIsMuted(false);
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(restoredVolume));

      if (audio) {
        audio.volume = restoredVolume;
        audio.muted = false;
      }

      return;
    }

    if (volume > 0) {
      previousVolumeRef.current = volume;
    }

    setIsMuted(true);

    if (audio) {
      audio.muted = true;
    }
  };

  return (
    <div className={["broey-audio-player", className].filter(Boolean).join(" ")}>
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        data-broey-audio
        onLoadStart={() => {
          setHasError(false);
          setIsLoading(true);
        }}
        onLoadedMetadata={(event) => {
          const mediaDuration = event.currentTarget.duration;

          if (Number.isFinite(mediaDuration)) {
            setDuration(mediaDuration);
          }

          setHasMetadata(true);
          setIsLoading(false);
        }}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
          setHasEnded(false);
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => {
          setIsPlaying(false);
          setIsLoading(false);
          setHasEnded(true);
        }}
        onError={() => {
          setIsPlaying(false);
          setIsLoading(false);
          setHasError(true);
        }}
      />

      <div className="broey-audio-player__header">
        <p className="broey-audio-player__eyebrow">Player</p>
        <p className="broey-audio-player__status" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="broey-audio-player__meta">
        <div className="broey-audio-player__track">
          <span>{title}</span>
          <small>{artist}</small>
        </div>
        <p className="broey-audio-player__time" aria-label={`${formatTime(currentTime)} of ${durationLabel}`}>
          {formatTime(currentTime)} / {durationLabel}
        </p>
      </div>

      <div className="broey-audio-player__controls">
        <button
          type="button"
          className="broey-audio-player__button"
          aria-label={buttonLabel}
          disabled={hasError}
          onClick={togglePlayback}
        >
          <span aria-hidden="true">{isPlaying ? "Pause" : hasEnded ? "Replay" : "Play"}</span>
        </button>

        <label className="broey-audio-player__seek">
          <span className="sr-only">Seek through {title}</span>
          <input
            type="range"
            min="0"
            max={resolvedDuration || 0}
            step="0.01"
            value={Math.min(currentTime, resolvedDuration || 0)}
            disabled={hasError || !resolvedDuration}
            aria-label={`Seek through ${title}`}
            onChange={(event) => seekTo(event.currentTarget.value)}
            style={{
              background: `linear-gradient(90deg, var(--color-cyan) ${progress}%, rgba(240, 236, 225, 0.18) ${progress}%)`,
            }}
          />
        </label>

        <div className="broey-audio-player__volume">
          <button
            type="button"
            className="broey-audio-player__mute"
            aria-label={volumeLabel}
            disabled={hasError}
            onClick={toggleMute}
          >
            <span aria-hidden="true">{isMuted || volume === 0 ? "Muted" : "Volume"}</span>
          </button>
          <label className="broey-audio-player__volume-range">
            <span className="sr-only">Volume for {title}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={activeVolume}
              disabled={hasError}
              aria-label={`Volume for ${title}`}
              onChange={(event) => changeVolume(event.currentTarget.value)}
              style={{
                background: `linear-gradient(90deg, var(--color-amber) ${activeVolume * 100}%, rgba(240, 236, 225, 0.18) ${activeVolume * 100}%)`,
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
