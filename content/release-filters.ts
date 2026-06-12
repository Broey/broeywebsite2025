import type { ReleaseEntry } from "@/content/releases";

export const releaseSortValue = (release: ReleaseEntry) => {
  if (release.releaseDate) {
    const parsedDate = Date.parse(release.releaseDate);

    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }

    const releaseYear = Number(release.releaseDate.slice(0, 4));

    if (Number.isFinite(releaseYear)) {
      return Date.UTC(releaseYear, 0, 1);
    }
  }

  return release.year ? Date.UTC(release.year, 0, 1) : 0;
};

export const sortReleasesNewestFirst = <T extends ReleaseEntry>(releaseList: T[]) =>
  [...releaseList].sort((a, b) => releaseSortValue(b) - releaseSortValue(a));

export const showReleaseInArchive = (release: ReleaseEntry) =>
  release.showInArchive === true ||
  Boolean(release.isFocusTrack) ||
  (release.showInArchive !== false && !release.isProjectTrack);

export const showReleaseInSitemap = (release: ReleaseEntry) =>
  release.showInSitemap !== false;

export const archiveReleases = <T extends ReleaseEntry>(releases: T[]) =>
  releases.filter(showReleaseInArchive);

export const sortedArchiveReleases = <T extends ReleaseEntry>(releases: T[]) =>
  sortReleasesNewestFirst(archiveReleases(releases));
