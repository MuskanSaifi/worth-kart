import { prisma } from "@/lib/prisma";
import { recordOrderEvent } from "@/lib/order-lifecycle";

/** Mark order paid, decrement stock, and clear cart (idempotent). */
export async function fulfillPaidOrder(
  orderId: string,
  gatewayPaymentId?: string
) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return null;
    if (order.paymentStatus === "PAID") return { order, newlyPaid: false };

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        ...(gatewayPaymentId ? { gatewayPaymentId } : {}),
      },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const cart = await tx.cart.findUnique({
      where: { userId: order.userId },
    });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return { order: updated, newlyPaid: true };
  });

  if (result?.newlyPaid) {
    await recordOrderEvent({
      orderId,
      status: "CONFIRMED",
      title: "Order confirmed",
      message: "Payment received. Your order is confirmed.",
      source: "system",
    });
    const { notifyOrderStatusChange } = await import("@/lib/order-notifications");
    void notifyOrderStatusChange(orderId, "CONFIRMED").catch(() => null);
  }

  return result?.order ?? null;
}

/** Cancel a pending online order when payment session could not be created. */
export async function cancelPendingOrder(orderId: string) {
  const res = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: "PENDING", status: "PENDING" },
    data: {
      status: "CANCELLED",
      paymentStatus: "FAILED",
      cancelledAt: new Date(),
      cancelReason: "Payment session failed",
    },
  });

  if (res.count > 0) {
    await recordOrderEvent({
      orderId,
      status: "CANCELLED",
      title: "Order cancelled",
      message: "Payment could not be completed.",
      source: "system",
    });
    const { notifyOrderStatusChange } = await import("@/lib/order-notifications");
    void notifyOrderStatusChange(orderId, "CANCELLED").catch(() => null);
  }

  return res;
}
