import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type AppRole = "BUYER" | "SELLER" | "ADMIN";

type AppSessionPayload = {
  uid: string;
  phone: string;
  role: AppRole;
  exp: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return secret;
}

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payloadB64: string) {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export async function getOrCreateBuyerByPhone(phone: string) {
  const normalized = normalizePhone(phone);

  const existing = await prisma.user.findUnique({
    where: { phone: normalized },
    include: { cart: { select: { id: true } } },
  });
  if (existing) {
    if (existing.role === "ADMIN") {
      throw new Error("Admin accounts cannot use buyer shopping login");
    }
    const data: { phoneVerified?: boolean } = {};
    if (!existing.phoneVerified) data.phoneVerified = true;
    if (Object.keys(data).length) {
      await prisma.user.update({ where: { id: existing.id }, data });
    }
    // Sellers may not have a cart yet — create for shopping
    if (!existing.cart) {
      await prisma.cart.create({ data: { userId: existing.id } }).catch(() => null);
    }
    return existing;
  }

  const internalEmail = `buyer-${normalized}@users.worthkart.in`;
  const hashed = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
  return prisma.user.create({
    data: {
      email: internalEmail,
      phone: normalized,
      password: hashed,
      role: "BUYER",
      emailVerified: false,
      phoneVerified: true,
      cart: { create: {} },
    },
  });
}

export function createAppSessionToken(user: {
  id: string;
  phone: string | null;
  role?: AppRole;
}) {
  const role = user.role || "BUYER";
  const phone = user.phone ? normalizePhone(user.phone) : "";
  if ((role === "BUYER" || role === "SELLER") && !phone) {
    throw new Error("User phone is required");
  }

  const payload: AppSessionPayload = {
    uid: user.id,
    phone,
    role,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  return `${payloadB64}.${signPayload(payloadB64)}`;
}

export function verifyAppSessionToken(token: string): AppSessionPayload | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;
  const expected = signPayload(payloadB64);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const raw = JSON.parse(fromBase64Url(payloadB64)) as Partial<AppSessionPayload>;
    if (!raw.uid || !raw.exp) return null;
    if (raw.exp < Date.now()) return null;
    return {
      uid: raw.uid,
      phone: raw.phone || "",
      role: (raw.role as AppRole) || "BUYER",
      exp: raw.exp,
    };
  } catch {
    return null;
  }
}

function bearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

export async function requireAppUser(req: Request) {
  const token = bearerToken(req);
  if (!token) throw new Error("Unauthorized");

  const payload = verifyAppSessionToken(token);
  if (!payload) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user) throw new Error("Unauthorized");

  if (payload.phone) {
    if (!user.phone || normalizePhone(user.phone) !== normalizePhone(payload.phone)) {
      throw new Error("Unauthorized");
    }
  }

  return user;
}

/** Seller / admin session for mobile Seller Hub */
export async function requireAppSeller(req: Request) {
  const token = bearerToken(req);
  if (!token) throw new Error("Unauthorized");

  const payload = verifyAppSessionToken(token);
  if (!payload) throw new Error("Unauthorized");
  if (payload.role !== "SELLER" && payload.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user || (user.role !== "SELLER" && user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
  return user;
}
