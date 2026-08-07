import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { PLATFORM_COMMISSION_RATE } from "@/lib/seller-commission";

export async function GET(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);

    const [returns, claims, settlements, notices] = await Promise.all([
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
      prisma.sellerSettlement.findMany({
        where: { sellerId: seller.id },
        orderBy: { availableAt: "desc" },
        take: 50,
      }),
      prisma.sellerNotice.findMany({
        where: { OR: [{ sellerId: seller.id }, { sellerId: null }] },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const pendingPayout = settlements
      .filter((s) => s.status === "PENDING")
      .reduce((sum, s) => sum + s.netAmount, 0);
    const paidOut = settlements
      .filter((s) => s.status === "PAID")
      .reduce((sum, s) => sum + s.netAmount, 0);
    const totalEarnings = pendingPayout + paidOut;
    const onHold = settlements
      .filter((s) => s.status === "ON_HOLD")
      .reduce((sum, s) => sum + s.netAmount, 0);

    // Backward-compatible items shape for existing app/web UIs
    const items = settlements
      .filter((s) => s.status === "PENDING" || s.status === "PAID")
      .slice(0, 30)
      .map((s) => ({
        id: s.id,
        price: s.grossAmount / Math.max(s.quantity, 1),
        quantity: s.quantity,
        netAmount: s.netAmount,
        grossAmount: s.grossAmount,
        commissionAmount: s.commissionAmount,
        settlementStatus: s.status,
        product: { name: s.productName },
        order: {
          orderNumber: s.orderNumber,
          paymentStatus: "PAID",
          status: s.status === "PAID" ? "PAID_OUT" : "DELIVERED",
        },
      }));

    return NextResponse.json({
      returns,
      claims,
      notices,
      profile: {
        id: seller.id,
        businessName: seller.businessName,
        businessType: seller.businessType,
        status: seller.status,
        gstNumber: seller.gstNumber,
        gstVerified: seller.gstVerified,
        panNumber: seller.panNumber,
        panVerified: seller.panVerified,
        bankAccount: seller.bankAccount,
        bankIfsc: seller.bankIfsc,
        bankVerified: seller.bankVerified,
        bankName: seller.bankName,
        pickupAddress: seller.pickupAddress,
        city: seller.city,
        state: seller.state,
        pincode: seller.pincode,
        rating: seller.rating,
        totalSales: seller.totalSales,
      },
      payments: {
        totalEarnings,
        pendingPayout,
        paidOut,
        onHold,
        commissionRate: PLATFORM_COMMISSION_RATE,
        commissionPercent: Math.round(PLATFORM_COMMISSION_RATE * 100),
        payoutSchedule: "Every Wednesday · bank transfer after delivery",
        flowHint:
          "Customer pays WorthKart (Cashfree). After delivery, your share (after 10% commission) is added to Pending Payout.",
        settlements,
        items,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);
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
      const updated = await prisma.returnRequest.update({
        where: { id: body.returnId },
        data: { status: body.status },
        include: { orderItem: true },
      });

      if (body.status === "COMPLETED" || body.status === "APPROVED") {
        const { transitionOrderStatus, recordOrderEvent } = await import(
          "@/lib/order-lifecycle"
        );
        if (body.status === "COMPLETED") {
          await transitionOrderStatus({
            orderId: updated.orderItem.orderId,
            status: "RETURNED",
            source: "seller",
            allowTerminal: true,
            title: "Order returned",
            message: "Return completed by seller.",
          }).catch(async () => {
            await recordOrderEvent({
              orderId: updated.orderItem.orderId,
              status: "RETURNED",
              title: "Return completed",
              source: "seller",
            });
          });
        } else {
          await recordOrderEvent({
            orderId: updated.orderItem.orderId,
            title: "Return approved",
            message: "Seller approved the return request.",
            source: "seller",
          });
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
