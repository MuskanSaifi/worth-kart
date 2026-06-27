"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { formatPrice } from "@/lib/utils";
import { Tag, Save } from "lucide-react";

export default function SellerPricingPage() {
  const [products, setProducts] = useState<Array<{
    id: string; name: string; price: number; mrp: number; discount: number;
    images: { url: string }[];
  }>>([]);
  const [editing, setEditing] = useState<Record<string, { price: string; mrp: string }>>({});

  useEffect(() => {
    fetch("/api/seller/inventory").then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, []);

  const savePrice = async (productId: string) => {
    const e = editing[productId];
    if (!e) return;
    await fetch("/api/seller/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, price: parseFloat(e.price), mrp: parseFloat(e.mrp) }),
    });
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, price: parseFloat(e.price), mrp: parseFloat(e.mrp), discount: Math.round(((parseFloat(e.mrp) - parseFloat(e.price)) / parseFloat(e.mrp)) * 100) }
          : p
      )
    );
    setEditing((prev) => { const n = { ...prev }; delete n[productId]; return n; });
  };

  return (
    <div>
      <SellerPageHeader title="Pricing" description="Manage product prices and competitive pricing" />
      <div className="space-y-3">
        {products.map((p) => (
          <SellerCard key={p.id}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-50 rounded relative flex-shrink-0">
                {p.images[0] && <Image src={p.images[0].url} alt="" fill className="object-contain p-1" unoptimized />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Tag size={12} /> {p.discount}% off
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <label className="text-[10px] text-gray-400">MRP</label>
                  <input
                    type="number"
                    defaultValue={p.mrp}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: { ...prev[p.id], price: prev[p.id]?.price || String(p.price), mrp: e.target.value } }))}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Price</label>
                  <input
                    type="number"
                    defaultValue={p.price}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: { ...prev[p.id], mrp: prev[p.id]?.mrp || String(p.mrp), price: e.target.value } }))}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                </div>
                {editing[p.id] && (
                  <button onClick={() => savePrice(p.id)} className="p-2 bg-[#5c59e8] text-white rounded-lg">
                    <Save size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm font-bold hidden md:block">{formatPrice(p.price)}</p>
            </div>
          </SellerCard>
        ))}
      </div>
    </div>
  );
}
