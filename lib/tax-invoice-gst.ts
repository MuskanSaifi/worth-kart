/** GST helpers for tax invoices (India). */

export type GstSplit = {
  rate: number;
  taxable: number;
  tax: number;
  total: number;
  taxType: "IGST" | "CGST+SGST";
  cgst?: number;
  sgst?: number;
  igst?: number;
};

const STATE_NAME_TO_CODE: Record<string, string> = {
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  punjab: "03",
  chandigarh: "04",
  uttarakhand: "05",
  haryana: "06",
  delhi: "07",
  rajasthan: "08",
  "uttar pradesh": "09",
  bihar: "10",
  sikkim: "11",
  "arunachal pradesh": "12",
  nagaland: "13",
  manipur: "14",
  mizoram: "15",
  tripura: "16",
  meghalaya: "17",
  assam: "18",
  "west bengal": "19",
  jharkhand: "20",
  odisha: "21",
  chhattisgarh: "22",
  "madhya pradesh": "23",
  gujarat: "24",
  "dadra and nagar haveli and daman and diu": "26",
  maharashtra: "27",
  karnataka: "29",
  goa: "30",
  lakshadweep: "31",
  kerala: "32",
  "tamil nadu": "33",
  puducherry: "34",
  "andaman and nicobar islands": "35",
  telangana: "36",
  "andhra pradesh": "37",
  ladakh: "38",
};

export function stateNameToCode(state?: string | null): string | null {
  if (!state?.trim()) return null;
  const key = state.trim().toLowerCase();
  if (STATE_NAME_TO_CODE[key]) return STATE_NAME_TO_CODE[key];
  const partial = Object.entries(STATE_NAME_TO_CODE).find(([name]) => key.includes(name) || name.includes(key));
  return partial?.[1] ?? null;
}

export function gstinStateCode(gstin?: string | null): string | null {
  if (!gstin || gstin.length < 2) return null;
  const code = gstin.slice(0, 2);
  return /^\d{2}$/.test(code) ? code : null;
}

export function isInterStateSupply(
  sellerState?: string | null,
  buyerState?: string | null,
  sellerGstin?: string | null
): boolean {
  const sellerCode = gstinStateCode(sellerGstin) || stateNameToCode(sellerState);
  const buyerCode = stateNameToCode(buyerState);
  if (!sellerCode || !buyerCode) return false;
  return sellerCode !== buyerCode;
}

/** Consumer price is GST-inclusive. */
export function splitGstFromInclusive(totalIncl: number, gstRatePercent: number): GstSplit {
  const rate = Math.max(0, gstRatePercent);
  if (rate === 0) {
    return {
      rate: 0,
      taxable: totalIncl,
      tax: 0,
      total: totalIncl,
      taxType: "IGST",
      igst: 0,
    };
  }
  const taxable = totalIncl / (1 + rate / 100);
  const tax = totalIncl - taxable;
  return {
    rate,
    taxable,
    tax,
    total: totalIncl,
    taxType: "IGST",
    igst: tax,
  };
}

export function applyGstSplit(
  split: GstSplit,
  interState: boolean
): GstSplit & { taxTypeLabel: string; cgst?: number; sgst?: number; igst?: number } {
  if (!interState && split.rate > 0) {
    const half = split.tax / 2;
    return {
      ...split,
      taxType: "CGST+SGST",
      taxTypeLabel: "CGST+SGST",
      cgst: half,
      sgst: half,
      igst: undefined,
    };
  }
  return {
    ...split,
    taxType: "IGST",
    taxTypeLabel: "IGST",
    igst: split.tax,
    cgst: undefined,
    sgst: undefined,
  };
}

export function parseProductCatalogTags(tags?: string | null): { hsnCode?: string; gstRate?: number } {
  if (!tags) return {};
  try {
    const parsed = JSON.parse(tags) as Record<string, unknown>;
    const hsn = typeof parsed.hsnCode === "string" ? parsed.hsnCode.trim() : "";
    const rateRaw = parsed.gstRate;
    const rate =
      typeof rateRaw === "number"
        ? rateRaw
        : typeof rateRaw === "string"
          ? parseFloat(rateRaw.replace(/%/g, ""))
          : NaN;
    return {
      hsnCode: hsn || undefined,
      gstRate: Number.isFinite(rate) ? rate : undefined,
    };
  } catch {
    return {};
  }
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? ` ${ONES[o]}` : ""}`.trim();
}

/** Rupees in words (integer part only, invoice style). */
export function amountInWordsINR(amount: number): string {
  const rupees = Math.floor(Math.abs(amount));
  if (rupees === 0) return "Zero only";
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = Math.floor((rupees % 1000) / 100);
  const rest = rupees % 100;
  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return `${parts.join(" ")} only`;
}
