"use client";

import { type ReactNode, useMemo, useState } from "react";

export type MusicCatalogRelease = {
  id: string;
  genres: string[];
  card: ReactNode;
};

export type MusicCatalogSection = {
  id: string;
  className: string;
  header: ReactNode;
  gridClassName: string;
  releases: MusicCatalogRelease[];
};

type MusicCatalogFilterProps = {
  genres: string[];
  sections: MusicCatalogSection[];
};

export function MusicCatalogFilter({
  genres,
  sections,
}: MusicCatalogFilterProps) {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const filteredSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          releases:
            selectedGenre === "All"
              ? section.releases
              : section.releases.filter((release) =>
                  release.genres.includes(selectedGenre),
                ),
        }))
        .filter((section) => section.releases.length > 0),
    [sections, selectedGenre],
  );
  const matchingCount = filteredSections.reduce(
    (count, section) => count + section.releases.length,
    0,
  );

  return (
    <div className="music-catalog-filter">
      <div className="music-filter-toolbar">
        <div className="music-filter-heading">
          <p className="release-detail-section-kicker">Filter by genre</p>
          <p className="music-filter-count" aria-live="polite">
            {matchingCount} {matchingCount === 1 ? "release" : "releases"}
          </p>
        </div>
        <div className="music-filter-controls" role="group" aria-label="Filter releases by genre">
          {["All", ...genres].map((genre) => (
            <button
              key={genre}
              type="button"
              className="music-filter-button"
              data-selected={selectedGenre === genre ? "true" : "false"}
              aria-pressed={selectedGenre === genre}
              aria-controls="music-release-catalog"
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div id="music-release-catalog">
        {filteredSections.map((section) => (
          <div key={section.id} className={section.className}>
            {section.header}
            <div className={section.gridClassName}>
              {section.releases.map((release) => (
                <div key={release.id}>{release.card}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {matchingCount === 0 ? (
        <p className="music-filter-empty" role="status">
          No approved releases match this genre.
        </p>
      ) : null}
    </div>
  );
}
