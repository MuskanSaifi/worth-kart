import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";

function generateFileId() {
  return `WK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile();
    const status = req.nextUrl.searchParams.get("status") || "all";

    const where: Record<string, unknown> = { sellerId: seller.id };
    if (status !== "all") {
      where.qcStatus = status.toUpperCase();
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: { take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: products.length,
      bulk: products.filter((p) => p.catalogFileId?.includes("BULK")).length,
      single: products.filter((p) => !p.catalogFileId?.includes("BULK")).length,
      actionRequired: products.filter((p) => p.qcStatus === "ACTION_REQUIRED").length,
      qcInProgress: products.filter((p) => p.qcStatus === "QC_IN_PROGRESS").length,
      qcError: products.filter((p) => p.qcStatus === "QC_ERROR").length,
      qcPass: products.filter((p) => p.qcStatus === "QC_PASS").length,
      draft: products.filter((p) => p.qcStatus === "DRAFT").length,
    };

    return NextResponse.json({ products, stats });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
