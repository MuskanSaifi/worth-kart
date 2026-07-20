"use client";

import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import type { ProductCardData } from "@/components/products/ProductCard";

export function TrackProductView({ product }: { product: ProductCardData }) {
  useEffect(() => {
    addRecentlyViewed(product);
  }, [product]);

  return null;
}
