"use client";

import { useState } from "react";
import { OTP_DIGITS } from "@/lib/two-factor";

interface OtpModalProps {
  type: "email" | "phone";
  target: string;
  devOtp?: string;
  onClose: () => void;
  onVerified: () => void;
  onError: (msg: string) => void;
}

export function OtpModal({ type, target, devOtp, onClose, onVerified, onError }: OtpModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (code.length !== OTP_DIGITS) return;
    setLoading(true);
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, target, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      onError(data.error || "Invalid OTP");
      return;
    }
    onVerified();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
        <h3 className="text-lg font-semibold mb-1">
          Verify {type === "email" ? "Email" : "Mobile"}
        </h3>
        <p className="text-sm text-muted mb-1">
          Enter 4-digit OTP sent to <strong>{target}</strong>
        </p>
        <p className="text-xs text-muted mb-4">
          {type === "email"
            ? "Real 4-digit OTP sent to your email (2Factor template)"
            : "Real 4-digit OTP via SMS (TWO_FACTOR_OTP_TEMPLATE)"}
        </p>

        {devOtp && (
          <p className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded mb-3">
            Dev OTP only (2Factor API key missing): <strong>{devOtp}</strong>
          </p>
        )}

        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_DIGITS))}
          maxLength={OTP_DIGITS}
          className="w-full px-4 py-3 border border-border rounded-lg text-center text-2xl tracking-[0.5em] font-mono mb-4"
          placeholder="0000"
          autoFocus
        />

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg">
            Cancel
          </button>
          <button
            type="button"
            onClick={verify}
            disabled={loading || code.length !== OTP_DIGITS}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}
