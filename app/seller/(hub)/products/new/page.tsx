"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { CategoryPicker } from "@/components/seller/CategoryPicker";

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState<"category" | "details">("category");
  const [categoryId, setCategoryId] = useState("");
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", price: "", mrp: "", stock: "", brand: "", images: "",
  });

  const handleCategorySelect = (id: string, crumbs: string[]) => {
    setCategoryId(id);
    setBreadcrumb(crumbs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError("Please select a category first");
      return;
    }
    setError("");
    setLoading(true);
    const images = form.images.split("\n").map((u) => u.trim()).filter(Boolean);
    const res = await fetch("/api/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, description: form.description,
        price: parseFloat(form.price), mrp: parseFloat(form.mrp),
        stock: parseInt(form.stock), categoryId,
        brand: form.brand || undefined, images,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/seller/catalog");
  };

  if (step === "category") {
    return (
      <div>
        <SellerPageHeader title="Add Single Catalog" description="Step 1: Select product category" />
        <CategoryPicker
          selectedId={categoryId}
          onSelect={handleCategorySelect}
          onContinue={() => categoryId && setStep("details")}
        />
        {!categoryId && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            Select the most specific category — e.g. Electronics → Mobiles → Smartphones
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button onClick={() => setStep("category")} className="flex items-center gap-1 text-sm text-[#5c59e8] mb-4 hover:underline">
        <ArrowLeft size={16} /> Change Category
      </button>
      <SellerPageHeader
        title="Add Product Details"
        description={breadcrumb.join(" / ")}
      />
      <SellerCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Product Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c59e8]/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c59e8]/30" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[{ key: "price", label: "Price (₹)" }, { key: "mrp", label: "MRP (₹)" }, { key: "stock", label: "Stock" }].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1">{f.label} *</label>
                <input type="number" value={form[f.key as keyof typeof form]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required min="0" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image URLs (one per line) *</label>
            <textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} required rows={3} placeholder="https://images.unsplash.com/photo-..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg font-mono text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#5c59e8] text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Submit for QC Review"}
          </button>
        </form>
      </SellerCard>
    </div>
  );
}
