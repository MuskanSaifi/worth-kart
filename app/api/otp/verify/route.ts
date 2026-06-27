import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpVerifySchema } from "@/lib/validations";
import { verifyOtpVia2Factor, isTwoFactorConfigured } from "@/lib/two-factor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { target, type, code } = parsed.data;
    const normalizedTarget =
      type === "email" ? target.trim().toLowerCase() : target.replace(/\D/g, "").slice(-10);

    const otp = await prisma.otp.findFirst({
      where: { target: normalizedTarget, type, verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "OTP not found. Please request a new OTP." }, { status: 400 });
    }

    if (otp.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP expired. Please request a new OTP." }, { status: 400 });
    }

    let valid = false;

    if (isTwoFactorConfigured() && !otp.code.startsWith("dev")) {
      valid = await verifyOtpVia2Factor(otp.code, code);
    } else {
      valid = otp.code === code;
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
    }

    await prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    return NextResponse.json({ success: true, verified: true });
  } catch (e) {
    console.error("OTP verify error:", e);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
