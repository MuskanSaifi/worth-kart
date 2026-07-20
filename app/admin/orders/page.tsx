"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatPrice } from "@/lib/utils";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentStatus: string;
  createdAt: string;
  estimatedDeliveryAt?: string | null;
  user: { name: string | null; email: string };
  items: { product: { name: string }; quantity: number }[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to load");
    else {
      setOrders(data.orders || []);
      setCounts(data.counts || {});
    }
    setLoading(false);
  }, [status, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(orderId: string, next: string) {
    setBusyId(orderId);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: next }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      alert(data.error || "Update failed");
      return;
    }
    void load();
  }

  return (
    <AdminShell title="Orders" description="Monitor and update marketplace order statuses.">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setStatus("")}
          className={`text-xs px-3 py-1.5 rounded-full border ${!status ? "bg-primary text-white border-primary" : "bg-white"}`}
        >
          All ({Object.values(counts).reduce((a, b) => a + b, 0)})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full border ${status === s ? "bg-primary text-white border-primary" : "bg-white"}`}
          >
            {s.replaceAll("_", " ")} ({counts[s] || 0})
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search order # or email"
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          Search
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border border-border rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {o.user.name || o.user.email} · {new Date(o.createdAt).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {o.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ").slice(0, 120)}
                  </p>
                  {o.estimatedDeliveryAt && (
                    <p className="text-xs text-[#007185] mt-1">
                      EDD:{" "}
                      {new Date(o.estimatedDeliveryAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatPrice(o.total)}</p>
                  <p className="text-xs text-muted">{o.paymentStatus}</p>
                  <p className="text-xs font-semibold mt-1">{o.status.replaceAll("_", " ")}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  className="text-xs border rounded-lg px-2 py-1.5"
                  defaultValue=""
                  disabled={busyId === o.id}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) void updateStatus(o.id, v);
                    e.target.value = "";
                  }}
                >
                  <option value="">Update status…</option>
                  {STATUSES.filter((s) => s !== o.status).map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-sm text-muted">No orders found.</p>}
        </div>
      )}
    </AdminShell>
  );
}
