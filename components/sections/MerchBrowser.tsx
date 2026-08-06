"use client";

import { type MouseEvent, type ReactNode, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type MerchBrowserItem = {
  card: ReactNode;
  category: string;
  slug: string;
  title: string;
};

type MerchBrowserProps = {
  categories: string[];
  items: MerchBrowserItem[];
};

const categoryLabel = (category: string) => {
  const normalized = category.trim();

  if (/hoodie/i.test(normalized)) return "Hoodies";
  if (/crewneck/i.test(normalized)) return "Crewnecks";
  if (/hat/i.test(normalized)) return "Hats";

  return normalized;
};

export function MerchBrowser({ categories, items }: MerchBrowserProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const filters = useMemo(() => ["All", ...categories], [categories]);
  const visibleItems =
    activeCategory === "All"
      ? items
      : items.filter((item) => item.category === activeCategory);
  const activeCategoryLabel =
    activeCategory === "All" ? "all categories" : categoryLabel(activeCategory);

  const handleProductClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const productLink = event.target.closest("a[href]");
    const productContainer = event.target.closest<HTMLElement>("[data-merch-slug]");

    if (!productLink || !productContainer?.dataset.merchSlug) {
      return;
    }

    const item = items.find(({ slug }) => slug === productContainer.dataset.merchSlug);

    if (!item) {
      return;
    }

    trackEvent("merch_click", {
      product_title: item.title,
      category: item.category,
      source_surface: "merch_page",
    });
  };

  return (
    <div className="merch-browser" aria-label="Merch browser">
      <div className="merch-filter-row" aria-label="Filter merch by category">
        {filters.map((category) => (
          <button
            key={category}
            type="button"
            className="merch-filter-chip"
            data-active={activeCategory === category ? "true" : "false"}
            aria-pressed={activeCategory === category}
            aria-controls="merch-product-grid"
            onClick={() => setActiveCategory(category)}
          >
            {category === "All" ? "All" : categoryLabel(category)}
          </button>
        ))}
      </div>

      <p className="merch-results-status" role="status" aria-live="polite">
        Showing {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"} in{" "}
        {activeCategoryLabel}.
      </p>

      {visibleItems.length ? (
        <div id="merch-product-grid" className="merch-grid" onClick={handleProductClick}>
          {visibleItems.map((item) => (
            <div key={item.slug} className="merch-grid-item" data-merch-slug={item.slug}>
              {item.card}
            </div>
          ))}
        </div>
      ) : (
        <p id="merch-product-grid" className="merch-empty-state">
          No merch items are available in this category.
        </p>
      )}
    </div>
  );
}
