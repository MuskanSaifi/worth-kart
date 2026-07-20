import { prisma } from "@/lib/prisma";

function normalizeOtpTarget(target: string, type: string): string {
  return type === "email"
    ? target.trim().toLowerCase()
    : target.replace(/\D/g, "").slice(-10);
}

/** Check if target was OTP-verified recently (for registration / login). */
export async function isOtpVerifiedRecently(
  target: string,
  type: string,
  withinMinutes = 30
): Promise<boolean> {
  const since = new Date(Date.now() - withinMinutes * 60 * 1000);
  const normalized = normalizeOtpTarget(target, type);
  const record = await prisma.otp.findFirst({
    where: {
      target: normalized,
      type,
      verified: true,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });
  return !!record;
}
