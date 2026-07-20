"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { formatPrice } from "@/lib/utils";
import { Download, Loader2, Package } from "lucide-react";
import {
  SELLER_STATUS_ACTION,
  canSellerAdvanceStatus,
  getNextSellerStatus,
  getTrackingHeadline,
} from "@/lib/order-status";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  labelDownloaded: boolean;
  awbCode?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  shiprocketShipmentId?: string | null;
  product: { name: string; images: { url: string }[] };
  order: {
    orderNumber: string;
    status: string;
    createdAt: string;
    estimatedDeliveryAt?: string | null;
    address: { name: string; city: string; pincode: string };
    user: { name: string | null };
  };
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

function isMockShipment(item: OrderItem) {
  return !!item.shiprocketShipmentId?.startsWith("MOCK-");
}

export default function SellerOrdersPage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const status = searchParams.get("status") || "";

  useEffect(() => {
    const params = status ? `?status=${status}` : "";
    fetch(`/api/seller/orders${params}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, [status]);

  const updateStatus = async (orderItemId: string, newStatus: string) => {
    setBusyId(orderItemId);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId, action: "update_status", status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update status");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderItemId
            ? {
                ...o,
                awbCode: data.awbCode ?? o.awbCode,
                courierName: data.courierName ?? o.courierName,
                trackingUrl: data.trackingUrl ?? o.trackingUrl,
                labelUrl: data.labelUrl ?? o.labelUrl,
                shiprocketShipmentId: data.shiprocketShipmentId ?? o.shiprocketShipmentId,
                order: { ...o.order, status: newStatus },
              }
            : o
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  /** Localhost only — mimics delivery boy OTP → Shiprocket webhook → Delivered */
  const simulateCourierDelivered = async (orderItemId: string) => {
    setBusyId(orderItemId);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId, action: "simulate_courier_delivered" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Simulation failed");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderItemId ? { ...o, order: { ...o.order, status: "DELIVERED" } } : o
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  const downloadLabel = async (orderItemId: string) => {
    setBusyId(orderItemId);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId, action: "download_label" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to download label");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderItemId
            ? {
                ...o,
                labelDownloaded: true,
                awbCode: data.awbCode ?? o.awbCode,
                courierName: data.courierName ?? o.courierName,
                labelUrl: data.labelUrl ?? o.labelUrl,
                shiprocketShipmentId: data.shiprocketShipmentId ?? o.shiprocketShipmentId,
              }
            : o
        )
      );
      if (data.labelUrl) {
        window.open(data.labelUrl, "_blank");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <SellerPageHeader
        title="Orders"
        description="Manage and fulfill customer orders"
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "pending", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].map((s) => (
          <a
            key={s}
            href={s ? `/seller/orders?status=${s}` : "/seller/orders"}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              (status === s || (!status && !s))
                ? "bg-[#5c59e8] text-white border-[#5c59e8]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#5c59e8]"
            }`}
          >
            {s === "" ? "All" : s === "pending" ? "Pending" : s === "OUT_FOR_DELIVERY" ? "Out for delivery" : s.charAt(0) + s.slice(1).toLowerCase()}
          </a>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#5c59e8]" /></div>
      ) : orders.length === 0 ? (
        <SellerCard>
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        </SellerCard>
      ) : (
        <div className="space-y-3">
          {orders.map((item) => (
            <SellerCard key={item.id}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0 relative">
                  {item.product.images[0] && (
                    <Image src={item.product.images[0].url} alt="" fill className="object-contain p-1" unoptimized />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800">{item.product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.order.orderNumber} · Qty: {item.quantity} · {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.order.user.name} · {item.order.address.city} - {item.order.address.pincode}
                      </p>
                      {item.awbCode && (
                        <p className="text-xs text-gray-700 mt-1.5 font-medium">
                          AWB: {item.awbCode}
                          {item.courierName ? ` · ${item.courierName}` : ""}
                        </p>
                      )}
                      {item.order.estimatedDeliveryAt && (
                        <p className="text-xs text-[#5c59e8] mt-1 font-medium">
                          EDD:{" "}
                          {new Date(item.order.estimatedDeliveryAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      {item.order.status === "OUT_FOR_DELIVERY" && (
                        <p className="text-xs text-orange-700 mt-1.5">
                          Waiting for delivery OTP — customer or courier confirms delivery
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[item.order.status] || "bg-gray-100"}`}>
                      {getTrackingHeadline(item.order.status, item.order.estimatedDeliveryAt)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {canSellerAdvanceStatus(item.order.status) && (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => {
                          const next = getNextSellerStatus(item.order.status);
                          if (next) updateStatus(item.id, next);
                        }}
                        className="text-xs bg-[#5c59e8] text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-60"
                      >
                        {busyId === item.id
                          ? "Updating…"
                          : SELLER_STATUS_ACTION[item.order.status as keyof typeof SELLER_STATUS_ACTION]}
                      </button>
                    )}
                    {item.order.status === "OUT_FOR_DELIVERY" && isMockShipment(item) && (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => simulateCourierDelivered(item.id)}
                        className="text-xs border border-dashed border-orange-400 text-orange-800 bg-orange-50 px-3 py-1.5 rounded-lg font-medium disabled:opacity-60"
                        title="Localhost only — simulates delivery boy OTP then Shiprocket webhook"
                      >
                        {busyId === item.id ? "Simulating…" : "Test: courier OTP delivered"}
                      </button>
                    )}
                    {(item.awbCode || item.order.status === "CONFIRMED" || item.order.status === "PACKED") && (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => downloadLabel(item.id)}
                        className="text-xs border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1 hover:border-[#5c59e8] disabled:opacity-60"
                      >
                        <Download size={12} />
                        {item.labelDownloaded ? "Label again" : "Download label"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </SellerCard>
          ))}
        </div>
      )}
    </div>
  );
}
