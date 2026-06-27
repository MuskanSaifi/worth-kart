import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicProductFilter } from "@/lib/products";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const deal = searchParams.get("deal");
    const featured = searchParams.get("featured");
    const brand = searchParams.get("brand");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { ...publicProductFilter };

    if (category) {
      const cat = await prisma.category.findFirst({ where: { slug: category } });
      if (cat) {
        const allCats = await prisma.category.findMany({ select: { id: true, parentId: true } });
        const collectIds = (id: string): string[] => {
          const kids = allCats.filter((c) => c.parentId === id).map((c) => c.id);
          return [id, ...kids.flatMap(collectIds)];
        };
        const ids = collectIds(cat.id);
        where.categoryId = { in: ids };
      }
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (deal === "true") where.isDeal = true;
    if (featured === "true") where.isFeatured = true;
    if (brand) where.brand = brand;

    const orderBy: Record<string, string> =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
          ? { price: "desc" }
          : sort === "rating"
            ? { rating: "desc" }
            : sort === "discount"
              ? { discount: "desc" }
              : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, slug: true } },
          seller: { select: { businessName: true, rating: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
