import {
  musicRegistryTracks,
  type GeneratedTrackRegistry,
} from "@/content/musicRegistry.generated";
import type { ReleaseEntry } from "@/content/releases";

// Keys are normalized source values. Values are the owner-editable public labels.
const genreTaxonomy: Record<string, readonly string[]> = {
  "alternative electronic": ["Alternative Electronic"],
  bass: ["Bass"],
  "bass house": ["Bass House"],
  bassline: ["Bassline"],
  breakbeat: ["Breakbeat"],
  breakbeats: ["Breakbeat"],
  chillout: ["Chillout"],
  club: ["Club"],
  dance: ["Dance"],
  "dance / electro pop": ["Dance", "Electro Pop"],
  "deep house": ["Deep House"],
  dnb: ["Drum & Bass"],
  "drum & bass": ["Drum & Bass"],
  "drum and bass": ["Drum & Bass"],
  dubstep: ["Dubstep"],
  "dubstep / trap": ["Dubstep", "Trap"],
  electronic: ["Electronic"],
  electronica: ["Electronica"],
  "future garage": ["Future Garage"],
  "future garage / uk garage": ["Future Garage", "UK Garage"],
  garage: ["Garage"],
  house: ["House"],
  "house (old school)": ["Old School House"],
  jungle: ["Jungle"],
  "jungle / dnb": ["Jungle", "Drum & Bass"],
  "old school house": ["Old School House"],
  "raw electronic": ["Electronic"],
  "speed house": ["Speed House"],
  "tech house": ["Tech House"],
  trance: ["Trance"],
  "trance (main floor)": ["Trance"],
  trap: ["Trap"],
  "trap / wave": ["Trap", "Wave"],
  "uk garage": ["UK Garage"],
  "uk garage / bassline": ["UK Garage", "Bassline"],
  ukg: ["UK Garage"],
  wave: ["Wave"],
};

export const curatedGenreFilters = [
  "House",
  "Drum & Bass",
  "Jungle",
  "Dubstep",
  "Garage",
  "Breakbeat",
  "Electronic",
] as const;

export type CuratedGenreFilter = (typeof curatedGenreFilters)[number];

export const curatedGenreTaxonomy: Readonly<
  Record<CuratedGenreFilter, readonly string[]>
> = {
  House: [
    "House",
    "Deep House",
    "Bass House",
    "Tech House",
    "Old School House",
    "Speed House",
  ],
  "Drum & Bass": ["Drum & Bass"],
  Jungle: ["Jungle"],
  Dubstep: ["Dubstep"],
  Garage: ["Garage", "UK Garage", "Bassline"],
  Breakbeat: ["Breakbeat"],
  Electronic: [
    "Electronic",
    "Alternative Electronic",
    "Electro Pop",
    "Chillout",
    "Club",
    "Dance",
    "Bass",
    "Trance",
    "Trap",
  ],
};

const genreKey = (value: string) =>
  value
    .normalize("NFKC")
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();

const trackRegistryBySlug = new Map<string, GeneratedTrackRegistry>(
  musicRegistryTracks.map((track) => [track.trackSlug, track] as [string, GeneratedTrackRegistry]),
);

const trackGenreValues = (release: ReleaseEntry) => {
  if (!release.isProjectTrack) {
    return [];
  }

  const track = trackRegistryBySlug.get(release.slug) as
    | (GeneratedTrackRegistry & {
        mainGenre?: string;
        edmGenre?: string;
        customGenre?: string;
      })
    | undefined;

  const genres: Array<string | undefined> = [
    track?.mainGenre,
    track?.edmGenre,
    track?.customGenre,
  ];

  return genres.filter(
    (genre): genre is string => typeof genre === "string" && Boolean(genre),
  );
};

export function normalizeGenreValues(values: readonly string[]) {
  const normalized = values.flatMap((value) => genreTaxonomy[genreKey(value)] ?? []);

  return normalized.filter(
    (genre, index, list) =>
      list.findIndex((candidate) => candidate.toLowerCase() === genre.toLowerCase()) === index,
  );
}

export function normalizedGenres(release: ReleaseEntry) {
  const sourceValues: Array<string | undefined> = [
    ...(release.registry?.genres ?? []),
    ...trackGenreValues(release),
    ...(release.tags ?? []),
  ];

  return normalizeGenreValues(
    sourceValues.filter((genre): genre is string => typeof genre === "string"),
  );
}

export function curatedGenreFiltersForGenres(detailedGenres: readonly string[]) {
  const normalizedDetailedGenres = new Set(detailedGenres.map(genreKey));

  return curatedGenreFilters.filter((filter) =>
    curatedGenreTaxonomy[filter].some((genre) =>
      normalizedDetailedGenres.has(genreKey(genre)),
    ),
  );
}

export function curatedGenreFiltersForRelease(release: ReleaseEntry) {
  return curatedGenreFiltersForGenres(normalizedGenres(release));
}

export function availableGenresForReleases(releaseList: readonly ReleaseEntry[]) {
  const genres = releaseList
    .filter((release) => release.visibility !== "draft")
    .flatMap(normalizedGenres);

  return genres
    .filter(
      (genre, index, list) =>
        list.findIndex((candidate) => candidate.toLowerCase() === genre.toLowerCase()) === index,
    )
    .sort((left, right) => left.localeCompare(right));
}
