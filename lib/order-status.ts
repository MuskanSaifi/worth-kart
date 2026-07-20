export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

/** Customer-facing tracker steps (Amazon-style). */
export const TRACKING_STEPS = [
  { key: "ordered", label: "Ordered" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

export type TrackingStepKey = (typeof TRACKING_STEPS)[number]["key"];

const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PACKED: 1,
  SHIPPED: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  RETURNED: -1,
};

/** Maps internal status to the active customer tracker step index (0–3). */
export function getTrackingStepIndex(status: string): number {
  const rank = STATUS_RANK[status as OrderStatus];
  if (rank === undefined || rank < 0) return 0;
  if (rank <= 1) return 0;
  if (rank === 2) return 1;
  if (rank === 3) return 2;
  return 3;
}

export function getTrackingHeadline(
  status: string,
  estimatedDeliveryAt?: string | Date | null
): string {
  const edd =
    estimatedDeliveryAt != null
      ? new Date(estimatedDeliveryAt).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : null;

  switch (status) {
    case "PENDING":
      return "Payment pending";
    case "CONFIRMED":
    case "PACKED":
      return edd ? `Arriving by ${edd}` : "Order placed";
    case "SHIPPED":
      return edd ? `Arriving by ${edd}` : "Shipped";
    case "OUT_FOR_DELIVERY":
      return edd ? `Arriving today · EDD ${edd}` : "Arriving today";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    case "RETURNED":
      return "Returned";
    default:
      return "Order placed";
  }
}

export const SELLER_NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "OUT_FOR_DELIVERY",
  // DELIVERED comes from courier OTP → Shiprocket webhook — not the seller
};

export const SELLER_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Mark Packed",
  PACKED: "Mark Shipped",
  SHIPPED: "Out for Delivery",
};

export function canSellerAdvanceStatus(current: string): boolean {
  return current in SELLER_NEXT_STATUS;
}

export function getNextSellerStatus(current: string): OrderStatus | null {
  return SELLER_NEXT_STATUS[current as OrderStatus] ?? null;
}

/** Who updates each status — for seller/admin reference. */
export const STATUS_UPDATED_BY: Record<OrderStatus, string> = {
  PENDING: "System (checkout)",
  CONFIRMED: "System (payment success / COD)",
  PACKED: "Seller (AWB generated)",
  SHIPPED: "Seller / Shiprocket",
  OUT_FOR_DELIVERY: "Courier / Shiprocket webhook",
  DELIVERED: "Delivery boy OTP → Shiprocket webhook",
  CANCELLED: "System / Buyer",
  RETURNED: "Admin / Support",
};
