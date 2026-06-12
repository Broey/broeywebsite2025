"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { PendingArtwork } from "@/components/ui/PendingArtwork";
import { hasLiveShopAction, type MerchProduct } from "@/content/merch";

type MerchMobileBrowserProps = {
  categories: string[];
  merch: MerchProduct[];
};

const categoryLabel = (category: string) => {
  const normalized = category.trim();

  if (/hoodie/i.test(normalized)) return "Hoodies";
  if (/crewneck/i.test(normalized)) return "Crewnecks";
  if (/hat/i.test(normalized)) return "Hats";

  return normalized;
};

function MobileMerchCard({ item }: { item: MerchProduct }) {
  return (
    <article className="merch-card">
      {item.image ? (
        <div className="merch-artwork-frame merch-card-artwork">
          <Image
            src={item.image}
            alt={item.imageAlt ?? `${item.title} product image`}
            fill
            sizes="92vw"
            className="merch-artwork-image"
          />
        </div>
      ) : (
        <PendingArtwork
          alt={`${item.title} product image`}
          eyebrow="Merch"
          label={item.title}
          className="merch-card-artwork"
        />
      )}
      <div className="merch-card-copy">
        <p className="merch-card-category">{item.category}</p>
        <h3 className="merch-card-title">{item.title}</h3>
        <p className="merch-card-price">{item.price}</p>
        <p className="merch-card-description">{item.description}</p>
        {hasLiveShopAction(item) ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="merch-card-action"
          >
            <span>View item</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function MerchMobileBrowser({ categories, merch }: MerchMobileBrowserProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const trackRef = useRef<HTMLDivElement>(null);
  const filters = useMemo(() => ["All", ...categories], [categories]);
  const visibleMerch =
    activeCategory === "All"
      ? merch
      : merch.filter((item) => item.category === activeCategory);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [activeCategory]);

  return (
    <div className="merch-mobile-browser" aria-label="Mobile merch browser">
      <div className="merch-mobile-filter-row" aria-label="Filter merch by category">
        {filters.map((category) => (
          <button
            key={category}
            type="button"
            className="merch-filter-chip"
            data-active={activeCategory === category ? "true" : "false"}
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {category === "All" ? "All" : categoryLabel(category)}
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visibleMerch.length} merch {visibleMerch.length === 1 ? "item" : "items"}.
      </p>

      <div ref={trackRef} className="merch-mobile-track">
        {visibleMerch.map((item) => (
          <div key={item.slug} className="merch-mobile-slide">
            <MobileMerchCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
