import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isProductPubliclyVisible } from "@/lib/products";
import { getRelatedProducts, getSimilarBrandProducts } from "@/lib/product-detail";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { isPrimary: "desc" } },
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { businessName: true, rating: true, status: true } },
        reviews: {
          include: { user: { select: { name: true } } },
          take: 8,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product || !isProductPubliclyVisible(product)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [relatedProducts, similarProducts] = await Promise.all([
      getRelatedProducts(product.id, product.category.id, 10),
      getSimilarBrandProducts(
        product.id,
        { brand: product.brand, categoryId: product.category.id },
        10
      ),
    ]);

    return NextResponse.json({
      product,
      relatedProducts,
      similarProducts,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
