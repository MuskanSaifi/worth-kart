import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type AppSessionPayload = {
  uid: string;
  phone: string;
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
  let user = await prisma.user.findUnique({ where: { phone: normalized } });
  if (user) return user;

  const internalEmail = `buyer-${normalized}@users.worthkart.in`;
  const hashed = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
  user = await prisma.user.create({
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
  return user;
}

export function createAppSessionToken(user: { id: string; phone: string | null }) {
  if (!user.phone) throw new Error("User phone is required");
  const payload: AppSessionPayload = {
    uid: user.id,
    phone: normalizePhone(user.phone),
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
    const payload = JSON.parse(fromBase64Url(payloadB64)) as AppSessionPayload;
    if (!payload.uid || !payload.phone || !payload.exp) return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAppUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const payload = verifyAppSessionToken(token);
  if (!payload) throw new Error("Unauthorized");

  const user = await prisma.user.findFirst({
    where: { id: payload.uid, phone: payload.phone, role: "BUYER" },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}
