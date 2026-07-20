import { prisma } from "@/lib/prisma";
import { generateOtp4 } from "@/lib/utils";
import { sendEmailOtpViaSmtp } from "@/lib/email-otp";
import {
  sendSmsOtp,
  sendEmailOtp,
  isTwoFactorConfigured,
  maskPhone,
  maskEmail,
  getTwoFactorSenderEmail,
} from "@/lib/two-factor";

export type OtpChannel = "email" | "phone";

function normalizeTarget(target: string, type: OtpChannel): string {
  return type === "email"
    ? target.trim().toLowerCase()
    : target.replace(/\D/g, "").slice(-10);
}

/**
 * Send real OTP via 2Factor (TWO_FACTOR_OTP_TEMPLATE).
 * Phone → SMS AUTOGEN3 + template.
 * Email → 2Factor Email OTP + template, SMTP fallback.
 */
export async function sendAndStoreOtp(
  target: string,
  type: OtpChannel
): Promise<
  | {
      success: true;
      message: string;
      target: string;
      type: OtpChannel;
      maskedTarget: string;
      devOtp?: string;
    }
  | { success: false; error: string; status: number }
> {
  const normalizedTarget = normalizeTarget(target, type);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otp.deleteMany({ where: { target: normalizedTarget, type } });

  if (type === "phone") {
    if (!isTwoFactorConfigured()) {
      if (process.env.NODE_ENV === "development") {
        const code = generateOtp4();
        await prisma.otp.create({
          data: { target: normalizedTarget, type, code, expiresAt },
        });
        return {
          success: true,
          message: `OTP sent to ${maskPhone(normalizedTarget)}`,
          target: normalizedTarget,
          type,
          maskedTarget: maskPhone(normalizedTarget),
          devOtp: code,
        };
      }
      return {
        success: false,
        error: "SMS OTP is temporarily unavailable. Please try again later.",
        status: 503,
      };
    }

    const sms = await sendSmsOtp(normalizedTarget);
    if (!sms.success || !sms.sessionId) {
      return {
        success: false,
        error: sms.error || "Failed to send SMS OTP via 2Factor template",
        status: 502,
      };
    }

    await prisma.otp.create({
      data: {
        target: normalizedTarget,
        type,
        code: sms.sessionId,
        expiresAt,
      },
    });

    return {
      success: true,
      message: `4-digit OTP sent to ${maskPhone(normalizedTarget)} via SMS`,
      target: normalizedTarget,
      type,
      maskedTarget: maskPhone(normalizedTarget),
    };
  }

  // Email: prefer 2Factor template, then SMTP (still real OTP)
  if (isTwoFactorConfigured()) {
    const email2f = await sendEmailOtp(normalizedTarget);
    if (email2f.success && email2f.sessionId) {
      await prisma.otp.create({
        data: {
          target: normalizedTarget,
          type,
          code: email2f.sessionId,
          expiresAt,
        },
      });
      return {
        success: true,
        message: `4-digit OTP sent to ${maskEmail(normalizedTarget)} from ${getTwoFactorSenderEmail()}`,
        target: normalizedTarget,
        type,
        maskedTarget: maskEmail(normalizedTarget),
      };
    }
  }

  const smtp = await sendEmailOtpViaSmtp(normalizedTarget);
  if (!smtp.success || !smtp.otpCode) {
    return {
      success: false,
      error:
        smtp.error ||
        "Unable to send email OTP. Please try again later.",
      status: 502,
    };
  }

  await prisma.otp.create({
    data: {
      target: normalizedTarget,
      type,
      code: smtp.otpCode,
      expiresAt,
    },
  });

  return {
    success: true,
    message: `4-digit OTP sent to ${maskEmail(normalizedTarget)} from ${getTwoFactorSenderEmail()}`,
    target: normalizedTarget,
    type,
    maskedTarget: maskEmail(normalizedTarget),
  };
}

/** True when stored code is a 2Factor session id (not a plain 4-digit OTP). */
export function isTwoFactorSessionCode(code: string): boolean {
  return !/^\d{4}$/.test(code);
}
