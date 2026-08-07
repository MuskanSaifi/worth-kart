import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { validateGstin, lookupGstinOnline } from "@/lib/gst";
import { blockSellerForGstFailure, MAX_GST_FAILED_ATTEMPTS, SUPPORT_EMAIL } from "@/lib/seller-gst";
import { verifyOtpVia2Factor, isTwoFactorConfigured } from "@/lib/two-factor";
import { z } from "zod";

const schema = z.object({
  gstin: z.string().min(15).max(15),
  otp: z.string().regex(/^\d{4}$/, "OTP must be 4 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);

    if (seller.status === "BLOCKED") {
      return NextResponse.json({ error: `Account blocked. Contact ${SUPPORT_EMAIL}` }, { status: 403 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const gstin = parsed.data.gstin.trim().toUpperCase();
    const { otp } = parsed.data;

    const otpRecord = await prisma.otp.findFirst({
      where: { target: gstin, type: "gst_verify", verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP expired. Please request a new OTP." }, { status: 400 });
    }

    let otpValid = false;

    if (isTwoFactorConfigured() && !otpRecord.code.startsWith("dev")) {
      otpValid = await verifyOtpVia2Factor(otpRecord.code, otp);
    } else {
      otpValid = otpRecord.code === otp;
    }

    if (!otpValid) {
      const attempts = seller.gstFailedAttempts + 1;
      if (attempts >= MAX_GST_FAILED_ATTEMPTS) {
        await blockSellerForGstFailure(seller.id);
        return NextResponse.json({
          error: "Wrong OTP. Account blocked after 3 failed attempts.",
          blocked: true,
          attempts,
        }, { status: 403 });
      }
      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: { gstFailedAttempts: attempts },
      });
      return NextResponse.json({
        error: "Invalid OTP",
        attempts,
        attemptsLeft: MAX_GST_FAILED_ATTEMPTS - attempts,
      }, { status: 400 });
    }

    const local = validateGstin(gstin);
    const lookup = await lookupGstinOnline(gstin);

    await prisma.otp.update({ where: { id: otpRecord.id }, data: { verified: true } });
    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        gstNumber: local.gstin,
        gstVerified: true,
        gstLegalName: lookup.legalName || null,
        panNumber: local.pan,
        panVerified: false,
        gstFailedAttempts: 0,
        gstBlockedAt: null,
        gstBlockReason: null,
      },
    });

    return NextResponse.json({
      verified: true,
      message: "GST verified via OTP! Now verify your PAN.",
      gstin: local.gstin,
      legalName: lookup.legalName,
    });
  } catch {
    return NextResponse.json({ error: "GST OTP verification failed" }, { status: 500 });
  }
}
