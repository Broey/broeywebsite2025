export type SocialLinkKind = "social" | "streaming" | "community" | "mailing-list" | "shop";

export interface SocialLinkEntry {
  platform: string;
  label: string;
  url: string;
  kind?: SocialLinkKind;
  featured?: boolean;
}

export const officialArtistProfileUrls = {
  tiktok: "https://tiktok.com/@broeybeats",
  instagram: "https://instagram.com/broeybeats",
  x: "https://x.com/broeybeats",
  youtube: "https://www.youtube.com/channel/UCiPFLFHcbBW0RE5oHBPAvAw",
  appleMusic: "https://music.apple.com/us/artist/broey/1444936978",
  audius: "https://audius.co/broeybeats",
  spotify: "https://open.spotify.com/artist/6HmeISbko4bc0zsZQvIAco",
  soundCloud: "https://soundcloud.com/broeybeats",
  tidal: "https://tidal.com/browse/artist/10677705",
  bandcamp: "https://broey.bandcamp.com/",
} as const;

export const officialArtistSameAs = Object.values(officialArtistProfileUrls);

export const socials: SocialLinkEntry[] = [
  {
    platform: "TikTok",
    label: "Broey on TikTok",
    url: officialArtistProfileUrls.tiktok,
    kind: "social",
    featured: true,
  },
  {
    platform: "Instagram",
    label: "Broey on Instagram",
    url: officialArtistProfileUrls.instagram,
    kind: "social",
    featured: true,
  },
  {
    platform: "X",
    label: "Broey on X",
    url: officialArtistProfileUrls.x,
    kind: "social",
    featured: true,
  },
  {
    platform: "YouTube",
    label: "Broey on YouTube",
    url: officialArtistProfileUrls.youtube,
    kind: "social",
    featured: true,
  },
  {
    platform: "Apple Music",
    label: "Broey on Apple Music",
    url: officialArtistProfileUrls.appleMusic,
    kind: "streaming",
  },
  {
    platform: "Audius",
    label: "Broey on Audius",
    url: officialArtistProfileUrls.audius,
    kind: "streaming",
  },
  {
    platform: "Spotify",
    label: "Broey on Spotify",
    url: officialArtistProfileUrls.spotify,
    kind: "streaming",
  },
  {
    platform: "SoundCloud",
    label: "Broey on SoundCloud",
    url: officialArtistProfileUrls.soundCloud,
    kind: "streaming",
  },
  {
    platform: "SuperCollector",
    label: "Broey on SuperCollector",
    url: "https://release.supercollector.xyz/artist/broey",
    kind: "streaming",
  },
  {
    platform: "TIDAL",
    label: "Broey on TIDAL",
    url: officialArtistProfileUrls.tidal,
    kind: "streaming",
  },
  {
    platform: "Discord",
    label: "Join the Broey. Community",
    url: "https://discord.gg/J5BCTsUuAN",
    kind: "community",
  },
  {
    platform: "Mailing List",
    label: "Sign up for Broey's mailing list",
    url: "/#homepage-mailing-list",
    kind: "mailing-list",
  },
];

export const socialByPlatform = (platform: string) =>
  socials.find((entry) => entry.platform === platform);
