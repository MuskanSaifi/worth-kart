"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Upload, ImageIcon, HelpCircle, ExternalLink, Trash2 } from "lucide-react";
import { SellerPageHeader } from "@/components/seller/SellerPageHeader";

interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  catalogFileId: string | null;
  qcStatus: string;
  createdAt: string;
  images: { url: string }[];
  category: { name: string };
}

const QC_TABS = [
  { key: "all", label: "All" },
  { key: "ACTION_REQUIRED", label: "Action Required" },
  { key: "QC_IN_PROGRESS", label: "QC in Progress" },
  { key: "QC_ERROR", label: "QC Error" },
  { key: "QC_PASS", label: "QC Pass" },
  { key: "DRAFT", label: "Draft" },
];

const qcColors: Record<string, string> = {
  QC_PASS: "bg-green-100 text-green-700",
  QC_IN_PROGRESS: "bg-blue-100 text-blue-700",
  QC_ERROR: "bg-red-100 text-red-700",
  ACTION_REQUIRED: "bg-orange-100 text-orange-700",
  DRAFT: "bg-gray-100 text-gray-600",
};

function CatalogContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("status") || "all";
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [stats, setStats] = useState({ total: 0, single: 0, bulk: 0, qcPass: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Images will be removed from Cloudinary.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    setDeletingId(null);
    if (!res.ok) {
      alert(data.error || "Delete failed");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    fetch(`/api/seller/catalog?status=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setStats(d.stats || {});
      });
  }, [tab]);

  return (
    <div>
      <SellerPageHeader
        title="Upload Catalog"
        description="Manage your product catalog uploads"
        action={
          <div className="flex gap-2">
            <button className="border-2 border-[#5c59e8] text-[#5c59e8] px-4 py-2 rounded-lg text-sm font-semibold opacity-60 cursor-not-allowed">
              Add Catalog in Bulk
            </button>
            <Link href="/seller/products/new" className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
              <Upload size={16} /> Add Single Catalog
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <a href="#" className="text-[#5c59e8] flex items-center gap-1 hover:underline">
          <ExternalLink size={14} /> Learn how to upload catalogs
        </a>
        <Link href="/seller/support" className="text-[#5c59e8] flex items-center gap-1 hover:underline">
          <HelpCircle size={14} /> Need Help?
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Uploads Done", value: stats.total },
          { label: "Using Bulk Uploads", value: stats.bulk },
          { label: "Using Single Uploads", value: stats.single },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 px-4 pt-3">
        <div className="flex gap-6 border-b border-gray-100 overflow-x-auto">
          <span className="pb-3 text-sm font-semibold text-[#5c59e8] border-b-2 border-[#5c59e8]">Single Uploads</span>
          <span className="pb-3 text-sm text-gray-400">Bulk Uploads (Soon)</span>
        </div>
        <div className="flex gap-1 py-3 overflow-x-auto">
          {QC_TABS.map((t) => (
            <Link
              key={t.key}
              href={t.key === "all" ? "/seller/catalog" : `/seller/catalog?status=${t.key}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                tab === t.key ? "bg-[#5c59e8] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Alert */}
      <div className="bg-yellow-50 border border-yellow-200 border-t-0 px-4 py-3 text-xs text-yellow-800">
        QC (Quality-Check) error products can now be fixed as they appear. Try to fix QC errors faster to speed up your catalog creation process.
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="p-3 text-left">S.no</th>
              <th className="p-3 text-left">Catalog Image</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">File Id</th>
              <th className="p-3 text-left">Created Date</th>
              <th className="p-3 text-left">Products</th>
              <th className="p-3 text-left">QC Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">
                  <div className="w-12 h-12 bg-gray-100 rounded relative">
                    {p.images[0] && (
                      <Image src={p.images[0].url} alt="" fill className="object-contain p-0.5" unoptimized />
                    )}
                  </div>
                </td>
                <td className="p-3 font-medium">{p.category.name}</td>
                <td className="p-3 text-xs text-gray-500 font-mono">{p.catalogFileId || p.id.slice(0, 12)}</td>
                <td className="p-3 text-xs text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                  {" | "}
                  {new Date(p.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="p-3">1</td>
                <td className="p-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${qcColors[p.qcStatus] || "bg-gray-100"}`}>
                    {p.qcStatus.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/products/${p.slug}`} className="text-[#5c59e8] text-xs font-semibold hover:underline">
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteProduct(p.id, p.name)}
                      disabled={deletingId === p.id}
                      className="text-red-600 text-xs font-semibold hover:underline disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      {deletingId === p.id ? "..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ImageIcon size={40} className="mx-auto mb-2 opacity-40" />
            <p>No catalog uploads yet</p>
            <Link href="/seller/products/new" className="text-[#5c59e8] text-sm font-semibold mt-2 inline-block">
              Add Single Catalog →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Loading...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
