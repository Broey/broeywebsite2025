import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import Image from "next/image";
import { join } from "path";
import { PendingArtwork } from "@/components/ui/PendingArtwork";
import type { ReleaseEntry } from "@/content/releases";

type ReleaseArtworkProps = {
  release: ReleaseEntry;
  className?: string;
};

const publicFileExists = (assetPath?: string) => {
  if (!assetPath || !assetPath.startsWith("/")) {
    return false;
  }

  return existsSync(join(process.cwd(), "public", assetPath));
};

const duplicateFallbackHashes = new Set([
  "7375038A23AD0F4A138E3692FAFB229943D5220F7D1F1F78737CEC62192F8B8A",
]);

const fileHashCache = new Map<string, string>();

const publicFileHash = (assetPath: string) => {
  const filePath = join(process.cwd(), "public", assetPath);
  const cached = fileHashCache.get(filePath);

  if (cached) {
    return cached;
  }

  const hash = createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
  fileHashCache.set(filePath, hash);
  return hash;
};

export const shouldUseFallbackArtwork = (assetPath?: string) => {
  if (!assetPath || !publicFileExists(assetPath)) {
    return true;
  }

  return duplicateFallbackHashes.has(publicFileHash(assetPath));
};

export function ReleaseArtwork({ release, className = "aspect-square" }: ReleaseArtworkProps) {
  const alt = release.coverAlt ?? `${release.title} cover art`;
  const coverImage = release.coverImage;
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
      />
    </div>
  );
}
