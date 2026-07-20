import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canBuyerRequestReturn, recordOrderEvent } from "@/lib/order-lifecycle";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const reason = String(body.reason || "").trim();
    const orderItemId = typeof body.orderItemId === "string" ? body.orderItemId : null;

    if (reason.length < 5) {
      return NextResponse.json({ error: "Please provide a reason (min 5 characters)" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!canBuyerRequestReturn(order.status)) {
      return NextResponse.json(
        { error: "Returns can only be requested after delivery" },
        { status: 400 }
      );
    }

    const items = orderItemId
      ? order.items.filter((i) => i.id === orderItemId)
      : order.items;

    if (items.length === 0) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }

    const created = [];
    for (const item of items) {
      const existing = await prisma.returnRequest.findFirst({
        where: {
          orderItemId: item.id,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });
      if (existing) continue;

      const rr = await prisma.returnRequest.create({
        data: {
          orderItemId: item.id,
          sellerId: item.sellerId,
          reason,
          status: "PENDING",
        },
      });
      created.push(rr);
    }

    if (created.length === 0) {
      return NextResponse.json(
        { error: "A return request is already pending for these items" },
        { status: 400 }
      );
    }

    await recordOrderEvent({
      orderId: id,
      title: "Return requested",
      message: reason,
      source: "buyer",
    });

    return NextResponse.json({ success: true, requests: created });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
