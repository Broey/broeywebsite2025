// Distributor details supplied by the artist on October 12, 2026.
// Midnight Eastern confirmed by the artist on October 12, 2026.
export const onlyUCampaign = {
  slug: "only-u",
  title: "OnlyU",
  artist: "Just A Gent, Broey.",
  releaseAt: "2026-10-15T00:00:00-04:00",
  releaseDate: "2026-10-15",
  presaveUrl: "https://bfan.link/onlyustores",
  campaign: "only_u_2026_10_15",
  duration: "3:18.947",
  label: "Just A Gent",
  upc: "3618114985136",
  isrc: "FR-X45-26-45232",
  catalogNumber: "BL1392272",
  spotifyTrackUri: "spotify:track:1sAyb06cJiHKPm18gc2fWN",
  // Official smartlink destinations, supplemented by exact ISRC matches from
  // TIDAL and Deezer on October 14, 2026. Regional playback may unlock later.
  stores: [
    { platform: "Spotify", url: "https://open.spotify.com/album/3ZMHlWgHbaboU9PlbvgUcf" },
    { platform: "Apple Music", url: "https://music.apple.com/song/6807108702" },
    { platform: "iTunes", url: "https://geo.itunes.apple.com/au/album/id6807108697?at=1l3v9Tx&app=itunes" },
    { platform: "VK Music", url: "https://music.vk.com/link/s2lEy" },
    { platform: "YouTube Music", url: "https://music.youtube.com/playlist?list=OLAK5uy_mWs3a3oqE7aP5fsgzFLPddpMCovgKMGWk" },
    { platform: "YouTube", url: "https://www.youtube.com/playlist?list=OLAK5uy_mWs3a3oqE7aP5fsgzFLPddpMCovgKMGWk" },
    { platform: "Amazon Music", url: "https://music.amazon.fr/albums/B0HHB16N45?ref=dm_ff_amazonmusic_3p" },
    { platform: "TIDAL", url: "https://tidal.com/browse/track/550245641" },
    { platform: "Deezer", url: "https://www.deezer.com/track/4209089652" },
    { platform: "All platforms", url: "https://bfan.link/onlyustores" },
  ],
} as const;

export function isOnlyUReleased(now = Date.now()) {
  return now >= Date.parse(onlyUCampaign.releaseAt);
}

export function campaignUrl(url: string, surface: string) {
  const destination = new URL(url);
  destination.searchParams.set("utm_source", "broey.net");
  destination.searchParams.set("utm_medium", "website");
  destination.searchParams.set("utm_campaign", onlyUCampaign.campaign);
  destination.searchParams.set("utm_content", surface);
  return destination.toString();
}

export function onlyUCountdown(now: number) {
  const seconds = Math.max(0, Math.ceil((Date.parse(onlyUCampaign.releaseAt) - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds % 60).padStart(2, "0")}s`;
}
