// Server-only projection: approved public metadata, never the full catalog in a client import.
import { curatedGenreFiltersForRelease } from "./genres";
import { isPublishedRelease } from "./release-filters";
import { hasApprovedPublicArtwork } from "../lib/release-artwork";
import { genreId, type PreferenceRelease } from "../lib/music-preferences";
import type { ReleaseEntry } from "./releases";

export const preferenceCatalog = (releases: readonly ReleaseEntry[]): PreferenceRelease[] =>
  releases.filter((release) => isPublishedRelease(release)
    && release.status !== "unreleased"
    && (!release.releaseDate || Date.parse(release.releaseDate) <= Date.now())
    && hasApprovedPublicArtwork(release.coverImage))
    .map((release) => ({ slug: release.slug, family: release.parentReleaseSlug ?? release.slug,
      genres: curatedGenreFiltersForRelease(release).flatMap((label) => {
        const id = genreId(label);
        return id ? [id] : [];
      }),
    }));
