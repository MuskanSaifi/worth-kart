"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Loader2, Package, ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ProductStep {
  id: string;
  label: string;
  done: boolean;
}

interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  qcStatus: string;
  category: string;
  createdAt: string;
  completion: number;
  steps: ProductStep[];
}

export function SellerProductsDropdown({
  sellerId,
  productCount,
}: {
  sellerId: string;
  productCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SellerProduct[] | null>(null);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    if (products !== null) {
      setOpen((v) => !v);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/products`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load products");
        return;
      }
      setProducts(data.products || []);
      setOpen(true);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
    } else {
      loadProducts();
    }
  };

  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center justify-between w-full text-sm font-medium text-primary hover:underline"
      >
        <span className="flex items-center gap-2">
          <Package size={16} />
          Products ({productCount})
        </span>
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : open ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
      </button>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {open && products && (
        <div className="mt-3 space-y-2">
          {products.length === 0 ? (
            <p className="text-xs text-muted bg-gray-50 rounded-lg p-3">No products listed yet.</p>
          ) : (
            products.map((p) => (
              <div key={p.id} className="bg-gray-50 border border-border rounded-lg p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-[11px] text-muted">
                      {p.category} · {formatPrice(p.price)}
                      {p.stock === 0 && <span className="text-red-600 ml-1">· Out of stock</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        p.qcStatus === "QC_PASS"
                          ? "bg-green-100 text-green-700"
                          : p.qcStatus === "QC_FAIL"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.qcStatus.replace("QC_", "")}
                    </span>
                    <Link
                      href={`/products/${p.slug}`}
                      target="_blank"
                      className="text-primary hover:underline"
                      title="View product"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted">Profile completion</span>
                    <span className="font-semibold">{p.completion}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p.completion === 100
                          ? "bg-green-500"
                          : p.completion >= 60
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                      }`}
                      style={{ width: `${p.completion}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
                    {p.steps.map((step) => (
                      <span
                        key={step.id}
                        className={`text-[10px] ${step.done ? "text-green-600" : "text-muted"}`}
                      >
                        {step.done ? "✓" : "○"} {step.label}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-muted">
                  Created:{" "}
                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {p.isActive ? (
                    <span className="ml-2 text-green-600 font-medium">· Live</span>
                  ) : (
                    <span className="ml-2 text-gray-500">· Not live</span>
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
