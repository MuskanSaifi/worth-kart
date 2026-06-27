"use client";

import { useState, useEffect } from "react";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { Barcode, Download, CheckCircle } from "lucide-react";

export default function SellerPackagingPage() {
  const [orders, setOrders] = useState<Array<{
    id: string; quantity: number; labelDownloaded: boolean;
    product: { name: string };
    order: { orderNumber: string; status: string; address: { name: string; line1: string; city: string; pincode: string } };
  }>>([]);

  useEffect(() => {
    fetch("/api/seller/orders?status=CONFIRMED")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }, []);

  const downloadLabel = async (orderItemId: string) => {
    await fetch("/api/seller/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderItemId, action: "download_label" }),
    });
    setOrders((prev) => prev.map((o) => (o.id === orderItemId ? { ...o, labelDownloaded: true } : o)));
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
            <button onClick={downloadAll} className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
              <Download size={16} /> Download All Labels
            </button>
          ) : undefined
        }
      />

      {orders.length === 0 ? (
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{item.order.orderNumber} · Qty: {item.quantity}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ship to: {item.order.address.name}, {item.order.address.line1}, {item.order.address.city} - {item.order.address.pincode}
                  </p>
                </div>
                {item.labelDownloaded ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle size={16} /> Downloaded
                  </span>
                ) : (
                  <button
                    onClick={() => downloadLabel(item.id)}
                    className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <Barcode size={16} /> Download Label
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
