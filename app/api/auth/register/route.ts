import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { isOtpVerifiedRecently } from "@/lib/otp-check";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;

    const [emailOk, phoneOk] = await Promise.all([
      isOtpVerifiedRecently(email, "email"),
      isOtpVerifiedRecently(phone, "phone"),
    ]);
    if (!emailOk) {
      return NextResponse.json({ error: "Please verify your email OTP first" }, { status: 400 });
    }
    if (!phoneOk) {
      return NextResponse.json({ error: "Please verify your mobile OTP first" }, { status: 400 });
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
        name,
        email,
        phone,
        password: hashed,
        role: "BUYER",
        emailVerified: true,
        phoneVerified: true,
        cart: { create: {} },
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
