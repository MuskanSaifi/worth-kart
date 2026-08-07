import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillPaidOrder } from "@/lib/order-fulfillment";
import { applyRefundWebhookStatus } from "@/lib/order-refund";

interface CashfreeWebhookPayload {
  type?: string;
  data?: {
    order?: {
      order_id?: string;
      order_status?: string;
    };
    payment?: {
      cf_payment_id?: string;
      payment_status?: string;
    };
    refund?: {
      refund_id?: string;
      cf_refund_id?: string;
      refund_status?: string;
      refund_amount?: number;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CashfreeWebhookPayload;
    const orderNumber = payload.data?.order?.order_id;
    if (!orderNumber) {
      return NextResponse.json({ ok: true });
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber },
    });
    if (!order) {
      return NextResponse.json({ ok: true });
    }

    const orderStatus = payload.data?.order?.order_status;
    const paymentStatus = payload.data?.payment?.payment_status;
    const isPaid =
      orderStatus === "PAID" ||
      paymentStatus === "SUCCESS" ||
      payload.type === "PAYMENT_SUCCESS_WEBHOOK";

    if (isPaid && order.paymentStatus !== "PAID" && order.paymentStatus !== "REFUNDED") {
      await fulfillPaidOrder(
        order.id,
        payload.data?.payment?.cf_payment_id
      );
    }

    if (
      (orderStatus === "EXPIRED" || orderStatus === "TERMINATED") &&
      order.paymentStatus === "PENDING"
    ) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      });
    }

    const refund = payload.data?.refund;
    const isRefundEvent =
      !!refund ||
      payload.type?.toUpperCase().includes("REFUND") ||
      false;

    if (isRefundEvent && refund) {
      await applyRefundWebhookStatus({
        orderNumber,
        refundId: refund.refund_id || refund.cf_refund_id,
        refundStatus: refund.refund_status,
        refundAmount: refund.refund_amount,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[cashfree] webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
