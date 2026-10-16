export const CASHFREE_PG_API_VERSION = "2023-08-01";

export function getAppBaseUrl(): string {
  return (
    process.env.APP_PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** Prefer the Host the client actually used (LAN IP), never force localhost for mobile. */
export function getRequestPublicOrigin(req: {
  headers: Headers;
  nextUrl: { origin: string; protocol: string };
}): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = (forwardedHost || req.headers.get("host") || "").split(",")[0]?.trim();
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const proto = (forwardedProto || req.nextUrl.protocol.replace(":", "") || "http").split(",")[0]?.trim();

  if (host && !/^localhost(?::\d+)?$/i.test(host) && !/^127\.0\.0\.1(?::\d+)?$/i.test(host)) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  const configured = getAppBaseUrl();
  if (!/localhost|127\.0\.0\.1/i.test(configured)) return configured;

  return req.nextUrl.origin.replace(/\/$/, "");
}

function isLocalHostUrl(url: string) {
  return /localhost|127\.0\.0\.1|192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[0-1])\./i.test(url);
}

/**
 * Localhost / LAN → sandbox. Public HTTPS (worthkart.in) → live.
 * CASHFREE_PG_ENV=sandbox|production still forces a mode if set.
 */
export function cashfreePgMode(): "sandbox" | "production" {
  const forced = process.env.CASHFREE_PG_ENV?.toLowerCase();
  if (forced === "sandbox" || forced === "test") return "sandbox";
  if (forced === "production" || forced === "live") {
    if (isLocalHostUrl(getAppBaseUrl())) return "sandbox";
    return "production";
  }
  return isLocalHostUrl(getAppBaseUrl()) ? "sandbox" : "production";
}

function cashfreePgKeys() {
  const live = cashfreePgMode() === "production";
  const clientId = (
    live
      ? process.env.CASHFREE_PG_CLIENT_ID_LIVE ||
        process.env.CASHFREE_PG_CLIENT_ID ||
        process.env.CASHFREE_PG_CLIENT_ID_TEST
      : process.env.CASHFREE_PG_CLIENT_ID_TEST ||
        process.env.CASHFREE_PG_CLIENT_ID ||
        process.env.CASHFREE_PG_CLIENT_ID_LIVE
  )?.trim() || "";
  const clientSecret = (
    live
      ? process.env.CASHFREE_PG_CLIENT_SECRET_LIVE ||
        process.env.CASHFREE_PG_CLIENT_SECRET ||
        process.env.CASHFREE_PG_CLIENT_SECRET_TEST
      : process.env.CASHFREE_PG_CLIENT_SECRET_TEST ||
        process.env.CASHFREE_PG_CLIENT_SECRET ||
        process.env.CASHFREE_PG_CLIENT_SECRET_LIVE
  )?.trim() || "";
  return { clientId, clientSecret };
}

export function isCashfreePgConfigured(): boolean {
  const { clientId, clientSecret } = cashfreePgKeys();
  return !!(clientId && clientSecret);
}

/** @deprecated Use isCashfreePgConfigured */
export function isCashfreeConfigured(): boolean {
  return isCashfreePgConfigured();
}

export function cashfreePgCredentialMode(): "sandbox" | "production" | null {
  const { clientSecret } = cashfreePgKeys();
  if (clientSecret.includes("_prod_")) return "production";
  if (clientSecret.includes("_test_")) return "sandbox";
  return null;
}

/** Returns a user-facing error when env and API keys disagree. */
export function getCashfreePgConfigError(): string | null {
  if (!isCashfreePgConfigured()) {
    const mode = cashfreePgMode();
    return mode === "production"
      ? "Cashfree live keys missing. Set CASHFREE_PG_CLIENT_ID_LIVE and CASHFREE_PG_CLIENT_SECRET_LIVE."
      : "Cashfree test keys missing. Set CASHFREE_PG_CLIENT_ID_TEST and CASHFREE_PG_CLIENT_SECRET_TEST.";
  }

  const credentialMode = cashfreePgCredentialMode();
  const mode = cashfreePgMode();
  if (credentialMode && credentialMode !== mode) {
    return (
      `Cashfree keys mismatch: ${mode} mode is active but the secret looks like ${credentialMode}. ` +
      `Use _TEST keys for localhost and _LIVE keys for worthkart.in.`
    );
  }

  return null;
}

export function cashfreePgBaseUrl(): string {
  return cashfreePgMode() === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
}

/** @deprecated Use cashfreePgBaseUrl */
export function cashfreeBaseUrl(): string {
  return cashfreePgBaseUrl();
}

/** @deprecated Use cashfreePgMode */
export function cashfreeMode(): "sandbox" | "production" {
  return cashfreePgMode();
}

export function cashfreePgClientId(): string {
  return cashfreePgKeys().clientId;
}

export function cashfreePgHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-client-id": cashfreePgKeys().clientId,
    "x-client-secret": cashfreePgKeys().clientSecret,
    "x-api-version": CASHFREE_PG_API_VERSION,
  };
}
