import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/app-auth";
import { prisma } from "@/lib/prisma";
import {
  canBuyerCancel,
  canBuyerRequestReturn,
} from "@/lib/order-lifecycle";
import { canDownloadOrderInvoice } from "@/lib/tax-invoice";
import { cancelBuyerOrder } from "@/lib/order-cancel";
import { REFUND_ETA_COPY } from "@/lib/order-refund";

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
        refundEtaCopy:
          order.paymentStatus === "REFUNDED" || order.refundId
            ? REFUND_ETA_COPY
            : null,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAppUser(req);
    const { id } = await params;
    const body = await req.json();
    const action = body.action as string;

    if (action === "cancel") {
      try {
        const result = await cancelBuyerOrder({
          orderId: id,
          userId: user.id,
          reason:
            typeof body.reason === "string" ? body.reason : "Cancelled by customer",
        });
        return NextResponse.json(result);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Cancel failed";
        const status =
          typeof e === "object" && e && "status" in e
            ? Number((e as { status: number }).status)
            : 500;
        return NextResponse.json({ error: message }, { status: status || 500 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
