import crypto from "crypto";
import fs from "fs";

/** Generate x-cf-signature for Cashfree Secure ID 2FA (public key method). */
export function generateCashfreeSignature(
  clientId: string,
  publicKeyPem: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${clientId}.${timestamp}`;

  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha1",
    },
    Buffer.from(payload)
  );

  return encrypted.toString("base64");
}

export function loadCashfreePublicKey(): string | null {
  const path =
    process.env.CASHFREE_SECURE_ID_PUBLIC_KEY_PATH ||
    process.env.CASHFREE_PUBLIC_KEY_PATH;
  if (!path || !fs.existsSync(path)) return null;

  let pem = fs.readFileSync(path, "utf8");
  // Strip BOM / normalize line endings
  pem = pem.replace(/^\uFEFF/, "").trim();
  if (!pem.includes("BEGIN")) return null;
  return pem;
}

export function getCashfreeSignatureHeader(clientId: string): string | null {
  const pem = loadCashfreePublicKey();
  if (!pem) return null;
  try {
    return generateCashfreeSignature(clientId, pem);
  } catch (error) {
    console.error("[cashfree] signature generation failed:", error);
    return null;
  }
}
