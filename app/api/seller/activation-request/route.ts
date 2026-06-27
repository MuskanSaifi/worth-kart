import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { SUPPORT_EMAIL } from "@/lib/seller-gst";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(20, "Please explain your situation (min 20 characters)"),
});

export async function POST(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile();

    if (seller.status !== "BLOCKED") {
      return NextResponse.json({ error: "Account is not blocked" }, { status: 400 });
    }

    const pending = await prisma.sellerActivationRequest.findFirst({
      where: { sellerId: seller.id, status: "PENDING" },
    });
    if (pending) {
      return NextResponse.json({
        error: "You already have a pending activation request. Admin will review it soon.",
      }, { status: 409 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const request = await prisma.sellerActivationRequest.create({
      data: {
        sellerId: seller.id,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({
      request,
      message: `Activation request submitted. You can also email ${SUPPORT_EMAIL} for faster support.`,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { seller } = await getSellerProfile();
    const requests = await prisma.sellerActivationRequest.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
