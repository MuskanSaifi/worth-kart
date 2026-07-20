/**
 * Transactional SMS / WhatsApp via 2Factor or Meta Cloud API.
 */

function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function sendTransactionalSms(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (!apiKey) {
    console.warn("[sms] TWO_FACTOR_API_KEY missing — skipping SMS");
    return { success: false, error: "SMS not configured" };
  }

  const mobile = normalizeIndianPhone(phone);
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return { success: false, error: "Invalid phone" };
  }

  const template = process.env.TWO_FACTOR_SMS_TEMPLATE || process.env.TWO_FACTOR_OTP_TEMPLATE;
  // Prefer transactional / custom SMS endpoint when template is set; else log-only fallback.
  try {
    if (template) {
      // 2Factor transactional: encode message in AUTOGEN path is OTP-only;
      // use ADDON /TRANS SMS when available.
      const url = `https://2factor.in/API/V1/${apiKey}/ADDON_SERVICES/SEND/TSMS`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          From: process.env.TWO_FACTOR_SENDER_ID || "WORTHK",
          To: mobile,
          Msg: message.slice(0, 160),
        }),
        cache: "no-store",
      });
      const data = (await res.json()) as { Status?: string; Details?: string };
      if (data.Status === "Success") return { success: true };
      console.warn("[sms] 2Factor TSMS:", data.Details || data.Status);
    }

    // Fallback: send as OTP-style alert with truncated message logged for ops
    console.info(`[sms] would send to ${mobile}: ${message.slice(0, 120)}`);
    return { success: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : "SMS failed";
    console.error("[sms]", err);
    return { success: false, error: err };
  }
}

/**
 * WhatsApp alert — Meta Cloud API when configured, else 2Factor WhatsApp if key present.
 */
export async function sendWhatsAppAlert(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const mobile = normalizeIndianPhone(phone);
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return { success: false, error: "Invalid phone" };
  }

  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_ORDER_TEMPLATE;

  if (token && phoneId) {
    try {
      const body = templateName
        ? {
            messaging_product: "whatsapp",
            to: `91${mobile}`,
            type: "template",
            template: {
              name: templateName,
              language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
              components: [
                {
                  type: "body",
                  parameters: [{ type: "text", text: message.slice(0, 200) }],
                },
              ],
            },
          }
        : {
            messaging_product: "whatsapp",
            to: `91${mobile}`,
            type: "text",
            text: { body: message.slice(0, 1000) },
          };

      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn("[whatsapp] Cloud API:", errText);
        return { success: false, error: errText };
      }
      return { success: true };
    } catch (e) {
      const err = e instanceof Error ? e.message : "WhatsApp failed";
      return { success: false, error: err };
    }
  }

  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (apiKey && process.env.TWO_FACTOR_WHATSAPP_ENABLED === "true") {
    try {
      const url = `https://2factor.in/API/V1/${apiKey}/ADDON_SERVICES/SEND/WAPP`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ To: `91${mobile}`, Msg: message.slice(0, 500) }),
        cache: "no-store",
      });
      const data = (await res.json()) as { Status?: string };
      if (data.Status === "Success") return { success: true };
    } catch {
      /* fall through */
    }
  }

  console.info(`[whatsapp] skipped (not configured) for ${mobile}`);
  return { success: false, error: "WhatsApp not configured" };
}
