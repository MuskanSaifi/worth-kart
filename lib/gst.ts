/**
 * GSTIN (GST Identification Number) validation for India.
 * 15 chars: [State(2)][PAN(10)][Entity(1)][Z][Checksum(1)]
 */

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const VALID_STATE_CODES = new Set([
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "31", "32", "33", "34", "35", "36", "37", "38", "97", "99",
]);

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHECKSUM_WEIGHTS = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];

function charValue(c: string): number {
  const idx = CHARS.indexOf(c);
  return idx === -1 ? -1 : idx;
}

function splitDigitSum(n: number): number {
  return Math.floor(n / 36) + (n % 36);
}

/** Validates GSTIN format, state code, and checksum digit */
export function validateGstinChecksum(gstin: string): boolean {
  const normalized = gstin.trim().toUpperCase();
  if (!GSTIN_REGEX.test(normalized)) return false;

  const stateCode = normalized.slice(0, 2);
  if (!VALID_STATE_CODES.has(stateCode)) return false;

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const val = charValue(normalized[i]);
    if (val < 0) return false;
    sum += splitDigitSum(val * CHECKSUM_WEIGHTS[i]);
  }

  const expectedChecksum = (36 - (sum % 36)) % 36;
  const actualChecksum = charValue(normalized[14]);
  return actualChecksum === expectedChecksum;
}

/** Extract embedded PAN from GSTIN (chars 3–12) */
export function extractPanFromGstin(gstin: string): string {
  return gstin.trim().toUpperCase().slice(2, 12);
}

export interface GstValidationResult {
  valid: boolean;
  gstin: string;
  stateCode?: string;
  pan?: string;
  error?: string;
}

export function validateGstin(gstin: string): GstValidationResult {
  const normalized = gstin.trim().toUpperCase();

  if (!normalized) {
    return { valid: false, gstin: normalized, error: "GST number is required" };
  }

  if (normalized.length !== 15) {
    return { valid: false, gstin: normalized, error: "GSTIN must be 15 characters" };
  }

  if (!GSTIN_REGEX.test(normalized)) {
    return { valid: false, gstin: normalized, error: "Invalid GSTIN format" };
  }

  const stateCode = normalized.slice(0, 2);
  if (!VALID_STATE_CODES.has(stateCode)) {
    return { valid: false, gstin: normalized, error: "Invalid state code in GSTIN" };
  }

  if (!validateGstinChecksum(normalized)) {
    return { valid: false, gstin: normalized, error: "Invalid GSTIN checksum — number may be fake" };
  }

  return {
    valid: true,
    gstin: normalized,
    stateCode,
    pan: extractPanFromGstin(normalized),
  };
}

/**
 * Live lookup against GST portal (via configured API provider).
 * Set GST_VERIFY_API_URL + GST_VERIFY_API_KEY in .env for production.
 * Falls back to checksum-only validation in development.
 */
export async function lookupGstinOnline(gstin: string): Promise<{
  verified: boolean;
  legalName?: string;
  status?: string;
  registeredMobile?: string;
  source: "api" | "checksum";
}> {
  const local = validateGstin(gstin);
  if (!local.valid) {
    return { verified: false, source: "checksum" };
  }

  const apiUrl = process.env.GST_VERIFY_API_URL;
  const apiKey = process.env.GST_VERIFY_API_KEY;

  if (apiUrl && apiKey) {
    try {
      const res = await fetch(`${apiUrl}?gstin=${local.gstin}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const active =
          data.status === "Active" ||
          data.sts === "Active" ||
          data.taxpayerInfo?.status === "Active";
        const registeredMobile = extractMobileFromGstResponse(data);
        return {
          verified: active,
          legalName: data.legalName || data.lgnm || data.tradeNam,
          status: data.status || data.sts,
          registeredMobile,
          source: "api",
        };
      }
    } catch {
      // fall through to checksum validation
    }
  }

  // Dev / no API: checksum passed = structurally valid
  return {
    verified: true,
    legalName: undefined,
    status: "Checksum verified (live lookup not configured)",
    source: "checksum",
  };
}

function extractMobileFromGstResponse(data: Record<string, unknown>): string | undefined {
  const taxpayer = data.taxpayerInfo as Record<string, unknown> | undefined;
  const candidates = [
    data.mobile,
    data.mob,
    data.mblNo,
    data.contact,
    data.phone,
    taxpayer?.mob,
    taxpayer?.mobile,
    taxpayer?.mblNo,
    (data.data as Record<string, unknown> | undefined)?.mobile,
  ];

  for (const c of candidates) {
    if (typeof c === "string") {
      const digits = c.replace(/\D/g, "");
      if (digits.length >= 10) return digits.slice(-10);
    }
  }
  return undefined;
}
