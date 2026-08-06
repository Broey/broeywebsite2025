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

const releaseRoleAttribution = (release: ReleaseEntry) =>
  (release.credits ?? [])
    .filter((credit) => credit.role === "Featured Artist" || credit.role === "Remixer")
    .map((credit) =>
      credit.role === "Featured Artist"
        ? `featuring ${credit.name}`
        : `remixed by ${credit.name}`,
    )
    .join(", ");

export function releaseFactualDescription(release: ReleaseEntry) {
  const artist = releaseDisplayArtist(release);
  const roleAttribution = releaseRoleAttribution(release);
  const artistAttribution = [artist, roleAttribution].filter(Boolean).join(", ");
  const releaseType = release.isProjectTrack ? "track" : releaseTypeLabel[release.type];
  const primaryGenre = normalizedGenres(release)[0];
  const factualType = [primaryGenre, releaseType].filter(Boolean).join(" ");
  const article = /^[aeiou]/i.test(factualType) ? "an" : "a";
  const year = release.year ?? release.releaseDate?.match(/^\d{4}/)?.[0];

  if (!year) {
    return `Listen to ${release.title} by ${artistAttribution}.`;
  }

  return `Listen to ${release.title} by ${artistAttribution}, ${article} ${factualType} released in ${year}.`;
}
