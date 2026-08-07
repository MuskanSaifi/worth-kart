import { prisma } from "@/lib/prisma";
import {
  createCashfreeOrderRefund,
  isOnlinePaymentMethod,
} from "@/lib/cashfree-pg";
import { isCashfreePgConfigured } from "@/lib/cashfree";
import { recordOrderEvent } from "@/lib/order-lifecycle";

export const REFUND_ETA_COPY =
  "Refund usually reaches you in 1–3 business days for UPI, and 3–5 business days for cards / net banking. Bank may take a little longer after WorthKart initiates the refund.";

/**
 * After buyer cancel (or admin): refund paid online orders via Cashfree.
 * COD / unpaid → no gateway refund.
 */
export async function initiateRefundForCancelledOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { refunded: false, reason: "not_found" as const };

  // Already refunded at gateway
  if (order.paymentStatus === "REFUNDED" && order.refundId) {
    return { refunded: true, reason: "already" as const, refundId: order.refundId };
  }

  if (order.paymentStatus !== "PAID") {
    return { refunded: false, reason: "not_paid" as const };
  }

  if (!isOnlinePaymentMethod(order.paymentMethod)) {
    // COD was never collected online
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "FAILED" },
    });
    return { refunded: false, reason: "cod" as const };
  }

  if (!isCashfreePgConfigured()) {
    await recordOrderEvent({
      orderId,
      title: "Refund pending",
      message:
        "Online payment was received but Cashfree is not configured. Contact support for manual refund.",
      source: "system",
    });
    return { refunded: false, reason: "not_configured" as const };
  }

  const refundId = `RF${order.orderNumber}`.slice(0, 40);
  const amount = order.total;

  try {
    const result = await createCashfreeOrderRefund({
      orderId: order.orderNumber,
      refundId,
      amount,
      note: `Cancel refund for ${order.orderNumber}`,
    });

    const status = (
      result.refund_status ||
      result.status ||
      "PENDING"
    ).toUpperCase();
    const successLike = status === "SUCCESS" || status === "PENDING" || status === "ONHOLD";

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "REFUNDED",
        refundId: result.refund_id || refundId,
        refundStatus: status,
        refundAmount: amount,
        refundedAt: status === "SUCCESS" ? new Date() : null,
      },
    });

    await recordOrderEvent({
      orderId,
      title: "Refund initiated",
      message: `₹${amount.toFixed(2)} refund started to your original payment method. ${REFUND_ETA_COPY}`,
      source: "system",
    });

    if (status === "SUCCESS") {
      await recordOrderEvent({
        orderId,
        title: "Refund completed",
        message:
          "Refund successful at payment gateway. Amount should reflect as per your bank/UPI timeline.",
        source: "system",
      });
    }

    return {
      refunded: successLike,
      reason: "ok" as const,
      refundId: result.refund_id || refundId,
      status,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Refund failed";
    console.error("[initiateRefundForCancelledOrder]", orderId, message);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        refundStatus: "FAILED",
        refundAmount: amount,
        refundId,
      },
    });

    await recordOrderEvent({
      orderId,
      title: "Refund failed",
      message: `Could not auto-refund via Cashfree (${message}). Our team will process this manually — contact support with order ${order.orderNumber}.`,
      source: "system",
    });

    return { refunded: false, reason: "gateway_error" as const, error: message };
  }
}

/** Apply Cashfree refund webhook status updates. */
export async function applyRefundWebhookStatus(opts: {
  orderNumber: string;
  refundId?: string;
  refundStatus?: string;
  refundAmount?: number;
}) {
  const order = await prisma.order.findFirst({
    where: { orderNumber: opts.orderNumber },
  });
  if (!order) return null;

  const status = (opts.refundStatus || "").toUpperCase();
  if (!status) return order;

  const data: Record<string, unknown> = {
    refundStatus: status,
    paymentStatus: "REFUNDED",
  };
  if (opts.refundId) data.refundId = opts.refundId;
  if (opts.refundAmount != null) data.refundAmount = opts.refundAmount;
  if (status === "SUCCESS") data.refundedAt = new Date();

  const updated = await prisma.order.update({
    where: { id: order.id },
    data,
  });

  if (status === "SUCCESS") {
    await recordOrderEvent({
      orderId: order.id,
      title: "Refund completed",
      message:
        "Refund credited by payment gateway. It may take 1–5 business days to appear in your bank/UPI.",
      source: "system",
    }).catch(() => null);
  }

  return updated;
}
