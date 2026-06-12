const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

/** @type {(phase: string) => import('next').NextConfig} */
module.exports = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  reactStrictMode: true,
  experimental: {
    outputFileTracingIgnores: ["**/public/**/*"],
    outputFileTracingExcludes: {
      "/": ["./public/**/*", "public/**/*", "**/public/**/*"],
      "/about": ["./public/**/*", "public/**/*", "**/public/**/*"],
      "/merch": ["./public/**/*", "public/**/*", "**/public/**/*"],
      "/music": ["./public/**/*", "public/**/*", "**/public/**/*"],
      "/music/[slug]": ["./public/**/*", "public/**/*", "**/public/**/*"],
    },
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
});
