import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpSendSchema } from "@/lib/validations";
import { generateOtp4 } from "@/lib/utils";
import {
  sendSmsOtp,
  sendEmailOtp,
  isTwoFactorConfigured,
  maskPhone,
  maskEmail,
  getTwoFactorSenderEmail,
} from "@/lib/two-factor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = otpSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { target, type } = parsed.data;
    const normalizedTarget =
      type === "email" ? target.trim().toLowerCase() : target.replace(/\D/g, "").slice(-10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otp.deleteMany({ where: { target: normalizedTarget, type } });

    if (isTwoFactorConfigured()) {
      const result =
        type === "phone"
          ? await sendSmsOtp(normalizedTarget)
          : await sendEmailOtp(normalizedTarget);

      if (!result.success || !result.sessionId) {
        return NextResponse.json(
          { error: result.error || `Failed to send ${type} OTP` },
          { status: 502 }
        );
      }

      await prisma.otp.create({
        data: {
          target: normalizedTarget,
          type,
          code: result.sessionId,
          expiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        message:
          type === "phone"
            ? `4-digit OTP sent to ${maskPhone(normalizedTarget)}`
            : `4-digit OTP sent to ${maskEmail(normalizedTarget)} from ${getTwoFactorSenderEmail()}`,
      });
    }

    // Dev fallback when 2Factor not configured
    const code = generateOtp4();
    await prisma.otp.create({
      data: { target: normalizedTarget, type, code, expiresAt },
    });

    return NextResponse.json({
      success: true,
      message: `OTP sent to your ${type}`,
      devOtp: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (e) {
    console.error("OTP send error:", e);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
