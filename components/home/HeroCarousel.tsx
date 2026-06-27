"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  bgColor?: string | null;
}

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) {
    return (
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-lg p-8 md:p-12 text-white">
        <h2 className="text-2xl md:text-4xl font-bold">India&apos;s Biggest Shopping Destination</h2>
        <p className="mt-2 text-purple-200">Best Deals. Best Brands. Best Prices.</p>
        <Link href="/products" className="inline-flex items-center gap-2 mt-6 bg-white text-primary px-6 py-2.5 rounded font-semibold hover:bg-gray-100 transition-colors">
          Shop Now <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const banner = banners[current];

  return (
    <div className="relative rounded-lg overflow-hidden group" style={{ backgroundColor: banner.bgColor || "#5b21b6" }}>
      <div className="flex items-center min-h-[200px] md:min-h-[320px]">
        <div className="flex-1 p-6 md:p-10 text-white z-10">
          <h2 className="text-xl md:text-3xl font-bold leading-tight">{banner.title}</h2>
          {banner.subtitle && (
            <p className="mt-2 text-sm md:text-base text-purple-200">{banner.subtitle}</p>
          )}
          <Link
            href={banner.link || "/products"}
            className="inline-flex items-center gap-2 mt-4 bg-white text-primary px-5 py-2 rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Shop Now <ArrowRight size={14} />
          </Link>
          <div className="flex gap-4 mt-6 text-xs text-purple-200">
            <span>No Cost EMI</span>
            <span>•</span>
            <span>Exchange Offer</span>
            <span>•</span>
            <span>Easy Returns</span>
          </div>
        </div>
        <div className="hidden md:block flex-1 relative h-[320px]">
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-contain object-right p-4"
            unoptimized
          />
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
