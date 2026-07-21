/** Placeholder emails for phone-only buyers until they verify a real address. */
export function isInternalBuyerEmail(email?: string | null): boolean {
  return !!email?.endsWith("@users.worthkart.in");
}

/** Cashfree and receipts: use verified email, else a stable phone-based fallback. */
export function getCustomerEmailForPayment(user: {
  email: string;
  emailVerified?: boolean;
  phone?: string | null;
}): string {
  if (user.emailVerified && user.email && !isInternalBuyerEmail(user.email)) {
    return user.email;
  }
  const phone = user.phone?.replace(/\D/g, "").slice(-10);
  if (phone) return `orders+${phone}@worthkart.in`;
  return "orders@worthkart.in";
}
