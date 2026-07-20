"use client";

import { useState, useCallback } from "react";
import { Loader2, Pencil, CheckCircle2, Building2 } from "lucide-react";

interface BankDetailsFormProps {
  initialAccount?: string | null;
  initialIfsc?: string | null;
  initialVerified?: boolean;
  initialHolderName?: string | null;
  initialBankName?: string | null;
  businessName?: string;
}

interface IfscInfo {
  bank: string;
  branch: string;
  city: string;
  state: string;
}

export function BankDetailsForm({
  initialAccount,
  initialIfsc,
  initialVerified = false,
  initialHolderName,
  initialBankName,
  businessName,
}: BankDetailsFormProps) {
  const hasBank = !!(initialAccount && initialIfsc && initialVerified);
  const [editing, setEditing] = useState(!hasBank);
  const [loading, setLoading] = useState(false);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ifscInfo, setIfscInfo] = useState<IfscInfo | null>(
    initialBankName ? { bank: initialBankName, branch: "", city: "", state: "" } : null
  );
  const [saved, setSaved] = useState({
    account: initialAccount || "",
    ifsc: initialIfsc || "",
    verified: initialVerified,
    holderName: initialHolderName || "",
    bankName: initialBankName || "",
  });
  const [form, setForm] = useState({
    bankAccount: "",
    confirmBankAccount: "",
    bankIfsc: initialIfsc || "",
    accountHolderName: initialHolderName || businessName || "",
  });

  const lookupIfsc = useCallback(async (code: string) => {
    if (code.length !== 11) {
      setIfscInfo(null);
      return;
    }
    setIfscLoading(true);
    const res = await fetch(`/api/seller/bank-details/ifsc?ifsc=${code}`);
    const data = await res.json();
    setIfscLoading(false);
    if (res.ok && data.ifsc) {
      setIfscInfo({
        bank: data.ifsc.bank,
        branch: data.ifsc.branch,
        city: data.ifsc.city,
        state: data.ifsc.state,
      });
    } else {
      setIfscInfo(null);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/seller/bank-details", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Bank verification failed");
      return;
    }

    setSaved({
      account: data.bankAccount,
      ifsc: data.bankIfsc,
      verified: true,
      holderName: data.bankAccountHolderName || form.accountHolderName,
      bankName: data.bankName || ifscInfo?.bank || "",
    });
    setForm({
      bankAccount: "",
      confirmBankAccount: "",
      bankIfsc: data.bankIfsc,
      accountHolderName: data.bankAccountHolderName || form.accountHolderName,
    });
    setEditing(false);
    setSuccess("Bank account verified & saved");
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-gray-800">Bank Account</p>
        {saved.verified && !editing && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={12} /> Verified
          </span>
        )}
        {hasBank && !editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setSuccess("");
              setForm((f) => ({
                ...f,
                bankIfsc: saved.ifsc,
                accountHolderName: saved.holderName || businessName || "",
              }));
            }}
            className="text-xs text-[#5c59e8] font-semibold flex items-center gap-1 hover:underline"
          >
            <Pencil size={12} /> Edit
          </button>
        )}
      </div>

      {!editing && saved.account && saved.verified ? (
        <div className="mt-3 text-sm space-y-1">
          {saved.bankName && (
            <p className="flex items-center gap-1 text-gray-700">
              <Building2 size={14} className="text-gray-400" />
              {saved.bankName}
            </p>
          )}
          <p>
            <span className="text-gray-400">Holder:</span> {saved.holderName}
          </p>
          <p>
            <span className="text-gray-400">Account:</span> ****{saved.account.slice(-4)}
          </p>
          <p>
            <span className="text-gray-400">IFSC:</span> {saved.ifsc}
          </p>
          {success && <p className="text-xs text-green-600 mt-2">{success}</p>}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2">
            Account number + IFSC are verified live with the bank (Cashfree). Name must match your business/GST name.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Account Holder Name * <span className="text-gray-400">(as per bank)</span>
            </label>
            <input
              value={form.accountHolderName}
              onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
              required
              placeholder={businessName || "Name on bank account"}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c59e8]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code *</label>
            <input
              value={form.bankIfsc}
              onChange={(e) => {
                const code = e.target.value.toUpperCase().slice(0, 11);
                setForm({ ...form, bankIfsc: code });
                if (code.length === 11) lookupIfsc(code);
                else setIfscInfo(null);
              }}
              required
              placeholder="e.g. SBIN0001234"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#5c59e8]/30"
            />
            {ifscLoading && <p className="text-xs text-gray-400 mt-1">Looking up IFSC...</p>}
            {ifscInfo && (
              <p className="text-xs text-green-700 mt-1 bg-green-50 rounded p-2">
                ✓ {ifscInfo.bank} — {ifscInfo.branch}, {ifscInfo.city}, {ifscInfo.state}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Bank Account Number *
            </label>
            <input
              value={form.bankAccount}
              onChange={(e) =>
                setForm({ ...form, bankAccount: e.target.value.replace(/\D/g, "") })
              }
              required
              inputMode="numeric"
              maxLength={18}
              placeholder="Enter account number"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c59e8]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Confirm Account Number *
            </label>
            <input
              value={form.confirmBankAccount}
              onChange={(e) =>
                setForm({ ...form, confirmBankAccount: e.target.value.replace(/\D/g, "") })
              }
              required
              inputMode="numeric"
              maxLength={18}
              placeholder="Re-enter account number"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c59e8]/30"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}

          <button
            type="submit"
            disabled={loading || ifscLoading}
            className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Verify & Save Bank Details
          </button>
        </form>
      )}
    </div>
  );
}
