"use client";

import { useAudioPlayer, type GlobalAudioQueue } from "@/components/audio/useAudioPlayer";

type ReleasePlayButtonProps = {
  queue: GlobalAudioQueue;
  label?: string;
  ariaLabelSubject?: string;
  className?: string;
};

export function ReleasePlayButton({
  queue,
  label = "Play",
  ariaLabelSubject,
  className = "",
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
        if (isCurrentQueueTrack && !hasEnded) {
          togglePlayback();
          return;
        }

        playQueue(queue, queue.activeIndex);
      }}
    >
      {actionLabel}
    </button>
  );
}
