import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

type PromoBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  bgColor?: string | null;
  ctaLabel?: string | null;
  variant: string;
};

function PromoImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className || "object-cover"}
      unoptimized
      sizes="(max-width: 768px) 50vw, 280px"
    />
  );
}

export function PromoBanners({ banners }: { banners: PromoBanner[] }) {
  if (banners.length === 0) return null;

  const large = banners.filter((b) => b.variant !== "COMPACT");
  const compact = banners.filter((b) => b.variant === "COMPACT");

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {large.map((promo) => (
        <Link
          key={promo.id}
          href={promo.link || "/products"}
          className="relative rounded-lg overflow-hidden text-white min-h-[200px] group hover:shadow-lg transition-shadow"
          style={{
            background: `linear-gradient(135deg, ${promo.bgColor || "#db2777"}, ${promo.bgColor || "#9d174d"}99)`,
          }}
        >
          {/* Full-bleed image on the right half */}
          {promo.image ? (
            <div className="absolute inset-y-0 right-0 w-[55%] md:w-[58%]">
              <PromoImage
                src={promo.image}
                alt={promo.title}
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, ${promo.bgColor || "#db2777"} 0%, ${promo.bgColor || "#db2777"}cc 18%, transparent 55%)`,
                }}
              />
            </div>
          ) : null}

          <div className="relative z-10 flex flex-col justify-between h-full min-h-[200px] p-5 max-w-[55%]">
            <div>
              <h3 className="text-lg md:text-xl font-bold leading-snug">{promo.title}</h3>
              {promo.subtitle && (
                <p className="text-sm text-white/90 mt-1.5">{promo.subtitle}</p>
              )}
            </div>
            <span className="inline-flex items-center gap-1 mt-4 w-fit text-sm font-semibold bg-white/25 px-3 py-1.5 rounded group-hover:bg-white/35 transition-colors">
              {promo.ctaLabel || "Explore Now"} <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      ))}

      {compact.length > 0 && (
        <div className="flex flex-col gap-4">
          {compact.map((promo) => (
            <Link
              key={promo.id}
              href={promo.link || "/products"}
              className="relative flex-1 rounded-lg overflow-hidden text-white min-h-[92px] group hover:shadow-lg transition-shadow"
              style={{
                background: `linear-gradient(90deg, ${promo.bgColor || "#2563eb"}, ${promo.bgColor || "#1d4ed8"}cc)`,
              }}
            >
              {promo.image ? (
                <div className="absolute inset-y-0 right-0 w-[42%]">
                  <PromoImage
                    src={promo.image}
                    alt={promo.title}
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, ${promo.bgColor || "#2563eb"} 0%, ${promo.bgColor || "#2563eb"}b3 25%, transparent 60%)`,
                    }}
                  />
                </div>
              ) : null}

              <div className="relative z-10 flex flex-col justify-center h-full min-h-[92px] p-4 pr-[45%]">
                <h3 className="text-base font-bold leading-snug">{promo.title}</h3>
                {promo.subtitle && (
                  <p className="text-xs text-white/90 mt-1">{promo.subtitle}</p>
                )}
                <span className="text-xs font-semibold mt-2 underline underline-offset-2">
                  {promo.ctaLabel || "View Details"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
