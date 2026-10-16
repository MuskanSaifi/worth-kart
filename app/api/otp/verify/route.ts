import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpVerifySchema } from "@/lib/validations";
import { verifyOtpVia2Factor, isTwoFactorConfigured } from "@/lib/two-factor";
import { isTwoFactorSessionCode } from "@/lib/otp-send";

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
    const cleanedCode = String(code).replace(/\D/g, "");

    // Already verified in the last 10 minutes → treat as success (retry-safe)
    const recentlyVerified = await prisma.otp.findFirst({
      where: {
        target: normalizedTarget,
        type,
        verified: true,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (recentlyVerified) {
      return NextResponse.json({ success: true, verified: true, already: true });
    }

    const otp = await prisma.otp.findFirst({
      where: { target: normalizedTarget, type, verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      // Helpful diagnostic: any OTP at all for this target?
      const any = await prisma.otp.findFirst({
        where: { target: normalizedTarget, type },
        orderBy: { createdAt: "desc" },
      });
      console.warn("[otp/verify] not found", {
        target: normalizedTarget,
        type,
        hadAny: !!any,
        anyVerified: any?.verified,
        anyAgeMs: any ? Date.now() - any.createdAt.getTime() : null,
      });
      return NextResponse.json(
        {
          error: any?.verified
            ? "OTP already used. Please request a new OTP."
            : "OTP not found. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    if (otp.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP expired. Please request a new OTP." }, { status: 400 });
    }

    let valid = false;

    if (isTwoFactorConfigured() && isTwoFactorSessionCode(otp.code)) {
      valid = await verifyOtpVia2Factor(otp.code, cleanedCode);
    } else {
      valid = otp.code === cleanedCode;
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
