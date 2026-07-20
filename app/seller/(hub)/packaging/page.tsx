"use client";

import { useState, useEffect } from "react";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { Barcode, Download, CheckCircle, Loader2 } from "lucide-react";

type PackItem = {
  id: string;
  quantity: number;
  labelDownloaded: boolean;
  awbCode?: string | null;
  courierName?: string | null;
  labelUrl?: string | null;
  product: { name: string };
  order: {
    orderNumber: string;
    status: string;
    address: { name: string; line1: string; city: string; pincode: string };
  };
};

export default function SellerPackagingPage() {
  const [orders, setOrders] = useState<PackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/seller/orders?status=CONFIRMED").then((r) => r.json()),
      fetch("/api/seller/orders?status=PACKED").then((r) => r.json()),
    ])
      .then(([a, b]) => {
        if (cancelled) return;
        const map = new Map<string, PackItem>();
        for (const o of [...(a.orders || []), ...(b.orders || [])] as PackItem[]) {
          map.set(o.id, o);
        }
        setOrders([...map.values()]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
              }
            : o
        )
      );
      if (data.labelUrl) window.open(data.labelUrl, "_blank");
    } finally {
      setBusyId(null);
    }
  };

  const downloadAll = () => {
    orders.filter((o) => !o.labelDownloaded).forEach((o) => downloadLabel(o.id));
  };

  return (
    <div>
      <SellerPageHeader
        title="Barcoded Packaging"
        description="Download shipping labels for your orders"
        action={
          orders.some((o) => !o.labelDownloaded) ? (
            <button
              type="button"
              onClick={downloadAll}
              className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <Download size={16} /> Download All Labels
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#5c59e8]" />
        </div>
      ) : orders.length === 0 ? (
        <SellerCard>
          <div className="text-center py-12">
            <Barcode size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No labels to download</p>
          </div>
        </SellerCard>
      ) : (
        <div className="space-y-3">
          {orders.map((item) => (
            <SellerCard key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.order.orderNumber} · Qty: {item.quantity} · {item.order.status}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ship to: {item.order.address.name}, {item.order.address.line1},{" "}
                    {item.order.address.city} - {item.order.address.pincode}
                  </p>
                  {item.awbCode && (
                    <p className="text-xs font-medium text-gray-700 mt-1">
                      AWB: {item.awbCode}
                      {item.courierName ? ` · ${item.courierName}` : ""}
                    </p>
                  )}
                </div>
                {item.labelDownloaded && item.awbCode ? (
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => downloadLabel(item.id)}
                    className="flex items-center gap-1 text-green-600 text-sm font-medium"
                  >
                    <CheckCircle size={16} /> Downloaded
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => downloadLabel(item.id)}
                    className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                  >
                    <Barcode size={16} />
                    {busyId === item.id ? "Generating…" : "Download Label"}
                  </button>
                )}
              </div>
            </SellerCard>
          ))}
        </div>
      )}
    </div>
  );
}
