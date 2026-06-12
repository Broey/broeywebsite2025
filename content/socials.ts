export type SocialLinkKind = "social" | "streaming" | "community" | "mailing-list" | "shop";

export interface SocialLinkEntry {
  platform: string;
  label: string;
  url: string;
  kind?: SocialLinkKind;
  featured?: boolean;
}

export const socials: SocialLinkEntry[] = [
  {
    platform: "TikTok",
    label: "Broey on TikTok",
    url: "https://tiktok.com/@broeybeats",
    kind: "social",
    featured: true,
  },
  {
    platform: "Instagram",
    label: "Broey on Instagram",
    url: "https://instagram.com/broeybeats",
    kind: "social",
    featured: true,
  },
  {
    platform: "X",
    label: "Broey on X",
    url: "https://x.com/broeybeats",
    kind: "social",
    featured: true,
  },
  {
    platform: "YouTube",
    label: "Broey on YouTube",
    url: "https://www.youtube.com/channel/UCiPFLFHcbBW0RE5oHBPAvAw",
    kind: "social",
    featured: true,
  },
  {
    platform: "Apple Music",
    label: "Broey on Apple Music",
    url: "https://music.apple.com/us/artist/broey/1444936978",
    kind: "streaming",
  },
  {
    platform: "Audius",
    label: "Broey on Audius",
    url: "https://audius.co/broeybeats",
    kind: "streaming",
  },
  {
    platform: "Spotify",
    label: "Broey on Spotify",
    url: "https://open.spotify.com/artist/6HmeISbko4bc0zsZQvIAco?si=k66s5QnrQvejvX6YBZhAZw&dl_branch=1",
    kind: "streaming",
  },
  {
    platform: "SoundCloud",
    label: "Broey on SoundCloud",
    url: "https://soundcloud.com/broeybeats",
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
    url: "https://tidal.com/browse/artist/10677705",
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
    label: "Sign up for Broey.'s Mailing List",
    url: "/#homepage-mailing-list",
    kind: "mailing-list",
  },
];

export const socialByPlatform = (platform: string) =>
  socials.find((entry) => entry.platform === platform);
