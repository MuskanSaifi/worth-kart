"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Package, ChevronRight } from "lucide-react";
import { OrderTrackingProgress } from "@/components/orders/OrderTrackingProgress";
import { PushNotificationToggle } from "@/components/orders/PushNotificationToggle";
import { getTrackingHeadline } from "@/lib/order-status";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  estimatedDeliveryAt?: string | null;
  items: { quantity: number; price: number; product: { name: string; images: { url: string }[] } }[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PACKED: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-muted">Loading...</div>;

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Package size={64} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">No orders yet</h1>
        <Link href="/products" className="text-primary font-semibold">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl font-bold">My Orders</h1>
        <PushNotificationToggle />
      </div>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block bg-card rounded-lg border border-border p-4 hover:border-[#007185]/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">{order.orderNumber}</p>
                <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100"}`}>
                  {getTrackingHeadline(order.status, order.estimatedDeliveryAt)}
                </span>
                <ChevronRight size={16} className="text-muted" />
              </div>
            </div>

            {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
              <div className="mb-4">
                <OrderTrackingProgress
                  status={order.status}
                  estimatedDeliveryAt={order.estimatedDeliveryAt}
                  showHeadline={false}
                />
              </div>
            )}

            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-t border-border first:border-0">
                <div className="w-14 h-14 bg-gray-50 rounded flex-shrink-0 relative">
                  {item.product.images[0] && (
                    <Image src={item.product.images[0].url} alt="" width={56} height={56} className="object-contain" unoptimized />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-muted">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
              <span className="text-sm text-muted">Total</span>
              <span className="font-bold">{formatPrice(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
