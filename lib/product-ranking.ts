/** Amazon-style product ranking for search & listing pages. */

export interface RankableProduct {
  id: string;
  name: string;
  description: string;
  brand?: string | null;
  tags?: string | null;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  rating: number;
  reviewCount: number;
  viewCount: number;
  isFeatured: boolean;
  isDeal: boolean;
  images: { url: string }[];
  seller: { rating: number; totalSales: number; status: string };
  createdAt: Date | string;
}

export interface RankOptions {
  search?: string;
  minPriceInSet?: number;
}

function relevanceScore(product: RankableProduct, query: string): number {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;

  const haystack =
    `${product.name} ${product.brand || ""} ${product.tags || ""} ${product.description}`.toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (product.name.toLowerCase() === term) score += 12;
    else if (product.name.toLowerCase().includes(term)) score += 8;
    if (product.brand?.toLowerCase().includes(term)) score += 6;
    if (product.tags?.toLowerCase().includes(term)) score += 5;
    if (haystack.includes(term)) score += 3;
  }
  return Math.min(30, score);
}

/** Higher score = show first (sponsored, in-stock, relevant, well-rated, competitive price). */
export function scoreProduct(product: RankableProduct, opts: RankOptions = {}): number {
  let score = 0;

  // Sponsored / promoted (Amazon Ads)
  if (product.isFeatured) score += 28;

  // Stock availability
  if (product.stock <= 0) score -= 60;
  else if (product.stock < 5) score += 4;
  else score += 10;

  // Search relevance
  if (opts.search) score += relevanceScore(product, opts.search);

  // Competitive price (within result set or discount %)
  if (opts.minPriceInSet && opts.minPriceInSet > 0 && product.price > 0) {
    const ratio = opts.minPriceInSet / product.price;
    score += Math.min(14, ratio * 6);
  } else {
    score += Math.min(10, product.discount / 4);
  }

  // Seller performance
  score += Math.min(10, product.seller.rating * 2);
  score += Math.min(8, Math.log10(product.seller.totalSales + 1) * 3);

  // Product ratings & reviews
  score += Math.min(12, product.rating * 2.4);
  score += Math.min(8, Math.log10(product.reviewCount + 1) * 4);

  // Popularity / conversion proxy
  score += Math.min(10, Math.log10(product.viewCount + 1) * 3);

  // Listing quality
  if (product.images.length > 0) score += 5;
  if (product.images.length >= 3) score += 3;
  if (product.description.length > 80) score += 3;
  if (product.brand) score += 2;

  if (product.isDeal) score += 5;

  const daysOld = (Date.now() - new Date(product.createdAt).getTime()) / 86400000;
  if (daysOld < 30) score += 2;

  return score;
}

export function rankProducts<T extends RankableProduct>(
  products: T[],
  opts: RankOptions = {}
): T[] {
  const inStock = products.filter((p) => p.stock > 0);
  const minPrice = inStock.length
    ? Math.min(...inStock.map((p) => p.price))
    : Math.min(...products.map((p) => p.price));

  return [...products]
    .map((p) => ({ p, score: scoreProduct(p, { ...opts, minPriceInSet: minPrice }) }))
    .sort((a, b) => b.score - a.score)
    .map(({ p }) => p);
}
