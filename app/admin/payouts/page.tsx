"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatPrice } from "@/lib/utils";
import { notify } from "@/lib/notify";

type SellerRow = {
  sellerId: string;
  businessName: string;
  bankVerified: boolean;
  count: number;
  amount: number;
};

type SettlementItem = {
  id: string;
  sellerId: string;
  businessName: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  netAmount: number;
  availableAt: string;
};

type Payload = {
  totalPending: number;
  pendingCount: number;
  bySeller: SellerRow[];
  items: SettlementItem[];
};

export default function AdminPayoutsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markPaid(body: Record<string, unknown>, key: string) {
    if (
      !window.confirm(
        "Confirm bank transfer already done? This will mark settlements as Paid Out."
      )
    ) {
      return;
    }
    setBusy(key);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      notify.success(
        json.payoutBatchId
          ? `Marked ${json.marked} settlement(s) paid (batch ${json.payoutBatchId})`
          : `Marked ${json.marked} settlement(s) paid`
      );
      await load();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <AdminShell
      title="Seller Payouts"
      description="After delivery, seller share waits here. Mark Paid after Wednesday bank transfer."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted font-semibold">Pending total</p>
          <p className="text-2xl font-bold mt-1">
            {formatPrice(data?.totalPending || 0)}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-muted font-semibold">Pending lines</p>
          <p className="text-2xl font-bold mt-1">{data?.pendingCount || 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 flex items-end">
          <button
            type="button"
            disabled={!!busy || !data?.pendingCount}
            onClick={() => markPaid({ markAllPending: true }, "all")}
            className="w-full rounded-lg bg-primary text-white text-sm font-semibold py-2.5 disabled:opacity-50"
          >
            {busy === "all" ? "Marking…" : "Mark all pending as Paid"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 mb-6">
        <h2 className="font-semibold mb-3">By seller</h2>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (data?.bySeller || []).length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">No pending payouts</p>
        ) : (
          <div className="space-y-2">
            {data!.bySeller.map((s) => (
              <div
                key={s.sellerId}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-gray-50"
              >
                <div>
                  <p className="font-medium text-sm">{s.businessName}</p>
                  <p className="text-xs text-muted">
                    {s.count} order line(s) ·{" "}
                    {s.bankVerified ? "Bank verified" : "Bank not verified"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-sm">{formatPrice(s.amount)}</p>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() =>
                      markPaid({ sellerId: s.sellerId }, s.sellerId)
                    }
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white disabled:opacity-50"
                  >
                    {busy === s.sellerId ? "…" : "Mark paid"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-3">Pending settlement lines</h2>
        <div className="space-y-2">
          {(data?.items || []).map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border text-sm"
            >
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-muted">
                  {item.businessName} · {item.orderNumber} · Qty {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">{formatPrice(item.netAmount)}</p>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() =>
                    markPaid({ settlementIds: [item.id] }, item.id)
                  }
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary text-primary disabled:opacity-50"
                >
                  {busy === item.id ? "…" : "Paid"}
                </button>
              </div>
            </div>
          ))}
          {!loading && (!data?.items || data.items.length === 0) && (
            <p className="text-center text-muted py-8 text-sm">
              Nothing pending — settlements appear after orders are delivered
            </p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
