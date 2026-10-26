/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/release-audio/only-u": ["./assets/releases/only-u.mp3.enc"],
    "/api/release-audio/vultures": ["./assets/releases/vultures.mp3"],
  },
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  outputFileTracingExcludes: {
    "/": ["./public/**/*", "public/**/*", "**/public/**/*"],
    "/about": ["./public/**/*", "public/**/*", "**/public/**/*"],
    "/merch": ["./public/**/*", "public/**/*", "**/public/**/*"],
    "/music": ["./public/**/*", "public/**/*", "**/public/**/*"],
    "/music/[slug]": ["./public/**/*", "public/**/*", "**/public/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "*.myshopify.com",
      },
    ],
  },
};

module.exports = nextConfig;
