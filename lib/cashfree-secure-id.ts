export const CASHFREE_SECURE_ID_API_VERSION = "2023-12-18";

export function isSecureIdConfigured(): boolean {
  return !!(
    process.env.CASHFREE_SECURE_ID_CLIENT_ID &&
    process.env.CASHFREE_SECURE_ID_CLIENT_SECRET
  );
}

export function secureIdBaseUrl(): string {
  const env = process.env.CASHFREE_SECURE_ID_ENV?.toLowerCase();
  if (env === "sandbox" || env === "test") {
    return "https://sandbox.cashfree.com";
  }
  if (env === "production" || env === "live") {
    return "https://api.cashfree.com";
  }

  const secret = process.env.CASHFREE_SECURE_ID_CLIENT_SECRET || "";
  return secret.includes("_prod_")
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
}

export function secureIdClientId(): string {
  return process.env.CASHFREE_SECURE_ID_CLIENT_ID || "";
}

export function secureIdClientSecret(): string {
  return process.env.CASHFREE_SECURE_ID_CLIENT_SECRET || "";
}

export function secureIdHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-client-id": secureIdClientId(),
    "x-client-secret": secureIdClientSecret(),
    "x-api-version": CASHFREE_SECURE_ID_API_VERSION,
  };
}

export function secureIdVerificationUrl(path: string): string {
  return `${secureIdBaseUrl()}/verification${path}`;
}
