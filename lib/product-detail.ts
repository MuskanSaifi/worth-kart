import { prisma } from "@/lib/prisma";
import { publicProductFilter } from "@/lib/products";
import { productCardImagesInclude } from "@/lib/product-images";

export async function getCategoryBreadcrumb(categoryId: string) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, parentId: true },
  });
  const map = new Map(categories.map((c) => [c.id, c]));
  const path: { name: string; slug: string }[] = [];
  let current = map.get(categoryId);
  while (current) {
    path.unshift({ name: current.name, slug: current.slug });
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return path;
}

const relatedInclude = {
  images: productCardImagesInclude,
  category: { select: { name: true, slug: true } },
} as const;

export async function getRelatedProducts(productId: string, categoryId: string, limit = 8) {
  const allCats = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });
  const collectIds = (id: string): string[] => {
    const kids = allCats.filter((c) => c.parentId === id).map((c) => c.id);
    return [id, ...kids.flatMap(collectIds)];
  };

  // Prefer same leaf category, then whole parent branch (e.g. all Mobiles)
  const sameCategory = await prisma.product.findMany({
    where: {
      ...publicProductFilter,
      categoryId,
      id: { not: productId },
    },
    include: relatedInclude,
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  if (sameCategory.length >= limit) return sameCategory;

  const excludeIds = [productId, ...sameCategory.map((p) => p.id)];
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { brand: true, category: { select: { parentId: true } } },
  });

  const extra: typeof sameCategory = [];

  // Fill from parent category tree (Mobiles → smartphones + chargers + …)
  if (product?.category?.parentId) {
    const branchIds = collectIds(product.category.parentId);
    const fromBranch = await prisma.product.findMany({
      where: {
        ...publicProductFilter,
        categoryId: { in: branchIds },
        id: { notIn: excludeIds },
      },
      include: relatedInclude,
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: limit - sameCategory.length,
    });
    extra.push(...fromBranch);
    excludeIds.push(...fromBranch.map((p) => p.id));
  }

  if (sameCategory.length + extra.length < limit && product?.brand) {
    const byBrand = await prisma.product.findMany({
      where: {
        ...publicProductFilter,
        brand: product.brand,
        id: { notIn: excludeIds },
      },
      include: relatedInclude,
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: limit - sameCategory.length - extra.length,
    });
    extra.push(...byBrand);
    excludeIds.push(...byBrand.map((p) => p.id));
  }

  // Climb one more level (e.g. Electronics) if still short
  if (sameCategory.length + extra.length < limit && product?.category?.parentId) {
    const parent = allCats.find((c) => c.id === product.category!.parentId);
    if (parent?.parentId) {
      const grandIds = collectIds(parent.parentId);
      const more = await prisma.product.findMany({
        where: {
          ...publicProductFilter,
          categoryId: { in: grandIds },
          id: { notIn: excludeIds },
        },
        include: relatedInclude,
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: limit - sameCategory.length - extra.length,
      });
      extra.push(...more);
    }
  }

  return [...sameCategory, ...extra].slice(0, limit);
}

/** Similar brands / category alternatives for Amazon-style carousel below PDP. */
export async function getSimilarBrandProducts(
  productId: string,
  opts: { brand?: string | null; categoryId: string },
  limit = 10
) {
  type RelatedProduct = Awaited<ReturnType<typeof getRelatedProducts>>[number];
  const excludeIds = [productId];
  const results: RelatedProduct[] = [];

  if (opts.brand) {
    const sameBrand = await prisma.product.findMany({
      where: {
        ...publicProductFilter,
        brand: opts.brand,
        id: { not: productId },
      },
      include: relatedInclude,
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { isFeatured: "desc" }],
      take: Math.min(4, limit),
    });
    results.push(...sameBrand);
    excludeIds.push(...sameBrand.map((p) => p.id));
  }

  const remaining = limit - results.length;
  if (remaining > 0) {
    const alternatives = await prisma.product.findMany({
      where: {
        ...publicProductFilter,
        categoryId: opts.categoryId,
        id: { notIn: excludeIds },
      },
      include: relatedInclude,
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { isDeal: "desc" }],
      take: remaining,
    });
    results.push(...alternatives);
  }

  if (results.length < limit) {
    const category = await prisma.category.findUnique({
      where: { id: opts.categoryId },
      select: { parentId: true },
    });
    if (category?.parentId) {
      const siblings = await prisma.category.findMany({
        where: { parentId: category.parentId, isActive: true },
        select: { id: true },
      });
      const catIds = siblings.map((c) => c.id);
      const more = await prisma.product.findMany({
        where: {
          ...publicProductFilter,
          categoryId: { in: catIds },
          id: { notIn: [...excludeIds, ...results.map((p) => p.id)] },
        },
        include: relatedInclude,
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: limit - results.length,
      });
      results.push(...more);
    }
  }

  return results.slice(0, limit);
}

export type RatingBreakdown = {
  average: number;
  total: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  percents: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ProductDetailItem = {
  key: string;
  label: string;
  value: string;
};

const PRODUCT_TAG_LABELS: Record<string, string> = {
  gstRate: "GST Rate",
  hsnCode: "HSN Code",
  netWeight: "Net Weight",
  styleCode: "Style Code",
  size: "Size",
  color: "Color",
  material: "Material",
  genericName: "Generic Name",
  netQuantity: "Net Quantity",
  productHeight: "Product Height",
  productBreadth: "Product Breadth",
  productLength: "Product Length",
  weight: "Weight",
  weightUnit: "Weight Unit",
  manufacturerName: "Manufacturer Name",
  manufacturerAddress: "Manufacturer Address",
  manufacturerPincode: "Manufacturer Pincode",
  packerName: "Packer Name",
  packerAddress: "Packer Address",
  packerPincode: "Packer Pincode",
  importerName: "Importer Name",
  importerAddress: "Importer Address",
  importerPincode: "Importer Pincode",
  countryOfOrigin: "Country of Origin",
};

function prettifyKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/** Parse catalog metadata saved in product.tags JSON into readable product details. */
export function parseProductDetailItems(tags?: string | null): ProductDetailItem[] {
  if (!tags) return [];

  try {
    const parsed = JSON.parse(tags) as Record<string, unknown>;
    return Object.entries(parsed)
      .filter(([, value]) => {
        if (value === null || value === undefined) return false;
        const text = String(value).trim();
        return text !== "" && text.toLowerCase() !== "null";
      })
      .map(([key, value]) => ({
        key,
        label: PRODUCT_TAG_LABELS[key] || prettifyKey(key),
        value: String(value).trim(),
      }));
  } catch {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag, index) => ({
        key: `tag-${index}`,
        label: "Tag",
        value: tag,
      }));
  }
}

export async function getRatingBreakdown(productId: string, fallbackAverage: number, fallbackTotal: number): Promise<RatingBreakdown> {
  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });

  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[star]++;
  }

  const total = reviews.length || fallbackTotal;
  const average =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : fallbackAverage;

  const percents: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const star of [5, 4, 3, 2, 1] as const) {
    percents[star] = total > 0 ? Math.round((counts[star] / total) * 100) : 0;
  }

  return { average, total, counts, percents };
}

export function getSiteUrl() {
  return process.env.NEXTAUTH_URL || "https://worthkart.com";
}
