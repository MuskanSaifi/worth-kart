import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

/** List pending seller settlements (weekly payout queue). */
export async function GET() {
  try {
    await requireRole("ADMIN");

    const pending = await prisma.sellerSettlement.findMany({
      where: { status: "PENDING" },
      orderBy: { availableAt: "asc" },
      take: 200,
    });

    const sellers = await prisma.sellerProfile.findMany({
      where: { id: { in: [...new Set(pending.map((p) => p.sellerId))] } },
      select: {
        id: true,
        businessName: true,
        bankVerified: true,
        bankAccount: true,
        bankIfsc: true,
      },
    });
    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    const totalPending = pending.reduce((s, row) => s + row.netAmount, 0);
    const bySellerMap = new Map<
      string,
      {
        sellerId: string;
        businessName: string;
        bankVerified: boolean;
        count: number;
        amount: number;
      }
    >();
    for (const row of pending) {
      const info = sellerMap.get(row.sellerId);
      const cur = bySellerMap.get(row.sellerId) || {
        sellerId: row.sellerId,
        businessName: info?.businessName || "Seller",
        bankVerified: !!info?.bankVerified,
        count: 0,
        amount: 0,
      };
      cur.count += 1;
      cur.amount += row.netAmount;
      bySellerMap.set(row.sellerId, cur);
    }

    return NextResponse.json({
      totalPending,
      pendingCount: pending.length,
      bySeller: Array.from(bySellerMap.values()),
      items: pending.map((p) => ({
        ...p,
        businessName: sellerMap.get(p.sellerId)?.businessName || "Seller",
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("Unauthorized") || msg.includes("Forbidden") ? 401 : 500 }
    );
  }
}

/**
 * Mark settlements PAID after bank transfer (manual / weekly).
 * Body: { settlementIds?: string[], sellerId?: string, markAllPending?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json();
    const batchId = `PAYOUT-${Date.now()}`;
    const now = new Date();

    let where: Record<string, unknown> = { status: "PENDING" };
    if (Array.isArray(body.settlementIds) && body.settlementIds.length > 0) {
      where = { status: "PENDING", id: { in: body.settlementIds } };
    } else if (typeof body.sellerId === "string" && body.sellerId) {
      where = { status: "PENDING", sellerId: body.sellerId };
    } else if (!body.markAllPending) {
      return NextResponse.json(
        { error: "Provide settlementIds, sellerId, or markAllPending:true" },
        { status: 400 }
      );
    }

    const result = await prisma.sellerSettlement.updateMany({
      where,
      data: {
        status: "PAID",
        paidAt: now,
        payoutBatchId: batchId,
        notes: "Marked paid by admin (weekly bank transfer)",
      },
    });

    return NextResponse.json({
      success: true,
      payoutBatchId: batchId,
      marked: result.count,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("Unauthorized") || msg.includes("Forbidden") ? 401 : 500 }
    );
  }
}
