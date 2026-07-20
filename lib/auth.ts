import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
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
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        // Require real 2Factor OTP verified just before login (buyer / seller / admin)
        const phone = user.phone?.replace(/\D/g, "").slice(-10);
        const phoneOk = phone
          ? await isOtpVerifiedRecently(phone, "phone", LOGIN_OTP_WINDOW_MINUTES)
          : false;
        const emailOk = await isOtpVerifiedRecently(
          user.email,
          "email",
          LOGIN_OTP_WINDOW_MINUTES
        );
        if (!phoneOk && !emailOk) {
          return null;
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
