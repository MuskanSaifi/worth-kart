import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { fetchCashfreePgOrder } from "@/lib/cashfree-pg";
import { fulfillPaidOrder } from "@/lib/order-fulfillment";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const orderNumber = req.nextUrl.searchParams.get("order_id");
    if (!orderNumber) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber, userId: session.user.id },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        status: "PAID",
        orderNumber: order.orderNumber,
        orderId: order.id,
      });
    }

    const pgOrder = await fetchCashfreePgOrder(order.orderNumber);
    if (!pgOrder) {
      return NextResponse.json(
        { error: "Could not verify payment status" },
        { status: 502 }
      );
    }

    if (pgOrder.order_status === "PAID") {
      await fulfillPaidOrder(order.id);
      return NextResponse.json({
        status: "PAID",
        orderNumber: order.orderNumber,
        orderId: order.id,
      });
    }

    if (pgOrder.order_status === "EXPIRED" || pgOrder.order_status === "TERMINATED") {
      await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: "PENDING" },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      });
      return NextResponse.json({
        status: pgOrder.order_status,
        orderNumber: order.orderNumber,
      });
    }

    return NextResponse.json({
      status: pgOrder.order_status || "PENDING",
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[cashfree] verify failed:", error);
    return NextResponse.json(
      { error: "Could not verify payment status" },
      { status: 500 }
    );
  }
}
