"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import {
  AudioPlayerContext,
  type AudioPlayerContextValue,
  type GlobalAudioQueue,
  type GlobalAudioTrack,
} from "@/components/audio/useAudioPlayer";

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

const normalizeQueue = (queue: GlobalAudioQueue, activeIndex = queue.activeIndex) => ({
  ...queue,
  activeIndex: Math.min(Math.max(activeIndex, 0), Math.max(queue.tracks.length - 1, 0)),
  tracks: queue.tracks.map((track) => ({
    ...track,
    artwork: track.artwork ?? queue.queueArtwork,
    releaseUrl: track.releaseUrl ?? queue.releaseUrl,
  })),
});

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousVolumeRef = useRef(DEFAULT_VOLUME);
  const [currentQueue, setCurrentQueue] = useState<GlobalAudioQueue>();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasMetadata, setHasMetadata] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const activeIndex = currentQueue?.activeIndex ?? 0;
  const currentTrack = currentQueue?.tracks[activeIndex];
  const currentTrackSrc = currentTrack?.src;
  const hasCurrentTrack = Boolean(currentTrack);
  const queueLength = currentQueue?.tracks.length ?? 0;
  const canGoPrevious = queueLength > 1 && activeIndex > 0;
  const canGoNext = queueLength > 1 && activeIndex < queueLength - 1;
  const fallbackDuration = useMemo(() => parseDuration(currentTrack?.duration), [currentTrack?.duration]);

  useEffect(() => {
    const savedVolume = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    const parsedVolume = savedVolume === null ? DEFAULT_VOLUME : Number(savedVolume);
    const nextVolume = Number.isFinite(parsedVolume) ? clampVolume(parsedVolume) : DEFAULT_VOLUME;
    const nextMuted = nextVolume === 0;

    previousVolumeRef.current = nextVolume > 0 ? nextVolume : DEFAULT_VOLUME;
    setVolume(nextVolume);
    setIsMuted(nextMuted);

    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
      audioRef.current.muted = nextMuted;
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-global-player", Boolean(currentQueue));

    return () => {
      document.body.classList.remove("has-global-player");
    };
  }, [currentQueue]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(fallbackDuration);
    setHasEnded(false);
    setHasError(false);
    setHasMetadata(false);
    setIsLoading(hasCurrentTrack);
    setIsPlaying(false);
  }, [currentTrackSrc, fallbackDuration, hasCurrentTrack]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume;
    audio.muted = isMuted;
  }, [isMuted, volume]);

  const playPendingTrack = useCallback(() => {
    const audio = audioRef.current;

    if (!pendingPlay || !currentTrack || !audio) {
      return;
    }

    if (audio.readyState < HTMLMediaElement.HAVE_METADATA) {
      setIsLoading(true);
      return;
    }

    audio.volume = volume;
    audio.muted = isMuted;
    setIsLoading(false);

    audio.play().catch(() => {
      setIsPlaying(false);
      setIsLoading(false);
    }).finally(() => {
      setPendingPlay(false);
    });
  }, [currentTrack, isMuted, pendingPlay, volume]);

  useEffect(() => {
    playPendingTrack();
  }, [playPendingTrack]);

  const playQueue = useCallback((queue: GlobalAudioQueue, startIndex = queue.activeIndex) => {
    if (!queue.tracks.length) {
      return;
    }

    const audio = audioRef.current;
    const nextQueue = normalizeQueue(queue, startIndex);
    const nextTrack = nextQueue.tracks[nextQueue.activeIndex];
    const isSameTrack =
      currentQueue?.queueId === nextQueue.queueId &&
      currentQueue?.activeIndex === nextQueue.activeIndex &&
      currentTrack?.src === nextTrack.src;

    if (isSameTrack && audio && hasEnded) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }

    setCurrentQueue(nextQueue);
    setHasEnded(false);
    setHasError(false);
    setPendingPlay(true);
  }, [currentQueue?.activeIndex, currentQueue?.queueId, currentTrack?.src, hasEnded]);

  const playTrack = useCallback((track: GlobalAudioTrack) => {
    playQueue({
      queueId: track.src,
      queueTitle: track.title,
      queueArtist: track.artist,
      queueArtwork: track.artwork,
      releaseUrl: track.releaseUrl,
      playContext: "single",
      tracks: [track],
      activeIndex: 0,
    });
  }, [playQueue]);

  const setActiveQueueIndex = useCallback((nextIndex: number, shouldPlay = true) => {
    if (!currentQueue) {
      return;
    }

    const safeIndex = Math.min(Math.max(nextIndex, 0), currentQueue.tracks.length - 1);

    if (safeIndex === currentQueue.activeIndex) {
      return;
    }

    setCurrentQueue({
      ...currentQueue,
      activeIndex: safeIndex,
    });
    setHasEnded(false);
    setHasError(false);

    if (shouldPlay) {
      setPendingPlay(true);
    }
  }, [currentQueue]);

  const playNext = useCallback(() => {
    if (!canGoNext) {
      return;
    }

    setActiveQueueIndex(activeIndex + 1);
  }, [activeIndex, canGoNext, setActiveQueueIndex]);

  const playPrevious = useCallback(() => {
    if (!canGoPrevious) {
      return;
    }

    setActiveQueueIndex(activeIndex - 1);
  }, [activeIndex, canGoPrevious, setActiveQueueIndex]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;

    if (!audio || hasError || !currentTrack) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      return;
    }

    if (hasEnded) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setHasEnded(false);
    }

    audio.volume = volume;
    audio.muted = isMuted;
    setIsLoading(audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA);

    audio.play().catch(() => {
      setIsPlaying(false);
      setIsLoading(false);
    });
  }, [currentTrack, hasEnded, hasError, isMuted, isPlaying, volume]);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;

    if (!audio || Number.isNaN(time)) {
      return;
    }

    audio.currentTime = time;
    setCurrentTime(time);
    setHasEnded(false);
  }, []);

  const setPlayerVolume = useCallback((nextVolume: number) => {
    const normalizedVolume = clampVolume(nextVolume);

    setVolume(normalizedVolume);
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(normalizedVolume));

    if (normalizedVolume > 0) {
      previousVolumeRef.current = normalizedVolume;
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      const restoredVolume = previousVolumeRef.current || DEFAULT_VOLUME;

      setVolume(restoredVolume);
      setIsMuted(false);
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(restoredVolume));
      return;
    }

    if (volume > 0) {
      previousVolumeRef.current = volume;
    }

    setIsMuted(true);
  }, [isMuted, volume]);

  const value = useMemo<AudioPlayerContextValue>(() => ({
    currentQueue,
    currentTrack,
    activeIndex,
    currentTime,
    duration,
    fallbackDuration,
    hasEnded,
    hasError,
    hasMetadata,
    isLoading,
    isMuted,
    isPlaying,
    volume,
    canGoNext,
    canGoPrevious,
    playTrack,
    playQueue,
    playNext,
    playPrevious,
    seekTo,
    setPlayerVolume,
    toggleMute,
    togglePlayback,
  }), [
    currentQueue,
    currentTrack,
    activeIndex,
    currentTime,
    duration,
    fallbackDuration,
    hasEnded,
    hasError,
    hasMetadata,
    isLoading,
    isMuted,
    isPlaying,
    volume,
    canGoNext,
    canGoPrevious,
    playTrack,
    playQueue,
    playNext,
    playPrevious,
    seekTo,
    setPlayerVolume,
    toggleMute,
    togglePlayback,
  ]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={currentTrack?.src}
        preload={pendingPlay ? "auto" : "metadata"}
        data-broey-global-audio
        onLoadStart={() => {
          setHasError(false);
          setIsLoading(Boolean(currentTrack));
        }}
        onLoadedMetadata={(event) => {
          const mediaDuration = event.currentTarget.duration;

          if (Number.isFinite(mediaDuration)) {
            setDuration(mediaDuration);
          }

          setHasMetadata(true);
          setIsLoading(false);
          playPendingTrack();
        }}
        onCanPlay={() => {
          setIsLoading(false);
          playPendingTrack();
        }}
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

          if (canGoNext) {
            setActiveQueueIndex(activeIndex + 1);
            return;
          }

          setHasEnded(true);
        }}
        onError={() => {
          setIsPlaying(false);
          setIsLoading(false);
          setHasError(true);
        }}
      />
      <GlobalAudioPlayer />
    </AudioPlayerContext.Provider>
  );
}
