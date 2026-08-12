import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

type FooterBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  ctaLabel?: string | null;
};

export function FooterPromoBanner({ banners }: { banners: FooterBanner[] }) {
  if (banners.length === 0) return null;

  const banner = banners[0];
  const text = banner.textColor || "#ffffff";

  return (
    <section className="rounded-lg overflow-hidden relative min-h-[140px] md:min-h-[180px]">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: banner.bgColor || "#1e1b4b" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="absolute inset-0 opacity-40">
        <Image src={banner.image} alt="" fill className="object-cover" unoptimized />
      </div>
      <div
        className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ color: text }}
      >
        <div>
          <h2 className="text-xl md:text-3xl font-bold">{banner.title}</h2>
          {banner.subtitle && (
            <p className="mt-2 text-sm md:text-base opacity-80">{banner.subtitle}</p>
          )}
        </div>
        <Link
          href={banner.link || "/products"}
          className="inline-flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded font-semibold text-sm hover:bg-gray-100 transition-colors w-fit"
        >
          {banner.ctaLabel || "Shop Now"} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
