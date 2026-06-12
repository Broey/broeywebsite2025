import Link from "next/link";
import { MerchArtwork } from "@/components/ui/MerchArtwork";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { hasLiveShopAction, merch, type MerchProduct } from "@/content/merch";

function HomepageMerchCard({ item }: { item: MerchProduct }) {
  const hasShopLink = hasLiveShopAction(item);

  return (
    <article className="homepage-merch-card group">
      <MerchArtwork
        item={item}
        className="homepage-merch-artwork"
        sizes="(min-width: 1280px) 22vw, (min-width: 768px) 42vw, 92vw"
      />
      <div className="homepage-merch-card-copy">
        <h3 className="homepage-merch-card-title">{item.title}</h3>
        <p className="homepage-merch-card-category">
          {item.category}
        </p>
        <p className="homepage-merch-card-price">
          {item.price}
        </p>
        <div className="homepage-merch-card-action-row">
          {hasShopLink ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="homepage-merch-card-cta"
            >
              View item
            </a>
          ) : (
            <Link href="/merch" className="homepage-merch-card-cta">
              View details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function HomepageMerchSection() {
  const featuredMerch = merch.slice(0, 3);

  return (
    <section aria-labelledby="homepage-merch-title" className="homepage-merch-section">
      <div className="homepage-section-inner">
        <div className="homepage-merch-header">
          <div>
            <SectionLabel>merch</SectionLabel>
            <h2
              id="homepage-merch-title"
              className="homepage-merch-title"
            >
              Wear the signal.
            </h2>
            <p className="homepage-merch-copy">
              Current Broey wearables fulfilled through the official Shopify store.
            </p>
          </div>
          <Link href="/merch" className="homepage-section-cta">
            See merch
          </Link>
        </div>

        <div className="homepage-merch-grid">
          {featuredMerch.map((item) => (
            <HomepageMerchCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
