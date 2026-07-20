export const CASHFREE_PG_API_VERSION = "2023-08-01";

export function getAppBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export function isCashfreePgConfigured(): boolean {
  return !!(
    process.env.CASHFREE_PG_CLIENT_ID && process.env.CASHFREE_PG_CLIENT_SECRET
  );
}

/** @deprecated Use isCashfreePgConfigured */
export function isCashfreeConfigured(): boolean {
  return isCashfreePgConfigured();
}

/** Infer sandbox vs production from the client secret suffix. */
export function cashfreePgCredentialMode(): "sandbox" | "production" | null {
  const secret = process.env.CASHFREE_PG_CLIENT_SECRET || "";
  if (secret.includes("_prod_")) return "production";
  if (secret.includes("_test_")) return "sandbox";
  return null;
}

function cashfreePgEnvOverride(): "sandbox" | "production" | null {
  const env = process.env.CASHFREE_PG_ENV?.toLowerCase();
  if (env === "sandbox" || env === "test") return "sandbox";
  if (env === "production" || env === "live") return "production";
  return null;
}

/** Returns a user-facing error when env and API keys disagree. */
export function getCashfreePgConfigError(): string | null {
  if (!isCashfreePgConfigured()) {
    return "Cashfree payment gateway is not configured";
  }

  const credentialMode = cashfreePgCredentialMode();
  const envOverride = cashfreePgEnvOverride();
  if (credentialMode && envOverride && credentialMode !== envOverride) {
    return (
      `Cashfree keys mismatch: your secret is for ${credentialMode} but ` +
      `CASHFREE_PG_ENV=${process.env.CASHFREE_PG_ENV}. ` +
      `Set CASHFREE_PG_ENV=${credentialMode} or use matching API keys.`
    );
  }

  if (cashfreePgMode() === "production") {
    const returnUrl = `${getAppBaseUrl()}/checkout/return`;
    if (!returnUrl.startsWith("https://")) {
      return (
        "Cashfree production requires an HTTPS return URL. " +
        "Set NEXTAUTH_URL to your https domain (e.g. ngrok tunnel), " +
        "or use sandbox Payment Gateway keys for local testing."
      );
    }
  }

  return null;
}

export function cashfreePgBaseUrl(): string {
  const credentialMode = cashfreePgCredentialMode();
  const envOverride = cashfreePgEnvOverride();

  if (credentialMode && envOverride && credentialMode !== envOverride) {
    console.warn(
      `[cashfree] CASHFREE_PG_ENV=${process.env.CASHFREE_PG_ENV} conflicts with ` +
        `${credentialMode} keys — using ${credentialMode} API`
    );
    return credentialMode === "production"
      ? "https://api.cashfree.com"
      : "https://sandbox.cashfree.com";
  }

  if (envOverride === "sandbox") return "https://sandbox.cashfree.com";
  if (envOverride === "production") return "https://api.cashfree.com";

  return credentialMode === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
}

/** @deprecated Use cashfreePgBaseUrl */
export function cashfreeBaseUrl(): string {
  return cashfreePgBaseUrl();
}

export function cashfreePgMode(): "sandbox" | "production" {
  return cashfreePgBaseUrl().includes("sandbox") ? "sandbox" : "production";
}

/** @deprecated Use cashfreePgMode */
export function cashfreeMode(): "sandbox" | "production" {
  return cashfreePgMode();
}

export function cashfreePgClientId(): string {
  return process.env.CASHFREE_PG_CLIENT_ID || "";
}

export function cashfreePgHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-client-id": cashfreePgClientId(),
    "x-client-secret": process.env.CASHFREE_PG_CLIENT_SECRET || "",
    "x-api-version": CASHFREE_PG_API_VERSION,
  };
}
