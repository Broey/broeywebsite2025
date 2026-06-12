import "server-only";

import { merch as fallbackMerch, type MerchProduct } from "@/content/merch";

const SHOPIFY_API_VERSION = "2025-01";
const DEFAULT_COLLECTION_HANDLE = "broey-site-merch";
const PRODUCT_LIMIT = 50;
const DESCRIPTION_LIMIT = 150;

type MerchSource = "shopify-token" | "shopify-tokenless" | "fallback";

type ShopifyMoney = {
  amount?: string;
  currencyCode?: string;
};

type ShopifyImage = {
  url?: string;
  altText?: string | null;
};

type StorefrontProductNode = {
  title?: string;
  handle?: string;
  description?: string;
  availableForSale?: boolean;
  productType?: string;
  tags?: string[];
  priceRange?: {
    minVariantPrice?: ShopifyMoney;
  };
  images?: {
    edges?: Array<{
      node?: ShopifyImage | null;
    }>;
  };
};

const warnedReasons = new Set<string>();

function isStorefrontProductNode(
  product?: StorefrontProductNode | null,
): product is StorefrontProductNode {
  return Boolean(product);
}

function readEnv(name: string) {
  return process.env[name]?.trim();
}

function warnFallback(reason: string) {
  if (warnedReasons.has(reason)) {
    return;
  }

  warnedReasons.add(reason);
  console.warn(`[shopify-merch] ${reason}; using manual merch data.`);
}

function infoSource(source: MerchSource, count: number) {
  if (readEnv("SHOPIFY_MERCH_DEBUG_SOURCE") !== "1") {
    return;
  }

  console.info(`[shopify-merch] source=${source} products=${count}`);
}

function sanitizeShopDomain(domain?: string) {
  if (!domain) {
    return undefined;
  }

  const withoutProtocol = domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  return withoutProtocol || undefined;
}

function productUrlForHandle(shopDomain: string, handle: string) {
  return `https://${shopDomain}/products/${handle}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function handleFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    const productIndex = segments.indexOf("products");
    return productIndex >= 0 ? segments[productIndex + 1] : undefined;
  } catch {
    return undefined;
  }
}

const fallbackByHandle = new Map(
  fallbackMerch
    .map((item) => {
      const handle = handleFromUrl(item.href) ?? item.slug;
      return [handle, item] as const;
    })
    .filter(([handle]) => Boolean(handle)),
);

const fallbackByTitle = new Map(fallbackMerch.map((item) => [item.title, item]));
const fallbackOrderByHandle = new Map(
  fallbackMerch.map((item, index) => [handleFromUrl(item.href) ?? item.slug, index]),
);

function matchingFallback(product: { title?: string; handle?: string }) {
  return (
    (product.handle ? fallbackByHandle.get(product.handle) : undefined) ??
    (product.title ? fallbackByTitle.get(product.title) : undefined)
  );
}

function stripHtml(value?: string) {
  return value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateDescription(value?: string) {
  const text = stripHtml(value);

  if (!text || text.length <= DESCRIPTION_LIMIT) {
    return text;
  }

  const clipped = text.slice(0, DESCRIPTION_LIMIT).replace(/\s+\S*$/, "");
  return `${clipped}...`;
}

function formatMoney(money?: ShopifyMoney) {
  const amount = Number(money?.amount);
  const currency = money?.currencyCode ?? "USD";

  if (!Number.isFinite(amount)) {
    return undefined;
  }

  return `${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)} ${currency}`;
}

function firstUsefulTag(tags?: string[]) {
  return tags
    ?.map((tag) => tag.trim())
    .find((tag) => {
      const normalized = tag.toLowerCase();
      return (
        tag &&
        !normalized.startsWith("_") &&
        !normalized.includes("hide") &&
        !normalized.includes("hidden") &&
        normalized !== "broey" &&
        normalized !== "merch"
      );
    });
}

function firstImage(product: StorefrontProductNode) {
  return product.images?.edges?.map((edge) => edge.node).find((image) => image?.url);
}

function normalizeProduct(product: StorefrontProductNode, shopDomain: string): MerchProduct | null {
  const title = product.title?.trim();
  const handle = product.handle?.trim();

  if (!title || !handle) {
    return null;
  }

  const fallback = matchingFallback({ title, handle });
  const image = firstImage(product);
  const description =
    fallback?.description ??
    truncateDescription(product.description) ??
    "Official Broey merch available through Shopify.";

  return {
    title: fallback?.title ?? title,
    slug: fallback?.slug ?? slugify(handle),
    category: fallback?.category ?? (product.productType?.trim() || firstUsefulTag(product.tags) || "Merch"),
    description,
    price:
      fallback?.price ??
      formatMoney(product.priceRange?.minVariantPrice) ??
      "Price available on Shopify",
    href: productUrlForHandle(shopDomain, handle),
    image: fallback?.image ?? image?.url ?? "",
    imageAlt: fallback?.imageAlt ?? image?.altText ?? `${title} product image`,
    featured: fallback?.featured ?? true,
    status: product.availableForSale ? "available" : "sold-out",
    shopify: fallback?.shopify,
  };
}

async function fetchStorefrontProducts({
  shopDomain,
  collectionHandle,
  storefrontToken,
}: {
  shopDomain: string;
  collectionHandle: string;
  storefrontToken?: string;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (storefrontToken) {
    headers["X-Shopify-Storefront-Access-Token"] = storefrontToken;
  }

  const response = await fetch(`https://${shopDomain}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: `
        query BroeyMerchCollection($handle: String!, $first: Int!) {
          collectionByHandle(handle: $handle) {
            title
            products(first: $first) {
              edges {
                node {
                  title
                  handle
                  description
                  availableForSale
                  productType
                  tags
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  images(first: 5) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        handle: collectionHandle,
        first: PRODUCT_LIMIT,
      },
    }),
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`storefront_request_failed_${response.status}`);
  }

  const body = (await response.json()) as {
    data?: {
      collectionByHandle?: {
        products?: {
          edges?: Array<{
            node?: StorefrontProductNode | null;
          }>;
        };
      } | null;
    };
    errors?: unknown[];
  };

  if (body.errors?.length) {
    throw new Error("storefront_graphql_errors");
  }

  const collection = body.data?.collectionByHandle;

  if (!collection) {
    throw new Error("storefront_collection_missing");
  }

  return collection.products?.edges?.map((edge) => edge.node).filter(isStorefrontProductNode) ?? [];
}

function normalizeProducts(products: StorefrontProductNode[], shopDomain: string) {
  return products
    .map((product) => normalizeProduct(product, shopDomain))
    .filter((product): product is MerchProduct => Boolean(product))
    .sort((a, b) => {
      const aHandle = handleFromUrl(a.href) ?? a.slug;
      const bHandle = handleFromUrl(b.href) ?? b.slug;
      const aIndex = fallbackOrderByHandle.get(aHandle) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = fallbackOrderByHandle.get(bHandle) ?? Number.MAX_SAFE_INTEGER;

      return aIndex - bIndex || a.title.localeCompare(b.title);
    });
}

async function getShopifyMerchProducts(): Promise<{
  products: MerchProduct[];
  source: Exclude<MerchSource, "fallback">;
}> {
  const shopDomain = sanitizeShopDomain(readEnv("SHOPIFY_STORE_DOMAIN"));
  const collectionHandle =
    readEnv("SHOPIFY_MERCH_COLLECTION_HANDLE") ?? DEFAULT_COLLECTION_HANDLE;

  if (!shopDomain) {
    throw new Error("missing_shopify_store_domain");
  }

  const storefrontToken = readEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
  const source = storefrontToken ? "shopify-token" : "shopify-tokenless";
  const products = await fetchStorefrontProducts({
    shopDomain,
    collectionHandle,
    storefrontToken,
  });

  return {
    products: normalizeProducts(products, shopDomain),
    source,
  };
}

export async function getMerchProducts() {
  try {
    const result = await getShopifyMerchProducts();

    if (!result.products.length) {
      throw new Error("empty_shopify_collection");
    }

    infoSource(result.source, result.products.length);
    return result.products;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown_shopify_error";
    warnFallback(reason);
    infoSource("fallback", fallbackMerch.length);
    return fallbackMerch;
  }
}
