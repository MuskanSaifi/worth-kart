import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canAdvanceOrderStatus,
  mapShiprocketStatusToOrderStatus,
} from "@/lib/shiprocket";
import type { OrderStatus } from "@/lib/order-status";
import { transitionOrderStatus } from "@/lib/order-lifecycle";

/**
 * Shiprocket tracking webhook.
 * Configure in Shiprocket panel to POST here (use ngrok URL on localhost).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const awb =
      (typeof body.awb === "string" && body.awb) ||
      (typeof body.awb_code === "string" && body.awb_code) ||
      (typeof (body as { tracking_data?: { awb?: string } }).tracking_data?.awb === "string" &&
        (body as { tracking_data: { awb: string } }).tracking_data.awb) ||
      "";

    const shipmentId =
      (body.shipment_id != null && String(body.shipment_id)) ||
      (body.sr_shipment_id != null && String(body.sr_shipment_id)) ||
      (body.shiprocketShipmentId != null && String(body.shiprocketShipmentId)) ||
      "";

    const rawStatus =
      (typeof body.current_status === "string" && body.current_status) ||
      (typeof body.status === "string" && body.status) ||
      (typeof body.shipment_status === "string" && body.shipment_status) ||
      (typeof body.current_status_id === "string" && body.current_status_id) ||
      "";

    if (!awb && !shipmentId) {
      return NextResponse.json({ error: "Missing awb or shipment_id" }, { status: 400 });
    }

    const nextStatus = mapShiprocketStatusToOrderStatus(rawStatus || "");
    if (!nextStatus) {
      return NextResponse.json({ ok: true, ignored: true, reason: "unmapped_status" });
    }

    const item = await prisma.orderItem.findFirst({
      where: {
        OR: [
          ...(awb ? [{ awbCode: awb }] : []),
          ...(shipmentId ? [{ shiprocketShipmentId: shipmentId }] : []),
        ],
      },
      include: { order: true },
    });

    if (!item) {
      return NextResponse.json({ ok: true, ignored: true, reason: "order_not_found" });
    }

    if (!canAdvanceOrderStatus(item.order.status, nextStatus)) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "no_advance",
        current: item.order.status,
        suggested: nextStatus,
      });
    }

    const eddRaw =
      (typeof body.etd === "string" && body.etd) ||
      (typeof body.edd === "string" && body.edd) ||
      (typeof body.expected_delivery_date === "string" && body.expected_delivery_date) ||
      "";
    if (eddRaw) {
      const edd = new Date(eddRaw);
      if (!Number.isNaN(edd.getTime())) {
        await prisma.order.update({
          where: { id: item.orderId },
          data: { estimatedDeliveryAt: edd },
        });
      }
    }

    await transitionOrderStatus({
      orderId: item.orderId,
      status: nextStatus as OrderStatus,
      source: "courier",
      message: rawStatus ? `Courier update: ${rawStatus}` : undefined,
    });

    if (nextStatus === "SHIPPED" && !item.shippedAt) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { shippedAt: new Date() },
      });
    }

    return NextResponse.json({
      ok: true,
      orderId: item.orderId,
      from: item.order.status,
      to: nextStatus,
    });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
