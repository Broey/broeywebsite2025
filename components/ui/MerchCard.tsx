import { MerchArtwork } from "@/components/ui/MerchArtwork";
import { TrackedMerchLink } from "@/components/analytics/TrackedLinks";
import { hasLiveShopAction, type MerchProduct } from "@/content/merch";
import type { AnalyticsSourceSurface } from "@/lib/analytics";

function MerchAction({
  item,
  compact = false,
  sourceSurface,
}: {
  item: MerchProduct;
  compact?: boolean;
  sourceSurface?: AnalyticsSourceSurface;
}) {
  if (!hasLiveShopAction(item)) {
    return null;
  }

  const className = ["merch-card-action", compact ? "merch-card-action--compact" : ""]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      <span>View item</span>
      <span aria-hidden="true">&rarr;</span>
    </>
  );

  if (!sourceSurface) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <TrackedMerchLink
      href={item.href}
      productTitle={item.title}
      category={item.category}
      sourceSurface={sourceSurface}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {content}
    </TrackedMerchLink>
  );
}

export function MerchCard({
  item,
  compact = false,
  sourceSurface,
}: {
  item: MerchProduct;
  compact?: boolean;
  sourceSurface?: AnalyticsSourceSurface;
}) {
  if (compact) {
    return (
      <article className="merch-card merch-card--compact">
        <MerchArtwork
          item={item}
          className="merch-card-compact-artwork"
          sizes="(min-width: 1280px) 10vw, (min-width: 640px) 22vw, 45vw"
        />
        <div className="merch-card-compact-copy">
          <h3 className="merch-card-compact-title">{item.title}</h3>
          <p className="merch-card-compact-category">{item.category}</p>
          <p className="merch-card-compact-price">{item.price}</p>
          <MerchAction item={item} compact sourceSurface={sourceSurface} />
        </div>
      </article>
    );
  }

  return (
    <article className="merch-card">
      <MerchArtwork
        item={item}
        className="merch-card-artwork"
        sizes="(min-width: 1280px) 360px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
      />
      <div className="merch-card-copy">
        <p className="merch-card-category">{item.category}</p>
        <h3 className="merch-card-title">{item.title}</h3>
        <p className="merch-card-price">{item.price}</p>
        <p className="merch-card-description">{item.description}</p>
        <MerchAction item={item} sourceSurface={sourceSurface} />
      </div>
    </article>
  );
}
