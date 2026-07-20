import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { transitionOrderStatus } from "@/lib/order-lifecycle";
import type { OrderStatus } from "@/lib/order-status";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const status = req.nextUrl.searchParams.get("status");
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const where: Record<string, unknown> = {};
    if (status) where.status = status.toUpperCase();
    if (q) {
      where.OR = [
        { orderNumber: { contains: q } },
        { user: { email: { contains: q } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        address: true,
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        events: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const counts = await prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    return NextResponse.json({
      orders,
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const orderId = String(body.orderId || "");
    const status = String(body.status || "").toUpperCase() as OrderStatus;

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
    }

    const allowTerminal = status === "CANCELLED" || status === "RETURNED";

    // Admin can force any forward or terminal status
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (allowTerminal) {
      await transitionOrderStatus({
        orderId,
        status,
        source: "admin",
        allowTerminal: true,
        cancelReason: typeof body.reason === "string" ? body.reason : undefined,
        title: status === "CANCELLED" ? "Cancelled by admin" : "Marked returned by admin",
        message: typeof body.reason === "string" ? body.reason : undefined,
      });
    } else {
      // For non-terminal, temporarily set via direct update if not advancing
      // Use lifecycle when advancing; otherwise force for admin ops
      try {
        await transitionOrderStatus({
          orderId,
          status,
          source: "admin",
          message: "Status updated by admin",
        });
      } catch {
        await prisma.order.update({ where: { id: orderId }, data: { status } });
        const { recordOrderEvent } = await import("@/lib/order-lifecycle");
        await recordOrderEvent({
          orderId,
          status,
          title: `Status set to ${status}`,
          message: "Forced update by admin",
          source: "admin",
        });
        const { notifyOrderStatusChange } = await import("@/lib/order-notifications");
        void notifyOrderStatusChange(orderId, status).catch(() => null);
      }
    }

    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: { events: { orderBy: { createdAt: "desc" }, take: 10 } },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
