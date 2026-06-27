import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { unblockSeller } from "@/lib/seller-gst";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const { action, adminNote } = await req.json();

    const request = await prisma.sellerActivationRequest.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!request || request.status !== "PENDING") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "reject") {
      await prisma.sellerActivationRequest.update({
        where: { id },
        data: { status: "REJECTED", adminNote },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "approve") {
      await unblockSeller(request.sellerId);
      await prisma.sellerActivationRequest.update({
        where: { id },
        data: { status: "APPROVED", adminNote },
      });
      await prisma.sellerNotice.create({
        data: {
          sellerId: request.sellerId,
          title: "Account Reactivated",
          message: "Your seller account has been reactivated by admin. Please verify your GST to continue selling.",
          isRead: false,
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
