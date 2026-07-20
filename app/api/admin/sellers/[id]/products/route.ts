import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getProductSetupSteps, getProductSetupProgress } from "@/lib/product-profile";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const seller = await prisma.sellerProfile.findUnique({
      where: { id },
      select: { id: true, businessName: true },
    });
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { sellerId: id },
      include: {
        category: { select: { name: true } },
        _count: { select: { images: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = products.map((p) => {
      const steps = getProductSetupSteps({
        name: p.name,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        stock: p.stock,
        brand: p.brand,
        categoryId: p.categoryId,
        sku: p.sku,
        tags: p.tags,
        isActive: p.isActive,
        qcStatus: p.qcStatus,
        imageCount: p._count.images,
      });
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        stock: p.stock,
        isActive: p.isActive,
        qcStatus: p.qcStatus,
        category: p.category.name,
        createdAt: p.createdAt,
        completion: getProductSetupProgress(steps),
        steps,
      };
    });

    return NextResponse.json({ products: items, total: items.length });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
