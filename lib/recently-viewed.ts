import type { ProductCardData } from "@/components/products/ProductCard";

const STORAGE_KEY = "worthkart_recently_viewed";
const MAX_ITEMS = 12;

export type RecentlyViewedItem = ProductCardData & { viewedAt: number };

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentlyViewedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(product: ProductCardData) {
  if (!canUseStorage()) return;
  const existing = getRecentlyViewed().filter((p) => p.id !== product.id);
  const next: RecentlyViewedItem[] = [
    { ...product, viewedAt: Date.now() },
    ...existing,
  ].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getRecentlyViewedExcluding(excludeIds: string[]): RecentlyViewedItem[] {
  const exclude = new Set(excludeIds);
  return getRecentlyViewed().filter((p) => !exclude.has(p.id));
}
