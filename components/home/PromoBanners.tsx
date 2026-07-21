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
          className="relative rounded-lg overflow-hidden text-white p-5 min-h-[180px] flex flex-col justify-between group hover:shadow-lg transition-shadow"
          style={{
            background: `linear-gradient(135deg, ${promo.bgColor || "#db2777"}, ${promo.bgColor || "#9d174d"}99)`,
          }}
        >
          <div>
            <h3 className="text-lg font-bold">{promo.title}</h3>
            {promo.subtitle && (
              <p className="text-sm text-white/80 mt-1">{promo.subtitle}</p>
            )}
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold bg-white/20 px-3 py-1 rounded group-hover:bg-white/30 transition-colors">
              {promo.ctaLabel || "Explore Now"} <ArrowRight size={14} />
            </span>
          </div>
          <div className="absolute right-2 bottom-2 w-28 h-28 opacity-80">
            <Image
              src={promo.image}
              alt={promo.title}
              fill
              className="object-cover rounded-lg"
              unoptimized
            />
          </div>
        </Link>
      ))}

      {compact.length > 0 && (
        <div className="flex flex-col gap-4">
          {compact.map((promo) => (
            <Link
              key={promo.id}
              href={promo.link || "/products"}
              className="flex-1 rounded-lg overflow-hidden text-white p-5 flex flex-col justify-center hover:shadow-lg transition-shadow min-h-[84px]"
              style={{
                background: `linear-gradient(90deg, ${promo.bgColor || "#2563eb"}, ${promo.bgColor || "#1d4ed8"}cc)`,
              }}
            >
              <h3 className="text-base font-bold">{promo.title}</h3>
              {promo.subtitle && (
                <p className="text-xs text-white/80 mt-1">{promo.subtitle}</p>
              )}
              <span className="text-xs font-semibold mt-2 underline">
                {promo.ctaLabel || "View Details"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
