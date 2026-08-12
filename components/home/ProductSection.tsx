"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, ProductCardData } from "@/components/products/ProductCard";

interface ProductSectionProps {
  title: string;
  viewAllHref?: string;
  fetchUrl: string;
  showTimer?: boolean;
}

export function ProductSection({ title, viewAllHref = "/products", fetchUrl, showTimer }: ProductSectionProps) {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [timeLeft, setTimeLeft] = useState({ h: 8, m: 24, s: 17 });

  useEffect(() => {
    fetch(fetchUrl)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
  }, [fetchUrl]);

  useEffect(() => {
    if (!showTimer) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        let { h, m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showTimer]);

  const scroll = (dir: "left" | "right") => {
    const el = document.getElementById(`scroll-${title.replace(/\s/g, "")}`);
    if (el) el.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className="bg-card rounded-xl border border-border p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">{title}</h2>
          {showTimer && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted">Ends in</span>
              <span className="font-mono font-bold text-danger">
                {String(timeLeft.h).padStart(2, "0")} : {String(timeLeft.m).padStart(2, "0")} : {String(timeLeft.s).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
        <Link href={viewAllHref} className="text-sm font-semibold text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="relative group/scroll">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full border border-border opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden md:flex"
        >
          <ChevronLeft size={18} />
        </button>

        <div
          id={`scroll-${title.replace(/\s/g, "")}`}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[160px] md:w-[200px]">
              <ProductCard product={product} flat />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full border border-border opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden md:flex"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
