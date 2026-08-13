"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/components/providers/CartProvider";
import { notify } from "@/lib/notify";
import { useSession } from "next-auth/react";
import type { ProductCardData } from "@/components/products/ProductCard";
import { pickProductImageUrl } from "@/lib/product-images";

export function CartProductRail({
  title,
  products,
  emptyHint,
}: {
  title: string;
  products: ProductCardData[];
  emptyHint?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { status } = useSession();

  if (products.length === 0) {
    if (!emptyHint) return null;
    return (
      <section className="bg-white border border-border rounded-sm p-4">
        <h2 className="text-base font-semibold mb-2">{title}</h2>
        <p className="text-sm text-muted">{emptyHint}</p>
      </section>
    );
  }

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  const handleAdd = async (productId: string) => {
    if (status !== "authenticated") {
      window.location.href = "/login";
      return;
    }
    try {
      await addToCart(productId);
      notify.success("Added to cart");
    } catch {
      notify.error("Could not add to cart");
    }
  };

  return (
    <section className="bg-white border border-border rounded-sm p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold text-foreground">{title}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="p-1.5 border border-border rounded hover:bg-gray-50 hidden sm:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="p-1.5 border border-border rounded hover:bg-gray-50 hidden sm:flex"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {products.map((product) => {
          const image = pickProductImageUrl(product.images);
          return (
            <div
              key={product.id}
              className="flex-shrink-0 w-[150px] md:w-[170px] border border-border rounded-sm hover:shadow-md transition-shadow bg-white"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="h-[140px] flex items-center justify-center p-3 bg-gray-50">
                  <Image
                    src={image}
                    alt={product.name}
                    width={120}
                    height={120}
                    className="object-contain max-h-full"
                    unoptimized
                  />
                </div>
                <div className="p-2.5 pt-2">
                  <p className="text-xs text-foreground line-clamp-2 min-h-[2rem] leading-snug">
                    {product.name}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-sm font-bold">{formatPrice(product.price)}</span>
                    {product.mrp > product.price && (
                      <>
                        <span className="text-[11px] text-muted line-through">
                          {formatPrice(product.mrp)}
                        </span>
                        <span className="text-[11px] text-success font-medium">
                          {product.discount}% off
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
              <div className="px-2.5 pb-2.5">
                <button
                  type="button"
                  onClick={() => handleAdd(product.id)}
                  className="w-full text-xs font-semibold text-primary py-1.5 border border-primary/30 rounded hover:bg-purple-50"
                >
                  Add to cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
