import { NextRequest, NextResponse } from "next/server";
import { createAppSessionToken, getOrCreateBuyerByPhone, normalizePhone } from "@/lib/app-auth";
import { isOtpVerifiedRecently } from "@/lib/otp-check";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { phone?: string };
    const phone = normalizePhone(body.phone || "");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Enter valid 10-digit Indian mobile number" }, { status: 400 });
    }

    const phoneOk = await isOtpVerifiedRecently(phone, "phone", 10);
    if (!phoneOk) {
      return NextResponse.json({ error: "Please verify OTP again to continue" }, { status: 401 });
    }

    const user = await getOrCreateBuyerByPhone(phone);
    const token = createAppSessionToken({
      id: user.id,
      phone: user.phone,
      role: user.role === "ADMIN" ? "ADMIN" : user.role === "SELLER" ? "SELLER" : "BUYER",
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not create app session" }, { status: 500 });
  }
}
