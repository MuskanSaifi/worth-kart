import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";

export async function GET(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);
    const filter = req.nextUrl.searchParams.get("filter");

    const where: Record<string, unknown> = { sellerId: seller.id, isActive: true };
    if (filter === "out") where.stock = 0;
    else if (filter === "low") where.stock = { gt: 0, lt: 10 };

    const products = await prisma.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { stock: "asc" },
    });

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);
    const { productId, stock, price, mrp } = await req.json();

    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId: seller.id },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, number> = {};
    if (stock !== undefined) data.stock = stock;
    if (price !== undefined) data.price = price;
    if (mrp !== undefined) {
      data.mrp = mrp;
      data.discount = Math.round(((mrp - (price ?? product.price)) / mrp) * 100);
    }

    const updated = await prisma.product.update({ where: { id: productId }, data });
    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
