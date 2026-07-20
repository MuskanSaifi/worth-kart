import type { OrderStatus } from "@/lib/order-status";

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

function getAppBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export type ShiprocketMode = "mock" | "live";

export type ShipmentResult = {
  awbCode: string;
  courierName: string;
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
  trackingUrl: string;
  labelUrl: string;
  mode: ShiprocketMode;
};

export type CreateShipmentInput = {
  orderItemId: string;
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shipping: number;
  total: number;
  quantity: number;
  price: number;
  productName: string;
  productSku?: string | null;
  productWeightKg?: number | null;
  address: {
    name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  seller: {
    businessName: string;
    pickupAddress: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    phone?: string | null;
    email?: string | null;
  };
};

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isShiprocketLiveConfigured(): boolean {
  return !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

export function getShiprocketMode(): ShiprocketMode {
  const mode = (process.env.SHIPROCKET_MODE || "").toLowerCase();
  if (mode === "live" || mode === "production") {
    if (!isShiprocketLiveConfigured()) {
      throw new Error(
        "SHIPROCKET_MODE=live but SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD are missing"
      );
    }
    return "live";
  }
  // Explicit mock, or credentials missing → mock (safe for localhost)
  return "mock";
}

function mockAwbCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `AWB${n}`;
}

function buildMockShipment(input: CreateShipmentInput): ShipmentResult {
  const awbCode = mockAwbCode();
  const shipmentId = `MOCK-SHIP-${input.orderItemId.slice(-8).toUpperCase()}`;
  const orderId = `MOCK-ORD-${input.orderNumber}`;
  const labelUrl = `${getAppBaseUrl()}/api/seller/labels/${input.orderItemId}`;

  return {
    awbCode,
    courierName: "WorthKart Mock Express",
    shiprocketOrderId: orderId,
    shiprocketShipmentId: shipmentId,
    trackingUrl: `${getAppBaseUrl()}/orders`,
    labelUrl,
    mode: "mock",
  };
}

async function getShiprocketToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error("Shiprocket credentials not configured");
  }

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as { token?: string; message?: string };
  if (!res.ok || !data.token) {
    throw new Error(data.message || "Shiprocket login failed");
  }

  // Token valid ~10 days; refresh a day early
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
  };
  return data.token;
}

async function shiprocketFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getShiprocketToken();
  const res = await fetch(`${SHIPROCKET_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const data = (await res.json()) as T & { message?: string; status_code?: number };
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message || `Shiprocket ${path} failed (${res.status})`
    );
  }
  return data;
}

function paymentMethodForShiprocket(method: string, paymentStatus: string): string {
  if (method === "COD" && paymentStatus !== "PAID") return "COD";
  return "Prepaid";
}

async function createLiveShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
  const weight = Math.max(0.5, input.productWeightKg || 0.5);

  const orderPayload = {
    order_id: `${input.orderNumber}-${input.orderItemId.slice(-6)}`,
    order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
    pickup_location: input.seller.businessName.slice(0, 36) || "Primary",
    billing_customer_name: input.address.name,
    billing_last_name: "",
    billing_address: input.address.line1,
    billing_address_2: input.address.line2 || "",
    billing_city: input.address.city,
    billing_pincode: input.address.pincode,
    billing_state: input.address.state,
    billing_country: "India",
    billing_email: input.seller.email || "orders@worthkart.com",
    billing_phone: input.address.phone,
    shipping_is_billing: true,
    order_items: [
      {
        name: input.productName,
        sku: input.productSku || input.orderItemId.slice(-8),
        units: input.quantity,
        selling_price: input.price,
      },
    ],
    payment_method: paymentMethodForShiprocket(input.paymentMethod, input.paymentStatus),
    sub_total: input.price * input.quantity,
    length: 10,
    breadth: 10,
    height: 5,
    weight,
  };

  const created = await shiprocketFetch<{
    order_id?: number | string;
    shipment_id?: number | string;
    status?: string;
    status_code?: number;
    message?: string;
  }>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });

  const shiprocketOrderId = String(created.order_id || "");
  const shiprocketShipmentId = String(created.shipment_id || "");
  if (!shiprocketShipmentId) {
    throw new Error(created.message || "Shiprocket did not return shipment_id");
  }

  const awbRes = await shiprocketFetch<{
    awb_assign_status?: number;
    response?: {
      data?: {
        awb_code?: string;
        courier_name?: string;
        courier_company_id?: number;
      };
    };
    message?: string;
  }>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({
      shipment_id: Number(shiprocketShipmentId) || shiprocketShipmentId,
    }),
  });

  const awbData = awbRes.response?.data;
  const awbCode = awbData?.awb_code || "";
  if (!awbCode) {
    throw new Error(awbRes.message || "Shiprocket AWB assignment failed");
  }

  const courierName = awbData?.courier_name || "Shiprocket";
  const labelUrl = `${getAppBaseUrl()}/api/seller/labels/${input.orderItemId}`;

  return {
    awbCode,
    courierName,
    shiprocketOrderId,
    shiprocketShipmentId,
    trackingUrl: `https://shiprocket.co/tracking/${awbCode}`,
    labelUrl,
    mode: "live",
  };
}

/** Create shipment + AWB (mock by default; live when SHIPROCKET_MODE=live). */
export async function createShipmentForOrderItem(
  input: CreateShipmentInput
): Promise<ShipmentResult> {
  const mode = getShiprocketMode();
  if (mode === "mock") {
    return buildMockShipment(input);
  }
  return createLiveShipment(input);
}

/**
 * Map Shiprocket / courier webhook status strings to our OrderStatus.
 * Returns null when the event should be ignored.
 */
export function mapShiprocketStatusToOrderStatus(
  rawStatus: string
): OrderStatus | null {
  const s = rawStatus.trim().toLowerCase().replace(/[_-]+/g, " ");

  if (
    s.includes("delivered") ||
    s === "rto delivered" ||
    s.includes("delivery completed")
  ) {
    return "DELIVERED";
  }

  if (
    s.includes("out for delivery") ||
    s.includes("ofd") ||
    s.includes("out_for_delivery")
  ) {
    return "OUT_FOR_DELIVERY";
  }

  if (
    s.includes("shipped") ||
    s.includes("in transit") ||
    s.includes("picked up") ||
    s.includes("pickup completed")
  ) {
    return "SHIPPED";
  }

  if (s.includes("packed") || s.includes("label generated") || s.includes("awb assigned")) {
    return "PACKED";
  }

  if (s.includes("cancelled") || s.includes("canceled")) {
    return "CANCELLED";
  }

  return null;
}

const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PACKED: 2,
  SHIPPED: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
  RETURNED: -1,
};

/** Only allow forward moves (never regress). */
export function canAdvanceOrderStatus(
  current: string,
  next: OrderStatus
): boolean {
  const curRank = STATUS_RANK[current as OrderStatus];
  const nextRank = STATUS_RANK[next];
  if (curRank === undefined || nextRank === undefined) return false;
  if (curRank < 0 || nextRank < 0) return next === "CANCELLED";
  return nextRank > curRank;
}
