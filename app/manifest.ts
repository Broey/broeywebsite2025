import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Broey.",
    short_name: "Broey.",
    description: "Official Broey site for electronic music, releases, press, merch, and updates.",
    start_url: "/",
    display: "standalone",
    background_color: "#06090d",
    theme_color: "#06090d",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
