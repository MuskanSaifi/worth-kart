import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { unblockSeller } from "@/lib/seller-gst";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const seller = await prisma.sellerProfile.findUnique({ where: { id } });
    if (!seller || seller.status !== "BLOCKED") {
      return NextResponse.json({ error: "Seller not found or not blocked" }, { status: 404 });
    }

    await unblockSeller(id);
    await prisma.sellerNotice.create({
      data: {
        sellerId: id,
        title: "Account Reactivated",
        message: "Your seller account has been reactivated by admin. Please verify your GST to continue selling.",
        isRead: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to unblock seller" }, { status: 500 });
  }
}
