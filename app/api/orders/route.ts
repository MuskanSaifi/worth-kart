import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerEmailForPayment } from "@/lib/user-email";
import { requireAuth } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations";
import { generateOrderNumber } from "@/lib/utils";
import {
  createCashfreePgOrder,
  isOnlinePaymentMethod,
} from "@/lib/cashfree-pg";
import { cashfreePgMode, getCashfreePgConfigError, isCashfreePgConfigured } from "@/lib/cashfree";
import { cancelPendingOrder } from "@/lib/order-fulfillment";

export async function GET() {
  try {
    const session = await requireAuth();
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const address = await prisma.address.findFirst({
      where: { id: parsed.data.addressId, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true, phone: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const shipping = subtotal > 499 ? 0 : 40;
    const total = subtotal + shipping;

    const paymentMethod =
      parsed.data.paymentMethod === "ONLINE" ||
      parsed.data.paymentMethod === "UPI" ||
      parsed.data.paymentMethod === "CARD" ||
      parsed.data.paymentMethod === "WALLET"
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
            userId: session.user.id,
            addressId: address.id,
            paymentMethod: "COD",
            paymentStatus: "PENDING",
            status: "CONFIRMED",
            subtotal,
            shipping,
            total,
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
                sellerId: item.product.sellerId,
              })),
            },
          },
          include: { items: true },
        });

        for (const item of cart.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
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
        userId: session.user.id,
        addressId: address.id,
        paymentMethod: "ONLINE",
        paymentStatus: "PENDING",
        status: "PENDING",
        subtotal,
        shipping,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            sellerId: item.product.sellerId,
          })),
        },
      },
      include: { items: true },
    });

    try {
      const pgOrder = await createCashfreePgOrder({
        orderId: order.orderNumber,
        amount: total,
        customerId: session.user.id,
        customerName: address.name || user.name || "Customer",
        customerEmail: getCustomerEmailForPayment(user),
        customerPhone: address.phone || user.phone || "9999999999",
        orderNote: `WorthKart order ${order.orderNumber}`,
      });

      return NextResponse.json(
        {
          order,
          paymentSessionId: pgOrder.payment_session_id,
          cashfreeMode: cashfreePgMode(),
        },
        { status: 201 }
      );
    } catch (error) {
      await cancelPendingOrder(order.id);
      console.error("[cashfree] create order failed:", error);
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
    console.error("[orders] checkout failed:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
