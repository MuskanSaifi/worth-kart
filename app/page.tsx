import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeCategorySidebar } from "@/components/home/HomeCategorySidebar";
import { CategoryIcons } from "@/components/home/CategoryIcons";
import { ProductSection } from "@/components/home/ProductSection";
import { PromoBanners } from "@/components/home/PromoBanners";
import { AppDownloadBanner } from "@/components/home/AppDownloadBanner";
import { BrandStrip } from "@/components/home/BrandStrip";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [heroBanners, promoBanners] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true, placement: "HERO" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.banner.findMany({
      where: { isActive: true, placement: "PROMO" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4 md:space-y-5 animate-fade-in">
      <div className="flex gap-4 items-stretch min-h-[280px] md:min-h-[420px]">
        <HomeCategorySidebar />
        <div className="flex-1 min-w-0 min-h-[280px] md:min-h-[420px]">
          <HeroCarousel banners={heroBanners} />
        </div>
      </div>

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

      <AppDownloadBanner />
      <BrandStrip />

      <ProductSection
        title="Trending in Fashion"
        fetchUrl="/api/products?category=fashion&limit=10"
        viewAllHref="/products?category=fashion"
      />
    </div>
  );
}
