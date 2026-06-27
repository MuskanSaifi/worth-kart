import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";

export async function GET() {
  try {
    const { seller } = await getSellerProfile();

    const [returns, claims, payments] = await Promise.all([
      prisma.returnRequest.findMany({
        where: { sellerId: seller.id },
        include: {
          orderItem: {
            include: { product: true, order: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sellerClaim.findMany({
        where: { sellerId: seller.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.orderItem.findMany({
        where: { sellerId: seller.id, order: { paymentStatus: "PAID" } },
        include: { order: true, product: true },
      }),
    ]);

    const totalEarnings = payments.reduce((s, i) => s + i.price * i.quantity * 0.9, 0);
    const pendingPayout = payments
      .filter((i) => i.order.status === "DELIVERED")
      .reduce((s, i) => s + i.price * i.quantity * 0.9, 0);

    return NextResponse.json({
      returns,
      claims,
      payments: { totalEarnings, pendingPayout, items: payments.slice(0, 20) },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile();
    const body = await req.json();

    if (body.type === "claim") {
      const claim = await prisma.sellerClaim.create({
        data: {
          sellerId: seller.id,
          title: body.title,
          description: body.description,
        },
      });
      return NextResponse.json({ claim }, { status: 201 });
    }

    if (body.type === "return_action") {
      await prisma.returnRequest.update({
        where: { id: body.returnId },
        data: { status: body.status },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
