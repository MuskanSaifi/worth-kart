import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/app-auth";
import { prisma } from "@/lib/prisma";
import {
  canBuyerCancel,
  canBuyerRequestReturn,
} from "@/lib/order-lifecycle";
import { canDownloadOrderInvoice } from "@/lib/tax-invoice";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAppUser(req);
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1 } } },
            returnRequests: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        address: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        ...order,
        deliveryOtpPending: !!(
          order.status === "OUT_FOR_DELIVERY" && order.deliveryOtpHash
        ),
        deliveryOtpHash: undefined,
      },
      actions: {
        canCancel: canBuyerCancel(order.status),
        canReturn: canBuyerRequestReturn(order.status),
        canReorder: true,
        canDownloadInvoice: canDownloadOrderInvoice(order),
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
