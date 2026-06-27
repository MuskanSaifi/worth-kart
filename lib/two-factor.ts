/**
 * 2Factor.in — real 4-digit OTP for SMS & Email.
 * Env: TWO_FACTOR_API_KEY, TWO_FACTOR_OTP_TEMPLATE, TWO_FACTOR_SENDER_ID, TWO_FACTOR_SENDER_EMAIL
 */

export const OTP_DIGITS = 4;

const DEFAULT_SENDER_EMAIL = "info@worthkart.in";

export function getTwoFactorSenderEmail(): string {
  return process.env.TWO_FACTOR_SENDER_EMAIL || DEFAULT_SENDER_EMAIL;
}

function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function maskPhone(phone: string): string {
  const p = normalizeIndianPhone(phone);
  if (p.length !== 10) return "**********";
  return `${p.slice(0, 2)}******${p.slice(-2)}`;
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
}

export function isTwoFactorConfigured(): boolean {
  return !!process.env.TWO_FACTOR_API_KEY;
}

async function call2Factor(url: string): Promise<{ ok: boolean; sessionId?: string; error?: string }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    if (data.Status === "Success" && data.Details) {
      return { ok: true, sessionId: String(data.Details) };
    }
    if (data.status === "sent" && (data.session_id || data.sessionId)) {
      return { ok: true, sessionId: String(data.session_id || data.sessionId) };
    }
    return { ok: false, error: String(data.Details || data.message || data.status || "2Factor request failed") };
  } catch {
    return { ok: false, error: "2Factor gateway unreachable" };
  }
}

async function call2FactorPost(
  url: string,
  body: Record<string, unknown>,
  apiKey: string
): Promise<{ ok: boolean; sessionId?: string; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.Status === "Success" && data.Details) {
      return { ok: true, sessionId: String(data.Details) };
    }
    if (data.status === "sent" && (data.session_id || data.sessionId)) {
      return { ok: true, sessionId: String(data.session_id || data.sessionId) };
    }
    return { ok: false, error: String(data.Details || data.message || data.status || "2Factor POST failed") };
  } catch {
    return { ok: false, error: "2Factor gateway unreachable" };
  }
}

/** Send 4-digit OTP via SMS (AUTOGEN3) */
export async function sendSmsOtp(phone: string): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  const template = process.env.TWO_FACTOR_OTP_TEMPLATE || "OTPtemplate";

  if (!apiKey) {
    return { success: false, error: "SMS API not configured (TWO_FACTOR_API_KEY)" };
  }

  const mobile = normalizeIndianPhone(phone);
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return { success: false, error: "Invalid 10-digit Indian mobile number" };
  }

  const attempts = [
    `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/AUTOGEN3/${template}`,
    `https://2factor.in/API/V1/${apiKey}/SMS/+91${mobile}/AUTOGEN3/${template}`,
    `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/AUTOGEN3`,
  ];

  for (const url of attempts) {
    const result = await call2Factor(url);
    if (result.ok && result.sessionId) {
      return { success: true, sessionId: result.sessionId };
    }
  }

  return { success: false, error: "Failed to send SMS OTP. Check 2Factor template & DLT." };
}

/** Send 4-digit OTP via Email (AUTOGEN3) from info@worthkart.in */
export async function sendEmailOtp(email: string): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  const template =
    process.env.TWO_FACTOR_EMAIL_TEMPLATE ||
    process.env.TWO_FACTOR_OTP_TEMPLATE ||
    "OTPtemplate";
  const senderEmail = getTwoFactorSenderEmail();

  if (!apiKey) {
    return { success: false, error: "Email OTP API not configured" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: "Invalid email address" };
  }

  // 1) Unified OTP API (channel: EMAIL + from)
  const postResult = await call2FactorPost(
    "https://2factor.in/API/V1/OTP/SEND",
    {
      to: normalizedEmail,
      channel: "EMAIL",
      template,
      template_name: template,
      from: senderEmail,
      from_email: senderEmail,
      sender: senderEmail,
      otp_length: OTP_DIGITS,
    },
    apiKey
  );
  if (postResult.ok && postResult.sessionId) {
    return { success: true, sessionId: postResult.sessionId };
  }

  // 2) Legacy GET endpoints with sender email in path
  const encodedEmail = encodeURIComponent(normalizedEmail);
  const encodedSender = encodeURIComponent(senderEmail);
  const getAttempts = [
    `https://2factor.in/API/V1/${apiKey}/EMAIL/${encodedEmail}/${encodedSender}/AUTOGEN3/${template}`,
    `https://2factor.in/API/V1/${apiKey}/EMAIL/${encodedEmail}/AUTOGEN3/${template}/${encodedSender}`,
    `https://2factor.in/API/V1/${apiKey}/EMAIL/${encodedEmail}/AUTOGEN3/${template}`,
    `https://2factor.in/API/V1/${apiKey}/EMAIL/${encodedEmail}/AUTOGEN3`,
    `https://2factor.in/API/V1/${apiKey}/EMAIL/${encodedEmail}/AUTOGEN/${template}`,
  ];

  for (const url of getAttempts) {
    const result = await call2Factor(url);
    if (result.ok && result.sessionId) {
      return { success: true, sessionId: result.sessionId };
    }
  }

  return {
    success: false,
    error:
      postResult.error ||
      `Failed to send Email OTP from ${senderEmail}. Enable Email OTP on 2Factor & verify sender domain.`,
  };
}

/** Verify OTP (works for SMS & Email session IDs) */
export async function verifyOtpVia2Factor(sessionId: string, otp: string): Promise<boolean> {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (!apiKey || !sessionId) return false;

  try {
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return data.Status === "Success" && String(data.Details).toLowerCase().includes("otp matched");
  } catch {
    return false;
  }
}

// Backward-compatible aliases
export const sendOtpVia2Factor = sendSmsOtp;
export const isSmsConfigured = isTwoFactorConfigured;
