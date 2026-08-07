import {
  cashfreePgBaseUrl,
  cashfreePgHeaders,
  getAppBaseUrl,
  getCashfreePgConfigError,
  isCashfreePgConfigured,
} from "@/lib/cashfree";

export interface CashfreePgOrderResponse {
  cf_order_id?: string;
  order_id: string;
  order_status: string;
  payment_session_id: string;
  order_amount: number;
  order_currency: string;
}

export interface CashfreePgOrderDetails {
  order_id: string;
  order_status: string;
  order_amount: number;
  cf_order_id?: string;
}

export function isOnlinePaymentMethod(method: string): boolean {
  return method !== "COD";
}

export async function createCashfreePgOrder(params: {
  orderId: string;
  amount: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNote?: string;
  returnUrl?: string;
}): Promise<CashfreePgOrderResponse> {
  const configError = getCashfreePgConfigError();
  if (configError) {
    throw new Error(configError);
  }

  const orderAmount = Math.round(params.amount * 100) / 100;
  const returnUrl =
    params.returnUrl ||
    `${getAppBaseUrl()}/checkout/return?order_id=${encodeURIComponent(params.orderId)}`;

  const res = await fetch(`${cashfreePgBaseUrl()}/pg/orders`, {
    method: "POST",
    headers: cashfreePgHeaders(),
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: params.customerId,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone.replace(/\D/g, "").slice(-10) || "9999999999",
      },
      order_meta: {
        return_url: returnUrl,
      },
      order_note: params.orderNote || "WorthKart order",
    }),
    cache: "no-store",
  });

  const data = (await res.json()) as CashfreePgOrderResponse & {
    message?: string;
  };

  if (!res.ok || !data.payment_session_id) {
    throw new Error(data.message || "Failed to create Cashfree payment session");
  }

  return data;
}

export async function fetchCashfreePgOrder(
  orderId: string
): Promise<CashfreePgOrderDetails | null> {
  if (!isCashfreePgConfigured()) return null;

  const res = await fetch(`${cashfreePgBaseUrl()}/pg/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: cashfreePgHeaders(),
    cache: "no-store",
  });

  if (!res.ok) return null;
  return (await res.json()) as CashfreePgOrderDetails;
}

export type CashfreeRefundResult = {
  refund_id: string;
  cf_refund_id?: string;
  refund_status?: string;
  refund_amount?: number;
  status?: string;
  message?: string;
};

/** Create refund against Cashfree order_id (our orderNumber). */
export async function createCashfreeOrderRefund(params: {
  orderId: string;
  refundId: string;
  amount: number;
  note?: string;
}): Promise<CashfreeRefundResult> {
  const configError = getCashfreePgConfigError();
  if (configError) throw new Error(configError);

  const refundAmount = Math.round(params.amount * 100) / 100;
  const res = await fetch(
    `${cashfreePgBaseUrl()}/pg/orders/${encodeURIComponent(params.orderId)}/refunds`,
    {
      method: "POST",
      headers: cashfreePgHeaders(),
      body: JSON.stringify({
        refund_amount: refundAmount,
        refund_id: params.refundId,
        refund_note: params.note || "Order cancelled — WorthKart refund",
        refund_speed: "STANDARD",
      }),
      cache: "no-store",
    }
  );

  const data = (await res.json()) as CashfreeRefundResult;
  if (!res.ok) {
    throw new Error(data.message || "Cashfree refund failed");
  }
  return data;
}
