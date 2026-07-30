"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Mail } from "lucide-react";

interface ActivationRequest {
  id: string;
  message: string;
  createdAt: string;
  seller: {
    businessName: string;
    gstNumber: string | null;
    gstFailedAttempts: number;
    user: { email: string; phone: string | null };
  };
}

interface BlockedSeller {
  id: string;
  businessName: string;
  gstNumber: string | null;
  gstBlockReason: string | null;
  user: { email: string; phone: string | null };
}

export function AdminActivationPanel() {
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [blocked, setBlocked] = useState<BlockedSeller[]>([]);
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch("/api/admin/activation-requests")
      .then((r) => r.json())
      .then((d) => {
        setRequests(d.requests || []);
        setBlocked(d.blockedSellers || []);
      });
  };

  useEffect(() => { load(); }, []);

  const handleRequest = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/admin/activation-requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setMsg(action === "approve" ? "Seller reactivated" : "Request rejected");
    load();
  };

  const unblockDirect = async (sellerId: string) => {
    await fetch(`/api/admin/sellers/${sellerId}/unblock`, { method: "POST" });
    setMsg("Seller unblocked directly");
    load();
  };

  if (requests.length === 0 && blocked.length === 0) return null;

  return (
    <div className="space-y-4">
      {msg && <div className="bg-green-50 text-green-800 text-sm p-3 rounded-lg">{msg}</div>}

      {requests.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500" />
            GST Block — Activation Requests ({requests.length})
          </h2>
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-medium">{r.seller.businessName}</p>
                    <p className="text-xs text-muted">{r.seller.user.email} · GST: {r.seller.gstNumber || "N/A"}</p>
                    <p className="text-sm text-gray-700 mt-2">&quot;{r.message}&quot;</p>
                    <p className="text-xs text-muted mt-1">{r.seller.gstFailedAttempts} failed GST attempts</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => handleRequest(r.id, "approve")} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-semibold">
                      Approve & Unblock
                    </button>
                    <button onClick={() => handleRequest(r.id, "reject")} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {blocked.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="font-semibold mb-4">Blocked Sellers ({blocked.length})</h2>
          <div className="space-y-2">
            {blocked.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{s.businessName}</p>
                  <p className="text-xs text-muted">{s.user.email} · {s.gstBlockReason}</p>
                  <a href={`mailto:${s.user.email}`} className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                    <Mail size={12} /> Contact seller
                  </a>
                </div>
                <button onClick={() => unblockDirect(s.id)} className="bg-primary text-white px-3 py-1.5 rounded text-xs font-semibold">
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        Sellers can also email <strong>support@worthkart.in</strong> for manual activation.
      </p>
    </div>
  );
}
