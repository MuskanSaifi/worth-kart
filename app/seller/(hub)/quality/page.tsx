"use client";

import { useState, useEffect } from "react";
import { SellerPageHeader, SellerCard, StatBadge } from "@/components/seller/SellerPageHeader";
import { Star } from "lucide-react";

export default function SellerQualityPage() {
  const [products, setProducts] = useState<Array<{
    id: string; name: string; rating: number; reviewCount: number;
  }>>([]);

  useEffect(() => {
    fetch("/api/seller/inventory").then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, []);

  const avgRating = products.length
    ? products.reduce((s, p) => s + p.rating, 0) / products.length
    : 0;
  const totalReviews = products.reduce((s, p) => s + p.reviewCount, 0);
  const lowRated = products.filter((p) => p.rating < 3.5).length;

  return (
    <div>
      <SellerPageHeader title="Quality" description="Monitor product quality ratings and customer feedback" />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatBadge label="Avg Rating" value={avgRating.toFixed(1)} />
        <StatBadge label="Total Reviews" value={totalReviews} />
        <StatBadge label="Low Rated Products" value={lowRated} />
      </div>

      <SellerCard title="Product Quality Score">
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium truncate flex-1">{p.name}</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  {p.rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">({p.reviewCount} reviews)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.rating >= 4 ? "bg-green-100 text-green-700" :
                  p.rating >= 3 ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {p.rating >= 4 ? "Excellent" : p.rating >= 3 ? "Good" : "Needs Improvement"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SellerCard>
    </div>
  );
}
