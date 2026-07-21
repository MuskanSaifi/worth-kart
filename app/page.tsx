import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryIcons } from "@/components/home/CategoryIcons";
import { ProductSection } from "@/components/home/ProductSection";
import { PromoBanners } from "@/components/home/PromoBanners";
import { FooterPromoBanner } from "@/components/home/FooterPromoBanner";
import { BrandStrip } from "@/components/home/BrandStrip";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [heroBanners, promoBanners, footerBanners] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true, placement: "HERO" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.banner.findMany({
      where: { isActive: true, placement: "PROMO" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.banner.findMany({
      where: { isActive: true, placement: "FOOTER" },
      orderBy: { sortOrder: "asc" },
      take: 1,
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <HeroCarousel banners={heroBanners} />
      <CategoryIcons />
      <ProductSection
        title="Deals of the Day"
        fetchUrl="/api/products?deal=true&limit=10&sort=best"
        viewAllHref="/products?deal=true"
        showTimer
      />
      <PromoBanners banners={promoBanners} />
      <ProductSection
        title="Best of Electronics"
        fetchUrl="/api/products?category=electronics&limit=10"
        viewAllHref="/products?category=electronics"
      />
      <ProductSection
        title="Top Picks for You"
        fetchUrl="/api/products?featured=true&limit=10&sort=best"
        viewAllHref="/products?featured=true"
      />
      <BrandStrip />
      <ProductSection
        title="Trending in Fashion"
        fetchUrl="/api/products?category=fashion&limit=10"
        viewAllHref="/products?category=fashion"
      />
      <FooterPromoBanner banners={footerBanners} />
    </div>
  );
}
