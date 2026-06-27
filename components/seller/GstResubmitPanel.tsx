"use client";

import { useState } from "react";
import { AlertTriangle, Mail, RefreshCw } from "lucide-react";
import { MAX_GST_FAILED_ATTEMPTS, SUPPORT_EMAIL } from "@/lib/seller-gst-constants";

interface GstResubmitPanelProps {
  gstNumber: string | null;
  gstVerified: boolean;
  gstFailedAttempts: number;
  status: string;
  panNumber: string | null;
}

export function GstResubmitPanel({
  gstNumber,
  gstVerified,
  gstFailedAttempts,
  status,
}: GstResubmitPanelProps) {
  const [gstin, setGstin] = useState(gstNumber || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(gstVerified);
  const [attempts, setAttempts] = useState(gstFailedAttempts);
  const [blocked, setBlocked] = useState(status === "BLOCKED");

  const attemptsLeft = Math.max(0, MAX_GST_FAILED_ATTEMPTS - attempts);

  const handleSubmit = async () => {
    if (gstin.length !== 15) {
      setError("GSTIN must be 15 characters");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/seller/resubmit-gst", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gstin }),
    });
    const data = await res.json();

    if (data.verified) {
      setVerified(true);
      setMessage(data.message || "GST verified!");
      setAttempts(0);
    } else {
      setError(data.error || data.message);
      if (data.attempts !== undefined) setAttempts(data.attempts);
      if (data.blocked) {
        setBlocked(true);
        setMessage(data.message);
      }
    }
    setLoading(false);
  };

  if (verified) return null;

  if (blocked) {
    return <SellerBlockedPanel attempts={attempts} />;
  }

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm text-yellow-900">GST Unverified — Re-submit Required</p>
          <p className="text-xs text-yellow-700 mt-1">
            Verify your GST to continue selling. Wrong attempts remaining:{" "}
            <strong>{attemptsLeft} of {MAX_GST_FAILED_ATTEMPTS}</strong>
            {attempts > 0 && ` (${attempts} failed so far)`}
          </p>

          <div className="flex gap-2 mt-3">
            <input
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="15-digit GSTIN"
              maxLength={15}
              className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg text-sm font-mono uppercase bg-white"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || gstin.length !== 15}
              className="px-4 py-2 bg-[#5c59e8] text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Verifying..." : "Verify GST"}
            </button>
          </div>

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          {message && !error && <p className="text-xs text-green-700 mt-2">{message}</p>}

          <p className="text-xs text-yellow-600 mt-2">
            After {MAX_GST_FAILED_ATTEMPTS} failed attempts your account will be blocked and products hidden from the website.
            PAN on your profile will be updated automatically from the verified GSTIN.
          </p>
        </div>
      </div>
    </div>
  );
}

function SellerBlockedPanel({ attempts }: { attempts: number }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submitRequest = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/seller/activation-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmitted(true);
    } else {
      setError(data.error);
    }
    setLoading(false);
  };

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="font-semibold text-sm text-red-800 flex items-center gap-2">
        <AlertTriangle size={18} /> Account Blocked
      </p>
      <p className="text-xs text-red-700 mt-1">
        Your account was blocked after {attempts || MAX_GST_FAILED_ATTEMPTS} failed GST verification attempts.
        Your products are hidden from the website.
      </p>

      <div className="mt-3 p-3 bg-white rounded-lg border border-red-100">
        <p className="text-sm font-medium text-gray-800">To reactivate your account:</p>
        <ol className="text-xs text-gray-600 mt-2 space-y-1 list-decimal list-inside">
          <li>Submit an activation request below, or</li>
          <li>
            Email us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#5c59e8] font-semibold inline-flex items-center gap-1">
              <Mail size={12} /> {SUPPORT_EMAIL}
            </a>
          </li>
        </ol>
      </div>

      {!submitted ? (
        <div className="mt-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain why your GST failed and request account reactivation..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <button
            onClick={submitRequest}
            disabled={loading || message.length < 20}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Activation Request to Admin"}
          </button>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      ) : (
        <p className="text-xs text-green-700 mt-3 font-medium">
          ✓ Activation request submitted. Admin will review within 24-48 hours.
        </p>
      )}
    </div>
  );
}
