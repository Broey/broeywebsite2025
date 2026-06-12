"use client";

type AudioPreviewProps = {
  src: string;
  label: string;
};

export function AudioPreview({ src, label }: AudioPreviewProps) {
  return (
    <audio
      controls
      preload="metadata"
      src={src}
      className="w-full"
      aria-label={label}
      data-broey-audio
      onPlay={(event) => {
        const current = event.currentTarget;
        document.querySelectorAll<HTMLAudioElement>("audio[data-broey-audio]").forEach((audio) => {
          if (audio !== current) {
            audio.pause();
          }
        });
      }}
    />
  );
}
