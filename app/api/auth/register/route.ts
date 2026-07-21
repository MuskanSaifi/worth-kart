import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { buyerRegisterSchema } from "@/lib/validations";
import { isOtpVerifiedRecently } from "@/lib/otp-check";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = buyerRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;
    const phoneOk = await isOtpVerifiedRecently(phone, "phone");
    if (!phoneOk) {
      return NextResponse.json({ error: "Please verify your mobile OTP first" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "Mobile number already registered. Please login." },
        { status: 409 }
      );
    }

    // User adds a real email later from My Account. These internal values keep
    // the existing schema compatible and are never shown to the buyer.
    const internalEmail = `buyer-${phone}@users.worthkart.in`;
    const hashed = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    const user = await prisma.user.create({
      data: {
        email: internalEmail,
        phone,
        password: hashed,
        role: "BUYER",
        emailVerified: false,
        phoneVerified: true,
        cart: { create: {} },
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, phone: user.phone },
    });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
