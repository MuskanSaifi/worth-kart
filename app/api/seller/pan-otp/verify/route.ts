import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile, tryAutoApproveSeller } from "@/lib/seller";
import { validatePan } from "@/lib/pan";
import { verifyOtpVia2Factor, isTwoFactorConfigured } from "@/lib/two-factor";
import { z } from "zod";

const schema = z.object({
  pan: z.string().min(10).max(10),
  otp: z.string().regex(/^\d{4}$/, "OTP must be 4 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const panResult = validatePan(parsed.data.pan);
    if (!panResult.valid) {
      return NextResponse.json({ error: panResult.error }, { status: 400 });
    }

    const target = `pan:${seller.id}`;
    const otpRecord = await prisma.otp.findFirst({
      where: { target, type: "pan_verify", verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP expired. Request a new OTP." }, { status: 400 });
    }

    let otpValid = false;
    if (isTwoFactorConfigured() && !otpRecord.code.startsWith("dev")) {
      otpValid = await verifyOtpVia2Factor(otpRecord.code, parsed.data.otp);
    } else {
      otpValid = otpRecord.code === parsed.data.otp;
    }

    if (!otpValid) {
      const attempts = (seller.panFailedAttempts ?? 0) + 1;
      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: { panFailedAttempts: attempts },
      });
      return NextResponse.json({ error: "Invalid OTP", attempts }, { status: 400 });
    }

    await prisma.otp.update({ where: { id: otpRecord.id }, data: { verified: true } });
    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        panNumber: panResult.pan,
        panVerified: true,
        panFailedAttempts: 0,
      },
    });

    const autoApproved = await tryAutoApproveSeller(seller.id);

    return NextResponse.json({
      verified: true,
      autoApproved,
      message: autoApproved
        ? "PAN verified! Your seller account is now approved."
        : "PAN verified successfully!",
    });
  } catch {
    return NextResponse.json({ error: "PAN verification failed" }, { status: 500 });
  }
}
