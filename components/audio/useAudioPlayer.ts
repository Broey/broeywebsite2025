"use client";

import { createContext, useContext } from "react";

export type GlobalAudioTrack = {
  title: string;
  slug?: string;
  audioKey?: string;
  artist: string;
  src: string;
  artwork?: string;
  releaseUrl?: string;
  duration?: string;
};

export type GlobalAudioPlayContext = "highlighted" | "archive" | "project" | "single";

export type GlobalAudioQueue = {
  queueId: string;
  queueTitle: string;
  queueArtist: string;
  queueArtwork?: string;
  releaseUrl?: string;
  playContext?: GlobalAudioPlayContext;
  tracks: GlobalAudioTrack[];
  activeIndex: number;
};

export type AudioPlayerContextValue = {
  currentQueue?: GlobalAudioQueue;
  currentTrack?: GlobalAudioTrack;
  activeIndex: number;
  currentTime: number;
  duration: number;
  fallbackDuration: number;
  hasEnded: boolean;
  hasError: boolean;
  hasMetadata: boolean;
  isLoading: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  volume: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  playTrack: (track: GlobalAudioTrack) => void;
  playQueue: (queue: GlobalAudioQueue, activeIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setPlayerVolume: (volume: number) => void;
  toggleMute: () => void;
  togglePlayback: () => void;
};

export const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }

  return context;
}
