export type ReleaseType = "single" | "ep" | "remix" | "mix" | "set";

export type ExternalLinkKind =
  | "streaming"
  | "disco"
  | "video"
  | "download"
  | "promo"
  | "social"
  | "shop";

export type ReleaseVerificationStatus =
  | "verified"
  | "source-backed"
  | "manual-review"
  | "unverified";

export type ReleaseMetadataStatus =
  | "verified"
  | "source-backed"
  | "manual-review"
  | "draft"
  | "unverified";

export type ExternalLink = {
  label: string;
  platform: string;
  url: string;
  kind: ExternalLinkKind;
  primary?: boolean;
  source?: string;
  sourceUrl?: string;
  confidence?: ReleaseVerificationStatus;
  verificationNotes?: string;
  resolvedFromSmartLink?: boolean;
};

export type ReleaseEmbedProvider = "disco" | "soundcloud" | "youtube" | "spotify";
export type ReleaseVisibility = "draft" | "public";
export type ReleaseIndexing = "index" | "noindex" | "internal";
export type ReleaseCatalogStatus = "tidal" | "manual" | "pending-tidal" | "draft";
export type ReleaseSuggestedTileType = "collectionTile" | "singleTile" | "trackTile";
export type ReleaseListenActionKind = "external" | "disco-embed" | "local-audio";

export type ReleaseCatalogSource = {
  provider?: string;
  source: string;
  sourceUrl?: string;
  tidalId?: string;
  externalIds?: Record<string, string>;
  artistName?: string;
  collectionName?: string;
  collectionType?: "Album" | "EP" | "Single" | "Remix" | "Unknown" | "Track";
  isCollection?: boolean;
  suggestedTileType?: ReleaseSuggestedTileType;
  artworkUrl?: string;
  trackCount?: number;
  rawKind?: string;
  parentCollection?: {
    title?: string;
    slug?: string;
  };
};

export type ReleaseEmbed = {
  provider: ReleaseEmbedProvider;
  src?: string;
  embedUrl?: string;
  externalUrl?: string;
  title: string;
  label?: string;
  height?: number;
  lazy?: boolean;
  disco?: {
    trackId?: string;
    width?: number | "100%";
    height?: number;
    theme?: "light" | "dark" | "white";
    controlColor?: string;
    downloadsEnabled?: boolean;
    artworkEnabled?: boolean;
  };
};

export type ReleaseListenAction = {
  kind: ReleaseListenActionKind;
  label?: string;
  provider?: string;
  url?: string;
  embedUrl?: string;
  audioSrc?: string;
};

export type ReleaseAudioTrack = {
  title: string;
  slug?: string;
  audioKey?: string;
  artist?: string;
  duration?: string;
  src: string;
};

export type ReleaseAudio = {
  type: "single" | "project";
  title?: string;
  artist?: string;
  artwork?: string;
  tracks: ReleaseAudioTrack[];
};

export type ReleaseCredit = {
  role: string;
  name: string;
  source?: string;
  sourceUrl?: string;
  confidence?: ReleaseVerificationStatus;
  verificationNotes?: string;
  publishApproved?: boolean;
};

export type ReleaseDetail = {
  label: string;
  value: string;
};

export type ReleaseEntry = {
  title: string;
  slug: string;
  type: ReleaseType;
  visibility?: ReleaseVisibility;
  indexing?: ReleaseIndexing;
  metadataStatus?: ReleaseMetadataStatus;
  verificationStatus?: ReleaseVerificationStatus;
  year?: number;
  releaseDate?: string;
  displayDate?: string;
  originalReleaseDate?: string;
  dspReleaseDate?: string;
  dateSource?: string;
  dateConfidence?: ReleaseVerificationStatus;
  dateNotes?: string;
  artistName?: string;
  description: string;
  about?: string | string[];
  tags?: string[];
  credits?: ReleaseCredit[];
  details?: ReleaseDetail[];
  tracklist?: Array<
    | string
    | {
        title: string;
        slug?: string;
        audioKey?: string;
        artist?: string;
        duration?: string;
      }
  >;
  mood?: string;
  seoTitle?: string;
  seoDescription?: string;
  coverImage?: string;
  coverAlt?: string;
  audioPreview?: string;
  audio?: ReleaseAudio;
  links: ExternalLink[];
  platformLinks?: ExternalLink[];
  disco?: {
    publicUrl?: string;
    privateShareUrl?: string;
    promoUrl?: string;
    downloadUrl?: string;
  };
  embed?: ReleaseEmbed;
  listenAction?: ReleaseListenAction;
  catalogSource?: ReleaseCatalogSource;
  catalogStatus?: ReleaseCatalogStatus;
  carouselEnabled?: boolean;
  carouselPriority?: number;
  featured?: boolean;
  parentReleaseSlug?: string;
  isProjectTrack?: boolean;
  showInArchive?: boolean;
  showInSitemap?: boolean;
  isFocusTrack?: boolean;
};

const link = (
  platform: string,
  url: string,
  kind: ExternalLinkKind = "streaming",
  primary = true,
): ExternalLink => ({
  label: platform,
  platform,
  url,
  kind,
  primary,
});

const localAudio = (
  title: string,
  src: string,
  duration: string,
  artist = "Broey.",
): ReleaseAudio => ({
  type: "single",
  tracks: [
    {
      title,
      artist,
      duration,
      src,
    },
  ],
});

export const releases: ReleaseEntry[] = (([
  {
    title: "LiNK",
    slug: "link",
    type: "single",
    year: 2025,
    description:
      "Glossy electronic pressure with late-night momentum.",
    mood: "Glossy electronic pressure with late-night momentum.",
    tags: ["Electronic", "Late-night", "Disco preview"],
    seoTitle: "LiNK by Broey.",
    seoDescription:
      "Listen to LiNK by Broey., with official release details, artwork, and listening links.",
    coverImage: "/assets/cover-art/link.png",
    coverAlt: "LiNK by Broey. cover art",
    audio: localAudio("LiNK (Radio Edit)", "/audio/link-radio-edit.mp3", "5:07"),
    links: [
      link(
        "Disco",
        "https://broeybeats.disco.ac/e/t/199920329?s=wxTEgXu5BYAOwfQ056jIjaSauVA%3AZZwg3MNV&artwork=false&color=%234E98FF&theme=dark",
        "disco",
      ),
    ],
    embed: {
      provider: "disco",
      title: "LiNK by Broey.",
      embedUrl:
        "https://broeybeats.disco.ac/e/t/199920329?s=wxTEgXu5BYAOwfQ056jIjaSauVA%3AZZwg3MNV&artwork=false&color=%234E98FF&theme=dark",
      height: 235,
      lazy: true,
      disco: {
        trackId: "199920329",
        width: 480,
        height: 235,
        theme: "dark",
        controlColor: "#4E98FF",
        artworkEnabled: false,
        downloadsEnabled: false,
      },
    },
    catalogStatus: "pending-tidal",
    carouselEnabled: true,
    carouselPriority: 1,
    featured: true,
  },
  {
    title: "STEREO LUV",
    slug: "stereo-luv",
    type: "single",
    year: 2025,
    releaseDate: "2025-00-00",
    description:
      "A dance-focused single built around motion, feeling, and stereo-wide club energy.",
    mood: "Motion, feeling, and stereo-wide club energy.",
    tags: ["Electronic", "Dance", "Club energy"],
    seoTitle: "STEREO LUV by Broey.",
    seoDescription:
      "Listen to STEREO LUV by Broey., a dance-focused single built around motion, feeling, and stereo-wide club energy.",
    coverImage: "/assets/cover-art/stereo-luv.png",
    coverAlt: "STEREO LUV cover art",
    audio: localAudio("STEREO LUV", "/audio/stereo-luv.mp3", "5:12"),
    links: [
      link(
        "Spotify",
        "https://open.spotify.com/album/2XU1WGtc5BbePITaatGe9D",
        "streaming",
        false,
      ),
      link("Create Music", "https://createmusic.fm/stereoluv"),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/stereo-luv-single/1837799560",
        "streaming",
        false,
      ),
      link(
        "YouTube",
        "https://www.youtube.com/playlist?list=OLAK5uy_lZCSeRIHh032U7XfC86Ih33UFgRZ4R-Mg",
        "streaming",
        false,
      ),
      link("TIDAL", "https://tidal.com/album/458541065", "streaming", false),
      link(
        "Bandcamp",
        "https://broey.bandcamp.com/track/stereo-luv",
        "streaming",
        false,
      ),
      link(
        "SoundCloud",
        "https://soundcloud.com/broeybeats/stereo-luv-1",
        "streaming",
        false,
      ),
      link(
        "Amazon Music",
        "https://music.amazon.com/albums/B0FPTB7TQR",
        "streaming",
        false,
      ),
      link("Deezer", "https://www.deezer.com/album/816347021", "streaming", false),
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/458541065",
      tidalId: "458541065",
      externalIds: {
        "tidal": "458541065",
      },
      artistName: "Broey.",
      collectionName: "STEREO LUV",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      trackCount: 1,
      rawKind: "albums",
    },
    carouselEnabled: true,
    carouselPriority: 3,
    embed: {
      provider: "disco",
      title: "STEREO LUV by Broey.",
      label: "STEREO LUV",
      src:
        "https://broeybeats.disco.ac/e/t/163013451?s=TnGWrsfeaxB9JWQ4l7vy2UFr35Q%3AwFcVLOEG&artwork=false&color=%234E98FF&theme=dark",
      embedUrl:
        "https://broeybeats.disco.ac/e/t/163013451?s=-iKLOiEjvYkHdhylWiKgVOaNsfo%3AQsm0RJkf&artwork=false&color=%234E98FF&theme=dark",
      height: 235,
      lazy: true,
      disco: {
        trackId: "163013451",
        width: 480,
        height: 235,
        theme: "dark",
        controlColor: "#4E98FF",
        artworkEnabled: false,
        downloadsEnabled: false,
      },
    },
    featured: false,
  },
  {
    title: "FREE",
    slug: "free",
    type: "single",
    year: 2026,
    releaseDate: "2026-05-07",
    description:
      "A direct, club-facing single from Broey.'s current electronic era: concise, emotional, and built for motion.",
    mood: "Concise, emotional, and built for motion.",
    tags: ["Electronic", "House", "Club-facing"],
    seoTitle: "FREE by Broey.",
    seoDescription:
      "Listen to FREE by Broey., a direct club-facing single from the current electronic era.",
    coverImage: "/assets/cover-art/free.png",
    coverAlt: "FREE by Broey. cover art",
    audio: localAudio("FREE", "/audio/free.mp3", "3:51"),
    links: [
      link(
        "Disco",
        "https://broeybeats.disco.ac/e/t/198818529?s=mIqIdkYOAHpGj60mv1ub4FxUxCQ%3AknM749BX&artwork=false&color=%234E98FF&theme=dark",
        "disco",
      ),
      link(
        "Spotify",
        "https://open.spotify.com/album/5bLOPMvddqpng76Lj5ZRKt",
        "streaming",
        false,
      ),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/free-single/1892157471",
        "streaming",
        false,
      ),
      link(
        "YouTube",
        "https://www.youtube.com/watch?v=3Ee5ewA2MiQ",
        "streaming",
        false,
      ),
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/514645954",
      tidalId: "514645954",
      externalIds: {
        "tidal": "514645954",
      },
      artistName: "Broey.",
      collectionName: "FREE",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      trackCount: 1,
      rawKind: "albums",
    },
    carouselEnabled: true,
    carouselPriority: 2,
    embed: {
      provider: "disco",
      title: "FREE by Broey.",
      embedUrl:
        "https://broeybeats.disco.ac/e/t/198818529?s=mIqIdkYOAHpGj60mv1ub4FxUxCQ%3AknM749BX&artwork=false&color=%234E98FF&theme=dark",
      height: 235,
      lazy: true,
      disco: {
        trackId: "198818529",
        width: 480,
        height: 235,
        theme: "dark",
        controlColor: "#4E98FF",
        artworkEnabled: false,
        downloadsEnabled: false,
      },
    },
    featured: false,
  },
  {
    title: "dancing dumpster fire",
    slug: "dancing-dumpster-fire",
    type: "ep",
    year: 2025,
    releaseDate: "2025-00-00",
    description:
      "A raw, emotionally driven release built from older ideas Broey. chose to let exist instead of over-polish. The project captures the current era at its most honest: imperfect, energetic, melodic, and alive.",
    mood: "Imperfect, energetic, melodic, and alive.",
    tags: ["EP", "Club", "Raw electronic"],
    seoTitle: "dancing dumpster fire by Broey.",
    seoDescription:
      "Listen to dancing dumpster fire by Broey., a raw, emotionally driven release from the current era.",
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: {
      type: "project",
      title: "dancing dumpster fire",
      artist: "Broey.",
      artwork: "/assets/cover-art/dancing-dumpster-fire.jpg",
      tracks: [
        {
          title: "shake!",
          slug: "shake",
          audioKey: "shake",
          artist: "Broey.",
          duration: "3:51",
          src: "/audio/shake.mp3",
        },
        {
          title: "old fashion",
          slug: "old-fashion",
          audioKey: "old-fashion",
          artist: "Broey.",
          duration: "3:03",
          src: "/audio/old-fashion.mp3",
        },
        {
          title: "lil luv",
          slug: "lil-luv",
          audioKey: "lil-luv",
          artist: "Broey.",
          duration: "2:22",
          src: "/audio/lil-luv.mp3",
        },
        {
          title: "brainrot (feat. Vivid Fever Dreams)",
          slug: "brainrot",
          audioKey: "brainrot",
          artist: "Broey. & Vivid Fever Dreams",
          duration: "3:37",
          src: "/audio/brainrot.mp3",
        },
        {
          title: "GLFM",
          slug: "glfm",
          audioKey: "glfm",
          artist: "Broey.",
          duration: "3:30",
          src: "/audio/glfm.mp3",
        },
        {
          title: "i can do better (broey. remix)",
          slug: "i-can-do-better-broey-remix",
          audioKey: "i-can-do-better-broey-remix",
          artist: "Dreameater, Broken Blythe & Broey.",
          duration: "3:15",
          src: "/audio/i-can-do-better-broey-remix.mp3",
        },
        {
          title: "4u vip",
          slug: "4u-vip",
          audioKey: "4u-vip",
          artist: "Broey. & notminimal.",
          duration: "2:22",
          src: "/audio/4u-vip.mp3",
        },
      ],
    },
    links: [
      link("Spotify", "https://open.spotify.com/album/1oZeVU9ghK6owsQFnYDPdY"),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/dancing-dumpster-fire/1820012666",
        "streaming",
        false,
      ),
      link(
        "YouTube",
        "https://www.youtube.com/playlist?list=OLAK5uy_m1ZFQYUjx7bDctJFqND7L75hIfmfYG-_w",
        "streaming",
        false,
      ),
      link(
        "Bandcamp",
        "https://broey.bandcamp.com/album/dancing-dumpster-fire",
        "streaming",
        false,
      ),
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/441546103",
      tidalId: "441546103",
      externalIds: {
        "tidal": "441546103",
      },
      artistName: "Broey.",
      collectionName: "dancing dumpster fire",
      collectionType: "EP",
      isCollection: true,
      suggestedTileType: "collectionTile",
      trackCount: 7,
      rawKind: "albums",
    },
    tracklist: [
      { title: "shake!", slug: "shake", audioKey: "shake" },
      { title: "old fashion", slug: "old-fashion", audioKey: "old-fashion" },
      { title: "lil luv", slug: "lil-luv", audioKey: "lil-luv" },
      {
        title: "brainrot (feat. Vivid Fever Dreams)",
        slug: "brainrot",
        audioKey: "brainrot",
      },
      { title: "GLFM", slug: "glfm", audioKey: "glfm" },
      {
        title: "i can do better (broey. remix)",
        slug: "i-can-do-better-broey-remix",
        audioKey: "i-can-do-better-broey-remix",
      },
      { title: "4u vip", slug: "4u-vip", audioKey: "4u-vip" },
    ],
    embed: {
      provider: "disco",
      title: "dancing dumpster fire by Broey.",
      src: "https://broeybeats.disco.ac/e/p/21737356?download=false&s=fx4DjEYWTZcHY60Xbdg6QBSSqRk%3AJcrwEkwq&artwork=false&color=%234E98FF&theme=dark",
      embedUrl: "https://broeybeats.disco.ac/e/p/21737356?download=false&s=fx4DjEYWTZcHY60Xbdg6QBSSqRk%3AJcrwEkwq&artwork=false&color=%234E98FF&theme=dark",
      height: 395,
      lazy: true,
      disco: {
        trackId: "21737356",
        width: 480,
        height: 395,
        theme: "dark",
        controlColor: "#4E98FF",
        artworkEnabled: false,
        downloadsEnabled: false,
      },
    },
    carouselEnabled: true,
    carouselPriority: 6,
  },
  {
    title: "shake!",
    slug: "shake",
    parentReleaseSlug: "dancing-dumpster-fire",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    year: 2025,
    description:
      "A dancing dumpster fire cut with bright motion, quick bounce, and restless club energy.",
    mood: "Bright motion with quick bounce and restless club energy.",
    tags: ["dancing dumpster fire", "Club", "Electronic"],
    seoTitle: "shake! by Broey.",
    seoDescription: "Listen to shake! by Broey.",
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: localAudio("shake!", "/audio/shake.mp3", "3:51"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "old fashion",
    slug: "old-fashion",
    parentReleaseSlug: "dancing-dumpster-fire",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    year: 2025,
    description:
      "A dancing dumpster fire cut with crisp percussion, loose club swing, and bright synth movement.",
    mood: "Loose club swing with bright synth movement.",
    tags: ["dancing dumpster fire", "Club", "Electronic"],
    seoTitle: "old fashion by Broey.",
    seoDescription: "Listen to old fashion by Broey.",
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: localAudio("old fashion", "/audio/old-fashion.mp3", "3:03"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "lil luv",
    slug: "lil-luv",
    parentReleaseSlug: "dancing-dumpster-fire",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    year: 2025,
    description:
      "A compact dancing dumpster fire cut with playful melodic color and a quick electronic pulse.",
    mood: "Playful melodic color with a quick electronic pulse.",
    tags: ["dancing dumpster fire", "Electronic", "Single"],
    seoTitle: "lil luv by Broey.",
    seoDescription: "Listen to lil luv by Broey.",
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: localAudio("lil luv", "/audio/lil-luv.mp3", "2:22"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "brainrot",
    slug: "brainrot",
    parentReleaseSlug: "dancing-dumpster-fire",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    year: 2025,
    artistName: "Broey. & Vivid Fever Dreams",
    description:
      "A Broey. and Vivid Fever Dreams collaboration from dancing dumpster fire with restless, high-color motion.",
    mood: "Restless high-color motion with collaborative edge.",
    tags: ["dancing dumpster fire", "Collaboration", "Club"],
    seoTitle: "brainrot by Broey. and Vivid Fever Dreams",
    seoDescription: "Listen to brainrot by Broey. and Vivid Fever Dreams.",
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: localAudio("brainrot", "/audio/brainrot.mp3", "3:37", "Broey. & Vivid Fever Dreams"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "i can do better (broey. remix)",
    slug: "i-can-do-better-broey-remix",
    parentReleaseSlug: "dancing-dumpster-fire",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2025,
    artistName: "Dreameater, Broken Blythe & Broey.",
    description:
      "Broey.'s remix of i can do better, shaped into a compact dancing dumpster fire club cut.",
    mood: "A compact remix with club pressure and bright movement.",
    tags: ["dancing dumpster fire", "Remix", "Club"],
    seoTitle: "i can do better (broey. remix)",
    seoDescription: "Listen to i can do better (broey. remix).",
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: localAudio(
      "i can do better (broey. remix)",
      "/audio/i-can-do-better-broey-remix.mp3",
      "3:15",
      "Dreameater, Broken Blythe & Broey.",
    ),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "4u vip",
    slug: "4u-vip",
    parentReleaseSlug: "dancing-dumpster-fire",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2025,
    artistName: "Broey. & notminimal.",
    description:
      "A tighter VIP version of 4u from dancing dumpster fire, with sharpened bass movement and quick club pressure.",
    mood: "Sharpened bass movement with quick club pressure.",
    tags: ["dancing dumpster fire", "VIP", "Club"],
    seoTitle: "4u vip by Broey. and notminimal.",
    seoDescription: "Listen to 4u vip by Broey. and notminimal.",
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: localAudio("4u vip", "/audio/4u-vip.mp3", "2:22", "Broey. & notminimal."),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "I Can't Wait For Love",
    slug: "i-cant-wait-for-love",
    type: "single",
    year: 2024,
    description:
      "A collaborative electronic single with Broken Blythe that connects Broey.'s emotive dance direction with vocal/song-driven energy.",
    mood: "Emotive dance direction with vocal/song-driven energy.",
    artistName: "Broey. and Broken Blythe",
    tags: ["Melodic", "Dance", "Collaboration"],
    seoTitle: "I Can't Wait For Love by Broey. and Broken Blythe",
    seoDescription:
      "Listen to I Can't Wait For Love by Broey. and Broken Blythe, a collaborative electronic single with vocal/song-driven energy.",
    coverImage: "/assets/cover-art/i-cant-wait-for-love.png",
    coverAlt: "I Can't Wait For Love cover art",
    audio: localAudio(
      "I Can't Wait For Love",
      "/audio/i-cant-wait-for-love.mp3",
      "3:39",
      "Broey. and Broken Blythe",
    ),
    links: [
      link(
        "Create Music",
        "https://createmusic.fm/icantwaitforlove?utm_source=newsletter&utm_medium=email&utm_term=2025-05-15&utm_campaign=Hey%20it%20s%20me%20Broey%20",
      ),
      link(
        "Spotify",
        "https://open.spotify.com/album/2nqHG03NQFtKUm4grl9DAj",
        "streaming",
        false,
      ),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/i-cant-wait-for-love-single/1805900957",
        "streaming",
        false,
      ),
      link(
        "YouTube",
        "https://www.youtube.com/playlist?list=OLAK5uy_kTPixthtQQRfkfKQKndRzlBGOCr-0cbKo",
        "streaming",
        false,
      ),
      link(
        "TIDAL",
        "https://tidal.com/browse/album/427566340",
        "streaming",
        false,
      ),
      link(
        "SoundCloud",
        "https://soundcloud.com/broeybeats/i-cant-wait-for-love",
        "streaming",
        false,
      ),
      link(
        "Amazon Music",
        "https://music.amazon.com/albums/B0F39J9X94",
        "streaming",
        false,
      ),
      link("Deezer", "https://www.deezer.com/album/736193071", "streaming", false),
    ],
  },
  {
    title: "Fragments",
    slug: "fragments-ep",
    type: "ep",
    year: 2024,
    releaseDate: "2024-00-00",
    description:
      "A six-track statement that turns Broey.'s lofi instincts toward house, processed vocals, saxophone, breakbeats, bass movement, and textured dance music.",
    mood: "House, processed vocals, saxophone, breakbeats, bass movement, and textured dance music.",
    tags: ["EP", "House", "Breakbeats"],
    seoTitle: "Fragments by Broey.",
    seoDescription:
      "Listen to Fragments by Broey., a turning-point release of house, processed vocals, saxophone, breakbeats, bass movement, and textured dance music.",
    coverImage: "/assets/cover-art/fragments-ep.jpg",
    coverAlt: "Fragments cover art",
    audio: {
      type: "project",
      title: "Fragments",
      artist: "Broey.",
      artwork: "/assets/cover-art/fragments-ep.jpg",
      tracks: [
        {
          title: "Like That",
          artist: "Broey.",
          duration: "2:32",
          src: "/audio/like-that.mp3",
        },
        {
          title: "Run For Cover",
          artist: "Broey.",
          duration: "2:34",
          src: "/audio/run-for-cover.mp3",
        },
        {
          title: "Wanted",
          artist: "Broey.",
          duration: "3:38",
          src: "/audio/wanted.mp3",
        },
        {
          title: "Numbers",
          artist: "Broey.",
          duration: "4:40",
          src: "/audio/numbers.mp3",
        },
        {
          title: "Breathing Room (feat. Vivid Fever Dreams)",
          artist: "Broey. & Vivid Fever Dreams",
          duration: "5:55",
          src: "/audio/breathing-room.mp3",
        },
        {
          title: "Eyes On Me",
          artist: "Broey.",
          duration: "4:30",
          src: "/audio/eyes-on-me.mp3",
        },
      ],
    },
    links: [
      link("Create Music", "https://createmusic.fm/fragments"),
      link(
        "Spotify",
        "https://open.spotify.com/album/5HzzutixZ8qVwIqUdhrRe7",
        "streaming",
        false,
      ),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/fragments-ep/1729476600",
        "streaming",
        false,
      ),
      link("TIDAL", "https://tidal.com/album/344095853", "streaming", false),
      link(
        "SoundCloud",
        "https://soundcloud.com/broeybeats/sets/fragments-807582035",
        "streaming",
        false,
      ),
      link(
        "Amazon Music",
        "https://music.amazon.com/albums/B0CV4MNZJV",
        "streaming",
        false,
      ),
      link("Deezer", "https://www.deezer.com/album/544619982", "streaming", false),
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/344095853",
      tidalId: "344095853",
      externalIds: {
        "tidal": "344095853",
      },
      artistName: "Broey.",
      collectionName: "Fragments",
      collectionType: "EP",
      isCollection: true,
      suggestedTileType: "collectionTile",
      trackCount: 6,
      rawKind: "albums",
    },
    tracklist: [
      "Like That",
      "Run For Cover",
      "Wanted",
      "Numbers",
      "Breathing Room (feat. Vivid Fever Dreams)",
      "Eyes On Me",
    ],
    carouselEnabled: true,
    carouselPriority: 5,
  },
  {
    title: "Run For Cover",
    slug: "run-for-cover",
    parentReleaseSlug: "fragments-ep",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    year: 2024,
    description:
      "A Fragments-era Broey. track with quick melodic motion and crisp electronic pressure.",
    mood: "Quick melodic motion with crisp electronic pressure.",
    tags: ["Fragments", "Electronic", "Single"],
    seoTitle: "Run For Cover by Broey.",
    seoDescription: "Listen to Run For Cover by Broey.",
    coverImage: "/assets/cover-art/fragments-ep.jpg",
    coverAlt: "Fragments cover art",
    audio: localAudio("Run For Cover", "/audio/run-for-cover.mp3", "2:34"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Wanted",
    slug: "wanted",
    parentReleaseSlug: "fragments-ep",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    year: 2024,
    description:
      "A Fragments-era Broey. track with direct tension, clean percussion, and late-night melodic lift.",
    mood: "Direct tension with clean percussion and melodic lift.",
    tags: ["Fragments", "Electronic", "Single"],
    seoTitle: "Wanted by Broey.",
    seoDescription: "Listen to Wanted by Broey.",
    coverImage: "/assets/cover-art/fragments-ep.jpg",
    coverAlt: "Fragments cover art",
    audio: localAudio("Wanted", "/audio/wanted.mp3", "3:38"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Numbers",
    slug: "numbers",
    parentReleaseSlug: "fragments-ep",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    year: 2024,
    description:
      "A Fragments-era Broey. track built from clean rhythmic movement and glowing synth detail.",
    mood: "Clean rhythmic movement with glowing synth detail.",
    tags: ["Fragments", "Electronic", "Single"],
    seoTitle: "Numbers by Broey.",
    seoDescription: "Listen to Numbers by Broey.",
    coverImage: "/assets/cover-art/fragments-ep.jpg",
    coverAlt: "Fragments cover art",
    audio: localAudio("Numbers", "/audio/numbers.mp3", "4:40"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Breathing Room",
    slug: "breathing-room",
    parentReleaseSlug: "fragments-ep",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    year: 2024,
    artistName: "Broey. & Vivid Fever Dreams",
    description:
      "A Broey. and Vivid Fever Dreams collaboration with open melodic space and a slow-blooming pulse.",
    mood: "Open melodic space with a slow-blooming pulse.",
    tags: ["Fragments", "Collaboration", "Electronic"],
    seoTitle: "Breathing Room by Broey. and Vivid Fever Dreams",
    seoDescription: "Listen to Breathing Room by Broey. and Vivid Fever Dreams.",
    coverImage: "/assets/cover-art/fragments-ep.jpg",
    coverAlt: "Fragments cover art",
    audio: localAudio("Breathing Room", "/audio/breathing-room.mp3", "5:55", "Broey. & Vivid Fever Dreams"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Eyes On Me",
    slug: "eyes-on-me",
    parentReleaseSlug: "fragments-ep",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    year: 2024,
    description:
      "A Fragments-era Broey. track with bright vocal pressure and glossy late-night movement.",
    mood: "Bright vocal pressure with glossy late-night movement.",
    tags: ["Fragments", "Electronic", "Single"],
    seoTitle: "Eyes On Me by Broey.",
    seoDescription: "Listen to Eyes On Me by Broey.",
    coverImage: "/assets/cover-art/fragments-ep.jpg",
    coverAlt: "Fragments cover art",
    audio: localAudio("Eyes On Me", "/audio/eyes-on-me.mp3", "4:30"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "4u",
    slug: "4u",
    type: "single",
    year: 2024,
    releaseDate: "2024-00-00",
    description:
      "A collaboration with notminimal. that bridges Broey.'s emotional production style with a deeper, dance-focused pulse.",
    mood: "Emotional production with a deeper, dance-focused pulse.",
    tags: ["Collaboration", "Bass", "Dance"],
    seoTitle: "4u by Broey. and notminimal.",
    seoDescription:
      "Listen to 4u by Broey. and notminimal., a collaboration with emotional production and a deeper dance-focused pulse.",
    coverImage: "/assets/cover-art/4u.jpg",
    coverAlt: "4u cover art",
    audio: localAudio("4u", "/audio/4u.mp3", "3:19", "Broey. & notminimal."),
    links: [
      link("Create Music", "https://createmusic.fm/4u"),
      link(
        "Spotify",
        "https://open.spotify.com/album/0lvaKQqHglh6aHU78gB42M",
        "streaming",
        false,
      ),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/4u-single/1752540493",
        "streaming",
        false,
      ),
      link(
        "YouTube",
        "https://www.youtube.com/watch?v=gG9b17Y-GEI",
        "streaming",
        false,
      ),
      link("TIDAL", "https://tidal.com/album/369907613", "streaming", false),
      link(
        "SoundCloud",
        "https://soundcloud.com/broeybeats/4u",
        "streaming",
        false,
      ),
      link(
        "Amazon Music",
        "https://music.amazon.com/albums/B0D79Q4ZHS",
        "streaming",
        false,
      ),
      link("Deezer", "https://www.deezer.com/album/602990992", "streaming", false),
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/369907613",
      tidalId: "369907613",
      externalIds: {
        "tidal": "369907613",
      },
      artistName: "Broey. & notminimal.",
      collectionName: "4u",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      trackCount: 1,
      rawKind: "albums",
    },
    carouselEnabled: true,
    carouselPriority: 9,
  },
  {
    title: "Mean Something",
    slug: "mean-something",
    type: "single",
    year: 2025,
    releaseDate: "2025-00-00",
    description:
      "A reflective electronic single centered on emotional weight, melody, and Broey.'s songwriter-producer identity.",
    mood: "Emotional weight, melody, and songwriter-producer identity.",
    tags: ["Melodic", "Emotional", "Electronic"],
    seoTitle: "Mean Something by Broey.",
    seoDescription:
      "Listen to Mean Something by Broey., a reflective electronic single centered on emotional weight and melody.",
    coverImage: "/assets/cover-art/mean-something.jpg",
    coverAlt: "Mean Something cover art",
    audio: localAudio("Mean Something", "/audio/mean-something.mp3", "4:31"),
    links: [
      link("Create Music", "https://createmusic.fm/meansomething"),
      link(
        "Spotify",
        "https://open.spotify.com/album/1IOco7DVpyPuePje8qZEnZ",
        "streaming",
        false,
      ),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/mean-something-single/1772176805",
        "streaming",
        false,
      ),
      link(
        "YouTube",
        "https://www.youtube.com/playlist?list=OLAK5uy_lC7gQTFNkQwzWg71HTs0ImdvRNopbySEg",
        "streaming",
        false,
      ),
      link("TIDAL", "https://tidal.com/album/391217958", "streaming", false),
      link(
        "SoundCloud",
        "https://soundcloud.com/broeybeats/mean-something-1",
        "streaming",
        false,
      ),
      link(
        "Amazon Music",
        "https://music.amazon.com/albums/B0DJG8W8WY",
        "streaming",
        false,
      ),
      link("Deezer", "https://www.deezer.com/album/651735401", "streaming", false),
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/391217958",
      tidalId: "391217958",
      externalIds: {
        "tidal": "391217958",
      },
      artistName: "Broey.",
      collectionName: "Mean Something",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      trackCount: 1,
      rawKind: "albums",
    },
    carouselEnabled: true,
    carouselPriority: 8,
  },
  {
    title: "Fragments (Remixes)",
    slug: "fragments-remixes",
    type: "remix",
    year: 2024,
    releaseDate: "2024-00-00",
    description:
      "A remix companion that opens the Fragments world to outside producers while keeping Broey.'s emotional dance DNA intact.",
    mood: "Outside-producer remixes with Broey.'s emotional dance DNA intact.",
    tags: ["Remixes", "Textural", "Electronic"],
    seoTitle: "Fragments (Remixes) by Broey.",
    seoDescription:
      "Listen to Fragments (Remixes) by Broey., a remix companion that opens the Fragments world to outside producers.",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: {
      type: "project",
      title: "Fragments (Remixes)",
      artist: "Broey.",
      artwork: "/assets/cover-art/fragments-remixes.jpg",
      tracks: [
        {
          title: "Numbers (tom_ecko Remix)",
          artist: "Broey.",
          duration: "2:23",
          src: "/audio/numbers-tom-ecko-remix.mp3",
        },
        {
          title: "Eyes On Me (dreamsuite Remix)",
          artist: "Broey.",
          duration: "2:39",
          src: "/audio/eyes-on-me-dreamsuite-remix.mp3",
        },
        {
          title: "Like That (notminimal. Remix)",
          artist: "Broey.",
          duration: "3:25",
          src: "/audio/like-that-notminimal-remix.mp3",
        },
        {
          title: "Wanted (Almost Anyone Remix)",
          artist: "Broey.",
          duration: "5:08",
          src: "/audio/wanted-almost-anyone-remix.mp3",
        },
        {
          title: "Eyes On Me (Vivid Fever Dreams Remix)",
          artist: "Broey.",
          duration: "3:35",
          src: "/audio/eyes-on-me-vivid-fever-dreams-remix.mp3",
        },
        {
          title: "Wanted (Kaiyo Remix)",
          artist: "Broey.",
          duration: "3:04",
          src: "/audio/wanted-kaiyo-remix.mp3",
        },
        {
          title: "Eyes On Me (exmaxhina Remix)",
          artist: "Broey.",
          duration: "4:22",
          src: "/audio/eyes-on-me-exmaxhina-remix.mp3",
        },
      ],
    },
    links: [
      link(
        "Spotify",
        "https://open.spotify.com/album/0I3culeJDMjf1rIcl0guyB",
        "streaming",
        false,
      ),
      link("Create Music", "https://createmusic.fm/fragments-remixes"),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/fragments-remixes/1742637606",
        "streaming",
        false,
      ),
      link(
        "YouTube",
        "https://www.youtube.com/playlist?list=OLAK5uy_lCBCvuruoKn5fK9Hwu3tkI_bns0oV6Z8g",
        "streaming",
        false,
      ),
      link("TIDAL", "https://tidal.com/album/359004950", "streaming", false),
      link(
        "SoundCloud",
        "https://soundcloud.com/broeybeats/sets/fragments-remixes-2",
        "streaming",
        false,
      ),
      link("Deezer", "https://www.deezer.com/album/576922861", "streaming", false),
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/359004950",
      tidalId: "359004950",
      externalIds: {
        "tidal": "359004950",
      },
      artistName: "Broey.",
      collectionName: "Fragments (Remixes)",
      collectionType: "Remix",
      isCollection: true,
      suggestedTileType: "collectionTile",
      trackCount: 7,
      rawKind: "albums",
    },
    tracklist: [
      "Numbers (tom_ecko Remix)",
      "Eyes On Me (dreamsuite Remix)",
      "Like That (notminimal. Remix)",
      "Wanted (Almost Anyone Remix)",
      "Eyes On Me (Vivid Fever Dreams Remix)",
      "Wanted (Kaiyo Remix)",
      "Eyes On Me (exmaxhina Remix)",
    ],
    carouselEnabled: true,
    carouselPriority: 7,
  },
  {
    title: "Numbers (tom_ecko Remix)",
    slug: "numbers-tom-ecko-remix",
    parentReleaseSlug: "fragments-remixes",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2024,
    description:
      "A tom_ecko remix from the Fragments remix companion, reshaping Numbers into a tighter rhythmic frame.",
    mood: "A tighter rhythmic remix of Numbers.",
    tags: ["Fragments Remixes", "Remix", "Electronic"],
    seoTitle: "Numbers (tom_ecko Remix) by Broey.",
    seoDescription: "Listen to Numbers (tom_ecko Remix) by Broey.",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio("Numbers (tom_ecko Remix)", "/audio/numbers-tom-ecko-remix.mp3", "2:23"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Eyes On Me (dreamsuite Remix)",
    slug: "eyes-on-me-dreamsuite-remix",
    parentReleaseSlug: "fragments-remixes",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2024,
    description:
      "A dreamsuite remix from Fragments (Remixes), recasting Eyes On Me with a softer, late-night pulse.",
    mood: "A softer late-night remix of Eyes On Me.",
    tags: ["Fragments Remixes", "Remix", "Electronic"],
    seoTitle: "Eyes On Me (dreamsuite Remix) by Broey.",
    seoDescription: "Listen to Eyes On Me (dreamsuite Remix) by Broey.",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio("Eyes On Me (dreamsuite Remix)", "/audio/eyes-on-me-dreamsuite-remix.mp3", "2:39"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Like That (notminimal. Remix)",
    slug: "like-that-notminimal-remix",
    parentReleaseSlug: "fragments-remixes",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2024,
    artistName: "Broey. & notminimal.",
    description:
      "A notminimal. remix from Fragments (Remixes), pushing Like That into a sharper bass-focused space.",
    mood: "A sharper bass-focused remix of Like That.",
    tags: ["Fragments Remixes", "Remix", "Bass"],
    seoTitle: "Like That (notminimal. Remix) by Broey. and notminimal.",
    seoDescription: "Listen to Like That (notminimal. Remix) by Broey. and notminimal.",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio("Like That (notminimal. Remix)", "/audio/like-that-notminimal-remix.mp3", "3:25", "Broey. & notminimal."),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Wanted (Almost Anyone Remix)",
    slug: "wanted-almost-anyone-remix",
    parentReleaseSlug: "fragments-remixes",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2024,
    description:
      "An Almost Anyone remix from Fragments (Remixes), expanding Wanted with a longer, club-facing build.",
    mood: "A longer club-facing remix of Wanted.",
    tags: ["Fragments Remixes", "Remix", "Club"],
    seoTitle: "Wanted (Almost Anyone Remix) by Broey.",
    seoDescription: "Listen to Wanted (Almost Anyone Remix) by Broey.",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio("Wanted (Almost Anyone Remix)", "/audio/wanted-almost-anyone-remix.mp3", "5:08"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Eyes On Me (Vivid Fever Dreams Remix)",
    slug: "eyes-on-me-vivid-fever-dreams-remix",
    parentReleaseSlug: "fragments-remixes",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2024,
    artistName: "Broey. & Vivid Fever Dreams",
    description:
      "A Vivid Fever Dreams remix from Fragments (Remixes), giving Eyes On Me a vivid collaborative lift.",
    mood: "A vivid collaborative remix of Eyes On Me.",
    tags: ["Fragments Remixes", "Remix", "Collaboration"],
    seoTitle: "Eyes On Me (Vivid Fever Dreams Remix)",
    seoDescription: "Listen to Eyes On Me (Vivid Fever Dreams Remix).",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio(
      "Eyes On Me (Vivid Fever Dreams Remix)",
      "/audio/eyes-on-me-vivid-fever-dreams-remix.mp3",
      "3:35",
      "Broey. & Vivid Fever Dreams",
    ),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Wanted (Kaiyo Remix)",
    slug: "wanted-kaiyo-remix",
    parentReleaseSlug: "fragments-remixes",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2024,
    description:
      "A Kaiyo remix from Fragments (Remixes), flipping Wanted into a compact electronic cut.",
    mood: "A compact electronic remix of Wanted.",
    tags: ["Fragments Remixes", "Remix", "Electronic"],
    seoTitle: "Wanted (Kaiyo Remix) by Broey.",
    seoDescription: "Listen to Wanted (Kaiyo Remix) by Broey.",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio("Wanted (Kaiyo Remix)", "/audio/wanted-kaiyo-remix.mp3", "3:04"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Eyes On Me (exmaxhina Remix)",
    slug: "eyes-on-me-exmaxhina-remix",
    parentReleaseSlug: "fragments-remixes",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2024,
    description:
      "An exmaxhina remix from Fragments (Remixes), stretching Eyes On Me into a wider electronic shape.",
    mood: "A wider electronic remix of Eyes On Me.",
    tags: ["Fragments Remixes", "Remix", "Electronic"],
    seoTitle: "Eyes On Me (exmaxhina Remix) by Broey.",
    seoDescription: "Listen to Eyes On Me (exmaxhina Remix) by Broey.",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio("Eyes On Me (exmaxhina Remix)", "/audio/eyes-on-me-exmaxhina-remix.mp3", "4:22"),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "GLFM",
    slug: "glfm",
    parentReleaseSlug: "dancing-dumpster-fire",
    isProjectTrack: true,
    showInArchive: false,
    type: "ep",
    year: 2025,
    description: "A compact release focused on warm synth textures and punchy percussion.",
    mood: "Warm synth texture with compact, punchy percussion.",
    tags: ["EP", "Warm synths", "Percussive"],
    seoTitle: "GLFM by Broey.",
    seoDescription:
      "Listen to GLFM by Broey., a compact EP focused on warm synth textures and punchy percussion.",
    coverImage: "/assets/cover-art/glfm.png",
    coverAlt: "GLFM cover art",
    audio: localAudio("GLFM", "/audio/glfm.mp3", "3:30"),
    links: [link("TIDAL", "https://tidal.com/browse/track/441546108")],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/track/441546108",
      tidalId: "441546108",
      externalIds: {
        "tidal": "441546108",
      },
      artistName: "Broey.",
      collectionName: "dancing dumpster fire",
      collectionType: "Track",
      isCollection: false,
      suggestedTileType: "trackTile",
      trackCount: 7,
      rawKind: "tracks",
      parentCollection: {
        title: "dancing dumpster fire",
        slug: "dancing-dumpster-fire",
      },
    },
  },
  {
    title: "blu.",
    slug: "blu",
    type: "single",
    year: 2025,
    releaseDate: "2025-00-00",
    description:
      "A blue-tinted electronic release with a DJ-minded extended version, balancing emotional color with late-night movement.",
    mood: "Emotional color balanced with late-night movement.",
    tags: ["Electronic", "Club", "Late-night"],
    seoTitle: "blu. by Broey.",
    seoDescription:
      "Listen to blu. by Broey., a blue-tinted electronic release with a DJ-minded extended version.",
    coverImage: "/assets/cover-art/blu.png",
    coverAlt: "blu. cover art",
    audio: {
      type: "project",
      title: "blu.",
      artist: "Broey.",
      artwork: "/assets/cover-art/blu.png",
      tracks: [
        {
          title: "blu. (radio edit)",
          slug: "blu",
          audioKey: "blu",
          artist: "Broey.",
          duration: "4:11",
          src: "/audio/blu.mp3",
        },
        {
          title: "blu. (extended version)",
          slug: "blu-extended-version",
          audioKey: "blu-extended-version",
          artist: "Broey.",
          duration: "5:20",
          src: "/audio/blu-extended-version.mp3",
        },
      ],
    },
    links: [
      link(
        "Spotify",
        "https://open.spotify.com/album/6nljucMAQ8fHgb0kBNzLta",
        "streaming",
        false,
      ),
      link("Create Music", "https://createmusic.fm/blu"),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/blu-single/1869157131",
        "streaming",
        false,
      ),
      link(
        "YouTube",
        "https://www.youtube.com/playlist?list=OLAK5uy_nARjDMR_qJuNmpjAqTlePDqHUltOiX1yg",
        "streaming",
        false,
      ),
      link("TIDAL", "https://tidal.com/album/489787750", "streaming", false),
      link(
        "Bandcamp",
        "https://broey.bandcamp.com/album/blu",
        "streaming",
        false,
      ),
      link(
        "SoundCloud",
        "https://soundcloud.com/broeybeats/sets/blu-860403193",
        "streaming",
        false,
      ),
      link(
        "Amazon Music",
        "https://music.amazon.com/albums/B0GGWLLFKY",
        "streaming",
        false,
      ),
      link("Deezer", "https://www.deezer.com/album/897704392", "streaming", false),
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/489787750",
      tidalId: "489787750",
      externalIds: {
        "tidal": "489787750",
      },
      artistName: "Broey.",
      collectionName: "blu.",
      collectionType: "EP",
      isCollection: true,
      suggestedTileType: "singleTile",
      trackCount: 2,
      rawKind: "albums",
    },
    carouselEnabled: true,
    carouselPriority: 4,
  },
  {
    title: "Like That",
    slug: "like-that",
    type: "single",
    visibility: "public",
    year: 2024,
    releaseDate: "2024-03-15",
    description:
      "A Broey. single with clipped rhythm, bright melodic movement, and a clean electronic snap.",
    mood: "Bright melodic movement with clipped, kinetic rhythm.",
    tags: ["Electronic", "Single", "Fragments"],
    seoTitle: "Like That by Broey.",
    seoDescription:
      "Listen to Like That by Broey., with verified Apple Music and TIDAL release links.",
    coverImage: "/assets/cover-art/like-that.jpg",
    coverAlt: "Like That cover art",
    audio: localAudio("Like That", "/audio/like-that.mp3", "2:32"),
    links: [
      link("TIDAL", "https://tidal.com/browse/album/344685076"),
      link("Apple Music", "https://music.apple.com/us/album/like-that-single/1730121194?uo=4", "streaming", false),
      link("YouTube", "https://www.youtube.com/watch?v=COOMXMksJ9E", "streaming", false),
    ],
    tracklist: ["Like That"],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/344685076",
      tidalId: "344685076",
      externalIds: {
        "itunes": "1730121194",
        "tidal": "344685076",
      },
      artistName: "Broey.",
      artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2c/ca/40/2cca4060-5989-73c6-e4bc-e227eb8a7110/cover.jpg/1000x1000bb.jpg",
      trackCount: 1,
      collectionName: "Like That",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      rawKind: "albums",
      parentCollection: {
        title: "Like That - Single",
        slug: "like-that",
      },
    },
  },
  {
    title: "Hold On",
    slug: "hold-on",
    type: "single",
    visibility: "public",
    year: 2023,
    releaseDate: "2023-05-08",
    description:
      "A Broey. single built around patient melodic tension and steady emotional release.",
    mood: "Patient melodic tension with a steady emotional lift.",
    tags: ["Electronic", "Melodic", "Single"],
    seoTitle: "Hold On by Broey.",
    seoDescription:
      "Listen to Hold On by Broey., with verified Apple Music and TIDAL release links.",
    coverImage: "/assets/cover-art/hold-on.png",
    coverAlt: "Hold On cover art",
    audio: localAudio("Hold On", "/audio/hold-on.mp3", "3:35"),
    links: [
      link("Spotify", "https://open.spotify.com/album/7iZkuzxea9D0SHEIXv3bVA", "streaming", false),
      link("TIDAL", "https://tidal.com/browse/album/291346877"),
      link("Apple Music", "https://music.apple.com/us/album/hold-on-single/1684637507?uo=4", "streaming", false),
      link("Bandcamp", "https://broey.bandcamp.com/track/hold-on", "streaming", false),
    ],
    tracklist: ["Hold On"],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/291346877",
      tidalId: "291346877",
      externalIds: {
        "itunes": "1684637507",
        "tidal": "291346877",
      },
      artistName: "Broey.",
      artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/fb/df/50/fbdf50de-ce8d-b822-82c0-9710f70adc8a/197368866475_cover.jpg/1000x1000bb.jpg",
      trackCount: 1,
      collectionName: "Hold On",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      rawKind: "albums",
      parentCollection: {
        title: "Hold On - Single",
        slug: "hold-on",
      },
    },
  },
  {
    title: "Warning",
    slug: "warning",
    type: "single",
    visibility: "public",
    year: 2023,
    releaseDate: "2023-03-10",
    artistName: "Cryztal Grid & Broey.",
    description:
      "A Cryztal Grid and Broey. collaboration from the transition into sharper, heavier, more physical electronic production.",
    mood: "Sharp collaborative pressure with heavier electronic motion.",
    tags: ["Collaboration", "Club", "Electronic"],
    seoTitle: "Warning by Cryztal Grid and Broey.",
    seoDescription:
      "Listen to Warning by Cryztal Grid and Broey., a transition-era collaboration with sharper electronic pressure.",
    coverImage: "/assets/cover-art/warning.jpg",
    coverAlt: "Warning by Cryztal Grid and Broey. cover art",
    audio: localAudio("Warning", "/audio/warning.mp3", "3:16", "Cryztal Grid & Broey."),
    links: [
      link("Spotify", "https://open.spotify.com/album/0m7quPpvC0EVQ21J86apaa", "streaming", false),
      link("TIDAL", "https://tidal.com/browse/album/279433677"),
      link("Apple Music", "https://music.apple.com/us/album/warning-single/1673797798?uo=4", "streaming", false),
      link("Deezer", "https://www.deezer.com/en/album/410679107", "streaming", false),
    ],
    tracklist: [
      {
        title: "Warning",
        artist: "Cryztal Grid & Broey.",
      },
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/279433677",
      tidalId: "279433677",
      externalIds: {
        "itunes": "1673797798",
        "tidal": "279433677",
      },
      artistName: "Cryztal Grid & Broey.",
      artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/9a/2a/c4/9a2ac406-854d-82e7-c97e-620e69bb3349/cover.jpg/1000x1000bb.jpg",
      trackCount: 1,
      collectionName: "Warning",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      rawKind: "albums",
      parentCollection: {
        title: "Warning - Single",
        slug: "warning",
      },
    },
  },
  {
    title: "hysteria",
    slug: "hysteria",
    type: "single",
    visibility: "public",
    year: 2022,
    releaseDate: "2022-01-13",
    description:
      "A high-energy DNB/electronic track from the early transition away from lofi and into heavier, more kinetic production.",
    mood: "Heavier, kinetic production from the early transition era.",
    tags: ["Electronic", "DNB", "Transition"],
    seoTitle: "hysteria by Broey.",
    seoDescription:
      "Listen to hysteria by Broey., a high-energy DNB/electronic track from the early transition away from lofi.",
    coverImage: "/assets/cover-art/hysteria.jpg",
    coverAlt: "hysteria cover art",
    audio: localAudio("hysteria", "/audio/hysteria.mp3", "3:42"),
    links: [
      link("Spotify", "https://open.spotify.com/track/12I7dRdt4uhBXMOKFSm7NV", "streaming", false),
      link("TIDAL", "https://tidal.com/browse/album/210567515"),
      link("Apple Music", "https://music.apple.com/us/album/hysteria-single/1602310014?uo=4", "streaming", false),
      link("YouTube", "https://www.youtube.com/watch?v=ffnbbnsniSs", "streaming", false),
    ],
    tracklist: ["hysteria"],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/210567515",
      tidalId: "210567515",
      externalIds: {
        "itunes": "1602310014",
        "tidal": "210567515",
      },
      artistName: "Broey.",
      artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/f1/e1/3c/f1e13cea-6cb2-ef69-21ae-e62f29f2136e/1963620488285_cover.jpg/1000x1000bb.jpg",
      trackCount: 1,
      collectionName: "hysteria",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      rawKind: "albums",
      parentCollection: {
        title: "hysteria - Single",
        slug: "hysteria",
      },
    },
  },
  {
    title: "After You",
    slug: "after-you",
    type: "single",
    visibility: "public",
    year: 2020,
    releaseDate: "2020-11-30",
    artistName: "Broey. & Mr. Hilroy",
    description:
      "A Broey. and Mr. Hilroy single with soft-focus melody, reflective space, and gentle forward motion.",
    mood: "Soft-focus melody with reflective forward motion.",
    tags: ["Collaboration", "Melodic", "Single"],
    seoTitle: "After You by Broey. and Mr. Hilroy",
    seoDescription:
      "Listen to After You by Broey. and Mr. Hilroy, with verified Apple Music and TIDAL release links.",
    coverImage: "/assets/cover-art/after-you.jpg",
    coverAlt: "After You cover art",
    links: [
      link("Spotify", "https://open.spotify.com/album/10KYFjdvz7plRKXRmSQqtb", "streaming", false),
      link("TIDAL", "https://tidal.com/browse/album/340981922"),
      link("Apple Music", "https://music.apple.com/us/album/after-you-single/1726655763?uo=4", "streaming", false),
      link("YouTube", "https://www.youtube.com/watch?v=TN90jROEvHw", "streaming", false),
    ],
    tracklist: [
      {
        title: "After You",
        artist: "Broey. & Mr. Hilroy",
      },
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/340981922",
      tidalId: "340981922",
      externalIds: {
        "itunes": "1726655763",
        "tidal": "340981922",
      },
      artistName: "Broey. & Mr. Hilroy",
      artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/86/ed/8a/86ed8af8-ed9f-2132-b259-78a844bca132/024543143901_cover.jpg/1000x1000bb.jpg",
      trackCount: 1,
      collectionName: "After You",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      rawKind: "albums",
      parentCollection: {
        title: "After You - Single",
        slug: "after-you",
      },
    },
  },
  {
    title: "Paradise",
    slug: "paradise",
    type: "single",
    visibility: "public",
    year: 2019,
    releaseDate: "2019-03-23",
    description:
      "An early Broey. single with bright melodic color, open space, and a light electronic pulse.",
    mood: "Bright melodic color with a light electronic pulse.",
    tags: ["Electronic", "Early catalog", "Single"],
    seoTitle: "Paradise by Broey.",
    seoDescription:
      "Listen to Paradise by Broey., with verified Apple Music and TIDAL release links.",
    coverAlt: "Paradise artwork pending",
    links: [
      link("Spotify", "https://open.spotify.com/album/2nkJjtXF1s41m8DscqlMK2", "streaming", false),
      link("TIDAL", "https://tidal.com/browse/album/314502943"),
      link("Apple Music", "https://music.apple.com/us/album/paradise-single/1705775795?uo=4", "streaming", false),
      link("YouTube", "https://www.youtube.com/watch?v=KjO1tX506ww", "streaming", false),
      link("Bandcamp", "https://broey.bandcamp.com/track/paradise", "streaming", false),
    ],
    tracklist: ["Paradise"],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/314502943",
      tidalId: "314502943",
      externalIds: {
        "itunes": "1705775795",
        "tidal": "314502943",
      },
      artistName: "Broey.",
      artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/43/c2/d9/43c2d95d-a8fc-22cd-d208-8a1021efbc2f/194271698971_cover.jpg/1000x1000bb.jpg",
      trackCount: 1,
      collectionName: "Paradise",
      collectionType: "Single",
      isCollection: true,
      suggestedTileType: "singleTile",
      rawKind: "albums",
      parentCollection: {
        title: "Paradise - Single",
        slug: "paradise",
      },
    },
  },
] satisfies ReleaseEntry[]) as ReleaseEntry[]).filter((release) => release.visibility !== "draft");
