import { prisma } from "@/lib/prisma";

function invoiceSerial(orderNumber: string, sellerId: string) {
  const sellerPart = sellerId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `WK-${orderNumber}-${sellerPart}`;
}

/**
 * Create tax invoice records when an order ships (idempotent per seller).
 */
export async function ensureTaxInvoicesForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { sellerId: true } } },
  });
  if (!order) return [];

  const sellerIds = [...new Set(order.items.map((i) => i.sellerId))];
  const invoiceDate = new Date();
  const created = [];

  for (const sellerId of sellerIds) {
    const existing = await prisma.taxInvoice.findUnique({
      where: { orderId_sellerId: { orderId, sellerId } },
    });
    if (existing) {
      created.push(existing);
      continue;
    }
    const row = await prisma.taxInvoice.create({
      data: {
        orderId,
        sellerId,
        invoiceNumber: invoiceSerial(order.orderNumber, sellerId),
        invoiceDate,
      },
    });
    created.push(row);
  }

  return created;
}

export function canDownloadOrderInvoice(order: {
  status: string;
  paymentMethod: string;
  paymentStatus: string;
}): boolean {
  const shipped = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status);
  if (!shipped) return false;
  if (order.status === "CANCELLED" || order.status === "RETURNED") return false;
  if (order.paymentMethod === "COD") {
    return order.status !== "PENDING";
  }
  return order.paymentStatus === "PAID";
}
