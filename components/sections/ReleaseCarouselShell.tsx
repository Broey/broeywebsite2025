"use client";

import { useEffect, useRef, useState } from "react";

type ReleaseCarouselShellProps = {
  labelledBy: string;
  children: React.ReactNode;
};

export function ReleaseCarouselShell({
  labelledBy,
  children,
}: ReleaseCarouselShellProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const dragStart = useRef<{ x: number; scrollLeft: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveCard = () => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-carousel-card]"));
    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(trackCenter - cardCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    cards.forEach((card, index) => {
      card.dataset.active = index === closestIndex ? "true" : "false";
    });
    setActiveIndex(closestIndex);
  };

  const scrollByCard = (direction: "previous" | "next") => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-carousel-card]"));
    const nextIndex =
      direction === "next"
        ? Math.min(activeIndex + 1, cards.length - 1)
        : Math.max(activeIndex - 1, 0);

    cards[nextIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  useEffect(() => {
    updateActiveCard();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div className="mt-5 max-w-full overflow-hidden">
      <div className="mb-3 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase text-[var(--color-muted)] backdrop-blur transition hover:border-[var(--color-cyan)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)] disabled:cursor-not-allowed disabled:opacity-35"
          onClick={() => scrollByCard("previous")}
          disabled={activeIndex === 0}
          aria-label="Show previous release"
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase text-[var(--color-muted)] backdrop-blur transition hover:border-[var(--color-cyan)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)] disabled:cursor-not-allowed disabled:opacity-35"
          onClick={() => scrollByCard("next")}
          aria-label="Show next release"
        >
          Next
        </button>
      </div>
      <div
        ref={trackRef}
        role="region"
        aria-labelledby={labelledBy}
        tabIndex={0}
        className="release-carousel-scroll flex max-w-full cursor-grab touch-pan-x snap-x snap-mandatory gap-4 overflow-x-auto pb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)] active:cursor-grabbing"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollByCard("next");
          }

          if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollByCard("previous");
          }
        }}
        onScroll={() => {
          if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
          }

          frameRef.current = requestAnimationFrame(updateActiveCard);
        }}
        onPointerDown={(event) => {
          const track = trackRef.current;

          if (!track) {
            return;
          }

          dragStart.current = {
            x: event.clientX,
            scrollLeft: track.scrollLeft,
          };
          track.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const track = trackRef.current;
          const start = dragStart.current;

          if (!track || !start) {
            return;
          }

          track.scrollLeft = start.scrollLeft - (event.clientX - start.x);
        }}
        onPointerUp={() => {
          dragStart.current = null;
          updateActiveCard();
        }}
        onPointerCancel={() => {
          dragStart.current = null;
          updateActiveCard();
        }}
      >
        {children}
      </div>
    </div>
  );
}
