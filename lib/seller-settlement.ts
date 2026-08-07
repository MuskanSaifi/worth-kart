import { prisma } from "@/lib/prisma";
import { calcSellerShare, PLATFORM_COMMISSION_RATE } from "@/lib/seller-commission";

/**
 * After delivery: mark COD as collected + create seller settlement lines.
 * Idempotent — safe to call multiple times for the same order.
 */
export async function settleOrderOnDelivery(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  if (!order || order.status !== "DELIVERED") {
    return { settled: 0, codMarkedPaid: false };
  }

  let codMarkedPaid = false;

  // COD: platform "receives" cash on delivery confirmation
  if (
    order.paymentMethod === "COD" &&
    order.paymentStatus === "PENDING"
  ) {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    });
    codMarkedPaid = true;
  }

  // Only settle when payment is PAID (online already paid; COD marked above)
  const fresh = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true, paymentMethod: true, orderNumber: true },
  });
  if (!fresh || fresh.paymentStatus !== "PAID") {
    return { settled: 0, codMarkedPaid };
  }

  const existing = await prisma.sellerSettlement.findMany({
    where: { orderId },
    select: { orderItemId: true },
  });
  const have = new Set(existing.map((e) => e.orderItemId));

  let settled = 0;
  const now = new Date();

  for (const item of order.items) {
    if (have.has(item.id)) continue;
    const grossAmount = item.price * item.quantity;
    const { commissionRate, commissionAmount, netAmount } =
      calcSellerShare(grossAmount, PLATFORM_COMMISSION_RATE);

    try {
      await prisma.sellerSettlement.create({
        data: {
          sellerId: item.sellerId,
          orderId: order.id,
          orderItemId: item.id,
          orderNumber: fresh.orderNumber,
          productName: item.product.name,
          quantity: item.quantity,
          grossAmount,
          commissionRate,
          commissionAmount,
          netAmount,
          paymentMethod: fresh.paymentMethod,
          status: "PENDING",
          availableAt: now,
          notes: "Auto-created on delivery",
        },
      });
      settled += 1;
    } catch (e) {
      // Unique on orderItemId — race / already exists
      console.warn("[settleOrderOnDelivery] skip item", item.id, e);
    }
  }

  // Bump seller totalSales (delivered units)
  const bySeller = new Map<string, number>();
  for (const item of order.items) {
    bySeller.set(item.sellerId, (bySeller.get(item.sellerId) || 0) + item.quantity);
  }
  for (const [sellerId, qty] of bySeller) {
    await prisma.sellerProfile
      .update({
        where: { id: sellerId },
        data: { totalSales: { increment: qty } },
      })
      .catch(() => null);
  }

  return { settled, codMarkedPaid };
}

/** Cancel pending settlements when order is returned. */
export async function cancelSettlementsOnReturn(orderId: string) {
  const res = await prisma.sellerSettlement.updateMany({
    where: { orderId, status: "PENDING" },
    data: {
      status: "CANCELLED",
      notes: "Cancelled due to return",
    },
  });
  return res.count;
}
