import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryIcons } from "@/components/home/CategoryIcons";
import { ProductSection } from "@/components/home/ProductSection";
import { PromoBanners } from "@/components/home/PromoBanners";
import { BrandStrip } from "@/components/home/BrandStrip";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <HeroCarousel banners={banners} />
      <CategoryIcons />
      <ProductSection
        title="Deals of the Day"
        fetchUrl="/api/products?deal=true&limit=10&sort=best"
        viewAllHref="/products?deal=true"
        showTimer
      />
      <PromoBanners />
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
    </div>
  );
}
