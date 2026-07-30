import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicProductFilter } from "@/lib/products";
import { rankProducts } from "@/lib/product-ranking";

const RANK_FETCH_CAP = 500;

const productInclude = {
  images: { where: { isPrimary: true }, take: 1 },
  category: { select: { name: true, slug: true } },
  seller: { select: { businessName: true, rating: true, totalSales: true, status: true } },
} as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const deal = searchParams.get("deal");
    const featured = searchParams.get("featured");
    const brand = searchParams.get("brand");
    const brandsParam = searchParams.get("brands");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");
    const minDiscount = searchParams.get("minDiscount") || searchParams.get("discount");
    const inStock = searchParams.get("inStock");
    const gender = searchParams.get("gender") || "";
    const color = searchParams.get("color") || "";
    const sort = searchParams.get("sort") || "best";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { ...publicProductFilter };
    const andFilters: Record<string, unknown>[] = [];
    let categoryIds: string[] | null = null;
    let rootCategoryId: string | null = null;
    let allCats: { id: string; parentId: string | null }[] = [];
    const collectIds = (id: string): string[] => {
      const kids = allCats.filter((c) => c.parentId === id).map((c) => c.id);
      return [id, ...kids.flatMap(collectIds)];
    };

    if (category) {
      const cat = await prisma.category.findFirst({ where: { slug: category } });
      if (cat) {
        rootCategoryId = cat.id;
        allCats = await prisma.category.findMany({ select: { id: true, parentId: true } });
        categoryIds = collectIds(cat.id);
        where.categoryId = { in: categoryIds };
      }
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { tags: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (deal === "true") where.isDeal = true;
    if (featured === "true") where.isFeatured = true;

    const brandList = brandsParam
      ? brandsParam.split(",").map((b) => b.trim()).filter(Boolean)
      : brand
        ? [brand]
        : [];
    if (brandList.length === 1) {
      where.brand = brandList[0];
    } else if (brandList.length > 1) {
      where.brand = { in: brandList };
    }

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      where.price = priceFilter;
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (minDiscount) {
      where.discount = { gte: parseInt(minDiscount, 10) };
    }

    if (inStock === "true") {
      where.stock = { gt: 0 };
    }

    if (gender) {
      andFilters.push({
        OR: [
          { tags: { contains: gender } },
          { name: { contains: gender } },
          { description: { contains: gender } },
        ],
      });
    }
    if (color) {
      andFilters.push({
        OR: [
          { tags: { contains: color } },
          { name: { contains: color } },
          { description: { contains: color } },
        ],
      });
    }
    if (andFilters.length) {
      where.AND = andFilters;
    }

    // Facet brands from same category scope (ignore brand filter so options stay visible)
    const facetWhere: Record<string, unknown> = { ...publicProductFilter };
    if (categoryIds) facetWhere.categoryId = { in: categoryIds };
    if (deal === "true") facetWhere.isDeal = true;
    if (featured === "true") facetWhere.isFeatured = true;
    if (search) {
      facetWhere.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { tags: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [facetProducts, subcategories] = await Promise.all([
      prisma.product.findMany({
        where: facetWhere,
        select: { brand: true },
        take: 1000,
      }),
      rootCategoryId
        ? prisma.category.findMany({
            where: { parentId: rootCategoryId, isActive: true },
            select: { id: true, name: true, slug: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          })
        : Promise.resolve([]),
    ]);

    const brandCounts = new Map<string, number>();
    for (const p of facetProducts) {
      if (!p.brand) continue;
      brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
    }

    // Products per direct subcategory — used for "Related Products" rows on listing
    const relatedBySubcategory =
      rootCategoryId && categoryIds && subcategories.length > 0
        ? (
            await Promise.all(
              subcategories.map(async (sub) => {
                const subIds = collectIds(sub.id);
                const products = await prisma.product.findMany({
                  where: {
                    ...publicProductFilter,
                    categoryId: { in: subIds },
                  },
                  include: productInclude,
                  orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }],
                  take: 8,
                });
                return { name: sub.name, slug: sub.slug, products };
              })
            )
          ).filter((row) => row.products.length > 0)
        : [];

    const facets = {
      brands: [...brandCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count })),
      subcategories: subcategories.map(({ name, slug }) => ({ name, slug })),
      genders: ["Women", "Men", "Boys", "Girls", "Unisex"],
      colors: [
        "Black",
        "White",
        "Red",
        "Blue",
        "Green",
        "Pink",
        "Yellow",
        "Purple",
        "Grey",
        "Brown",
        "Beige",
        "Orange",
      ],
    };

    const useRanking = sort === "best" || sort === "relevance";

    if (useRanking) {
      const [all, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: { select: { url: true }, take: 5 },
            category: productInclude.category,
            seller: productInclude.seller,
          },
          take: RANK_FETCH_CAP,
        }),
        prisma.product.count({ where }),
      ]);

      const ranked = rankProducts(all, { search: search || undefined });
      const products = ranked.slice(skip, skip + limit);

      return NextResponse.json({
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        sort: "best",
        facets,
        relatedBySubcategory,
      });
    }

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
        include: productInclude,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      facets,
      relatedBySubcategory,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
