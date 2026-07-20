import nodemailer from "nodemailer";
import { generateOtp4 } from "@/lib/utils";
import { getTwoFactorSenderEmail, OTP_DIGITS } from "@/lib/two-factor";

function getSmtpConfig() {
  const user = process.env.SMTP_USER || getTwoFactorSenderEmail();
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);

  if (!user || !pass) {
    return null;
  }

  return { user, pass, host, port };
}

export function isEmailOtpConfigured(): boolean {
  return !!getSmtpConfig();
}

/** Send 4-digit OTP via Gmail/SMTP (2Factor has no public Email API). */
export async function sendEmailOtpViaSmtp(email: string): Promise<{
  success: boolean;
  otpCode?: string;
  error?: string;
}> {
  const smtp = getSmtpConfig();
  if (!smtp) {
    return {
      success: false,
      error:
        "Email OTP not configured. Set SMTP_USER=kartworth@gmail.com and SMTP_PASS (Gmail App Password) in .env",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: "Invalid email address" };
  }

  const otp = generateOtp4();
  const senderEmail = smtp.user;

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: `"WorthKart" <${senderEmail}>`,
      to: normalizedEmail,
      subject: `${otp} is your WorthKart verification code`,
      text: `Your WorthKart verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#2874f0;margin:0 0 16px">WorthKart</h2>
          <p style="color:#333;font-size:15px">Your verification code is:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111;margin:16px 0">${otp}</p>
          <p style="color:#666;font-size:13px">Valid for 10 minutes. Do not share this code with anyone.</p>
        </div>
      `,
    });

    return { success: true, otpCode: otp };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    console.error("[email-otp] SMTP error:", message);
    return {
      success: false,
      error: `Could not send email from ${senderEmail}. Check Gmail App Password in .env.`,
    };
  }
}

export { OTP_DIGITS };
