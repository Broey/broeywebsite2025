import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

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

export const hasApprovedPublicArtwork = (assetPath?: string) =>
  Boolean(assetPath && !shouldUseFallbackArtwork(assetPath));
