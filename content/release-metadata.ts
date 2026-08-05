import { normalizedGenres } from "@/content/genres";
import type { ReleaseEntry } from "@/content/releases";

const releaseTypeLabel: Record<ReleaseEntry["type"], string> = {
  single: "single",
  ep: "EP",
  remix: "remix",
  mix: "mix",
  set: "set",
};

export const releaseDisplayArtist = (release: ReleaseEntry) =>
  release.artistName ?? release.catalogSource?.artistName ?? "Broey.";

export function releaseFactualDescription(release: ReleaseEntry) {
  const artist = releaseDisplayArtist(release);
  const releaseType = release.isProjectTrack ? "track" : releaseTypeLabel[release.type];
  const primaryGenre = normalizedGenres(release)[0];
  const factualType = [primaryGenre, releaseType].filter(Boolean).join(" ");
  const article = /^[aeiou]/i.test(factualType) ? "an" : "a";
  const year = release.year ?? release.releaseDate?.match(/^\d{4}/)?.[0];

  if (!year) {
    return `Listen to ${release.title} by ${artist}.`;
  }

  return `Listen to ${release.title} by ${artist}, ${article} ${factualType} released in ${year}.`;
}
