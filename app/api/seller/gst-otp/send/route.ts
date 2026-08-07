import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { validateGstin, lookupGstinOnline } from "@/lib/gst";
import { blockSellerForGstFailure, MAX_GST_FAILED_ATTEMPTS, SUPPORT_EMAIL } from "@/lib/seller-gst";
import { generateOtp4 } from "@/lib/utils";
import { sendSmsOtp, isTwoFactorConfigured, maskPhone } from "@/lib/two-factor";
import { z } from "zod";

const schema = z.object({ gstin: z.string().min(15).max(15) });

export async function POST(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);

    if (seller.status === "BLOCKED") {
      return NextResponse.json({
        error: `Account blocked. Contact ${SUPPORT_EMAIL}`,
        blocked: true,
      }, { status: 403 });
    }

    if (seller.gstVerified) {
      return NextResponse.json({ error: "GST already verified" }, { status: 400 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid GSTIN" }, { status: 400 });
    }

    const gstin = parsed.data.gstin.trim().toUpperCase();
    const local = validateGstin(gstin);

    if (!local.valid) {
      const attempts = seller.gstFailedAttempts + 1;
      if (attempts >= MAX_GST_FAILED_ATTEMPTS) {
        await blockSellerForGstFailure(seller.id);
        return NextResponse.json({
          error: local.error,
          blocked: true,
          attempts,
          attemptsLeft: 0,
        }, { status: 403 });
      }
      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: { gstFailedAttempts: attempts, gstNumber: gstin },
      });
      return NextResponse.json({
        error: local.error,
        attempts,
        attemptsLeft: MAX_GST_FAILED_ATTEMPTS - attempts,
      }, { status: 400 });
    }

    const lookup = await lookupGstinOnline(local.gstin);
    if (!lookup.verified) {
      const attempts = seller.gstFailedAttempts + 1;
      if (attempts >= MAX_GST_FAILED_ATTEMPTS) {
        await blockSellerForGstFailure(seller.id);
        return NextResponse.json({ error: "GST not active", blocked: true }, { status: 403 });
      }
      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: { gstFailedAttempts: attempts, gstNumber: gstin },
      });
      return NextResponse.json({
        error: "GSTIN not active or not found in government records",
        attempts,
        attemptsLeft: MAX_GST_FAILED_ATTEMPTS - attempts,
      }, { status: 400 });
    }

    // Mobile linked to GST (API) or seller account phone as fallback
    const mobile =
      lookup.registeredMobile ||
      seller.user.phone?.replace(/\D/g, "").slice(-10);

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({
        error: "Could not find mobile linked to this GST. Configure GST_VERIFY_API_URL or ensure your account phone is set.",
      }, { status: 400 });
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
      // Dev fallback: store our own OTP
      sessionId = `dev-${Date.now()}`;
      devOtp = generateOtp4();
    }

    await prisma.otp.deleteMany({ where: { target: gstin, type: "gst_verify" } });
    await prisma.otp.create({
      data: {
        userId: seller.userId,
        target: gstin,
        type: "gst_verify",
        code: isTwoFactorConfigured() ? sessionId : devOtp!,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Store pending GST data on seller (not verified until OTP)
    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        gstNumber: local.gstin,
        gstRegisteredMobile: mobile,
        panNumber: local.pan,
      },
    });

    return NextResponse.json({
      success: true,
      maskedPhone: maskPhone(mobile),
      message: `OTP sent to GST-linked mobile ${maskPhone(mobile)}`,
      sessionId: isTwoFactorConfigured() ? sessionId : undefined,
      devOtp: process.env.NODE_ENV === "development" ? devOtp : undefined,
      legalName: lookup.legalName,
    });
  } catch {
    return NextResponse.json({ error: "Failed to send GST OTP" }, { status: 500 });
  }
}
