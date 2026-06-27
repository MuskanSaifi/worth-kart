"use client";

import { useState } from "react";
import { AlertTriangle, Mail, RefreshCw, Smartphone } from "lucide-react";
import { MAX_GST_FAILED_ATTEMPTS, SUPPORT_EMAIL } from "@/lib/seller-gst-constants";

interface GstOtpVerifyPanelProps {
  gstNumber: string | null;
  gstVerified: boolean;
  gstFailedAttempts: number;
  status: string;
}

export function GstOtpVerifyPanel({
  gstNumber,
  gstVerified,
  gstFailedAttempts,
  status,
}: GstOtpVerifyPanelProps) {
  const [gstin, setGstin] = useState(gstNumber || "");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"gst" | "otp">("gst");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [legalName, setLegalName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(gstVerified);
  const [attempts, setAttempts] = useState(gstFailedAttempts);
  const [blocked, setBlocked] = useState(status === "BLOCKED");
  const [devOtp, setDevOtp] = useState("");

  const attemptsLeft = Math.max(0, MAX_GST_FAILED_ATTEMPTS - attempts);

  const sendOtp = async () => {
    if (gstin.length !== 15) {
      setError("GSTIN must be 15 characters");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/seller/gst-otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gstin }),
    });
    const data = await res.json();
    if (res.ok) {
      setStep("otp");
      setMaskedPhone(data.maskedPhone);
      setLegalName(data.legalName || "");
      setMessage(data.message);
      if (data.devOtp) setDevOtp(data.devOtp);
    } else {
      setError(data.error);
      if (data.attempts !== undefined) setAttempts(data.attempts);
      if (data.blocked) setBlocked(true);
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/seller/gst-otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gstin, otp }),
    });
    const data = await res.json();
    if (data.verified) {
      setVerified(true);
      setMessage(data.message);
      window.location.reload();
    } else {
      setError(data.error);
      if (data.attempts !== undefined) setAttempts(data.attempts);
      if (data.blocked) setBlocked(true);
    }
    setLoading(false);
  };

  if (verified) return null;
  if (blocked) return <SellerBlockedPanel attempts={attempts} />;

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-2">
        <Smartphone size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm text-yellow-900">GST OTP Verification Required</p>
          <p className="text-xs text-yellow-700 mt-1">
            OTP will be sent to the mobile number linked with your GST.
            Attempts left: <strong>{attemptsLeft}</strong>
          </p>

          {step === "gst" ? (
            <div className="flex gap-2 mt-3">
              <input
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="15-digit GSTIN"
                maxLength={15}
                className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg text-sm font-mono uppercase bg-white"
              />
              <button
                onClick={sendOtp}
                disabled={loading || gstin.length !== 15}
                className="px-4 py-2 bg-[#5c59e8] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-600">
                OTP sent to <strong>{maskedPhone}</strong>
                {legalName && <> · {legalName}</>}
              </p>
              {devOtp && (
                <p className="text-xs bg-blue-50 text-blue-800 p-2 rounded">Dev OTP: <strong>{devOtp}</strong></p>
              )}
              <div className="flex gap-2">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Enter 4-digit OTP"
                  maxLength={4}
                  className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-white tracking-widest"
                />
                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 4}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? "..." : "Verify OTP"}
                </button>
              </div>
              <button onClick={() => setStep("gst")} className="text-xs text-[#5c59e8] hover:underline">
                ← Change GSTIN / Resend OTP
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          {message && !error && <p className="text-xs text-green-700 mt-2">{message}</p>}
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
    const res = await fetch("/api/seller/activation-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (res.ok) setSubmitted(true);
    else setError(data.error);
    setLoading(false);
  };

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="font-semibold text-sm text-red-800 flex items-center gap-2">
        <AlertTriangle size={18} /> Account Blocked
      </p>
      <p className="text-xs text-red-700 mt-1">
        Blocked after {attempts || MAX_GST_FAILED_ATTEMPTS} failed verification attempts. Products hidden.
      </p>
      <p className="text-xs mt-2">
        Email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#5c59e8] font-semibold"><Mail size={12} className="inline" /> {SUPPORT_EMAIL}</a> or submit request:
      </p>
      {!submitted ? (
        <div className="mt-2">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Request account reactivation..." />
          <button onClick={submitRequest} disabled={loading || message.length < 20} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            Submit Request
          </button>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      ) : (
        <p className="text-xs text-green-700 mt-2">✓ Request submitted.</p>
      )}
    </div>
  );
}
