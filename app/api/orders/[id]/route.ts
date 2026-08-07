import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  canBuyerCancel,
  canBuyerRequestReturn,
  transitionOrderStatus,
  verifyDeliveryOtp,
} from "@/lib/order-lifecycle";
import { canDownloadOrderInvoice } from "@/lib/tax-invoice";
import { cancelBuyerOrder } from "@/lib/order-cancel";
import { REFUND_ETA_COPY } from "@/lib/order-refund";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
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
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const action = body.action as string;

    if (action === "cancel") {
      try {
        const result = await cancelBuyerOrder({
          orderId: id,
          userId: session.user.id,
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

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (action === "confirm_delivery") {
      const otp = String(body.otp || "");
      if (order.status !== "OUT_FOR_DELIVERY") {
        return NextResponse.json(
          { error: "Order is not out for delivery" },
          { status: 400 }
        );
      }
      const ok = await verifyDeliveryOtp(id, otp);
      if (!ok) {
        return NextResponse.json(
          { error: "Invalid or expired delivery OTP" },
          { status: 400 }
        );
      }

      await transitionOrderStatus({
        orderId: id,
        status: "DELIVERED",
        source: "buyer",
        title: "Delivered",
        message: "Delivery confirmed with OTP.",
      });

      return NextResponse.json({ success: true, status: "DELIVERED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
