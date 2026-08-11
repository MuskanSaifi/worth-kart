import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buyerLoginSchema } from "@/lib/validations";
import { sendAndStoreOtp } from "@/lib/otp-send";

/**
 * App buyer login OTP — number + OTP only.
 * No prior registration required; /api/app/session creates the buyer after verify.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = buyerLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const phone = parsed.data.phone.replace(/\D/g, "").slice(-10);
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { role: true },
    });

    if (user?.role === "ADMIN") {
      return NextResponse.json(
        { error: "This number belongs to an admin account. Use admin login." },
        { status: 400 }
      );
    }

    const result = await sendAndStoreOtp(phone, "phone");
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      type: result.type,
      target: result.target,
      maskedTarget: result.maskedTarget,
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (e) {
    console.error("App buyer login OTP error:", e);
    return NextResponse.json({ error: "Failed to send login OTP" }, { status: 500 });
  }
}
