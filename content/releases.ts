import {
  musicRegistryBySiteSlug,
  trackRegistryByReleaseSlug,
  type GeneratedReleaseRegistry,
  type GeneratedTrackRegistry,
} from "@/content/musicRegistry.generated";

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
export type ReleaseArtworkPresentation = {
  fit?: "cover" | "contain";
  position?: "center" | "center top" | "center bottom";
};

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
  playerAccent?: string;
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

export type ReleaseRegistryMetadata = Omit<GeneratedReleaseRegistry, "privateListeningLink">;

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
  artworkPresentation?: ReleaseArtworkPresentation;
  playerAccent?: string;
  audioPreview?: string;
  audio?: ReleaseAudio;
  links: ExternalLink[];
  platformLinks?: ExternalLink[];
  disco?: {
    publicUrl?: string;
    privateShareUrl?: string;
    promoUrl?: string;
    downloadUrl?: string;
    publicUse?: "preview" | "press" | "industry";
  };
  embed?: ReleaseEmbed;
  listenAction?: ReleaseListenAction;
  catalogSource?: ReleaseCatalogSource;
  catalogStatus?: ReleaseCatalogStatus;
  registry?: ReleaseRegistryMetadata;
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
  primary = false,
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

const generatedRegistryBySiteSlug = musicRegistryBySiteSlug as unknown as Record<
  string,
  GeneratedReleaseRegistry | undefined
>;

const generatedTracksByReleaseSlug = trackRegistryByReleaseSlug as unknown as Record<
  string,
  readonly GeneratedTrackRegistry[] | undefined
>;

const registryForRelease = (release: Pick<ReleaseEntry, "slug">) =>
  generatedRegistryBySiteSlug[release.slug];

const registryTracksForRelease = (release: Pick<ReleaseEntry, "slug">) =>
  generatedTracksByReleaseSlug[release.slug] ?? [];

const publicRegistryMetadata = (
  registry?: GeneratedReleaseRegistry,
): ReleaseRegistryMetadata | undefined => {
  if (!registry) {
    return undefined;
  }

  const publicRegistry = {
    ...registry,
  } as GeneratedReleaseRegistry & { privateListeningLink?: string };

  delete publicRegistry.privateListeningLink;

  return publicRegistry;
};

const generatedVerificationStatus = (
  registry: GeneratedReleaseRegistry,
): ReleaseVerificationStatus =>
  registry.verificationStatus.toLowerCase().includes("confirmed")
    ? "source-backed"
    : "manual-review";

const generatedMetadataStatus = (
  registry: GeneratedReleaseRegistry,
): ReleaseMetadataStatus =>
  registry.publishStatus.toLowerCase().includes("copy needed")
    ? "manual-review"
    : "source-backed";

const shouldUseGeneratedDate = (releaseDate?: string) =>
  !releaseDate || releaseDate.includes("-00-");

const generatedDuration = (duration?: string) =>
  duration?.replace(/^0(?=\d:)/, "");

const comparableRegistryTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!]/g, "")
    .trim();

const registryTrackForTitle = (
  title: string,
  tracks: readonly GeneratedTrackRegistry[],
) => {
  const normalizedTitle = comparableRegistryTitle(title);

  return tracks.find((track) => {
    const normalizedTrackTitle = comparableRegistryTitle(track.title);

    return (
      normalizedTrackTitle === normalizedTitle ||
      normalizedTrackTitle.startsWith(`${normalizedTitle} (`) ||
      normalizedTitle.startsWith(`${normalizedTrackTitle} (`)
    );
  });
};

const registryTrackForEntry = (
  track: NonNullable<ReleaseEntry["tracklist"]>[number],
  tracks: readonly GeneratedTrackRegistry[],
) => {
  const title = typeof track === "string" ? track : track.title;
  const slug = typeof track === "string" ? undefined : track.slug ?? track.audioKey;
  const slugMatch = slug
    ? tracks.find((entry) => comparableRegistryTitle(entry.trackSlug) === comparableRegistryTitle(slug))
    : undefined;

  return slugMatch ?? registryTrackForTitle(title, tracks);
};

const mergeGeneratedTracklist = (
  release: ReleaseEntry,
  tracks: readonly GeneratedTrackRegistry[],
): ReleaseEntry["tracklist"] => {
  if (!tracks.length) {
    return release.tracklist;
  }

  if (release.tracklist?.length) {
    return release.tracklist.map((track) => {
      const registryTrack = registryTrackForEntry(track, tracks);

      if (!registryTrack) {
        return track;
      }

      const trackValue = typeof track === "string" ? { title: track } : track;

      return {
        ...trackValue,
        artist: trackValue.artist ?? registryTrack.displayArtist,
        duration: trackValue.duration ?? generatedDuration(registryTrack.duration),
      };
    });
  }

  return tracks
    .slice()
    .sort((left, right) => (left.trackNumber ?? 0) - (right.trackNumber ?? 0))
    .map((track) => ({
      title: track.title,
      slug: track.trackSlug,
      audioKey: track.trackSlug,
      artist: track.displayArtist,
      duration: generatedDuration(track.duration),
    }));
};

const mergeGeneratedAudio = (
  release: ReleaseEntry,
  tracks: readonly GeneratedTrackRegistry[],
): ReleaseEntry["audio"] => {
  if (!release.audio || !tracks.length) {
    return release.audio;
  }

  return {
    ...release.audio,
    artist: release.audio.artist ?? release.artistName,
    tracks: release.audio.tracks.map((track) => {
      const registryTrack =
        (track.slug || track.audioKey)
          ? tracks.find((entry) =>
              comparableRegistryTitle(entry.trackSlug) === comparableRegistryTitle(track.slug ?? "") ||
              comparableRegistryTitle(entry.trackSlug) === comparableRegistryTitle(track.audioKey ?? ""),
            )
          : undefined;
      const titleMatch = registryTrack ?? registryTrackForTitle(track.title, tracks);

      if (!titleMatch) {
        return track;
      }

      return {
        ...track,
        artist: track.artist ?? titleMatch.displayArtist,
        duration: track.duration ?? generatedDuration(titleMatch.duration),
      };
    }),
  };
};

const generatedReleaseDetails = (registry: GeneratedReleaseRegistry): ReleaseDetail[] =>
  [
    registry.label ? { label: "Label", value: registry.label } : undefined,
    registry.catalogNumber
      ? { label: "Catalogue number", value: registry.catalogNumber }
      : undefined,
    registry.upc ? { label: "UPC", value: registry.upc } : undefined,
    registry.focusTrack ? { label: "Focus track", value: registry.focusTrack } : undefined,
    registry.pLine ? { label: "P line", value: registry.pLine } : undefined,
    registry.cLine ? { label: "C line", value: registry.cLine } : undefined,
  ].reduce<ReleaseDetail[]>((details, detail) => {
    if (detail) {
      details.push(detail);
    }

    return details;
  }, []);

const mergeGeneratedDetails = (
  release: ReleaseEntry,
  registry: GeneratedReleaseRegistry,
) => {
  const existingDetails = release.details ?? [];
  const existingLabels = new Set(existingDetails.map((detail) => detail.label.toLowerCase()));
  const details = generatedReleaseDetails(registry).filter(
    (detail) => !existingLabels.has(detail.label.toLowerCase()),
  );

  return [...existingDetails, ...details];
};

const generatedSmartLinks = (registry: GeneratedReleaseRegistry): ExternalLink[] =>
  registry.smartLinks.map((smartLink) => ({
    label: smartLink.label,
    platform: smartLink.platform,
    url: smartLink.url,
    kind: smartLink.kind as ExternalLinkKind,
  }));

const mergeGeneratedLinks = (
  release: ReleaseEntry,
  registry: GeneratedReleaseRegistry,
) => {
  const links = [...release.links];

  for (const smartLink of generatedSmartLinks(registry)) {
    if (!links.some((existing) => existing.url === smartLink.url)) {
      links.push(smartLink);
    }
  }

  return links;
};

const uniqueTags = (tags: string[]) =>
  tags.filter((tag, index, list) => list.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index);

const mergeGeneratedRelease = (release: ReleaseEntry): ReleaseEntry => {
  const registry = registryForRelease(release);

  if (!registry) {
    return release;
  }

  const registryTracks = registryTracksForRelease(release);
  const mergedArtistName = registry.displayArtist || release.artistName;
  const hasAuthoredPageCopy = Boolean(release.about);
  const mergedTags = release.tags?.length
    ? uniqueTags([...release.tags, ...registry.genres])
    : uniqueTags([...registry.genres, ...registry.moods]).slice(0, 5);

  return {
    ...release,
    title: registry.title || release.title,
    year: registry.year ?? release.year,
    releaseDate: shouldUseGeneratedDate(release.releaseDate)
      ? registry.releaseDate ?? release.releaseDate
      : release.releaseDate,
    artistName: mergedArtistName,
    metadataStatus: release.metadataStatus ?? generatedMetadataStatus(registry),
    verificationStatus: release.verificationStatus ?? generatedVerificationStatus(registry),
    description: hasAuthoredPageCopy ? release.description : registry.shortDescription ?? release.description,
    about: release.about ?? registry.pageDescription,
    tags: mergedTags.length ? mergedTags : release.tags,
    seoTitle: release.seoTitle ?? registry.seoTitle,
    seoDescription: hasAuthoredPageCopy && release.seoDescription
      ? release.seoDescription
      : registry.seoDescription ?? release.seoDescription,
    tracklist: mergeGeneratedTracklist(release, registryTracks),
    audio: mergeGeneratedAudio(
      {
        ...release,
        artistName: mergedArtistName,
      },
      registryTracks,
    ),
    links: mergeGeneratedLinks(release, registry),
    details: mergeGeneratedDetails(release, registry),
    registry: publicRegistryMetadata(registry),
  };
};

const applyParentPlayerAccents = (releaseList: ReleaseEntry[]) => {
  const accentBySlug = new Map(
    releaseList.map((release) => [release.slug, release.playerAccent]),
  );

  return releaseList.map((release) => {
    if (release.playerAccent || !release.parentReleaseSlug) {
      return release;
    }

    const parentAccent = accentBySlug.get(release.parentReleaseSlug);

    return parentAccent ? { ...release, playerAccent: parentAccent } : release;
  });
};

export const releases: ReleaseEntry[] = applyParentPlayerAccents(
  (([
  {
    title: "LiNK",
    slug: "link",
    type: "single",
    visibility: "draft",
    year: 2025,
    description:
      "Electronic single available here as a local radio edit while public platform links are verified.",
    mood: "Electronic single available as a local radio edit.",
    tags: ["Electronic", "Late-night", "Preview"],
    seoTitle: "LiNK by Broey.",
    seoDescription:
      "Preview LiNK by Broey, with a local radio edit and pending public platform links.",
    about: [
      "LiNK is kept on the site as a preview/manual listen while public platform links are pending. The available version is a local radio edit.",
      "Use the local player for now; DSP links will appear here once they are verified.",
    ],
    details: [
      { label: "Public platform links", value: "Pending verification" },
    ],
    coverImage: "/assets/cover-art/link.png",
    coverAlt: "LiNK by Broey. cover art",
    playerAccent: "#4f8fc7",
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
    carouselPriority: 2,
    featured: false,
  },
  {
    title: "STEREO LUV",
    slug: "stereo-luv",
    type: "single",
    year: 2025,
    releaseDate: "2025-00-00",
    description:
      "A dusty deep-house single built from drum machines, bass sequencing, sampler grit, and a wide stereo field.",
    mood: "Deep-house single with drum machines, bass sequencing, and a wide stereo field.",
    tags: ["Electronic", "Dance", "Deep house"],
    seoTitle: "STEREO LUV by Broey.",
    seoDescription:
      "Listen to STEREO LUV by Broey, a dusty deep-house single built from drum machines, bass sequencing, sampler grit, and a wide stereo field.",
    about: [
      "STEREO LUV came together after Broey treated and calibrated a new home-studio space. The track leans into a dusty 90s deep-house feel with drum machines, bass sequencing, samplers, and a noticeably wide stereo image.",
      "It sits in the catalog as a cleaner club record without losing the warm, hands-on detail that runs through the older lo-fi work.",
    ],
    coverImage: "/assets/cover-art/stereo-luv.png",
    coverAlt: "STEREO LUV cover art",
    playerAccent: "#b8738f",
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
      "A house-leaning single with a stripped-down arrangement.",
    mood: "House-leaning single with a stripped-down arrangement.",
    tags: ["Electronic", "House", "Club-facing"],
    seoTitle: "FREE by Broey.",
    seoDescription:
      "Listen to FREE by Broey, a house-leaning single with a stripped-down arrangement.",
    about: [
      "FREE is the current focus release: a concise, house-leaning single with a stripped-down arrangement.",
      "It puts Broey's newer catalog right up front with a direct club track and minimal extra framing.",
    ],
    coverImage: "/assets/cover-art/free.png",
    coverAlt: "FREE by Broey. cover art",
    playerAccent: "#b68a45",
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
    carouselPriority: 1,
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
    featured: true,
  },
  {
    title: "dancing dumpster fire",
    slug: "dancing-dumpster-fire",
    type: "ep",
    year: 2025,
    releaseDate: "2025-00-00",
    description:
      "A seven-track EP with UKG, bassline, trance, and speed-house tracks.",
    mood: "Seven-track EP with UKG, bassline, trance, and speed-house.",
    tags: ["EP", "Club", "Raw electronic"],
    credits: [
      { role: "Artist", name: "Broey." },
    ],
    seoTitle: "dancing dumpster fire by Broey.",
    seoDescription:
      "Listen to dancing dumpster fire by Broey, a seven-track EP with UKG, bassline, trance, and speed-house tracks.",
    about: [
      "dancing dumpster fire collects seven club tracks across UKG, bassline, trance, and speed-house.",
      "It is intentionally direct: short tracks, fast ideas, and a title that says what the record is.",
    ],
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    playerAccent: "#8d5a9f",
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
          artist: "Broey. feat. Vivid Fever Dreams",
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
          artist: "DreamEater & Broken Blythe — remixed by Broey.",
          duration: "3:15",
          src: "/audio/i-can-do-better-broey-remix.mp3",
        },
        {
          title: "4u vip",
          slug: "4u-vip",
          audioKey: "4u-vip",
          artist: "Broey., notminimal.",
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
        artist: "Broey. feat. Vivid Fever Dreams",
      },
      { title: "GLFM", slug: "glfm", audioKey: "glfm" },
      {
        title: "i can do better (broey. remix)",
        slug: "i-can-do-better-broey-remix",
        audioKey: "i-can-do-better-broey-remix",
        artist: "DreamEater & Broken Blythe — remixed by Broey.",
      },
      {
        title: "4u vip",
        slug: "4u-vip",
        audioKey: "4u-vip",
        artist: "Broey., notminimal.",
      },
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
      "A short dancing dumpster fire track with clipped drums and club production.",
    mood: "Short dancing dumpster fire track with clipped drums.",
    tags: ["dancing dumpster fire", "Club", "Electronic"],
    seoTitle: "shake! by Broey.",
    seoDescription:
      "Listen to shake! by Broey, a short dancing dumpster fire track with clipped drums.",
    about: [
      "shake! keeps the EP's approach short and direct: clipped drums, club production, and little extra polish.",
    ],
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
      "A dancing dumpster fire track with crisp percussion and bright synths.",
    mood: "Crisp percussion and bright synths.",
    tags: ["dancing dumpster fire", "Club", "Electronic"],
    seoTitle: "old fashion by Broey.",
    seoDescription:
      "Listen to old fashion by Broey, a dancing dumpster fire track with crisp percussion and bright synths.",
    about: [
      "old fashion sits on the lighter side of dancing dumpster fire: crisp percussion, bright synths, and a short arrangement.",
    ],
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
      "A compact dancing dumpster fire track with playful melody and quick drums.",
    mood: "Playful melody and quick drums.",
    tags: ["dancing dumpster fire", "Electronic", "Single"],
    seoTitle: "lil luv by Broey.",
    seoDescription:
      "Listen to lil luv by Broey, a compact dancing dumpster fire cut with playful melody and quick drums.",
    about: [
      "lil luv is one of the EP's shorter tracks: playful melody and quick drums in a compact arrangement.",
    ],
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
    artistName: "Broey.",
    description:
      "A Broey and Vivid Fever Dreams collaboration from dancing dumpster fire with saturated synths.",
    mood: "Broey and Vivid Fever Dreams collaboration with saturated synths.",
    tags: ["dancing dumpster fire", "Collaboration", "Club"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Featured Artist", name: "Vivid Fever Dreams" },
    ],
    seoTitle: "brainrot by Broey.",
    seoDescription:
      "Listen to brainrot by Broey., featuring Vivid Fever Dreams, from dancing dumpster fire.",
    about: [
      "brainrot brings Vivid Fever Dreams into the dancing dumpster fire tracklist with saturated synths and a collaborative production credit.",
    ],
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: localAudio("brainrot", "/audio/brainrot.mp3", "3:37", "Broey. feat. Vivid Fever Dreams"),
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
    artistName: "DreamEater & Broken Blythe",
    description:
      "Broey's compact remix of i can do better, pulled into the rough club language of dancing dumpster fire.",
    mood: "Compact club remix from dancing dumpster fire.",
    tags: ["dancing dumpster fire", "Remix", "Club"],
    credits: [
      { role: "Artist", name: "DreamEater & Broken Blythe" },
      { role: "Remixer", name: "Broey." },
    ],
    seoTitle: "i can do better (broey. remix)",
    seoDescription:
      "Listen to i can do better by DreamEater & Broken Blythe, remixed by Broey., from dancing dumpster fire.",
    about: [
      "Broey's remix of i can do better folds DreamEater and Broken Blythe's source into the dancing dumpster fire tracklist as a compact club remix.",
    ],
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: localAudio(
      "i can do better (broey. remix)",
      "/audio/i-can-do-better-broey-remix.mp3",
      "3:15",
      "DreamEater & Broken Blythe — remixed by Broey.",
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
    artistName: "Broey., notminimal.",
    description:
      "A tighter VIP version of 4u with sharpened bass and a shorter arrangement.",
    mood: "Tighter VIP version of 4u with sharpened bass.",
    tags: ["dancing dumpster fire", "VIP", "Club"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Collaborator", name: "notminimal." },
    ],
    seoTitle: "4u vip by Broey., notminimal.",
    seoDescription:
      "Listen to 4u vip by Broey., notminimal., a tighter VIP version with sharpened bass.",
    about: [
      "4u vip tightens the Broey and notminimal. collaboration into a shorter club version, pushing the bass forward and cutting down the space around it.",
    ],
    coverImage: "/assets/cover-art/dancing-dumpster-fire.jpg",
    coverAlt: "dancing dumpster fire cover art",
    audio: localAudio("4u vip", "/audio/4u-vip.mp3", "2:22", "Broey., notminimal."),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "I Can't Wait For Love",
    slug: "i-cant-wait-for-love",
    type: "single",
    year: 2024,
    description:
      "A Broken Blythe collaboration that pulls Broey's dance production into a more vocal-led, song-shaped frame.",
    mood: "Vocal-led dance production with a song-shaped frame.",
    artistName: "Broey., Broken Blythe",
    tags: ["Melodic", "Dance", "Collaboration"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Collaborator", name: "Broken Blythe" },
    ],
    seoTitle: "I Can't Wait For Love by Broey., Broken Blythe",
    seoDescription:
      "Listen to I Can't Wait For Love by Broey., Broken Blythe, a vocal-led electronic collaboration.",
    about: [
      "I Can't Wait For Love pairs Broey with Broken Blythe, moving the production into a more vocal-led space without losing the dance-floor pull around it.",
      "The track works as a bridge between Broey's club-facing singles and a more direct songwriter frame: polished, melodic, and built around the push of the vocal.",
    ],
    coverImage: "/assets/cover-art/i-cant-wait-for-love.png",
    coverAlt: "I Can't Wait For Love cover art",
    audio: localAudio(
      "I Can't Wait For Love",
      "/audio/i-cant-wait-for-love.mp3",
      "3:39",
      "Broey., Broken Blythe",
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
      "A six-track EP with house, processed vocals, sax, breakbeats, and bass.",
    mood: "House, processed vocals, sax, breakbeats, and bass.",
    tags: ["EP", "House", "Breakbeats"],
    credits: [
      { role: "Artist", name: "Broey." },
    ],
    seoTitle: "Fragments by Broey.",
    seoDescription:
      "Listen to Fragments by Broey, a six-track EP with house, processed vocals, sax, breakbeats, and bass.",
    about: [
      "Fragments is one of the catalog's clear turning points. The six-track EP connects Broey's lo-fi roots with house, processed vocals, sax, breakbeats, and bass.",
      "The record sits between the older headphone records and the later club-focused catalog.",
    ],
    coverImage: "/assets/cover-art/fragments-ep.jpg",
    coverAlt: "Fragments cover art",
    playerAccent: "#3f8f8c",
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
          artist: "Broey. feat. Vivid Fever Dreams",
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
      {
        title: "Breathing Room (feat. Vivid Fever Dreams)",
        artist: "Broey. feat. Vivid Fever Dreams",
      },
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
      "A Fragments track with quick melodic turns and crisp drums.",
    mood: "Quick melodic turns and crisp drums.",
    tags: ["Fragments", "Electronic", "Single"],
    seoTitle: "Run For Cover by Broey.",
    seoDescription:
      "Listen to Run For Cover by Broey, a Fragments track with quick melodic turns and crisp drums.",
    about: [
      "Run For Cover keeps the Fragments palette short and direct: quick melodic turns and crisp drums.",
    ],
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
      "A Fragments track with clean percussion, direct tension, and a late-night melodic lift.",
    mood: "Clean percussion, direct tension, and late-night melodic lift.",
    tags: ["Fragments", "Electronic", "Single"],
    seoTitle: "Wanted by Broey.",
    seoDescription:
      "Listen to Wanted by Broey, a Fragments track with clean percussion and late-night melodic lift.",
    about: [
      "Wanted sits in the darker pocket of Fragments, built around clean percussion, direct tension, and a late-night melodic lift.",
    ],
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
      "A Fragments track built from measured rhythm, glowing synth detail, and a steady electronic climb.",
    mood: "Measured rhythm, glowing synth detail, and steady electronic climb.",
    tags: ["Fragments", "Electronic", "Single"],
    seoTitle: "Numbers by Broey.",
    seoDescription:
      "Listen to Numbers by Broey, a Fragments track with measured rhythm and glowing synth detail.",
    about: [
      "Numbers gives Fragments one of its steadier shapes, with measured rhythm, glowing synth detail, and a patient electronic climb.",
    ],
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
    artistName: "Broey.",
    description:
      "A Broey and Vivid Fever Dreams collaboration from Fragments.",
    mood: "Broey and Vivid Fever Dreams collaboration from Fragments.",
    tags: ["Fragments", "Collaboration", "Electronic"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Featured Artist", name: "Vivid Fever Dreams" },
    ],
    seoTitle: "Breathing Room by Broey.",
    seoDescription:
      "Listen to Breathing Room by Broey., featuring Vivid Fever Dreams, from Fragments.",
    about: [
      "Breathing Room is the Broey and Vivid Fever Dreams collaboration on Fragments.",
    ],
    coverImage: "/assets/cover-art/fragments-ep.jpg",
    coverAlt: "Fragments cover art",
    audio: localAudio("Breathing Room", "/audio/breathing-room.mp3", "5:55", "Broey. feat. Vivid Fever Dreams"),
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
      "A Fragments track with vocals, glossy synths, and a club lean.",
    mood: "Vocals, glossy synths, and a club lean.",
    tags: ["Fragments", "Electronic", "Single"],
    seoTitle: "Eyes On Me by Broey.",
    seoDescription:
      "Listen to Eyes On Me by Broey, a Fragments track with vocals and glossy synths.",
    about: [
      "Eyes On Me closes the Fragments run with vocals, glossy synths, and a firmer club lean than the softer moments around it.",
    ],
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
      "A Broey and notminimal. collaboration with heavy low-end and dance production.",
    mood: "Broey and notminimal. collaboration with heavy low-end.",
    tags: ["Collaboration", "Bass", "Dance"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Collaborator", name: "notminimal." },
      { role: "Artwork", name: "DreamEater" },
    ],
    seoTitle: "4u by Broey., notminimal.",
    seoDescription:
      "Listen to 4u by Broey., notminimal., a dance collaboration with heavy low-end.",
    about: [
      "4u brings Broey and notminimal. together on a dance-focused single with heavy low-end.",
      "The DreamEater artwork gives the single its visual identity.",
    ],
    coverImage: "/assets/cover-art/4u.jpg",
    coverAlt: "4u cover art",
    playerAccent: "#a987c8",
    audio: localAudio("4u", "/audio/4u.mp3", "3:19", "Broey., notminimal."),
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
      "An electronic single built around melody, space, and a direct song structure.",
    mood: "Melody, space, and a direct song structure.",
    tags: ["Melodic", "Reflective", "Electronic"],
    seoTitle: "Mean Something by Broey.",
    seoDescription:
      "Listen to Mean Something by Broey, an electronic single built around melody and space.",
    about: [
      "Mean Something is one of the more reflective singles in the selected catalog. It keeps the production direct, letting melody and space carry most of the weight.",
      "The track belongs near the newer club-facing work, but it is smaller and more song-focused.",
    ],
    coverImage: "/assets/cover-art/mean-something.jpg",
    coverAlt: "Mean Something cover art",
    playerAccent: "#9a7448",
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
      "A seven-track remix companion that lets outside producers pull Fragments into tighter, softer, heavier, and more club-facing shapes.",
    mood: "Outside-producer remixes across tighter, softer, heavier, and club-facing shapes.",
    tags: ["Remixes", "Club", "Electronic"],
    credits: [
      { role: "Artist", name: "Broey." },
    ],
    seoTitle: "Fragments (Remixes) by Broey.",
    seoDescription:
      "Listen to Fragments (Remixes) by Broey, a seven-track remix companion with outside-producer flips of the Fragments EP.",
    about: [
      "Fragments (Remixes) opens the EP to outside producers with shorter edits, late-night versions, bass remixes, and longer club-facing builds.",
      "The companion release keeps the original EP's melodic DNA in view, but the point is range. Each remix treats Fragments as material to be bent, sharpened, stretched, or pushed further toward the floor.",
    ],
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    artworkPresentation: {
      fit: "cover",
      position: "center bottom",
    },
    playerAccent: "#717bb0",
    audio: {
      type: "project",
      title: "Fragments (Remixes)",
      artist: "Broey.",
      artwork: "/assets/cover-art/fragments-remixes.jpg",
      tracks: [
        {
          title: "Numbers (tom_ecko Remix)",
          artist: "Broey. — remixed by tom_ecko",
          duration: "2:23",
          src: "/audio/numbers-tom-ecko-remix.mp3",
        },
        {
          title: "Eyes On Me (dreamsuite Remix)",
          artist: "Broey. — remixed by dreamsuite",
          duration: "2:39",
          src: "/audio/eyes-on-me-dreamsuite-remix.mp3",
        },
        {
          title: "Like That (notminimal. Remix)",
          artist: "Broey. — remixed by notminimal.",
          duration: "3:25",
          src: "/audio/like-that-notminimal-remix.mp3",
        },
        {
          title: "Wanted (Almost Anyone Remix)",
          artist: "Broey. — remixed by Almost Anyone",
          duration: "5:08",
          src: "/audio/wanted-almost-anyone-remix.mp3",
        },
        {
          title: "Eyes On Me (Vivid Fever Dreams Remix)",
          artist: "Broey. — remixed by Vivid Fever Dreams",
          duration: "3:35",
          src: "/audio/eyes-on-me-vivid-fever-dreams-remix.mp3",
        },
        {
          title: "Wanted (KAIYO Remix)",
          artist: "Broey. — remixed by KAIYO",
          duration: "3:04",
          src: "/audio/wanted-kaiyo-remix.mp3",
        },
        {
          title: "Eyes On Me (ExMaxhina Remix)",
          artist: "Broey. — remixed by ExMaxhina",
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
      { title: "Numbers (tom_ecko Remix)", artist: "Broey. — remixed by tom_ecko" },
      { title: "Eyes On Me (dreamsuite Remix)", artist: "Broey. — remixed by dreamsuite" },
      { title: "Like That (notminimal. Remix)", artist: "Broey. — remixed by notminimal." },
      { title: "Wanted (Almost Anyone Remix)", artist: "Broey. — remixed by Almost Anyone" },
      {
        title: "Eyes On Me (Vivid Fever Dreams Remix)",
        artist: "Broey. — remixed by Vivid Fever Dreams",
      },
      { title: "Wanted (KAIYO Remix)", artist: "Broey. — remixed by KAIYO" },
      { title: "Eyes On Me (ExMaxhina Remix)", artist: "Broey. — remixed by ExMaxhina" },
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
      "A tom_ecko remix that tightens Numbers into a shorter, rhythm-first frame.",
    mood: "Shorter, rhythm-first remix of Numbers.",
    tags: ["Fragments Remixes", "Remix", "Electronic"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Remixer", name: "tom_ecko" },
    ],
    seoTitle: "Numbers (tom_ecko Remix) by Broey.",
    seoDescription:
      "Listen to Numbers (tom_ecko Remix), a tighter rhythm-first remix from Fragments (Remixes).",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio(
      "Numbers (tom_ecko Remix)",
      "/audio/numbers-tom-ecko-remix.mp3",
      "2:23",
      "Broey. — remixed by tom_ecko",
    ),
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
      "A dreamsuite remix that softens Eyes On Me into a late-night version.",
    mood: "Softer late-night remix of Eyes On Me.",
    tags: ["Fragments Remixes", "Remix", "Electronic"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Remixer", name: "dreamsuite" },
    ],
    seoTitle: "Eyes On Me (dreamsuite Remix) by Broey.",
    seoDescription:
      "Listen to Eyes On Me (dreamsuite Remix), a softer late-night remix from Fragments (Remixes).",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio(
      "Eyes On Me (dreamsuite Remix)",
      "/audio/eyes-on-me-dreamsuite-remix.mp3",
      "2:39",
      "Broey. — remixed by dreamsuite",
    ),
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
    artistName: "Broey.",
    description:
      "A notminimal. remix that pushes Like That into a sharper bass-focused lane.",
    mood: "Sharper bass-focused remix of Like That.",
    tags: ["Fragments Remixes", "Remix", "Bass"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Remixer", name: "notminimal." },
    ],
    seoTitle: "Like That (notminimal. Remix) by Broey.",
    seoDescription:
      "Listen to Like That (notminimal. Remix), a sharper bass-focused remix from Fragments (Remixes).",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio(
      "Like That (notminimal. Remix)",
      "/audio/like-that-notminimal-remix.mp3",
      "3:25",
      "Broey. — remixed by notminimal.",
    ),
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
      "An Almost Anyone remix that stretches Wanted into a longer club-facing build.",
    mood: "Longer club-facing remix of Wanted.",
    tags: ["Fragments Remixes", "Remix", "Club"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Remixer", name: "Almost Anyone" },
    ],
    seoTitle: "Wanted (Almost Anyone Remix) by Broey.",
    seoDescription:
      "Listen to Wanted (Almost Anyone Remix), a longer club-facing remix from Fragments (Remixes).",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio(
      "Wanted (Almost Anyone Remix)",
      "/audio/wanted-almost-anyone-remix.mp3",
      "5:08",
      "Broey. — remixed by Almost Anyone",
    ),
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
    artistName: "Broey.",
    description:
      "A Vivid Fever Dreams remix that gives Eyes On Me a brighter collaborative lift.",
    mood: "Brighter collaborative remix of Eyes On Me.",
    tags: ["Fragments Remixes", "Remix", "Collaboration"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Remixer", name: "Vivid Fever Dreams" },
    ],
    seoTitle: "Eyes On Me (Vivid Fever Dreams Remix)",
    seoDescription:
      "Listen to Eyes On Me (Vivid Fever Dreams Remix), a brighter collaborative remix from Fragments (Remixes).",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio(
      "Eyes On Me (Vivid Fever Dreams Remix)",
      "/audio/eyes-on-me-vivid-fever-dreams-remix.mp3",
      "3:35",
      "Broey. — remixed by Vivid Fever Dreams",
    ),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Wanted (KAIYO Remix)",
    slug: "wanted-kaiyo-remix",
    parentReleaseSlug: "fragments-remixes",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2024,
    description:
      "A KAIYO remix that flips Wanted into a compact, direct electronic cut.",
    mood: "Compact, direct electronic remix of Wanted.",
    tags: ["Fragments Remixes", "Remix", "Electronic"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Remixer", name: "KAIYO" },
    ],
    seoTitle: "Wanted (KAIYO Remix) by Broey.",
    seoDescription:
      "Listen to Wanted (KAIYO Remix), a compact electronic remix from Fragments (Remixes).",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio(
      "Wanted (KAIYO Remix)",
      "/audio/wanted-kaiyo-remix.mp3",
      "3:04",
      "Broey. — remixed by KAIYO",
    ),
    links: [],
    catalogStatus: "manual",
  },
  {
    title: "Eyes On Me (ExMaxhina Remix)",
    slug: "eyes-on-me-exmaxhina-remix",
    parentReleaseSlug: "fragments-remixes",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    year: 2024,
    description:
      "An ExMaxhina remix that stretches Eyes On Me into a wider electronic shape.",
    mood: "Wider electronic remix of Eyes On Me.",
    tags: ["Fragments Remixes", "Remix", "Electronic"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Remixer", name: "ExMaxhina" },
    ],
    seoTitle: "Eyes On Me (ExMaxhina Remix) by Broey.",
    seoDescription:
      "Listen to Eyes On Me (ExMaxhina Remix), a wider electronic remix from Fragments (Remixes).",
    coverImage: "/assets/cover-art/fragments-remixes.jpg",
    coverAlt: "Fragments (Remixes) cover art",
    audio: localAudio(
      "Eyes On Me (ExMaxhina Remix)",
      "/audio/eyes-on-me-exmaxhina-remix.mp3",
      "4:22",
      "Broey. — remixed by ExMaxhina",
    ),
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
    description: "A compact GLFM catalog entry with warm synth color and punchy percussion.",
    mood: "Warm synth color with punchy percussion.",
    tags: ["EP", "Warm synths", "Percussive"],
    seoTitle: "GLFM by Broey.",
    seoDescription:
      "Listen to GLFM by Broey, a compact catalog entry with warm synth color and punchy percussion.",
    about: [
      "GLFM pairs warm synth color with punchy percussion and appears on dancing dumpster fire.",
    ],
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
      "A two-version deep-house release with a concise radio edit and a longer extended mix.",
    mood: "Deep-house shape in a tight radio edit and a longer club-facing mix.",
    tags: ["Electronic", "Club", "Late-night"],
    seoTitle: "blu. by Broey.",
    seoDescription:
      "Listen to blu. by Broey, a two-version deep-house release with a radio edit and extended mix.",
    about: [
      "blu. is built as a two-version deep-house release: a concise radio edit for standard listening and an extended version with more room for the groove.",
      "The release is framed by its format: one tighter version for quick listening and one longer mix with more space for the club-facing groove.",
    ],
    coverImage: "/assets/cover-art/blu.png",
    coverAlt: "blu. cover art",
    playerAccent: "#4d91bd",
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
      "A bright Fragments-era single with clipped rhythm, quick melodic turns, and a clean electronic snap.",
    mood: "Clipped rhythm, quick melodic turns, and clean electronic snap.",
    tags: ["Electronic", "Single", "Fragments"],
    seoTitle: "Like That by Broey.",
    seoDescription:
      "Listen to Like That by Broey, a bright Fragments-era single with clipped rhythm and clean electronic snap.",
    about: [
      "Like That is a compact Fragments-era single with clipped rhythm and quick melodic turns.",
      "It works as a clean entry point into that 2024 pocket of the catalog, where Broey was pulling the older melodic instincts into sharper drums and more direct electronic shapes.",
    ],
    coverImage: "/assets/cover-art/like-that.jpg",
    coverAlt: "Like That cover art",
    playerAccent: "#5f9fad",
    audio: localAudio("Like That", "/audio/like-that.mp3", "2:32"),
    links: [
      link("Spotify", "https://open.spotify.com/album/5HzzutixZ8qVwIqUdhrRe7", "streaming", false),
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
    title: "Contrast",
    slug: "contrast",
    type: "ep",
    visibility: "public",
    year: 2023,
    releaseDate: "2023-08-04",
    description:
      "A three-track 2023 project centered on Falling, drum and bass pressure, and Almost Anyone's longer remix versions.",
    mood: "Falling, reshaped through drum and bass pressure and Almost Anyone's extended remixes.",
    tags: ["EP", "Drum & Bass", "Jungle", "Remix"],
    credits: [
      { role: "Artist", name: "Broey." },
    ],
    seoTitle: "Contrast by Broey.",
    seoDescription:
      "Listen to Contrast by Broey, a three-track 2023 project featuring Falling and Almost Anyone remixes.",
    about: [
      "Contrast is a 2023 Broey project built around Falling and two Almost Anyone remix versions. The release ties fast drum and bass, jungle pressure, and brighter club-facing remix work into a compact three-track run.",
      "It sits in the discography as a bridge between the earlier DnB/electronic run and the later Fragments-era catalog.",
    ],
    coverImage: "/assets/cover-art/contrast.jpg",
    coverAlt: "Contrast cover art",
    audio: {
      type: "project",
      title: "Contrast",
      artist: "Broey.",
      artwork: "/assets/cover-art/contrast.jpg",
      tracks: [
        {
          title: "Falling",
          slug: "contrast-falling",
          audioKey: "contrast-falling",
          artist: "Broey.",
          duration: "2:50",
          src: "/audio/contrast-falling.mp3",
        },
        {
          title: "Falling (Almost Anyone Remix)",
          slug: "contrast-falling-almost-anyone-remix",
          audioKey: "contrast-falling-almost-anyone-remix",
          artist: "Broey. — remixed by Almost Anyone",
          duration: "6:36",
          src: "/audio/contrast-falling-almost-anyone-remix.mp3",
        },
        {
          title: "Origins (Almost Anyone Remix)",
          slug: "contrast-origins-almost-anyone-remix",
          audioKey: "contrast-origins-almost-anyone-remix",
          artist: "Broey. — remixed by Almost Anyone",
          duration: "5:05",
          src: "/audio/contrast-origins-almost-anyone-remix.mp3",
        },
      ],
    },
    links: [
      link("Disco", "https://s.disco.ac/asdexfkgdpvx", "disco", true),
      link("Spotify", "https://open.spotify.com/album/3o65TaH8pFQ5Ls0e3lO8ij"),
      link(
        "Apple Music",
        "https://music.apple.com/us/album/contrast-single/1694344760?uo=4",
        "streaming",
        false,
      ),
      link("TIDAL", "https://tidal.com/browse/album/301898934", "streaming", false),
      link("Deezer", "https://www.deezer.com/album/458008805", "streaming", false),
      link("Amazon Music", "https://music.amazon.com/albums/B0C9F66L5B", "streaming", false),
    ],
    tracklist: [
      {
        title: "Falling",
        slug: "contrast-falling",
        audioKey: "contrast-falling",
        artist: "Broey.",
        duration: "2:50",
      },
      {
        title: "Falling (Almost Anyone Remix)",
        slug: "contrast-falling-almost-anyone-remix",
        audioKey: "contrast-falling-almost-anyone-remix",
        artist: "Broey. — remixed by Almost Anyone",
        duration: "6:36",
      },
      {
        title: "Origins (Almost Anyone Remix)",
        slug: "contrast-origins-almost-anyone-remix",
        audioKey: "contrast-origins-almost-anyone-remix",
        artist: "Broey. — remixed by Almost Anyone",
        duration: "5:05",
      },
    ],
    disco: {
      publicUrl: "https://s.disco.ac/asdexfkgdpvx",
    },
    details: [
      { label: "Catalogue number", value: "CAT876424" },
      { label: "UPC", value: "197773344582" },
    ],
    catalogStatus: "tidal",
    catalogSource: {
      provider: "tidal",
      source: "tidal",
      sourceUrl: "https://tidal.com/browse/album/301898934",
      tidalId: "301898934",
      externalIds: {
        "itunes": "1694344760",
        "tidal": "301898934",
      },
      artistName: "Broey.",
      collectionName: "Contrast",
      collectionType: "EP",
      isCollection: true,
      suggestedTileType: "collectionTile",
      artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c5/9b/1f/c59b1f73-0606-c7d5-1a07-30af9ba1c02f/197773344582_cover.jpg/1000x1000bb.jpg",
      trackCount: 3,
      rawKind: "albums",
    },
  },
  {
    title: "Falling",
    slug: "contrast-falling",
    parentReleaseSlug: "contrast",
    isProjectTrack: true,
    showInArchive: false,
    type: "single",
    visibility: "public",
    year: 2023,
    releaseDate: "2023-08-04",
    description:
      "The core Contrast track, built from fast drum and bass and electronic production.",
    mood: "Fast drum and bass track from Contrast.",
    tags: ["Contrast", "Drum & Bass", "Electronic"],
    seoTitle: "Falling by Broey.",
    seoDescription:
      "Listen to Falling by Broey, the core track from Contrast.",
    about: [
      "Falling is the center of Contrast: a fast, compact DnB/electronic track from the catalog's shift into heavier production.",
    ],
    coverImage: "/assets/cover-art/contrast.jpg",
    coverAlt: "Contrast cover art",
    links: [
      link("Disco", "https://s.disco.ac/asdexfkgdpvx", "disco", true),
    ],
    tracklist: ["Falling"],
    catalogStatus: "manual",
  },
  {
    title: "Falling (Almost Anyone Remix)",
    slug: "contrast-falling-almost-anyone-remix",
    parentReleaseSlug: "contrast",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    visibility: "public",
    year: 2023,
    releaseDate: "2023-08-04",
    artistName: "Broey.",
    description:
      "Almost Anyone's extended remix of Falling, stretching the track into a brighter club-facing shape.",
    mood: "Extended club-facing remix with bright melodic lift.",
    tags: ["Contrast", "Remix", "Electronic"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Remixer", name: "Almost Anyone" },
      { role: "Composer", name: "Joseph Montaro, Alex Reade" },
    ],
    seoTitle: "Falling (Almost Anyone Remix) by Broey.",
    seoDescription:
      "Listen to Falling (Almost Anyone Remix) by Broey., remixed by Almost Anyone, from Contrast.",
    about: [
      "Almost Anyone's remix stretches Falling into a longer, brighter club-facing version.",
    ],
    coverImage: "/assets/cover-art/contrast.jpg",
    coverAlt: "Contrast cover art",
    links: [
      link("Disco", "https://s.disco.ac/asdexfkgdpvx", "disco", true),
    ],
    tracklist: ["Falling (Almost Anyone Remix)"],
    details: [
      { label: "BPM", value: "129" },
    ],
    catalogStatus: "manual",
  },
  {
    title: "Origins (Almost Anyone Remix)",
    slug: "contrast-origins-almost-anyone-remix",
    parentReleaseSlug: "contrast",
    isProjectTrack: true,
    showInArchive: false,
    type: "remix",
    visibility: "public",
    year: 2023,
    releaseDate: "2023-08-04",
    artistName: "Broey.",
    description:
      "Almost Anyone's Origins remix closes Contrast with a longer electronic reshape and brighter melodic lift.",
    mood: "Longer electronic remix with a brighter melodic lift.",
    tags: ["Contrast", "Remix", "Electronic"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Remixer", name: "Almost Anyone" },
      { role: "Composer", name: "Joseph Montaro, Alex Reade" },
    ],
    seoTitle: "Origins (Almost Anyone Remix) by Broey.",
    seoDescription:
      "Listen to Origins (Almost Anyone Remix) by Broey., remixed by Almost Anyone, from Contrast.",
    about: [
      "Almost Anyone's Origins remix closes Contrast by pulling the project into a longer, melodic electronic version.",
    ],
    coverImage: "/assets/cover-art/contrast.jpg",
    coverAlt: "Contrast cover art",
    links: [
      link("Disco", "https://s.disco.ac/asdexfkgdpvx", "disco", true),
    ],
    tracklist: ["Origins (Almost Anyone Remix)"],
    catalogStatus: "manual",
  },
  {
    title: "Hold On",
    slug: "hold-on",
    type: "single",
    visibility: "public",
    year: 2023,
    releaseDate: "2023-05-08",
    description:
      "A melodic electronic single built around steady tension and soft release.",
    mood: "Melodic electronic single with steady tension.",
    tags: ["Electronic", "Melodic", "Single", "Drum & Bass", "Jungle"],
    seoTitle: "Hold On by Broey.",
    seoDescription:
      "Listen to Hold On by Broey, a melodic electronic single with steady tension.",
    about: [
      "Hold On sits in the transition stretch before the newer club records took over the front of the catalog. The production is patient, melodic, and steady.",
      "It is still connected to the broader electronic direction, but its center is restraint: a single built around tension and release.",
    ],
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
      "A Cryztal Grid and Broey collaboration from the shift into heavier electronic production.",
    mood: "Cryztal Grid and Broey collaboration with heavier electronic production.",
    tags: ["Collaboration", "Club", "Electronic", "Dubstep"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Collaborator", name: "Cryztal Grid" },
    ],
    seoTitle: "Warning by Cryztal Grid & Broey.",
    seoDescription:
      "Listen to Warning by Cryztal Grid & Broey., a collaboration with heavier electronic production.",
    about: [
      "Warning catches Broey in collaboration with Cryztal Grid during the move away from softer lo-fi framing and toward heavier, more physical electronic production.",
      "The track is useful context for the current catalog because it points toward the later club-facing work.",
    ],
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
      "A DNB/electronic track from the early shift away from lo-fi and into faster production.",
    mood: "Fast DNB/electronic track from the transition catalog.",
    tags: ["Electronic", "DNB", "Transition"],
    seoTitle: "hysteria by Broey.",
    seoDescription:
      "Listen to hysteria by Broey, a DNB/electronic track from the early shift into faster production.",
    about: [
      "hysteria marks an earlier break from the softer lo-fi frame, pushing into faster DNB/electronic production.",
      "It is not as polished or club-shaped as the newest records, but it matters as an early signal of the later catalog.",
    ],
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
      "A Broey and Mr. Hilroy single with soft-focus melody and a lighter electronic arrangement.",
    mood: "Soft-focus melody and a lighter electronic arrangement.",
    tags: ["Collaboration", "Melodic", "Single"],
    credits: [
      { role: "Artist", name: "Broey." },
      { role: "Collaborator", name: "Mr. Hilroy" },
    ],
    seoTitle: "After You by Broey. & Mr. Hilroy",
    seoDescription:
      "Listen to After You by Broey. & Mr. Hilroy, a soft-focus melodic single with reflective space.",
    about: [
      "After You sits in the older archive as a softer collaboration with Mr. Hilroy, built around melody and a lighter arrangement.",
      "It is not part of the current club-facing run, but it helps show the quieter side of the catalog that fed into the later production instincts.",
    ],
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
    visibility: "draft",
    year: 2019,
    releaseDate: "2019-03-23",
    description:
      "An early Broey single with bright melody and a light electronic arrangement.",
    mood: "Bright melody and a light electronic arrangement.",
    tags: ["Electronic", "Early catalog", "Single"],
    seoTitle: "Paradise by Broey.",
    seoDescription:
      "Listen to Paradise by Broey, an early single with bright melody and a light electronic arrangement.",
    about: [
      "Paradise is an early catalog entry: bright, open, and lighter on its feet than the newer dance-focused records.",
    ],
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
  ] satisfies ReleaseEntry[]) as ReleaseEntry[])
    .map(mergeGeneratedRelease)
    .filter((release) => release.visibility !== "draft"),
);
