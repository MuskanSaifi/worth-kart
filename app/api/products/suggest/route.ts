import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicProductFilter } from "@/lib/products";

/** Lightweight autocomplete for header search. */
export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) {
      return NextResponse.json({ products: [], categories: [], brands: [] });
    }

    const contains = (field: "name" | "brand" | "tags" | "keywords" | "description") => ({
      [field]: { contains: q, mode: "insensitive" as const },
    });

    const [products, categories, brandRows] = await Promise.all([
      prisma.product.findMany({
        where: {
          ...publicProductFilter,
          OR: [contains("name"), contains("brand"), contains("tags")],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          mrp: true,
          brand: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: 8,
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          OR: [contains("name"), contains("keywords")],
        },
        select: { name: true, slug: true },
        orderBy: { sortOrder: "asc" },
        take: 4,
      }),
      prisma.product.findMany({
        where: {
          ...publicProductFilter,
          brand: { contains: q, mode: "insensitive" },
        },
        select: { brand: true },
        take: 40,
      }),
    ]);

    const brands = [
      ...new Set(
        brandRows
          .map((row) => row.brand)
          .filter((brand): brand is string => !!brand)
      ),
    ].slice(0, 4);

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        mrp: p.mrp,
        brand: p.brand,
        image: p.images[0]?.url || null,
        category: p.category?.name || null,
        href: `/products/${p.slug}`,
      })),
      categories: categories.map((c) => ({
        name: c.name,
        slug: c.slug,
        href: `/products?category=${c.slug}`,
      })),
      brands: brands.map((name) => ({
        name,
        href: `/products?brand=${encodeURIComponent(name)}`,
      })),
    });
  } catch (error) {
    console.error("[products/suggest]", error);
    return NextResponse.json({ products: [], categories: [], brands: [] });
  }
}
