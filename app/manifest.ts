import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Broey.",
    short_name: "Broey.",
    description: "Genre-fluid electronic music, selected releases, merch, and community from Broey.",
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
