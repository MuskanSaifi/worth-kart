"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { OrderTrackingProgress } from "@/components/orders/OrderTrackingProgress";
import { OrderTrackingTimeline } from "@/components/orders/OrderTrackingTimeline";
import { PushNotificationToggle } from "@/components/orders/PushNotificationToggle";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { notify } from "@/lib/notify";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shipping: number;
  createdAt: string;
  estimatedDeliveryAt?: string | null;
  deliveredAt?: string | null;
  cancelReason?: string | null;
  deliveryOtpPending?: boolean;
  refundId?: string | null;
  refundStatus?: string | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
  refundEtaCopy?: string | null;
  address: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    awbCode?: string | null;
    courierName?: string | null;
    trackingUrl?: string | null;
    product: { name: string; images: { url: string }[] };
    returnRequests?: { status: string }[];
  }[];
  events?: {
    id: string;
    title: string;
    message?: string | null;
    status?: string | null;
    source: string;
    createdAt: string;
  }[];
}

interface Actions {
  canCancel: boolean;
  canReturn: boolean;
  canReorder: boolean;
  canDownloadInvoice: boolean;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [actions, setActions] = useState<Actions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [msg, setMsg] = useState("");
  const confirm = useConfirm();

  async function load() {
    const r = await fetch(`/api/orders/${id}`);
    const d = await r.json();
    if (d.error) setError(d.error);
    else {
      setOrder(d.order);
      setActions(d.actions);
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  async function cancelOrder() {
    const ok = await confirm(
      order.paymentMethod !== "COD" && order.paymentStatus === "PAID"
        ? "Cancel this order? Refund will go to your original payment method (UPI 1–3 days, card/netbanking 3–5 days)."
        : "Cancel this order?",
      {
        title: "Cancel order",
        confirmLabel: "Cancel order",
        destructive: true,
      }
    );
    if (!ok) return;
    setBusy("cancel");
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", reason: "Cancelled by customer" }),
    });
    const d = await res.json();
    setBusy("");
    if (!res.ok) {
      const err = d.error || "Cancel failed";
      setMsg(err);
      notify.error(err);
    } else {
      const okMsg =
        d.refundMessage ||
        (d.refund?.refunded
          ? "Order cancelled. Refund initiated to your original payment method."
          : "Order cancelled.");
      setMsg(okMsg);
      notify.success(okMsg);
      await load();
    }
  }

  async function submitReturn() {
    setBusy("return");
    const res = await fetch(`/api/orders/${id}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: returnReason }),
    });
    const d = await res.json();
    setBusy("");
    if (!res.ok) setMsg(d.error || "Return failed");
    else {
      setMsg("Return request submitted.");
      setShowReturn(false);
      await load();
    }
  }

  async function reorder() {
    setBusy("reorder");
    const res = await fetch(`/api/orders/${id}/reorder`, { method: "POST" });
    const d = await res.json();
    setBusy("");
    if (!res.ok) setMsg(d.error || "Reorder failed");
    else router.push(d.redirect || "/cart");
  }

  async function confirmDelivery() {
    setBusy("otp");
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm_delivery", otp: deliveryOtp }),
    });
    const d = await res.json();
    setBusy("");
    if (!res.ok) setMsg(d.error || "OTP verification failed");
    else {
      setMsg("Delivery confirmed.");
      await load();
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-muted">Loading...</div>;
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Package size={64} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-bold mb-2">Order not found</h1>
        <Link href="/orders" className="text-primary font-semibold">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-[#007185] font-medium mb-4 hover:underline"
      >
        <ArrowLeft size={16} />
        See all orders
      </Link>

      {msg && (
        <p className="mb-3 text-sm bg-blue-50 text-blue-800 border border-blue-100 rounded-lg px-3 py-2">
          {msg}
        </p>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs text-muted">{order.orderNumber}</p>
              <p className="text-xs text-muted mt-0.5">Placed on {orderDate}</p>
              {order.estimatedDeliveryAt && order.status !== "DELIVERED" && (
                <p className="text-xs font-medium text-[#007185] mt-1">
                  Estimated delivery:{" "}
                  {new Date(order.estimatedDeliveryAt).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {order.items[0]?.product.images[0] && (
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-16 h-16 bg-gray-50 rounded flex-shrink-0">
                <Image
                  src={order.items[0].product.images[0].url}
                  alt=""
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {order.items.length === 1
                    ? order.items[0].product.name
                    : `${order.items.length} items`}
                </p>
              </div>
            </div>
          )}

          <OrderTrackingProgress
            status={order.status}
            estimatedDeliveryAt={order.estimatedDeliveryAt}
          />

          {order.items.some((i) => i.awbCode) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Delivery partner
              </p>
              {order.items
                .filter((i) => i.awbCode)
                .map((item) => (
                  <div key={item.id} className="text-sm">
                    <p className="font-medium text-gray-900">
                      {item.courierName || "Courier"} · AWB {item.awbCode}
                    </p>
                    {item.trackingUrl && !item.trackingUrl.endsWith("/orders") && (
                      <a
                        href={item.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#007185] font-medium hover:underline"
                      >
                        Track on partner site
                      </a>
                    )}
                  </div>
                ))}
            </div>
          )}

          {order.events && order.events.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Live timeline
              </p>
              <OrderTrackingTimeline events={order.events} />
            </div>
          )}

          {(order.paymentStatus === "REFUNDED" || order.refundId) && (
            <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
              <p className="font-semibold">
                {order.refundStatus === "SUCCESS"
                  ? "Refund completed"
                  : order.refundStatus === "FAILED"
                    ? "Refund needs attention"
                    : "Refund initiated"}
              </p>
              {order.refundAmount != null && (
                <p className="text-sm font-semibold mt-1">
                  Amount: {formatPrice(order.refundAmount)}
                </p>
              )}
              <p className="text-xs mt-2 text-emerald-800/90">
                Online payment cancel/return ke baad refund original payment method pe jata hai:
              </p>
              <ul className="mt-1.5 text-xs text-emerald-900 space-y-1 list-disc pl-4">
                <li>Debit / Credit Card — usually 3–5 business days</li>
                <li>Net Banking — usually 3–5 business days</li>
                <li>UPI — usually 1–3 business days</li>
              </ul>
              <p className="text-[11px] mt-2 text-amber-800 font-medium">
                Important: WorthKart refund initiate ke baad bank/UPI provider ko credit mein extra
                time lag sakta hai.
              </p>
            </div>
          )}

          {order.deliveryOtpPending && (
            <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                Confirm delivery with OTP
              </p>
              <p className="text-xs text-amber-800 mb-2">
                Enter the OTP sent to your phone/email when the delivery partner arrives.
              </p>
              <div className="flex gap-2">
                <input
                  value={deliveryOtp}
                  onChange={(e) => setDeliveryOtp(e.target.value)}
                  maxLength={4}
                  placeholder="4-digit OTP"
                  className="border rounded-lg px-3 py-2 text-sm w-32"
                />
                <button
                  type="button"
                  disabled={busy === "otp" || deliveryOtp.length < 4}
                  onClick={() => void confirmDelivery()}
                  className="px-3 py-2 bg-[#007185] text-white text-sm rounded-lg disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-b border-border flex flex-wrap gap-2">
          {actions?.canDownloadInvoice && (
            <a
              href={`/api/orders/${order.id}/invoice`}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Download size={15} /> Tax Invoice (PDF)
            </a>
          )}
          {actions?.canReorder && (
            <button
              type="button"
              disabled={busy === "reorder"}
              onClick={() => void reorder()}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={15} /> Reorder
            </button>
          )}
          {actions?.canCancel && (
            <button
              type="button"
              disabled={busy === "cancel"}
              onClick={() => void cancelOrder()}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle size={15} /> Cancel order
            </button>
          )}
          {actions?.canReturn && (
            <button
              type="button"
              onClick={() => setShowReturn((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RotateCcw size={15} /> Request return
            </button>
          )}
        </div>

        {showReturn && (
          <div className="px-4 sm:px-5 pb-4 border-b border-border">
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={3}
              placeholder="Why are you returning this order?"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy === "return" || returnReason.trim().length < 5}
              onClick={() => void submitReturn()}
              className="mt-2 px-4 py-2 bg-primary text-white text-sm rounded-lg disabled:opacity-50"
            >
              Submit return request
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-sm font-semibold mb-3">Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-50 rounded flex-shrink-0 relative">
                  {item.product.images[0] && (
                    <Image
                      src={item.product.images[0].url}
                      alt=""
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-muted">Qty: {item.quantity}</p>
                  {item.awbCode && (
                    <p className="text-xs text-muted mt-0.5">
                      AWB {item.awbCode}
                      {item.courierName ? ` · ${item.courierName}` : ""}
                    </p>
                  )}
                  {item.returnRequests?.[0] && (
                    <p className="text-xs text-amber-700 mt-0.5">
                      Return: {item.returnRequests[0].status}
                    </p>
                  )}
                </div>
                <p className="text-sm font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <MapPin size={15} />
            Delivery address
          </h2>
          <p className="text-sm font-medium">{order.address.name}</p>
          <p className="text-sm text-muted mt-0.5">
            {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ""}
          </p>
          <p className="text-sm text-muted">
            {order.address.city}, {order.address.state} - {order.address.pincode}
          </p>
          <p className="text-sm text-muted mt-0.5">{order.address.phone}</p>
        </div>

        <div className="p-4 sm:p-5">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <p className="text-xs text-muted pt-1">
              {order.paymentMethod === "COD" ? "Cash on Delivery" : "Paid online"} ·{" "}
              {order.paymentStatus}
            </p>
            {order.cancelReason && (
              <p className="text-xs text-red-600 pt-1">Cancel reason: {order.cancelReason}</p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <PushNotificationToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
