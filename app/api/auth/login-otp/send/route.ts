import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buyerLoginSchema, loginSchema, sellerLoginSchema } from "@/lib/validations";
import { sendAndStoreOtp } from "@/lib/otp-send";

/**
 * Buyer & Seller: mobile number + OTP.
 * Admin: email + password, then OTP to phone/email.
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
      const phone = parsed.data.phone.replace(/\D/g, "").slice(-10);
      const user = await prisma.user.findUnique({ where: { phone } });
      // Same phone can shop as buyer even if role is SELLER (dual use)
      if (user?.role === "ADMIN") {
        return NextResponse.json(
          { error: "This number belongs to an admin account. Use admin login." },
          { status: 400 }
        );
      }
      target = phone;
      type = "phone";
    } else if (accountType === "seller") {
      const parsed = sellerLoginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const phone = parsed.data.phone.replace(/\D/g, "").slice(-10);
      const user = await prisma.user.findUnique({
        where: { phone },
        include: { sellerProfile: { select: { id: true } } },
      });

      if (!user) {
        return NextResponse.json(
          {
            error: "This mobile is not registered as a seller. Please register first.",
            registerUrl: "/seller/register",
            code: "NOT_SELLER",
          },
          { status: 404 }
        );
      }

      if (user.role === "BUYER") {
        return NextResponse.json(
          {
            error:
              "This number is only a buyer account. Register as a seller separately (Become a Seller) using the same number.",
            registerUrl: "/seller/register",
            code: "BUYER_UPGRADE",
          },
          { status: 400 }
        );
      }

      if (user.role === "ADMIN") {
        return NextResponse.json(
          {
            error: "This number belongs to an admin account. Use a different seller number.",
            code: "ADMIN_PHONE",
          },
          { status: 400 }
        );
      }

      if (user.role !== "SELLER") {
        return NextResponse.json(
          {
            error: "This mobile is not registered as a seller. Please register first.",
            registerUrl: "/seller/register",
            code: "NOT_SELLER",
          },
          { status: 404 }
        );
      }

      if (!user.sellerProfile) {
        return NextResponse.json(
          {
            error:
              "Seller registration is incomplete. Finish business details on Become a Seller.",
            registerUrl: "/seller/register",
            code: "INCOMPLETE_SELLER",
          },
          { status: 400 }
        );
      }

      target = phone;
      type = "phone";
    } else {
      // admin: email + password
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const email = parsed.data.email.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Invalid admin email or password" }, { status: 401 });
      }
      const valid = await bcrypt.compare(parsed.data.password, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Invalid admin email or password" }, { status: 401 });
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
