import type { OrderStatus } from "@/lib/order-status";

export function statusTitle(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Payment pending";
    case "CONFIRMED":
      return "Order confirmed";
    case "PACKED":
      return "Order packed";
    case "SHIPPED":
      return "Order shipped";
    case "OUT_FOR_DELIVERY":
      return "Out for delivery";
    case "DELIVERED":
      return "Order delivered";
    case "CANCELLED":
      return "Order cancelled";
    case "RETURNED":
      return "Order returned";
    default:
      return "Order update";
  }
}

export function statusMessage(
  status: OrderStatus,
  orderNumber: string,
  extras?: { edd?: string | null; deliveryOtp?: string | null; courier?: string | null; awb?: string | null }
): string {
  const edd = extras?.edd ? ` Estimated delivery: ${extras.edd}.` : "";
  const courier =
    extras?.courier || extras?.awb
      ? ` Courier: ${extras.courier || "Partner"}${extras.awb ? ` (AWB ${extras.awb})` : ""}.`
      : "";

  switch (status) {
    case "PENDING":
      return `Your WorthKart order ${orderNumber} is awaiting payment.`;
    case "CONFIRMED":
      return `Your WorthKart order ${orderNumber} is confirmed. We'll notify you when it ships.`;
    case "PACKED":
      return `Your WorthKart order ${orderNumber} has been packed and will ship soon.`;
    case "SHIPPED":
      return `Your WorthKart order ${orderNumber} has been shipped.${courier}${edd}`;
    case "OUT_FOR_DELIVERY":
      return `Your WorthKart order ${orderNumber} is out for delivery.${courier}${
        extras?.deliveryOtp ? ` Share delivery OTP ${extras.deliveryOtp} with the delivery partner.` : ""
      }`;
    case "DELIVERED":
      return `Your WorthKart order ${orderNumber} has been delivered. Thank you for shopping with us!`;
    case "CANCELLED":
      return `Your WorthKart order ${orderNumber} has been cancelled.`;
    case "RETURNED":
      return `Your WorthKart order ${orderNumber} return has been processed.`;
    default:
      return `Update on your WorthKart order ${orderNumber}.`;
  }
}

/** Default EDD: 5 calendar days after ship date (India marketplace style). */
export function computeEstimatedDelivery(from: Date = new Date(), businessDays = 5): Date {
  const d = new Date(from);
  d.setHours(20, 0, 0, 0);
  d.setDate(d.getDate() + businessDays);
  return d;
}

export function formatEdd(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
