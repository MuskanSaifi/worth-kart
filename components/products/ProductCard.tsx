"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { notify } from "@/lib/notify";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  discount: number;
  rating: number;
  reviewCount: number;
  brand?: string | null;
  images: { url: string; alt?: string | null }[];
  isFeatured?: boolean;
  stock?: number;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { status } = useSession();
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const imageUrl = product.images[0]?.url || "/placeholder-product.jpg";

  const toggleWishlist = async () => {
    if (status !== "authenticated") {
      window.location.href = "/login";
      return;
    }
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setWishlisted(data.added);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (status !== "authenticated") {
      window.location.href = "/login";
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id);
      notify.success("Added to cart");
    } catch {
      notify.error("Could not add to cart");
    }
    setAdding(false);
  };

  return (
    <div className="group bg-card rounded-lg border border-border hover:shadow-lg transition-all duration-300 overflow-hidden relative">
      {product.isFeatured && (
        <span className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          Sponsored
        </span>
      )}
      {product.discount > 0 && (
        <span className={`absolute ${product.isFeatured ? "top-7" : "top-2"} left-2 z-10 bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}>
          {product.discount}% OFF
        </span>
      )}
      <button
        onClick={toggleWishlist}
        className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
      >
        <Heart size={16} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"} />
      </button>

      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square bg-gray-50 p-4 flex items-center justify-center overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            width={200}
            height={200}
            className="object-contain max-h-full group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </div>
        <div className="p-3">
          {product.brand && (
            <p className="text-[10px] text-muted uppercase tracking-wide">{product.brand}</p>
          )}
          <h3 className="text-sm text-foreground line-clamp-2 mt-0.5 leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="flex items-center gap-0.5 bg-success text-white text-[10px] font-medium px-1 py-0.5 rounded">
              {product.rating.toFixed(1)} <Star size={8} fill="white" />
            </span>
            <span className="text-[10px] text-muted">({product.reviewCount})</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.mrp > product.price && (
              <span className="text-xs text-muted line-through">{formatPrice(product.mrp)}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3">
        <button
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
          className="w-full py-2 text-xs font-semibold text-primary border border-primary rounded hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
        >
          {product.stock === 0 ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
