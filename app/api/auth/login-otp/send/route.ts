import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { sendAndStoreOtp } from "@/lib/otp-send";

/**
 * Step 1 of login: validate email/password, then send real 2Factor OTP
 * to phone (preferred) or email. Works for BUYER, SELLER, and ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const phone = user.phone?.replace(/\D/g, "").slice(-10);
    const preferPhone = phone && /^[6-9]\d{9}$/.test(phone);
    const type = preferPhone ? "phone" : "email";
    const target = preferPhone ? phone! : user.email;

    const result = await sendAndStoreOtp(target, type);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      type: result.type,
      target: result.target,
      maskedTarget: result.maskedTarget,
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (e) {
    console.error("Login OTP send error:", e);
    return NextResponse.json({ error: "Failed to send login OTP" }, { status: 500 });
  }
}
