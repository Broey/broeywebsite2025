"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type MusicCatalogFilterProps = {
  genres: string[];
  releaseCount: number;
  children: ReactNode;
};

export function MusicCatalogFilter({
  genres,
  releaseCount,
  children,
}: MusicCatalogFilterProps) {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [matchingCount, setMatchingCount] = useState(releaseCount);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const catalog = catalogRef.current;

    if (!catalog) {
      return;
    }

    const releaseCards = Array.from(
      catalog.querySelectorAll<HTMLElement>("[data-release-genres]"),
    );
    let nextMatchingCount = 0;

    releaseCards.forEach((card) => {
      const cardGenres = (card.dataset.releaseGenres ?? "").split("|").filter(Boolean);
      const isMatch = selectedGenre === "All" || cardGenres.includes(selectedGenre);

      card.hidden = !isMatch;
      if (isMatch) {
        nextMatchingCount += 1;
      }
    });

    catalog.querySelectorAll<HTMLElement>("[data-release-section]").forEach((section) => {
      const sectionCards = Array.from(
        section.querySelectorAll<HTMLElement>("[data-release-genres]"),
      );
      section.hidden = sectionCards.every((card) => card.hidden);
    });

    setMatchingCount(nextMatchingCount);
  }, [releaseCount, selectedGenre]);

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

      <div id="music-release-catalog" ref={catalogRef}>
        {children}
      </div>

      <p className="music-filter-empty" role="status" hidden={matchingCount !== 0}>
        No approved releases match this genre.
      </p>
    </div>
  );
}
