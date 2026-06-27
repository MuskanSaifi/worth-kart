"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronRight, FolderTree } from "lucide-react";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  keywords: string | null;
  parentId: string | null;
  isActive: boolean;
  parent?: { name: string } | null;
  _count: { children: number; products: number };
}

interface CategoryRequest {
  id: string;
  name: string;
  productExample: string | null;
  status: string;
  seller: { businessName: string };
  parentCategory?: { name: string } | null;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [form, setForm] = useState({ name: "", parentId: "", keywords: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
    fetch("/api/admin/category-requests").then((r) => r.json()).then((d) => setRequests(d.requests || []));
  };

  useEffect(() => { load(); }, []);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        parentId: form.parentId || null,
        keywords: form.keywords || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setForm({ name: "", parentId: "", keywords: "" });
      setMsg(`Added: ${data.category.name}`);
      load();
    } else {
      setMsg(data.error);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    setMsg(res.ok ? "Deleted" : data.error);
    load();
  };

  const approveRequest = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/admin/category-requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const roots = categories.filter((c) => !c.parentId);

  function renderTree(parentId: string | null, depth = 0): React.ReactNode {
    return categories
      .filter((c) => c.parentId === parentId)
      .map((c) => (
        <div key={c.id}>
          <div className="flex items-center gap-2 py-2 border-b border-gray-100" style={{ paddingLeft: depth * 20 }}>
            {c._count.children > 0 && <ChevronRight size={14} className="text-gray-400" />}
            <span className={`text-sm flex-1 ${!c.isActive ? "text-gray-400 line-through" : "font-medium"}`}>
              {c.name}
            </span>
            <span className="text-xs text-gray-400">{c._count.products} products</span>
            <button onClick={() => toggleActive(c.id, c.isActive)} className="text-xs text-blue-600">
              {c.isActive ? "Disable" : "Enable"}
            </button>
            <button onClick={() => deleteCat(c.id)} className="text-red-500 p-1"><Trash2 size={14} /></button>
          </div>
          {renderTree(c.id, depth + 1)}
        </div>
      ));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-primary hover:underline">← Admin</Link>
          <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
            <FolderTree size={24} /> Category Management
          </h1>
          <p className="text-sm text-muted">{categories.length} categories · Unlimited nesting supported</p>
        </div>
      </div>

      {msg && <div className="bg-green-50 text-green-800 text-sm p-3 rounded-lg">{msg}</div>}

      {/* Add category */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus size={18} /> Add New Category</h2>
        <form onSubmit={addCategory} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Category name *"
            required
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <select
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Root (top-level)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            placeholder="Search keywords (comma separated)"
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <button type="submit" className="bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark">
            Add Category
          </button>
        </form>
        <p className="text-xs text-muted mt-2">
          Example: Parent = Electronics → Name = Tablets → Keywords = ipad, tab, slate
        </p>
      </div>

      {/* Seller requests */}
      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Seller Category Requests ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-muted">
                    {r.seller.businessName} · {r.productExample}
                    {r.parentCategory && ` · under ${r.parentCategory.name}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveRequest(r.id, "approve")} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">Approve</button>
                  <button onClick={() => approveRequest(r.id, "reject")} className="bg-red-500 text-white px-3 py-1 rounded text-xs">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tree view */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold mb-4">Category Tree ({roots.length} root categories)</h2>
        <div className="max-h-[500px] overflow-y-auto">
          {renderTree(null)}
        </div>
      </div>
    </div>
  );
}
