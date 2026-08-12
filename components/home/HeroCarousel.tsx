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
  textColor?: string | null;
  ctaLabel?: string | null;
}

function withAlpha(hex: string, alpha: number) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${raw}${a}`;
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
      <div className="h-full min-h-[280px] md:min-h-[420px] bg-gradient-to-br from-primary via-primary-light to-[#a78bfa] rounded-xl p-6 md:p-10 text-white flex flex-col justify-between">
        <div>
          <p className="text-sm text-purple-100 font-medium mb-2">WorthKart</p>
          <h2 className="text-2xl md:text-4xl font-bold leading-tight">
            India&apos;s Biggest Shopping Destination
          </h2>
          <p className="mt-3 text-purple-100 text-sm md:text-base">
            From ₹99 · No Cost EMI · Easy Returns
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 mt-6 bg-white text-primary px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors w-fit"
          >
            Shop Now <ArrowRight size={16} />
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/80 pt-6">
          <span>No Cost EMI</span>
          <span>•</span>
          <span>Exchange Offer</span>
          <span>•</span>
          <span>Easy Returns</span>
        </div>
      </div>
    );
  }

  const banner = banners[current];
  const bg = banner.bgColor || "#5b21b6";
  const text = banner.textColor || "#ffffff";

  return (
    <div
      className="relative h-full min-h-[280px] md:min-h-[420px] rounded-xl overflow-hidden group"
      style={{ backgroundColor: bg }}
    >
      {/* Right image — edge-to-edge height */}
      <div className="absolute inset-y-0 right-0 w-[52%] hidden md:block">
        <Image
          src={banner.image}
          alt={banner.title}
          fill
          className="object-cover object-center"
          unoptimized
          priority
        />
      </div>

      {/* Mobile: image as soft full-bleed backdrop */}
      <div className="absolute inset-0 md:hidden opacity-35">
        <Image
          src={banner.image}
          alt=""
          fill
          className="object-cover object-right"
          unoptimized
          priority
        />
      </div>

      {/* Left scrim so text stays readable over image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, ${bg} 0%, ${bg} 42%, ${bg}cc 52%, transparent 72%)`,
        }}
      />
      <div className="absolute inset-0 md:hidden bg-gradient-to-r from-black/45 via-black/25 to-transparent pointer-events-none" />

      {/* Content fills full height */}
      <div
        className="relative z-10 flex flex-col justify-between h-full min-h-[280px] md:min-h-[420px] p-6 md:p-9 lg:p-10 max-w-xl"
        style={{ color: text }}
      >
        <div className="flex flex-col justify-center flex-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.15rem] font-bold leading-tight">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p
              className="mt-3 text-sm md:text-base max-w-md"
              style={{ color: withAlpha(text, 0.9) }}
            >
              {banner.subtitle}
            </p>
          )}
          <Link
            href={banner.link || "/products"}
            className="inline-flex items-center gap-2 mt-5 md:mt-6 bg-white text-primary px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors w-fit"
          >
            {banner.ctaLabel || "Shop Now"} <ArrowRight size={14} />
          </Link>
        </div>

        <div
          className="flex flex-wrap gap-x-3 gap-y-1 pt-4 text-xs"
          style={{ color: withAlpha(text, 0.8) }}
        >
          <span>No Cost EMI</span>
          <span>•</span>
          <span>Exchange Offer</span>
          <span>•</span>
          <span>Easy Returns</span>
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/95 rounded-full border border-border opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous banner"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/95 rounded-full border border-border opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next banner"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "bg-white w-5" : "bg-white/45 w-2"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
