"use client";

import { useAudioPlayer, type GlobalAudioQueue } from "@/components/audio/useAudioPlayer";
import { trackEvent } from "@/lib/analytics";
import { recommendationProperties, type RecommendationContext } from "@/lib/recommendation-analytics";

type ReleasePlayButtonProps = {
  queue: GlobalAudioQueue;
  label?: string;
  ariaLabelSubject?: string;
  className?: string;
  recommendation?: RecommendationContext;
};

export function ReleasePlayButton({
  queue,
  label = "Play",
  ariaLabelSubject,
  className = "",
  recommendation,
}: ReleasePlayButtonProps) {
  const { currentQueue, hasEnded, isPlaying, playQueue, togglePlayback } = useAudioPlayer();
  const isCurrentQueueTrack =
    currentQueue?.queueId === queue.queueId && currentQueue.activeIndex === queue.activeIndex;
  const labelSubject = ariaLabelSubject ?? `${queue.queueTitle} by ${queue.queueArtist}`;
  const actionLabel = isCurrentQueueTrack && isPlaying
    ? "Pause"
    : isCurrentQueueTrack && hasEnded
      ? "Replay"
      : label;

  return (
    <button
      type="button"
      className={className}
      aria-label={`${actionLabel} ${labelSubject}`}
      onClick={() => {
        if (recommendation) {
          const interaction = isCurrentQueueTrack
            ? hasEnded ? "replay" : isPlaying ? "pause" : "resume"
            : "play";
          trackEvent("recommendation_interaction", recommendationProperties(recommendation, interaction));
        }
        if (isCurrentQueueTrack && !hasEnded) {
          togglePlayback(recommendation);
          return;
        }

        playQueue(queue, queue.activeIndex, recommendation);
      }}
    >
      {actionLabel}
    </button>
  );
}
