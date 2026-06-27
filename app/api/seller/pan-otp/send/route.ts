import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { validatePan, panMatchesGstin } from "@/lib/pan";
import { generateOtp4 } from "@/lib/utils";
import { sendSmsOtp, maskPhone, isTwoFactorConfigured } from "@/lib/two-factor";
import { z } from "zod";

const schema = z.object({
  pan: z.string().min(10).max(10),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile();

    if (seller.status === "BLOCKED") {
      return NextResponse.json({ error: "Account blocked" }, { status: 403 });
    }

    if (!seller.gstVerified || !seller.gstNumber) {
      return NextResponse.json({ error: "Verify GST first before PAN verification" }, { status: 400 });
    }

    if (seller.panVerified) {
      return NextResponse.json({ error: "PAN already verified" }, { status: 400 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid PAN" }, { status: 400 });
    }

    const panResult = validatePan(parsed.data.pan);
    if (!panResult.valid) {
      return NextResponse.json({ error: panResult.error }, { status: 400 });
    }

    if (!panMatchesGstin(panResult.pan, seller.gstNumber)) {
      const attempts = (seller.panFailedAttempts ?? 0) + 1;
      try {
        await prisma.sellerProfile.update({
          where: { id: seller.id },
          data: { panFailedAttempts: attempts },
        });
      } catch {
        // stale prisma client — still return useful error
      }
      const expectedPan = seller.gstNumber.slice(2, 12);
      return NextResponse.json({
        error: `PAN does not match your GSTIN. Expected PAN from GST: ${expectedPan}`,
        attempts,
      }, { status: 400 });
    }

    const mobile =
      parsed.data.phone ||
      seller.gstRegisteredMobile ||
      seller.user.phone?.replace(/\D/g, "").slice(-10);

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ error: "No mobile found for OTP. Re-verify GST or update account phone." }, { status: 400 });
    }

    let sessionId: string;
    let devOtp: string | undefined;

    if (isTwoFactorConfigured()) {
      const sms = await sendSmsOtp(mobile);
      if (!sms.success || !sms.sessionId) {
        return NextResponse.json({ error: sms.error || "Failed to send OTP" }, { status: 502 });
      }
      sessionId = sms.sessionId;
    } else {
      sessionId = `dev-pan-${Date.now()}`;
      devOtp = generateOtp4();
    }

    const target = `pan:${seller.id}`;
    await prisma.otp.deleteMany({ where: { target, type: "pan_verify" } });
    await prisma.otp.create({
      data: {
        userId: seller.userId,
        target,
        type: "pan_verify",
        code: isTwoFactorConfigured() ? sessionId : devOtp!,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: { panNumber: panResult.pan },
    });

    return NextResponse.json({
      success: true,
      maskedPhone: maskPhone(mobile),
      message: `OTP sent to ${maskPhone(mobile)} for PAN verification`,
      devOtp: process.env.NODE_ENV === "development" ? devOtp : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("PAN OTP send error:", e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Please login again" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    return NextResponse.json({
      error: process.env.NODE_ENV === "development" ? msg : "Failed to send PAN OTP",
    }, { status: 500 });
  }
}
