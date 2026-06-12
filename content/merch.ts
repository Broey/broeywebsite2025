export type ShopifyEmbed = {
  productHandle?: string;
  productId?: string;
  collectionHandle?: string;
  embedUrl?: string;
  buyButtonId?: string;
};

export type MerchStatus = "available" | "sold-out";

export type MerchProduct = {
  title: string;
  slug: string;
  category: string;
  description: string;
  price: string;
  href: string;
  image: string;
  imageAlt?: string;
  status: MerchStatus;
  featured: boolean;
  shopify?: ShopifyEmbed;
};

export const isRealMerchUrl = (url?: string) => Boolean(url && url !== "#");

export const hasShopifyEmbed = (item: MerchProduct) =>
  Boolean(item.shopify?.embedUrl && item.shopify.embedUrl !== "#");

export const hasLiveShopAction = (item: MerchProduct) =>
  item.status === "available" && isRealMerchUrl(item.href);

export const merch: MerchProduct[] = [
  {
    title: "Beats Hoodie",
    slug: "beats-hoodie",
    category: "Hoodie",
    description: "Washed boxy-fit hoodie with distressed details and a worn-in Broey feel.",
    price: "From $60.00 USD",
    href: "https://broey-beats.myshopify.com/products/beats-hoodie-1",
    image: "/images/merch/beats-hoodie.jpg",
    imageAlt: "Beats Hoodie product image",
    status: "available",
    featured: true,
  },
  {
    title: "Broey. Crewneck Sweater - Colors",
    slug: "broey-crewneck-sweater-colors",
    category: "Crewneck",
    description: "Classic-fit Broey crewneck available in multiple colorways.",
    price: "From $32.00 USD",
    href: "https://broey-beats.myshopify.com/products/broey-crewneck-sweater-colors",
    image: "/images/merch/crewneck-sweater-colors.jpg",
    imageAlt: "Broey. Crewneck Sweater - Colors product image",
    status: "available",
    featured: true,
  },
  {
    title: "Broey. Dad Hat (The Original)",
    slug: "dad-hat",
    category: "Hat",
    description: "Low-profile embroidered Broey dad hat with adjustable strap.",
    price: "$25.00 USD",
    href: "https://broey-beats.myshopify.com/products/dad-hat",
    image: "/images/merch/dad-hat.jpg",
    imageAlt: "Broey. Dad Hat product image",
    status: "available",
    featured: true,
  },
  {
    title: "Broey. Unisex Crewbeck Sweatshirt (The Classic)",
    slug: "classic-crewneck",
    category: "Crewneck",
    description: "Simple black Broey crewneck with a clean everyday fit.",
    price: "From $32.00 USD",
    href: "https://broey-beats.myshopify.com/products/broey-unisex-crewbeck-sweatshirt-the-classic",
    image: "/images/merch/classic-crewneck.jpg",
    imageAlt: "Broey. Unisex Crewbeck Sweatshirt product image",
    status: "available",
    featured: true,
  },
  {
    title: "Broey. Unisex Hoodie",
    slug: "unisex-hoodie",
    category: "Hoodie",
    description: "Soft everyday Broey hoodie with front pouch pocket and classic fit.",
    price: "From $36.50 USD",
    href: "https://broey-beats.myshopify.com/products/broey-unisex-hoodie-new-logo",
    image: "/images/merch/unisex-hoodie.jpg",
    imageAlt: "Broey. Unisex Hoodie product image",
    status: "available",
    featured: true,
  },
  {
    title: "Broey. Unisex Hoodie - Pastels",
    slug: "pastel-hoodie",
    category: "Hoodie",
    description: "Pastel Broey hoodie available in soft colorways.",
    price: "From $36.50 USD",
    href: "https://broey-beats.myshopify.com/products/broey-unisex-hoodie-pastels",
    image: "/images/merch/pastel-hoodie.jpg",
    imageAlt: "Broey. Unisex Hoodie - Pastels product image",
    status: "available",
    featured: true,
  },
];
