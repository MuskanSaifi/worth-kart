import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { validateGstin, lookupGstinOnline } from "@/lib/gst";
import { blockSellerForGstFailure, MAX_GST_FAILED_ATTEMPTS, SUPPORT_EMAIL } from "@/lib/seller-gst";
import { z } from "zod";

const schema = z.object({
  gstin: z.string().min(15).max(15),
});

async function recordGstFailure(
  sellerId: string,
  currentAttempts: number,
  gstin: string,
  error: string
) {
  const attempts = currentAttempts + 1;

  if (attempts >= MAX_GST_FAILED_ATTEMPTS) {
    await blockSellerForGstFailure(sellerId);
    return NextResponse.json({
      verified: false,
      error,
      attempts,
      attemptsLeft: 0,
      blocked: true,
      message: `Account blocked after ${MAX_GST_FAILED_ATTEMPTS} failed attempts. Contact ${SUPPORT_EMAIL} to reactivate.`,
    }, { status: 403 });
  }

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { gstFailedAttempts: attempts, gstNumber: gstin, gstVerified: false },
  });

  return NextResponse.json({
    verified: false,
    error,
    attempts,
    attemptsLeft: MAX_GST_FAILED_ATTEMPTS - attempts,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);

    if (seller.status === "BLOCKED") {
      return NextResponse.json({
        error: `Account blocked due to repeated GST failures. Contact admin at ${SUPPORT_EMAIL} or submit an activation request.`,
        blocked: true,
      }, { status: 403 });
    }

    if (seller.gstVerified) {
      return NextResponse.json({ error: "GST is already verified" }, { status: 400 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid GSTIN" }, { status: 400 });
    }

    const gstin = parsed.data.gstin.trim().toUpperCase();
    const local = validateGstin(gstin);

    if (!local.valid) {
      return recordGstFailure(seller.id, seller.gstFailedAttempts, gstin, local.error || "Invalid GSTIN");
    }

    const lookup = await lookupGstinOnline(local.gstin);

    if (!lookup.verified) {
      return recordGstFailure(seller.id, seller.gstFailedAttempts, gstin, "GSTIN could not be verified — status unverified");
    }

    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        gstNumber: local.gstin,
        gstVerified: true,
        gstLegalName: lookup.legalName || null,
        panNumber: local.pan,
        gstFailedAttempts: 0,
        gstBlockedAt: null,
        gstBlockReason: null,
      },
    });

    return NextResponse.json({
      verified: true,
      gstin: local.gstin,
      legalName: lookup.legalName,
      message: "GST verified successfully!",
    });
  } catch {
    return NextResponse.json({ error: "Failed to verify GST" }, { status: 500 });
  }
}
