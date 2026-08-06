"use client";

import { type ReactNode, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";

export type MusicCatalogRelease = {
  id: string;
  filterGroups: readonly string[];
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
  filters: readonly string[];
  sections: MusicCatalogSection[];
};

export function MusicCatalogFilter({
  filters,
  sections,
}: MusicCatalogFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const filteredSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          releases:
            selectedFilter === "All"
              ? section.releases
              : section.releases.filter((release) =>
                  release.filterGroups.includes(selectedFilter),
                ),
        }))
        .filter((section) => section.releases.length > 0),
    [sections, selectedFilter],
  );
  const matchingCount = filteredSections.reduce(
    (count, section) => count + section.releases.length,
    0,
  );
  const selectFilter = (filter: string) => {
    if (filter === selectedFilter) {
      return;
    }

    const resultCount = sections.reduce(
      (count, section) => count + section.releases.filter((release) =>
        filter === "All" || release.filterGroups.includes(filter),
      ).length,
      0,
    );

    setSelectedFilter(filter);
    trackEvent("genre_filter", {
      genre: filter,
      result_count: resultCount,
    });
  };

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
          {["All", ...filters].map((filter) => (
            <button
              key={filter}
              type="button"
              className="music-filter-button"
              data-selected={selectedFilter === filter ? "true" : "false"}
              aria-pressed={selectedFilter === filter}
              aria-controls="music-release-catalog"
              onClick={() => selectFilter(filter)}
            >
              {filter}
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
          No releases match this genre.
        </p>
      ) : null}
    </div>
  );
}
