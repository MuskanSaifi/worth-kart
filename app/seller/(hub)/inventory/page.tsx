"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SellerPageHeader, SellerCard, StatBadge } from "@/components/seller/SellerPageHeader";
import { formatPrice } from "@/lib/utils";
import { Boxes, Plus, Save } from "lucide-react";

function InventoryContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "";
  const [products, setProducts] = useState<Array<{
    id: string; name: string; stock: number; price: number; sku: string | null;
    images: { url: string }[]; category: { name: string };
  }>>([]);
  const [stockEdit, setStockEdit] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = filter ? `?filter=${filter}` : "";
    fetch(`/api/seller/inventory${params}`).then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, [filter]);

  const saveStock = async (productId: string) => {
    const stock = parseInt(stockEdit[productId]);
    if (isNaN(stock)) return;
    await fetch("/api/seller/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, stock }),
    });
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock } : p)));
    setStockEdit((prev) => { const n = { ...prev }; delete n[productId]; return n; });
  };

  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;

  return (
    <div>
      <SellerPageHeader
        title="Inventory"
        description="Track and manage your product stock levels"
        action={
          <Link href="/seller/products/new" className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Add Product
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatBadge label="Total SKUs" value={products.length} />
        <StatBadge label="Out of Stock" value={outOfStock} />
        <StatBadge label="Low Stock" value={lowStock} />
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { key: "", label: "All" },
          { key: "out", label: "Out of Stock" },
          { key: "low", label: "Low Stock" },
        ].map((f) => (
          <a
            key={f.key}
            href={f.key ? `/seller/inventory?filter=${f.key}` : "/seller/inventory"}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              filter === f.key ? "bg-[#5c59e8] text-white border-[#5c59e8]" : "bg-white border-gray-200"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Product</th>
              <th className="text-left p-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
              <th className="text-left p-3 font-medium text-gray-600">SKU</th>
              <th className="text-left p-3 font-medium text-gray-600">Price</th>
              <th className="text-left p-3 font-medium text-gray-600">Stock</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-50 rounded relative flex-shrink-0">
                      {p.images[0] && <Image src={p.images[0].url} alt="" fill className="object-contain p-0.5" unoptimized />}
                    </div>
                    <span className="font-medium truncate max-w-[150px]">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-500 hidden md:table-cell">{p.category.name}</td>
                <td className="p-3 text-gray-400 text-xs">{p.sku || "—"}</td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">
                  <span className={`font-semibold ${p.stock === 0 ? "text-red-500" : p.stock < 10 ? "text-orange-500" : "text-green-600"}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder={String(p.stock)}
                      value={stockEdit[p.id] || ""}
                      onChange={(e) => setStockEdit({ ...stockEdit, [p.id]: e.target.value })}
                      className="w-16 px-2 py-1 border rounded text-xs"
                    />
                    {stockEdit[p.id] && (
                      <button onClick={() => saveStock(p.id)} className="p-1 bg-[#5c59e8] text-white rounded">
                        <Save size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Boxes size={40} className="mx-auto mb-2 opacity-50" />
            No products found
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerInventoryPage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Loading...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
