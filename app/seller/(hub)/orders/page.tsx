"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { formatPrice } from "@/lib/utils";
import { Loader2, Package } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  labelDownloaded: boolean;
  product: { name: string; images: { url: string }[] };
  order: {
    orderNumber: string;
    status: string;
    createdAt: string;
    address: { name: string; city: string; pincode: string };
    user: { name: string | null };
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PACKED: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

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
  const status = searchParams.get("status") || "";

  useEffect(() => {
    const params = status ? `?status=${status}` : "";
    fetch(`/api/seller/orders${params}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, [status]);

  const updateStatus = async (orderItemId: string, newStatus: string) => {
    await fetch("/api/seller/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderItemId, action: "update_status", status: newStatus }),
    });
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderItemId ? { ...o, order: { ...o.order, status: newStatus } } : o
      )
    );
  };

  return (
    <div>
      <SellerPageHeader
        title="Orders"
        description="Manage and fulfill customer orders"
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "pending", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"].map((s) => (
          <a
            key={s}
            href={s ? `/seller/orders?status=${s}` : "/seller/orders"}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              (status === s || (!status && !s))
                ? "bg-[#5c59e8] text-white border-[#5c59e8]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#5c59e8]"
            }`}
          >
            {s === "" ? "All" : s === "pending" ? "Pending" : s.charAt(0) + s.slice(1).toLowerCase()}
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
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[item.order.status] || "bg-gray-100"}`}>
                      {item.order.status}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {item.order.status === "CONFIRMED" && (
                      <button onClick={() => updateStatus(item.id, "PACKED")} className="text-xs bg-[#5c59e8] text-white px-3 py-1.5 rounded-lg font-medium">
                        Mark Packed
                      </button>
                    )}
                    {item.order.status === "PACKED" && (
                      <button onClick={() => updateStatus(item.id, "SHIPPED")} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium">
                        Mark Shipped
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
