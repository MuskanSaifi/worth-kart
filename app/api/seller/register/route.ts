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
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

      const [emailOk, phoneOk] = await Promise.all([
        isOtpVerifiedRecently(normalizedEmail, "email"),
        isOtpVerifiedRecently(normalizedPhone, "phone"),
      ]);
      if (!emailOk) {
        return NextResponse.json(
          { error: "Email OTP not verified. Please verify your email." },
          { status: 400 }
        );
      }
      if (!phoneOk) {
        return NextResponse.json(
          { error: "Mobile OTP not verified. Please verify your phone." },
          { status: 400 }
        );
      }

      const [byPhone, byEmail] = await Promise.all([
        prisma.user.findUnique({
          where: { phone: normalizedPhone },
          include: { sellerProfile: { select: { id: true } } },
        }),
        prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { sellerProfile: { select: { id: true } } },
        }),
      ]);

      // Same person already a completed seller
      if (
        (byPhone?.sellerProfile || byEmail?.sellerProfile) &&
        (byPhone?.role === "SELLER" || byEmail?.role === "SELLER")
      ) {
        return NextResponse.json(
          {
            error: "Already registered as a seller. Please login.",
            loginUrl: "/seller/login",
          },
          { status: 409 }
        );
      }

      if (byPhone?.role === "ADMIN" || byEmail?.role === "ADMIN") {
        return NextResponse.json(
          {
            error:
              "This email/phone belongs to an admin account. Use different credentials.",
          },
          { status: 409 }
        );
      }

      // Phone and email belong to two different users → conflict
      if (byPhone && byEmail && byPhone.id !== byEmail.id) {
        return NextResponse.json(
          {
            error:
              "This email and mobile belong to different accounts. Use matching details, or a new email/phone pair.",
          },
          { status: 409 }
        );
      }

      const hashed = await bcrypt.hash(password, 12);

      // Upgrade BUYER / resume incomplete SELLER on same phone or email
      const existing = byPhone || byEmail;
      if (existing) {
        if (existing.sellerProfile) {
          return NextResponse.json(
            {
              error: "Already registered as a seller. Please login.",
              loginUrl: "/seller/login",
            },
            { status: 409 }
          );
        }

        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            email: normalizedEmail,
            phone: normalizedPhone,
            password: hashed,
            role: "SELLER",
            emailVerified: true,
            phoneVerified: true,
          },
        });

        return NextResponse.json({
          success: true,
          userId: updated.id,
          upgraded: existing.role === "BUYER",
        });
      }

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          phone: normalizedPhone,
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

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { sellerProfile: { select: { id: true } } },
      });
      if (!user || user.role !== "SELLER") {
        return NextResponse.json(
          { error: "Complete account step first" },
          { status: 400 }
        );
      }
      if (user.sellerProfile) {
        return NextResponse.json(
          {
            error: "Seller profile already exists. Please login.",
            loginUrl: "/seller/login",
          },
          { status: 409 }
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
  } catch (e) {
    console.error("Seller registration failed:", e);
    return NextResponse.json({ error: "Seller registration failed" }, { status: 500 });
  }
}
