import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";

export async function GET(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile();
    const status = req.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = { sellerId: seller.id };
    if (status === "pending") {
      where.order = { status: { in: ["PENDING", "CONFIRMED"] } };
    } else if (status) {
      where.order = { status: status.toUpperCase() };
    }

    const items = await prisma.orderItem.findMany({
      where,
      include: {
        order: { include: { address: true, user: { select: { name: true, email: true } } } },
        product: { include: { images: { take: 1 } } },
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    return NextResponse.json({ orders: items });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile();
    const { orderItemId, action, status } = await req.json();

    const item = await prisma.orderItem.findFirst({
      where: { id: orderItemId, sellerId: seller.id },
      include: { order: true },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "download_label") {
      await prisma.orderItem.update({
        where: { id: orderItemId },
        data: { labelDownloaded: true },
      });
      return NextResponse.json({ success: true, labelUrl: `/api/seller/labels/${orderItemId}` });
    }

    if (action === "update_status" && status) {
      await prisma.order.update({
        where: { id: item.orderId },
        data: { status },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
