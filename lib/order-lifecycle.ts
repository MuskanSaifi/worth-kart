import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { canAdvanceOrderStatus } from "@/lib/shiprocket";
import { computeEstimatedDelivery, statusTitle } from "@/lib/order-messages";
import { notifyOrderStatusChange } from "@/lib/order-notifications";
import { generateOtp4 } from "@/lib/utils";
import type { OrderStatus } from "@/lib/order-status";
import { ensureTaxInvoicesForOrder } from "@/lib/tax-invoice";

export type OrderEventSource = "system" | "seller" | "buyer" | "courier" | "admin";

type TransitionOpts = {
  orderId: string;
  status: OrderStatus;
  source: OrderEventSource;
  title?: string;
  message?: string;
  allowTerminal?: boolean;
  cancelReason?: string;
  skipNotify?: boolean;
};

/**
 * Single pipeline for status changes: validate → update → timeline → EDD/OTP → notify.
 */
export async function transitionOrderStatus(opts: TransitionOpts) {
  const order = await prisma.order.findUnique({ where: { id: opts.orderId } });
  if (!order) throw new Error("Order not found");

  if (order.status === opts.status) {
    return { order, deliveryOtp: null as string | null, unchanged: true };
  }

  const isTerminal =
    opts.status === "CANCELLED" || opts.status === "RETURNED";

  if (isTerminal && !opts.allowTerminal) {
    throw new Error("Terminal status requires allowTerminal");
  }

  if (!isTerminal && !canAdvanceOrderStatus(order.status, opts.status)) {
    throw new Error(`Cannot change status from ${order.status} to ${opts.status}`);
  }

  // Don't cancel/return from delivered without explicit admin path for return
  if (opts.status === "CANCELLED" && order.status === "DELIVERED") {
    throw new Error("Delivered orders cannot be cancelled — request a return instead");
  }

  let deliveryOtp: string | null = null;
  const data: Record<string, unknown> = { status: opts.status };

  if (opts.status === "SHIPPED" && !order.estimatedDeliveryAt) {
    data.estimatedDeliveryAt = computeEstimatedDelivery(new Date());
  }

  if (opts.status === "OUT_FOR_DELIVERY") {
    deliveryOtp = generateOtp4();
    data.deliveryOtpHash = await bcrypt.hash(deliveryOtp, 8);
    data.deliveryOtpExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }

  if (opts.status === "DELIVERED") {
    data.deliveredAt = new Date();
    data.deliveryOtpHash = null;
    data.deliveryOtpExpiresAt = null;
  }

  if (opts.status === "CANCELLED") {
    data.cancelledAt = new Date();
    if (opts.cancelReason) data.cancelReason = opts.cancelReason;
  }

  const updated = await prisma.order.update({
    where: { id: opts.orderId },
    data,
  });

  await prisma.orderEvent.create({
    data: {
      orderId: opts.orderId,
      status: opts.status,
      title: opts.title || statusTitle(opts.status),
      message: opts.message || null,
      source: opts.source,
    },
  });

  if (!opts.skipNotify) {
    // Fire-and-forget so API latency stays low
    void notifyOrderStatusChange(opts.orderId, opts.status, {
      deliveryOtp,
    }).catch((e) => console.warn("[transitionOrderStatus] notify", e));
  }

  if (opts.status === "SHIPPED") {
    void ensureTaxInvoicesForOrder(opts.orderId).catch((e) =>
      console.warn("[transitionOrderStatus] tax invoice", e)
    );
  }

  if (opts.status === "DELIVERED") {
    void import("@/lib/seller-settlement")
      .then(({ settleOrderOnDelivery }) => settleOrderOnDelivery(opts.orderId))
      .catch((e) => console.warn("[transitionOrderStatus] settlement", e));
  }

  if (opts.status === "RETURNED") {
    void import("@/lib/seller-settlement")
      .then(({ cancelSettlementsOnReturn }) => cancelSettlementsOnReturn(opts.orderId))
      .catch((e) => console.warn("[transitionOrderStatus] return settlement", e));
  }

  return { order: updated, deliveryOtp, unchanged: false };
}

export async function recordOrderEvent(opts: {
  orderId: string;
  status?: OrderStatus | null;
  title: string;
  message?: string;
  source: OrderEventSource;
}) {
  return prisma.orderEvent.create({
    data: {
      orderId: opts.orderId,
      status: opts.status ?? null,
      title: opts.title,
      message: opts.message || null,
      source: opts.source,
    },
  });
}

export function canBuyerCancel(status: string): boolean {
  return status === "PENDING" || status === "CONFIRMED" || status === "PACKED";
}

export function canBuyerRequestReturn(status: string): boolean {
  return status === "DELIVERED";
}

export async function verifyDeliveryOtp(orderId: string, otp: string): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.deliveryOtpHash) return false;
  if (order.deliveryOtpExpiresAt && order.deliveryOtpExpiresAt < new Date()) return false;
  return bcrypt.compare(otp.trim(), order.deliveryOtpHash);
}
