import { prisma } from "@/lib/prisma";

/** Check if target was OTP-verified recently (for registration). */
export async function isOtpVerifiedRecently(
  target: string,
  type: string,
  withinMinutes = 30
): Promise<boolean> {
  const since = new Date(Date.now() - withinMinutes * 60 * 1000);
  const record = await prisma.otp.findFirst({
    where: {
      target: type === "email" ? target.trim().toLowerCase() : target,
      type,
      verified: true,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });
  return !!record;
}
