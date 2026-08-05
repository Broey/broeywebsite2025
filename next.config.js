/** @type {import('next').NextConfig} */
const nextConfig = {
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
