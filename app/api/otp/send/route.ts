import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpSendSchema } from "@/lib/validations";
import { sendAndStoreOtp } from "@/lib/otp-send";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = otpSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { target, type, purpose } = parsed.data;

    // Registration OTPs: only block when the account cannot continue registration.
    if (purpose === "seller_register" || purpose === "buyer_register") {
      if (type === "phone") {
        const phone = normalizePhone(target);
        if (!/^[6-9]\d{9}$/.test(phone)) {
          return NextResponse.json(
            { error: "Enter a valid 10-digit Indian mobile number" },
            { status: 400 }
          );
        }
        const existing = await prisma.user.findUnique({
          where: { phone },
          select: {
            id: true,
            role: true,
            sellerProfile: { select: { id: true } },
          },
        });

        if (existing) {
          if (purpose === "seller_register") {
            // Admin phone is reserved
            if (existing.role === "ADMIN") {
              return NextResponse.json(
                {
                  error:
                    "This mobile belongs to an admin account. Use a different number for seller registration.",
                  code: "ALREADY_REGISTERED",
                  field: "phone",
                },
                { status: 409 }
              );
            }

            // Fully registered seller → login
            if (existing.role === "SELLER" && existing.sellerProfile) {
              return NextResponse.json(
                {
                  error:
                    "This mobile number is already registered as a seller. Please login.",
                  code: "ALREADY_REGISTERED",
                  loginUrl: "/seller/login",
                  field: "phone",
                },
                { status: 409 }
              );
            }

            // BUYER or incomplete SELLER (no profile) → allow OTP to continue / upgrade
          } else {
            // buyer_register: any existing user blocks
            return NextResponse.json(
              {
                error:
                  existing.role === "SELLER"
                    ? "This mobile number is already registered as a seller. Please use seller login."
                    : "This mobile number is already registered. Please login.",
                code: "ALREADY_REGISTERED",
                loginUrl: existing.role === "SELLER" ? "/seller/login" : "/login",
                field: "phone",
              },
              { status: 409 }
            );
          }
        }
      } else {
        const email = target.trim().toLowerCase();
        const existing = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            role: true,
            sellerProfile: { select: { id: true } },
          },
        });

        if (existing) {
          if (purpose === "seller_register") {
            if (existing.role === "ADMIN") {
              return NextResponse.json(
                {
                  error:
                    "This email belongs to an admin account. Use a different email for seller registration.",
                  code: "ALREADY_REGISTERED",
                  field: "email",
                },
                { status: 409 }
              );
            }

            if (existing.role === "SELLER" && existing.sellerProfile) {
              return NextResponse.json(
                {
                  error:
                    "This email is already registered as a seller. Please login.",
                  code: "ALREADY_REGISTERED",
                  loginUrl: "/seller/login",
                  field: "email",
                },
                { status: 409 }
              );
            }

            // BUYER / incomplete seller → allow OTP
          } else {
            return NextResponse.json(
              {
                error:
                  existing.role === "SELLER"
                    ? "This email is already registered as a seller. Please use seller login."
                    : "This email is already registered. Please login.",
                code: "ALREADY_REGISTERED",
                loginUrl: existing.role === "SELLER" ? "/seller/login" : "/login",
                field: "email",
              },
              { status: 409 }
            );
          }
        }
      }
    }

    const result = await sendAndStoreOtp(target, type);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (e) {
    console.error("OTP send error:", e);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
