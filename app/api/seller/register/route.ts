import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sellerStep1Schema, sellerStep2Schema } from "@/lib/validations";
import { isOtpVerifiedRecently } from "@/lib/otp-check";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, ...data } = body;

    if (step === 1) {
      const parsed = sellerStep1Schema.safeParse(data);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { email, phone, password } = parsed.data;

      const [emailOk, phoneOk] = await Promise.all([
        isOtpVerifiedRecently(email, "email"),
        isOtpVerifiedRecently(phone, "phone"),
      ]);
      if (!emailOk) {
        return NextResponse.json({ error: "Email OTP not verified. Please verify your email." }, { status: 400 });
      }
      if (!phoneOk) {
        return NextResponse.json({ error: "Mobile OTP not verified. Please verify your phone." }, { status: 400 });
      }

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Email or phone already registered" },
          { status: 409 }
        );
      }

      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          phone,
          password: hashed,
          role: "SELLER",
          emailVerified: true,
          phoneVerified: true,
        },
      });

      return NextResponse.json({ success: true, userId: user.id });
    }

    if (step === 2) {
      const parsed = sellerStep2Schema.safeParse(data);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { userId, gstVerified, gstLegalName, ...business } = data;
      if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
      }

      if (business.gstNumber && !gstVerified) {
        return NextResponse.json(
          { error: "GSTIN must be verified before registration" },
          { status: 400 }
        );
      }

      const profile = await prisma.sellerProfile.create({
        data: {
          userId,
          businessName: business.businessName,
          businessType: business.businessType,
          gstNumber: business.gstNumber || null,
          gstVerified: !!gstVerified && !!business.gstNumber,
          gstLegalName: gstLegalName || null,
          panNumber: business.panNumber || null,
          bankAccount: business.bankAccount || null,
          bankIfsc: business.bankIfsc || null,
          pickupAddress: business.pickupAddress,
          city: business.city,
          state: business.state,
          pincode: business.pincode,
          status: "PENDING",
        },
      });

      return NextResponse.json({ success: true, profileId: profile.id });
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Seller registration failed" }, { status: 500 });
  }
}
