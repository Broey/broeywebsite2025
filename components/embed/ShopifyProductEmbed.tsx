import { hasShopifyEmbed, type MerchProduct } from "@/content/merch";

export function ShopifyProductEmbed({ product }: { product: MerchProduct }) {
  const hasEmbed = hasShopifyEmbed(product);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30 p-3 shadow-2xl shadow-black/20">
      {hasEmbed ? (
        <iframe
          title={`${product.title} Shopify product embed`}
          src={product.shopify?.embedUrl}
          loading="lazy"
          className="block min-h-[24rem] w-full max-w-full rounded-lg border-0 bg-black/30"
        />
      ) : (
        <div className="pending-artwork rounded-lg border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase text-[var(--color-amber)]">
            Official Shopify
          </p>
          <h3 className="mt-3 text-xl font-semibold text-white">{product.title}</h3>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            This item opens in the official Broey Shopify store.
          </p>
          <a
            href={product.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--color-amber)] bg-[var(--color-amber)] px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-300"
          >
            View item
          </a>
        </div>
      )}
    </div>
  );
}
