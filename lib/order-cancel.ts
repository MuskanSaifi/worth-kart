import { prisma } from "@/lib/prisma";
import {
  canBuyerCancel,
  transitionOrderStatus,
} from "@/lib/order-lifecycle";
import { initiateRefundForCancelledOrder } from "@/lib/order-refund";
import { isOnlinePaymentMethod } from "@/lib/cashfree-pg";

/**
 * Shared cancel pipeline for website + app:
 * restock → cancel status → Cashfree refund if online paid.
 */
export async function cancelBuyerOrder(opts: {
  orderId: string;
  userId: string;
  reason?: string;
}) {
  const order = await prisma.order.findFirst({
    where: { id: opts.orderId, userId: opts.userId },
    include: { items: true },
  });
  if (!order) {
    throw Object.assign(new Error("Order not found"), { status: 404 });
  }
  if (!canBuyerCancel(order.status)) {
    throw Object.assign(new Error("This order can no longer be cancelled"), {
      status: 400,
    });
  }

  // Restock if already confirmed (stock was decremented on pay/COD confirm)
  if (order.status !== "PENDING") {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  const reason = opts.reason || "Cancelled by customer";

  // Unpaid online pending → fail payment; COD unpaid → fail
  if (order.paymentStatus === "PENDING") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
  }

  await transitionOrderStatus({
    orderId: order.id,
    status: "CANCELLED",
    source: "buyer",
    allowTerminal: true,
    cancelReason: reason,
    title: "Order cancelled",
    message: reason,
  });

  let refund: Awaited<ReturnType<typeof initiateRefundForCancelledOrder>> | null =
    null;

  if (
    order.paymentStatus === "PAID" &&
    isOnlinePaymentMethod(order.paymentMethod)
  ) {
    refund = await initiateRefundForCancelledOrder(order.id);
  }

  return {
    success: true,
    status: "CANCELLED" as const,
    refund,
    refundMessage:
      refund?.refunded
        ? "Refund has been initiated to your original payment method."
        : order.paymentStatus === "PAID" && isOnlinePaymentMethod(order.paymentMethod)
          ? "Order cancelled. Refund will be processed — check timeline or contact support."
          : undefined,
  };
}
