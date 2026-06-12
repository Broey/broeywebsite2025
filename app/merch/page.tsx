import type { Metadata } from "next";
import { MerchCard } from "@/components/ui/MerchCard";
import { MerchArtwork } from "@/components/ui/MerchArtwork";
import { PageIntro } from "@/components/ui/PageIntro";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createPageMetadata } from "@/content/seo";
import { getMerchProducts } from "@/lib/shopify-merch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Merch",
  description:
    "Official Broey. merch with current wearables and physical pieces opening in the Broey Shopify store.",
  path: "/merch",
});

export default async function MerchPage() {
  const merch = await getMerchProducts();
  const featured =
    merch.find((item) => item.slug === "beats-hoodie") ??
    merch.find((item) => item.featured) ??
    merch[0];
  const categories = Array.from(new Set(merch.map((item) => item.category)));
  const categorySummary = categories.map((category) => category.toLowerCase()).join(" / ");

  return (
    <section className="merch-page inner-page" aria-labelledby="merch-page-title">
      <div className="merch-page-shell">
        <PageIntro
          eyebrow="/ merch"
          title="Merch"
          titleId="merch-page-title"
          description="Broey wearables and physical pieces."
        />

        <header className="hero-panel merch-hero">
          <div className="merch-hero-copy-block">
            <p className="merch-kicker">Featured piece</p>
            <h2 className="merch-store-title">{featured.title}</h2>
            <p className="merch-hero-copy">
              The current Broey piece from the official store.
            </p>
            <a
              href={featured.href}
              target="_blank"
              rel="noopener noreferrer"
              className="merch-text-link merch-hero-action"
            >
              <span>Shop featured piece</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <a
            href={featured.href}
            target="_blank"
            rel="noopener noreferrer"
            className="merch-featured-card"
          >
            <MerchArtwork
              item={featured}
              className="merch-featured-artwork"
              sizes="(min-width: 1180px) 17rem, (min-width: 768px) 28vw, 92vw"
            />
            <div className="merch-featured-copy">
              <p className="merch-featured-kicker">{featured.category}</p>
              <h3 className="merch-featured-title">Featured item</h3>
              <div className="merch-featured-action-row">
                <span className="merch-price">{featured.price}</span>
                <span className="merch-text-link">
                  View item <span aria-hidden="true">&rarr;</span>
                </span>
              </div>
            </div>
          </a>
        </header>

        <section className="merch-store-panel" aria-labelledby="merch-store-title">
          <SectionHeader
            eyebrow="Shopify store"
            title="Available Pieces"
            titleId="merch-store-title"
            meta={`${merch.length} items / ${categorySummary}`}
          />

          <div className="merch-grid">
            {merch.map((item) => (
              <MerchCard key={item.slug} item={item} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
