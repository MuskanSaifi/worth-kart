"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const onDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not delete account");
        setDeleting(false);
        return;
      }
      await signOut({ redirect: false });
      router.replace("/?accountDeleted=1");
      router.refresh();
    } catch {
      setError("Could not delete account. Try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-red-200 p-5">
      <h2 className="font-semibold text-red-700 mb-1">Delete account</h2>
      <p className="text-sm text-muted mb-4">
        Permanently deletes your WorthKart account and personal data. Past orders
        stay on file for tax and legal records without your name or phone.
      </p>

      {error ? <p className="text-sm text-danger mb-3">{error}</p> : null}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 border border-red-200 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100"
        >
          <Trash2 size={14} />
          Delete my account
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Confirm permanent deletion
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => setConfirming(false)}
            className="text-sm font-semibold text-muted px-3 py-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
