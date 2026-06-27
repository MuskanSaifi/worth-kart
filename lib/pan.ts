import { extractPanFromGstin } from "@/lib/gst";

const PAN_REGEX = /^[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z]$/;

const ENTITY_CHARS = new Set(["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"]);

export interface PanValidationResult {
  valid: boolean;
  pan: string;
  error?: string;
}

export function validatePan(pan: string): PanValidationResult {
  const normalized = pan.trim().toUpperCase();

  if (!normalized) {
    return { valid: false, pan: normalized, error: "PAN is required" };
  }

  if (normalized.length !== 10) {
    return { valid: false, pan: normalized, error: "PAN must be 10 characters" };
  }

  if (!PAN_REGEX.test(normalized)) {
    return { valid: false, pan: normalized, error: "Invalid PAN format (e.g. ABCDE1234F)" };
  }

  if (!ENTITY_CHARS.has(normalized[3])) {
    return { valid: false, pan: normalized, error: "Invalid PAN entity type (4th character)" };
  }

  return { valid: true, pan: normalized };
}

export function panMatchesGstin(pan: string, gstin: string): boolean {
  const panResult = validatePan(pan);
  if (!panResult.valid) return false;
  return panResult.pan === extractPanFromGstin(gstin);
}
