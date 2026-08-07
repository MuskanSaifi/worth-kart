/**
 * Marketplace money flow (WorthKart ≈ Meesho / Flipkart):
 *
 * 1. Customer pays platform via Cashfree PG (ONLINE) or chooses COD.
 * 2. ONLINE → paymentStatus=PAID immediately; order CONFIRMED; stock reduced.
 *    COD → order CONFIRMED; paymentStatus stays PENDING until delivery.
 * 3. Seller packs / ships; courier delivers (OTP / Shiprocket).
 * 4. On DELIVERED:
 *    - COD orders are marked paymentStatus=PAID (cash collected).
 *    - One SellerSettlement row per order item (gross − 10% commission).
 * 5. Settlements stay PENDING until weekly bank payout (admin/manual for now).
 * 6. Cashfree Payouts API can pay PENDING rows later without changing this ledger.
 */

export const PLATFORM_COMMISSION_RATE = 0.1; // 10%

export function calcSellerShare(grossAmount: number, rate = PLATFORM_COMMISSION_RATE) {
  const commissionAmount = Math.round(grossAmount * rate * 100) / 100;
  const netAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;
  return { commissionRate: rate, commissionAmount, netAmount };
}
