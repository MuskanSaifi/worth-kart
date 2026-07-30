"use client";

import { useEffect, useState } from "react";
import { SimilarProductsCarousel } from "@/components/products/SimilarProductsCarousel";
import {
  getRecentlyViewedExcluding,
  type RecentlyViewedItem,
} from "@/lib/recently-viewed";

export function RecentlyViewedSection({ excludeId }: { excludeId: string }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewedExcluding([excludeId]));
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <SimilarProductsCarousel
      title="Recently Viewed"
      products={items}
      viewAllHref="/products"
      sponsored={false}
    />
  );
}
