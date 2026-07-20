"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccountSetupSteps, getSetupProgress } from "@/lib/seller";
import { SellerProductsDropdown } from "@/components/admin/SellerProductsDropdown";

type SellerRow = {
  id: string;
  businessName: string;
  businessType: string | null;
  status: string;
  gstNumber: string | null;
  gstVerified: boolean;
  gstLegalName: string | null;
  panNumber: string | null;
  panVerified: boolean;
  bankAccount: string | null;
  bankIfsc: string | null;
  bankVerified: boolean;
  bankAccountHolderName: string | null;
  bankName: string | null;
  pickupAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  createdAt: Date;
  user: { email: string; phone: string | null; name: string | null };
  _count: { products: number };
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    BLOCKED: "bg-red-100 text-red-800",
    REJECTED: "bg-gray-100 text-gray-700",
    SUSPENDED: "bg-orange-100 text-orange-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function VerifyTag({ label, verified }: { label: string; verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        verified ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
      }`}
    >
      {verified ? "✓" : "✗"} {label}
    </span>
  );
}

function maskAccount(account: string) {
  if (account.length <= 4) return account;
  return "••••" + account.slice(-4);
}

export function AdminSellerList({ sellers }: { sellers: SellerRow[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  if (sellers.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <h2 className="font-semibold mb-2">Sellers</h2>
        <p className="text-sm text-muted">No sellers registered yet.</p>
      </div>
    );
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSellers = useMemo(() => {
    if (!normalizedQuery) return sellers;

    return sellers.filter((s) => {
      const haystack = [
        s.businessName,
        s.user.email,
        s.user.phone,
        s.gstNumber,
        s.panNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, sellers]);

  const pendingCount = filteredSellers.filter((s) => s.status === "PENDING").length;
  const totalPages = Math.max(1, Math.ceil(filteredSellers.length / pageSize));
  const paginatedSellers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSellers.slice(start, start + pageSize);
  }, [filteredSellers, page]);

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">
            Sellers
            {pendingCount > 0 && (
              <span className="ml-2 text-xs font-normal text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <p className="text-xs text-muted mt-1">GST + PAN verified → auto-approved</p>
        </div>

        <div className="w-full md:w-[360px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by mobile, email, GST, PAN"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <p className="text-[11px] text-muted mt-1">
            Matching fields: mobile number, email, GST, PAN
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <p>
          Showing {filteredSellers.length === 0 ? 0 : (page - 1) * pageSize + 1}-
          {Math.min(page * pageSize, filteredSellers.length)} of {filteredSellers.length} sellers
        </p>
        <p>5 per page</p>
      </div>

      <div className="max-h-[75vh] overflow-y-auto pr-1 space-y-4">
        {filteredSellers.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            No sellers matched your search.
          </div>
        )}

        {paginatedSellers.map((s) => {
          const steps = getAccountSetupSteps(s);
          const progress = getSetupProgress(steps);
          const readyForAuto = s.gstVerified && s.panVerified && s.status === "PENDING";

          return (
            <div key={s.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-base">{s.businessName}</p>
                    <StatusBadge status={s.status} />
                    {readyForAuto && (
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                        Ready to auto-approve
                      </span>
                    )}
                  </div>
                  {s.gstLegalName && s.gstLegalName !== s.businessName && (
                    <p className="text-xs text-muted mt-0.5">Legal: {s.gstLegalName}</p>
                  )}
                  <p className="text-xs text-muted mt-1">
                    {s.user.email}
                    {s.user.phone ? ` · ${s.user.phone}` : ""}
                    {s.city ? ` · ${s.city}, ${s.state}` : ""}
                  </p>
                </div>

                {s.status === "PENDING" && (
                  <form action={`/api/admin/sellers/${s.id}/approve`} method="POST">
                    <button
                      type="submit"
                      className="bg-success text-white px-3 py-1.5 rounded text-sm font-semibold hover:opacity-90"
                    >
                      Approve manually
                    </button>
                  </form>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <VerifyTag label="GST" verified={s.gstVerified} />
                <VerifyTag label="PAN" verified={s.panVerified} />
                <VerifyTag label="Bank" verified={s.bankVerified} />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted">Profile completion</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progress === 100 ? "bg-green-500" : progress >= 60 ? "bg-blue-500" : "bg-yellow-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {steps.map((step) => (
                    <span
                      key={step.id}
                      className={`text-xs ${step.done ? "text-green-600" : "text-muted"}`}
                    >
                      {step.done ? "✓" : "○"} {step.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted border-t border-border pt-3">
                {s.businessType && <p><span className="font-medium text-foreground">Business type:</span> {s.businessType}</p>}
                {s.gstNumber && (
                  <p><span className="font-medium text-foreground">GST:</span> {s.gstNumber}</p>
                )}
                {s.panNumber && (
                  <p><span className="font-medium text-foreground">PAN:</span> {s.panNumber}</p>
                )}
                {s.bankAccount && (
                  <p>
                    <span className="font-medium text-foreground">Bank:</span>{" "}
                    {maskAccount(s.bankAccount)} · {s.bankIfsc}
                    {s.bankName ? ` · ${s.bankName}` : ""}
                  </p>
                )}
                {s.bankAccountHolderName && (
                  <p><span className="font-medium text-foreground">Account holder:</span> {s.bankAccountHolderName}</p>
                )}
                {s.pickupAddress && (
                  <p className="sm:col-span-2">
                    <span className="font-medium text-foreground">Pickup:</span> {s.pickupAddress}
                    {s.pincode ? `, ${s.pincode}` : ""}
                  </p>
                )}
                <p>
                  <span className="font-medium text-foreground">Joined:</span>{" "}
                  {new Date(s.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <SellerProductsDropdown sellerId={s.id} productCount={s._count.products} />
            </div>
          );
        })}
      </div>

      {filteredSellers.length > 0 && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNo) => (
                <button
                  key={pageNo}
                  type="button"
                  onClick={() => setPage(pageNo)}
                  className={`h-8 min-w-8 rounded-md px-2 text-sm ${
                    pageNo === page
                      ? "bg-primary text-white"
                      : "border border-border hover:bg-gray-50"
                  }`}
                >
                  {pageNo}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
