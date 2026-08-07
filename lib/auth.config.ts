import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // Behind nginx/Hostinger proxy (worthkart.in → :3002). Without this,
  // Auth.js throws UntrustedHost and every page 500s.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.phone = user.phone;
        token.name = user.name;
        token.picture = user.image;
      }
      if (trigger === "update" && session) {
        if (typeof session.name !== "undefined") token.name = session.name;
        if (typeof session.image !== "undefined") token.picture = session.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "BUYER" | "SELLER" | "ADMIN";
        session.user.phone = token.phone as string | null | undefined;
        session.user.name = (token.name as string | null | undefined) ?? session.user.name;
        session.user.image =
          (token.picture as string | null | undefined) ?? session.user.image;
      }
      return session;
    },
  },
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
