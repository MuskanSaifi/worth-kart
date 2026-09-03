import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canAdvanceOrderStatus,
  mapShiprocketStatusToOrderStatus,
} from "@/lib/shiprocket";
import type { OrderStatus } from "@/lib/order-status";
import { transitionOrderStatus } from "@/lib/order-lifecycle";

/** Shiprocket "Test Webhook" often sends GET — must return 200. */
export async function GET() {
  return NextResponse.json({ ok: true, message: "WorthKart courier webhook ready" });
}

/**
 * Shiprocket tracking webhook (POST).
 * Live URL (no forbidden keywords): /api/shipping/courier/webhook
 */
export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    const raw = await req.text();
    if (raw.trim()) {
      try {
        body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    }

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

    // Test ping / empty payload — accept so Shiprocket panel test passes
    if (!awb && !shipmentId) {
      return NextResponse.json({ ok: true, message: "Webhook reachable", test: true });
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
  } catch (e) {
    console.error("[courier/webhook]", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
