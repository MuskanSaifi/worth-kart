"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, ProductCardData } from "@/components/products/ProductCard";

type SimilarProductsCarouselProps = {
  title: string;
  products: ProductCardData[];
  viewAllHref?: string;
  sponsored?: boolean;
};

export function SimilarProductsCarousel({
  title,
  products,
  viewAllHref,
  sponsored = true,
}: SimilarProductsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="mt-8 bg-card rounded-xl border border-border p-4 md:p-5" aria-labelledby="similar-products-heading">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 id="similar-products-heading" className="text-lg md:text-xl font-bold text-foreground">
            {title}
          </h2>
          {sponsored && (
            <span className="text-[10px] uppercase tracking-wide text-muted bg-gray-100 px-1.5 py-0.5 rounded">
              Sponsored
            </span>
          )}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-semibold text-primary hover:underline shrink-0">
            See more
          </Link>
        )}
      </div>

      <div className="relative group/scroll">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg border border-border opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden md:flex"
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 scroll-smooth"
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[160px] md:w-[200px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg border border-border opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden md:flex"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
