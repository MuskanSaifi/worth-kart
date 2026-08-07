import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAppSessionToken, normalizePhone } from "@/lib/app-auth";
import { isOtpVerifiedRecently } from "@/lib/otp-check";

/**
 * Create a mobile Seller Hub session after phone OTP verify.
 * Body: { phone: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { phone?: string };
    const phone = normalizePhone(body.phone || "");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter valid 10-digit Indian mobile number" },
        { status: 400 }
      );
    }

    const phoneOk = await isOtpVerifiedRecently(phone, "phone", 15);
    if (!phoneOk) {
      return NextResponse.json(
        { error: "Please verify OTP again to continue" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { sellerProfile: true },
    });
    if (!user || user.role !== "SELLER") {
      return NextResponse.json({ error: "Seller account not found" }, { status: 404 });
    }
    if (!user.sellerProfile) {
      return NextResponse.json({ error: "Complete seller registration first" }, { status: 400 });
    }

    const token = createAppSessionToken({
      id: user.id,
      phone: user.phone,
      role: "SELLER",
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        businessName: user.sellerProfile.businessName || "Seller",
        sellerStatus: user.sellerProfile.status || null,
      },
    });
  } catch (e) {
    console.error("[app/seller/session]", e);
    return NextResponse.json({ error: "Could not create seller session" }, { status: 500 });
  }
}
