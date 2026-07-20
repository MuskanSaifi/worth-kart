/**
 * Bank account & IFSC verification for Indian sellers.
 * - IFSC lookup: Razorpay public API (free, real-time)
 * - Account verification: Cashfree Secure ID Sync BAV (CASHFREE_SECURE_ID_CLIENT_ID + CASHFREE_SECURE_ID_CLIENT_SECRET)
 */

import {
  isSecureIdConfigured,
  secureIdClientId,
  secureIdHeaders,
  secureIdVerificationUrl,
} from "@/lib/cashfree-secure-id";
import { getCashfreeSignatureHeader } from "@/lib/cashfree-signature";

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export interface IfscLookupResult {
  ifsc: string;
  bank: string;
  branch: string;
  city: string;
  state: string;
  address: string;
  neft: boolean;
  imps: boolean;
  upi: boolean;
}

export interface BankVerifyResult {
  verified: boolean;
  accountStatus?: string;
  accountHolderName?: string;
  bankName?: string;
  branch?: string;
  nameMatchScore?: number;
  error?: string;
  source: "cashfree" | "api" | "ifsc_only";
}

export function validateIfscFormat(ifsc: string): boolean {
  return IFSC_REGEX.test(ifsc.trim().toUpperCase());
}

/** Real IFSC lookup via Razorpay (no API key required) */
export async function lookupIfsc(ifsc: string): Promise<IfscLookupResult | null> {
  const code = ifsc.trim().toUpperCase();
  if (!validateIfscFormat(code)) return null;

  try {
    const res = await fetch(`https://ifsc.razorpay.com/${code}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data === "Not Found" || !data.BANK) return null;

    return {
      ifsc: data.IFSC || code,
      bank: data.BANK,
      branch: data.BRANCH,
      city: data.CITY,
      state: data.STATE,
      address: data.ADDRESS || "",
      neft: !!data.NEFT,
      imps: !!data.IMPS,
      upi: !!data.UPI,
    };
  } catch {
    return null;
  }
}

export function isBankVerifyConfigured(): boolean {
  return !!(
    isSecureIdConfigured() ||
    (process.env.BANK_VERIFY_API_URL && process.env.BANK_VERIFY_API_KEY)
  );
}

async function verifyViaCashfree(params: {
  bankAccount: string;
  ifsc: string;
  name?: string;
  phone?: string;
}): Promise<BankVerifyResult> {
  const clientId = secureIdClientId();
  if (!isSecureIdConfigured()) {
    return { verified: false, error: "Cashfree Secure ID not configured", source: "cashfree" };
  }

  const body: Record<string, string> = {
    bank_account: params.bankAccount,
    ifsc: params.ifsc.toUpperCase(),
  };
  if (params.name) body.name = params.name.trim();
  if (params.phone) body.phone = params.phone.replace(/\D/g, "").slice(-10);

  const headers: Record<string, string> = {
    ...secureIdHeaders(),
  };

  const signature = getCashfreeSignatureHeader(clientId);
  if (signature) headers["x-cf-signature"] = signature;

  const res = await fetch(secureIdVerificationUrl("/bank-account/sync"), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    return { verified: false, error: "Invalid response from Cashfree", source: "cashfree" };
  }

  if (!res.ok) {
    const requestId = res.headers.get("x-request-id");
    if (requestId) {
      console.error(
        "[cashfree] BAV failed:",
        res.status,
        String(data.code || ""),
        "request-id:",
        requestId
      );
    }
    return {
      verified: false,
      error: mapCashfreeError(res.status, data, !!signature),
      source: "cashfree",
    };
  }

  const status = String(data.account_status || "").toUpperCase();
  const verified = status === "VALID";
  const statusCode = String(data.account_status_code || "");

  return {
    verified,
    accountStatus: data.account_status as string | undefined,
    accountHolderName: (data.name_at_bank || data.account_holder_name) as string | undefined,
    bankName: data.bank_name as string | undefined,
    branch: data.branch as string | undefined,
    nameMatchScore: typeof data.name_match_score === "number" ? data.name_match_score : undefined,
    error: verified
      ? undefined
      : humanizeAccountStatusCode(statusCode) ||
        (data.message as string) ||
        "Bank account is invalid",
    source: "cashfree",
  };
}

function humanizeAccountStatusCode(code: string): string | undefined {
  const map: Record<string, string> = {
    INVALID_ACCOUNT_FAIL: "Invalid bank account number",
    INVALID_IFSC_FAIL: "Invalid IFSC code",
    ACCOUNT_BLOCKED: "This bank account is blocked",
    NRE_ACCOUNT_FAIL: "NRE accounts are not supported",
  };
  return map[code];
}

function mapCashfreeError(
  status: number,
  data: Record<string, unknown>,
  hasSignature: boolean
): string {
  const message = String(data.message || data.error || "");
  const code = String(data.code || "");

  if (code === "x-client-secret_value_invalid") {
    return "Cashfree keys mismatch — set CASHFREE_SECURE_ID_ENV=production for prod keys";
  }

  if (status === 403 || code === "ip_validation_failed") {
    return "Your server IP is not whitelisted in Cashfree Secure ID → Developers → IP Whitelist";
  }

  if (status === 404 && code === "api_error") {
    return (
      "Cashfree Bank Account Verification is not active. In Secure ID dashboard: " +
      "(1) enable Bank Account service, (2) recharge wallet credits, " +
      "(3) use API keys from Developers → API Keys. IP whitelist is already OK if you added your public IP."
    );
  }

  if (message && message !== "something went wrong, please try after some time") {
    return message;
  }

  return "Bank verification failed. Check Cashfree Secure ID (BAV enabled, IP whitelist, 2FA key)";
}

async function verifyViaGenericApi(params: {
  bankAccount: string;
  ifsc: string;
  name?: string;
  phone?: string;
}): Promise<BankVerifyResult> {
  const apiUrl = process.env.BANK_VERIFY_API_URL;
  const apiKey = process.env.BANK_VERIFY_API_KEY;
  if (!apiUrl || !apiKey) {
    return { verified: false, error: "Bank verify API not configured", source: "api" };
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      bank_account: params.bankAccount,
      ifsc: params.ifsc,
      name: params.name,
      phone: params.phone,
    }),
    cache: "no-store",
  });

  const data = await res.json();
  const verified =
    data.verified === true ||
    data.account_status === "VALID" ||
    data.status === "VALID" ||
    data.success === true;

  return {
    verified,
    accountHolderName: data.name_at_bank || data.account_holder_name || data.beneficiary_name,
    bankName: data.bank_name,
    error: verified ? undefined : data.message || data.error || "Verification failed",
    source: "api",
  };
}

/**
 * Verify bank account exists at bank/NPCI (requires Cashfree or BANK_VERIFY_API).
 * Always validates IFSC format + live IFSC lookup first.
 */
export async function verifyBankAccount(params: {
  bankAccount: string;
  ifsc: string;
  accountHolderName?: string;
  phone?: string;
}): Promise<BankVerifyResult> {
  const ifsc = params.ifsc.trim().toUpperCase();
  const bankAccount = params.bankAccount.trim();

  if (!validateIfscFormat(ifsc)) {
    return { verified: false, error: "Invalid IFSC format", source: "ifsc_only" };
  }

  const ifscData = await lookupIfsc(ifsc);
  if (!ifscData) {
    return { verified: false, error: "IFSC code not found — check branch code", source: "ifsc_only" };
  }

  if (!ifscData.imps && !ifscData.neft) {
    return {
      verified: false,
      error: "This branch does not support IMPS/NEFT verification",
      source: "ifsc_only",
    };
  }

  if (isSecureIdConfigured()) {
    const result = await verifyViaCashfree({
      bankAccount,
      ifsc,
      name: params.accountHolderName,
      phone: params.phone,
    });
    if (!result.bankName) result.bankName = ifscData.bank;
    if (!result.branch) result.branch = ifscData.branch;
    return result;
  }

  if (process.env.BANK_VERIFY_API_URL && process.env.BANK_VERIFY_API_KEY) {
    const result = await verifyViaGenericApi({
      bankAccount,
      ifsc,
      name: params.accountHolderName,
      phone: params.phone,
    });
    if (!result.bankName) result.bankName = ifscData.bank;
    return result;
  }

  return {
    verified: false,
    error:
      "Bank account verification API not configured. Add CASHFREE_SECURE_ID_CLIENT_ID and CASHFREE_SECURE_ID_CLIENT_SECRET to .env",
    bankName: ifscData.bank,
    branch: ifscData.branch,
    source: "ifsc_only",
  };
}

/** Fuzzy name match (0–100) for holder name vs business name */
export function nameMatchScore(a: string, b: string): number {
  const norm = (s: string) =>
    s
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 100;
  if (x.includes(y) || y.includes(x)) return 85;

  const xWords = new Set(x.split(" "));
  const yWords = y.split(" ").filter((w) => xWords.has(w));
  if (yWords.length === 0) return 0;
  return Math.round((yWords.length / Math.max(x.split(" ").length, y.split(" ").length)) * 100);
}
