import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buyerLoginSchema, loginSchema } from "@/lib/validations";
import { sendAndStoreOtp } from "@/lib/otp-send";

/**
 * Buyer: mobile number only. Seller/admin: email + password.
 * Both flows finish with OTP verification before a session is created.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accountType =
      body.accountType === "admin"
        ? "admin"
        : body.accountType === "seller"
          ? "seller"
          : "buyer";
    let target: string;
    let type: "phone" | "email";

    if (accountType === "buyer") {
      const parsed = buyerLoginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const user = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
      if (!user || user.role !== "BUYER") {
        return NextResponse.json(
          { error: "Mobile number is not registered. Please create an account." },
          { status: 404 }
        );
      }
      target = parsed.data.phone;
      type = "phone";
    } else {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const email = parsed.data.email.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });
      const allowedRole = accountType === "admin" ? "ADMIN" : "SELLER";
      if (!user || user.role !== allowedRole) {
        return NextResponse.json(
          {
            error:
              accountType === "admin"
                ? "Invalid admin email or password"
                : "Invalid seller email or password",
          },
          { status: 401 }
        );
      }
      const valid = await bcrypt.compare(parsed.data.password, user.password);
      if (!valid) {
        return NextResponse.json(
          {
            error:
              accountType === "admin"
                ? "Invalid admin email or password"
                : "Invalid seller email or password",
          },
          { status: 401 }
        );
      }
      const phone = user.phone?.replace(/\D/g, "").slice(-10);
      const usePhone = Boolean(phone && /^[6-9]\d{9}$/.test(phone));
      type = usePhone ? "phone" : "email";
      target = usePhone ? phone! : user.email;
    }

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
