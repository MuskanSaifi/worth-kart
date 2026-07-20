import nodemailer from "nodemailer";
import { getTwoFactorSenderEmail } from "@/lib/two-factor";

function getSmtpConfig() {
  const user = process.env.SMTP_USER || getTwoFactorSenderEmail();
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);

  if (!user || !pass) return null;
  return { user, pass, host, port };
}

export function isEmailConfigured(): boolean {
  return !!getSmtpConfig();
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ success: boolean; error?: string }> {
  const smtp = getSmtpConfig();
  if (!smtp) {
    return { success: false, error: "Email not configured (SMTP_USER / SMTP_PASS)" };
  }

  const to = opts.to.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { success: false, error: "Invalid email address" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from: `"WorthKart" <${smtp.user}>`,
      to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html || `<pre style="font-family:sans-serif">${opts.text}</pre>`,
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    console.error("[email]", message);
    return { success: false, error: message };
  }
}
