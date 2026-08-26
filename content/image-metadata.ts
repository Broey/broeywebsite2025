export type ImageDimensions = {
  width: number;
  height: number;
};

const localImageDimensions: Record<string, ImageDimensions> = {
  "/assets/brand/broey-headshot-2025.jpg": { width: 1440, height: 1800 },
  "/assets/cover-art/4u.jpg": { width: 4320, height: 4320 },
  "/assets/cover-art/4u.png": { width: 1200, height: 1200 },
  "/assets/cover-art/after-you.jpg": { width: 3000, height: 3000 },
  "/assets/cover-art/blu.png": { width: 1200, height: 1200 },
  "/assets/cover-art/counting.png": { width: 3000, height: 3000 },
  "/assets/cover-art/contrast.jpg": { width: 3000, height: 3000 },
  "/assets/cover-art/hold-me-back.jpg": { width: 2977, height: 2977 },
  "/assets/cover-art/dancing-dumpster-fire.jpg": { width: 3000, height: 3000 },
  "/assets/cover-art/dancing-dumpster-fire.png": { width: 1200, height: 1200 },
  "/assets/cover-art/fragments-ep.jpg": { width: 4000, height: 4000 },
  "/assets/cover-art/fragments-ep.png": { width: 1200, height: 1200 },
  "/assets/cover-art/fragments-remixes.jpg": { width: 3000, height: 3000 },
  "/assets/cover-art/fragments-remixes.png": { width: 1200, height: 1200 },
  "/assets/cover-art/free.png": { width: 1200, height: 1200 },
  "/assets/cover-art/glfm.png": { width: 1200, height: 1200 },
  "/assets/cover-art/hold-on.png": { width: 1200, height: 1200 },
  "/assets/cover-art/hysteria.jpg": { width: 3000, height: 3000 },
  "/assets/cover-art/i-cant-wait-for-love.jpg": { width: 3000, height: 3000 },
  "/assets/cover-art/i-cant-wait-for-love.png": { width: 1000, height: 1000 },
  "/assets/cover-art/latest-release.png": { width: 1200, height: 1200 },
  "/assets/cover-art/like-that.jpg": { width: 3000, height: 3000 },
  "/assets/cover-art/link.png": { width: 1200, height: 1200 },
  "/assets/cover-art/mean-something.jpg": { width: 2396, height: 2396 },
  "/assets/cover-art/mean-something.png": { width: 1200, height: 1200 },
  "/assets/cover-art/stereo-luv.png": { width: 1200, height: 1200 },
  "/assets/cover-art/warning.jpg": { width: 1600, height: 1600 },
  "/images/merch/beats-hoodie.jpg": { width: 1200, height: 1200 },
};

export function imageDimensionsForPath(path: string): ImageDimensions | undefined {
  return localImageDimensions[path];
}
