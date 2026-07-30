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
        // Never expose hash
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const action = body.action as string;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (action === "cancel") {
      if (!canBuyerCancel(order.status)) {
        return NextResponse.json(
          { error: "This order can no longer be cancelled" },
          { status: 400 }
        );
      }

      // Restock if already confirmed (stock was decremented)
      if (order.status !== "PENDING") {
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const paymentStatus =
        order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus === "PENDING" ? "FAILED" : order.paymentStatus;

      await prisma.order.update({
        where: { id },
        data: { paymentStatus },
      });

      await transitionOrderStatus({
        orderId: id,
        status: "CANCELLED",
        source: "buyer",
        allowTerminal: true,
        cancelReason: typeof body.reason === "string" ? body.reason : "Cancelled by customer",
        title: "Order cancelled",
        message: typeof body.reason === "string" ? body.reason : "Cancelled by customer",
      });

      return NextResponse.json({ success: true, status: "CANCELLED" });
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
        return NextResponse.json({ error: "Invalid or expired delivery OTP" }, { status: 400 });
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
