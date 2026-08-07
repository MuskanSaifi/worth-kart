import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buyerLoginSchema, loginSchema, sellerLoginSchema } from "@/lib/validations";
import { authConfig } from "@/lib/auth.config";
import { isOtpVerifiedRecently } from "@/lib/otp-check";
import type { Role } from "@/app/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    phone?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
      phone?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    phone?: string | null;
  }
}

const LOGIN_OTP_WINDOW_MINUTES = 10;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        phone: { label: "Mobile", type: "tel" },
        accountType: { label: "Account type", type: "text" },
      },
      async authorize(credentials) {
        const accountType =
          credentials.accountType === "admin"
            ? "admin"
            : credentials.accountType === "seller"
              ? "seller"
              : "buyer";
        let user;

        if (accountType === "buyer") {
          const parsed = buyerLoginSchema.safeParse(credentials);
          if (!parsed.success) return null;
          user = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
          // Allow BUYER and SELLER to shop with the same mobile number
          if (!user || user.role === "ADMIN") return null;
          const phoneOk = await isOtpVerifiedRecently(
            parsed.data.phone,
            "phone",
            LOGIN_OTP_WINDOW_MINUTES
          );
          if (!phoneOk) return null;
        } else if (accountType === "seller") {
          const parsed = sellerLoginSchema.safeParse(credentials);
          if (!parsed.success) return null;
          user = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
          if (!user || user.role !== "SELLER") return null;
          const phoneOk = await isOtpVerifiedRecently(
            parsed.data.phone,
            "phone",
            LOGIN_OTP_WINDOW_MINUTES
          );
          if (!phoneOk) return null;
        } else {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;
          user = await prisma.user.findUnique({
            where: { email: parsed.data.email.trim().toLowerCase() },
          });
          if (!user || user.role !== "ADMIN") return null;
          const valid = await bcrypt.compare(parsed.data.password, user.password);
          if (!valid) return null;

          const phone = user.phone?.replace(/\D/g, "").slice(-10);
          const phoneOk = phone
            ? await isOtpVerifiedRecently(phone, "phone", LOGIN_OTP_WINDOW_MINUTES)
            : false;
          const emailOk = await isOtpVerifiedRecently(
            user.email,
            "email",
            LOGIN_OTP_WINDOW_MINUTES
          );
          if (!phoneOk && !emailOk) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          image: user.image,
        };
      },
    }),
  ],
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}
