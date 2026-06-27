"use client";

import { useState, useEffect } from "react";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { AlertCircle, Plus } from "lucide-react";

export default function SellerClaimsPage() {
  const [claims, setClaims] = useState<Array<{ id: string; title: string; description: string; status: string; createdAt: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  useEffect(() => {
    fetch("/api/seller/extras").then((r) => r.json()).then((d) => setClaims(d.claims || []));
  }, []);

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/seller/extras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "claim", ...form }),
    });
    const data = await res.json();
    if (res.ok) {
      setClaims([data.claim, ...claims]);
      setForm({ title: "", description: "" });
      setShowForm(false);
    }
  };

  const statusColor: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    IN_REVIEW: "bg-yellow-100 text-yellow-700",
    RESOLVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <SellerPageHeader
        title="Claims"
        description="File and track claims for lost or damaged shipments"
        action={
          <button onClick={() => setShowForm(!showForm)} className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> New Claim
          </button>
        }
      />

      {showForm && (
        <SellerCard className="mb-4">
          <form onSubmit={submitClaim} className="space-y-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Claim title" required className="w-full px-3 py-2 border rounded-lg text-sm" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue..." required rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="flex gap-2">
              <button type="submit" className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold">Submit Claim</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </SellerCard>
      )}

      {claims.length === 0 ? (
        <SellerCard>
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No claims filed</p>
          </div>
        </SellerCard>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <SellerCard key={c.id}>
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full h-fit ${statusColor[c.status]}`}>{c.status.replace("_", " ")}</span>
              </div>
            </SellerCard>
          ))}
        </div>
      )}
    </div>
  );
}
