/**
 * One-shot: replace broken Unsplash product image URLs in DB.
 * Run: npx tsx scripts/fix-broken-product-images.ts
 */
import { prisma } from "../lib/prisma";

const FIXES: Record<string, string> = {
  "https://images.unsplash.com/photo-1600294037688-c8b4a5a9322a?w=400&h=400&fit=crop":
    "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1583391735257-f30a1a8a4c3e?w=400&h=400&fit=crop":
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1586495777744-4413f210fc35?w=400&h=400&fit=crop":
    "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1598327275564-c6de1d2c1b0d?w=400&h=400&fit=crop":
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1570222094114-d054a817e56a?w=400&h=400&fit=crop":
    "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1610037127423-fa920bb390de?w=400&h=400&fit=crop":
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1591290619762-d2a4a9b2f5b6?w=400&h=400&fit=crop":
    "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1558060370-d644479cb6f5?w=400&h=400&fit=crop":
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=400&fit=crop",
};

async function main() {
  let updated = 0;
  for (const [from, to] of Object.entries(FIXES)) {
    const result = await prisma.productImage.updateMany({
      where: { url: from },
      data: { url: to },
    });
    if (result.count > 0) {
      console.log(`Updated ${result.count}: ${from.slice(0, 60)}...`);
      updated += result.count;
    }
  }

  // Also fix by slug if URL already changed partially / empty images
  const bySlug: Record<string, string> = {
    "65w-fast-charger-type-c":
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop",
    "banarasi-silk-saree-zari":
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop",
    "apple-airpods-pro-2nd-gen":
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop",
    "womens-floral-kurta-set":
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
    "cotton-printed-saree-daily":
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
    "lakme-absolute-matte-lipstick":
      "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=400&h=400&fit=crop",
    "oneplus-nord-ce-3-lite-5g":
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    "prestige-iris-mixer-grinder":
      "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400&h=400&fit=crop",
    "teddy-bear-soft-toy-40cm":
      "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=400&fit=crop",
  };

  for (const [slug, url] of Object.entries(bySlug)) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { images: true },
    });
    if (!product) continue;
    if (product.images.length === 0) {
      await prisma.productImage.create({
        data: { productId: product.id, url, isPrimary: true, alt: product.name },
      });
      console.log(`Created image for ${slug}`);
      updated++;
    } else {
      const primary = product.images.find((i) => i.isPrimary) || product.images[0];
      if (primary.url !== url) {
        await prisma.productImage.update({
          where: { id: primary.id },
          data: { url, isPrimary: true },
        });
        console.log(`Synced ${slug}`);
        updated++;
      }
    }
  }

  console.log(`Done. ${updated} image row(s) fixed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
