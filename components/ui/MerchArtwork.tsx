import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import Image from "next/image";
import { join } from "path";
import { PendingArtwork } from "@/components/ui/PendingArtwork";
import type { MerchProduct } from "@/content/merch";

type MerchArtworkProps = {
  item: MerchProduct;
  className?: string;
  sizes?: string;
};

const duplicateFallbackHashes = new Set([
  "7375038A23AD0F4A138E3692FAFB229943D5220F7D1F1F78737CEC62192F8B8A",
]);

const fileHashCache = new Map<string, string>();

const publicFilePath = (assetPath: string) => join(process.cwd(), "public", assetPath);

const publicFileExists = (assetPath?: string) =>
  Boolean(assetPath?.startsWith("/") && existsSync(publicFilePath(assetPath)));

const publicFileHash = (assetPath: string) => {
  const filePath = publicFilePath(assetPath);
  const cached = fileHashCache.get(filePath);

  if (cached) {
    return cached;
  }

  const hash = createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
  fileHashCache.set(filePath, hash);
  return hash;
};

const isRemoteImage = (assetPath?: string) =>
  Boolean(assetPath?.startsWith("http://") || assetPath?.startsWith("https://"));

const shouldUseFallbackArtwork = (assetPath?: string) => {
  if (isRemoteImage(assetPath)) {
    return false;
  }

  if (!assetPath || !publicFileExists(assetPath)) {
    return true;
  }

  return duplicateFallbackHashes.has(publicFileHash(assetPath));
};

export function MerchArtwork({
  item,
  className = "aspect-[4/5]",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
}: MerchArtworkProps) {
  const alt = item.imageAlt ?? `${item.title} product image`;
  const image = item.image;

  if (!image || shouldUseFallbackArtwork(image)) {
    return (
      <PendingArtwork
        alt={alt}
        eyebrow="Merch"
        label={item.title}
        className={className}
      />
    );
  }

  return (
    <div className={["merch-artwork-frame", className].filter(Boolean).join(" ")}>
      <Image
        src={image}
        alt={alt}
        fill
        sizes={sizes}
        className="merch-artwork-image"
      />
    </div>
  );
}
