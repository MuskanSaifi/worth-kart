import { NextRequest, NextResponse } from "next/server";
import { createCashfreePgOrder, isOnlinePaymentMethod } from "@/lib/cashfree-pg";
import {
  cashfreePgMode,
  getCashfreePgConfigError,
  getRequestPublicOrigin,
  isCashfreePgConfigured,
} from "@/lib/cashfree";
import { requireAppUser } from "@/lib/app-auth";
import { prisma } from "@/lib/prisma";
import { getCustomerEmailForPayment } from "@/lib/user-email";
import { generateOrderNumber } from "@/lib/utils";
import { cancelPendingOrder } from "@/lib/order-fulfillment";
import { canDownloadOrderInvoice } from "@/lib/tax-invoice";

type AppCheckoutBody = {
  addressId?: string;
  paymentMethod?: string;
  returnUrl?: string;
  items?: { productId?: string; quantity?: number }[];
};

function normalizeReturnUrl(
  returnUrl: string | undefined,
  orderNumber: string,
  publicOrigin: string
) {
  // Cashfree needs a reachable http(s) URL — never exp:// or localhost for phone testing.
  let base = returnUrl?.trim() || `${publicOrigin}/app-pay/return`;
  if (/localhost|127\.0\.0\.1/i.test(base) || /^(exp|worthkart):\/\//i.test(base)) {
    base = `${publicOrigin}/app-pay/return`;
  }
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}order_id=${encodeURIComponent(orderNumber)}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAppUser(req);
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        address: true,
        items: { include: { product: { include: { images: { take: 1 } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      orders: orders.map((o) => ({
        ...o,
        canDownloadInvoice: canDownloadOrderInvoice(o),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAppUser(req);
    const body = (await req.json()) as AppCheckoutBody;
    const addressId = typeof body.addressId === "string" ? body.addressId : "";
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!addressId) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }
    if (rawItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const address = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!address) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const itemMap = new Map<string, number>();
    for (const item of rawItems) {
      const productId = typeof item.productId === "string" ? item.productId : "";
      const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
      if (!productId) continue;
      itemMap.set(productId, (itemMap.get(productId) || 0) + quantity);
    }
    const productIds = [...itemMap.keys()];
    if (productIds.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, qcStatus: "QC_PASS" },
    });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 });
    }

    for (const product of products) {
      const qty = itemMap.get(product.id) || 0;
      if (product.stock < qty) {
        return NextResponse.json(
          { error: `${product.name} has only ${product.stock} item(s) left` },
          { status: 400 }
        );
      }
    }

    const subtotal = products.reduce(
      (sum, product) => sum + product.price * (itemMap.get(product.id) || 0),
      0
    );
    const shipping = subtotal > 499 ? 0 : 40;
    const total = subtotal + shipping;

    const paymentMethod =
      body.paymentMethod === "ONLINE" ||
      body.paymentMethod === "UPI" ||
      body.paymentMethod === "CARD" ||
      body.paymentMethod === "WALLET"
        ? "ONLINE"
        : "COD";

    const isOnline = isOnlinePaymentMethod(paymentMethod);
    if (isOnline && !isCashfreePgConfigured()) {
      return NextResponse.json(
        { error: "Online payment is not configured. Please use Cash on Delivery." },
        { status: 503 }
      );
    }

    const cashfreeConfigError = isOnline ? getCashfreePgConfigError() : null;
    if (cashfreeConfigError) {
      return NextResponse.json({ error: cashfreeConfigError }, { status: 503 });
    }

    const orderNumber = generateOrderNumber();

    if (!isOnline) {
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            addressId: address.id,
            paymentMethod: "COD",
            paymentStatus: "PENDING",
            status: "CONFIRMED",
            subtotal,
            shipping,
            total,
            items: {
              create: products.map((product) => ({
                productId: product.id,
                quantity: itemMap.get(product.id) || 0,
                price: product.price,
                sellerId: product.sellerId,
              })),
            },
          },
          include: { items: true },
        });

        for (const product of products) {
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: itemMap.get(product.id) || 0 } },
          });
        }
        return newOrder;
      });

      const { recordOrderEvent } = await import("@/lib/order-lifecycle");
      await recordOrderEvent({
        orderId: order.id,
        status: "CONFIRMED",
        title: "Order placed",
        message: "Cash on Delivery order confirmed.",
        source: "system",
      });
      const { notifyOrderStatusChange } = await import("@/lib/order-notifications");
      void notifyOrderStatusChange(order.id, "CONFIRMED").catch(() => null);

      return NextResponse.json({ order }, { status: 201 });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: address.id,
        paymentMethod: "ONLINE",
        paymentStatus: "PENDING",
        status: "PENDING",
        subtotal,
        shipping,
        total,
        items: {
          create: products.map((product) => ({
            productId: product.id,
            quantity: itemMap.get(product.id) || 0,
            price: product.price,
            sellerId: product.sellerId,
          })),
        },
      },
      include: { items: true },
    });

    try {
      const publicOrigin = getRequestPublicOrigin(req);
      const pgOrder = await createCashfreePgOrder({
        orderId: order.orderNumber,
        amount: total,
        customerId: user.id,
        customerName: address.name || user.name || "Customer",
        customerEmail: getCustomerEmailForPayment(user),
        customerPhone: address.phone || user.phone || "9999999999",
        orderNote: `WorthKart app order ${order.orderNumber}`,
        returnUrl: normalizeReturnUrl(body.returnUrl, order.orderNumber, publicOrigin),
      });

      // Use Cashfree's hosted payment page directly — no JS SDK needed, works in any in-app browser
      const cashfreeHostedBase =
        cashfreePgMode() === "production"
          ? "https://payments.cashfree.com/order"
          : "https://payments-test.cashfree.com/order";
      const paymentPageUrl = `${cashfreeHostedBase}/#session_id=${encodeURIComponent(pgOrder.payment_session_id)}`;
      return NextResponse.json(
        {
          order,
          paymentSessionId: pgOrder.payment_session_id,
          paymentPageUrl,
        },
        { status: 201 }
      );
    } catch (error) {
      await cancelPendingOrder(order.id);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Could not start online payment. Try again or use COD.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[app orders] checkout failed:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
