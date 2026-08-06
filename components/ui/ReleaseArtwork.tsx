import Image from "next/image";
import { PendingArtwork } from "@/components/ui/PendingArtwork";
import type { ReleaseEntry } from "@/content/releases";
import { shouldUseFallbackArtwork } from "@/lib/release-artwork";

export { shouldUseFallbackArtwork } from "@/lib/release-artwork";

type ReleaseArtworkProps = {
  release: ReleaseEntry;
  className?: string;
};

export function ReleaseArtwork({ release, className = "aspect-square" }: ReleaseArtworkProps) {
  const alt = release.coverAlt ?? `${release.title} cover art`;
  const coverImage = release.coverImage;
  const artworkPresentation = release.artworkPresentation;
  const fallbackEyebrow =
    release.catalogStatus === "pending-tidal"
      ? "Manual release"
      : release.catalogStatus === "draft"
        ? "Draft tile"
        : "Artwork pending";

  if (!coverImage || shouldUseFallbackArtwork(coverImage)) {
    return (
      <PendingArtwork
        alt={alt}
        eyebrow={fallbackEyebrow}
        label={release.title}
        className={`release-artwork-frame ${className}`}
      />
    );
  }

  return (
    <div className={`release-artwork-frame ${className}`}>
      <Image
        src={coverImage}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="release-artwork-image"
        style={{
          objectFit: artworkPresentation?.fit ?? "cover",
          objectPosition: artworkPresentation?.position ?? "center",
        }}
      />
    </div>
  );
}
