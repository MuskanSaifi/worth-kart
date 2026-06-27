"use client";

import { useState, useEffect } from "react";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { formatPrice } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

export default function SellerReturnsPage() {
  const [returns, setReturns] = useState<Array<{
    id: string; reason: string; status: string; createdAt: string;
    orderItem: { product: { name: string }; quantity: number; price: number; order: { orderNumber: string } };
  }>>([]);

  useEffect(() => {
    fetch("/api/seller/extras").then((r) => r.json()).then((d) => setReturns(d.returns || []));
  }, []);

  const handleAction = async (returnId: string, status: string) => {
    await fetch("/api/seller/extras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "return_action", returnId, status }),
    });
    setReturns((prev) => prev.map((r) => (r.id === returnId ? { ...r, status } : r)));
  };

  return (
    <div>
      <SellerPageHeader title="Returns" description="Manage return requests from customers" />
      {returns.length === 0 ? (
        <SellerCard>
          <div className="text-center py-12">
            <RotateCcw size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No return requests</p>
            <p className="text-xs text-gray-400 mt-1">Returns will appear here when customers request them</p>
          </div>
        </SellerCard>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <SellerCard key={r.id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{r.orderItem.product.name}</p>
                  <p className="text-xs text-gray-500">{r.orderItem.order.orderNumber} · {formatPrice(r.orderItem.price * r.orderItem.quantity)}</p>
                  <p className="text-sm text-gray-600 mt-2">Reason: {r.reason}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">{r.status}</span>
                  {r.status === "PENDING" && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleAction(r.id, "APPROVED")} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Approve</button>
                      <button onClick={() => handleAction(r.id, "REJECTED")} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            </SellerCard>
          ))}
        </div>
      )}
    </div>
  );
}
