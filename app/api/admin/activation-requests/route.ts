import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const requests = await prisma.sellerActivationRequest.findMany({
      where: { status: "PENDING" },
      include: {
        seller: {
          select: {
            businessName: true,
            gstNumber: true,
            gstFailedAttempts: true,
            gstBlockReason: true,
            user: { select: { email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const blockedSellers = await prisma.sellerProfile.findMany({
      where: { status: "BLOCKED" },
      include: { user: { select: { email: true, phone: true } } },
    });

    return NextResponse.json({ requests, blockedSellers });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
