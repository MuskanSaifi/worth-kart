"use client";

import { useState } from "react";
import { CreditCard, Smartphone } from "lucide-react";

interface PanVerifyPanelProps {
  panNumber: string | null;
  panVerified: boolean;
  gstVerified: boolean;
  gstNumber: string | null;
  gstRegisteredMobile: string | null;
}

function gstPanHint(gstNumber: string | null): string {
  if (!gstNumber || gstNumber.length < 12) return "";
  return gstNumber.slice(2, 12);
}

export function PanVerifyPanel({
  panNumber,
  panVerified,
  gstVerified,
  gstNumber,
}: PanVerifyPanelProps) {
  const [pan, setPan] = useState(panNumber || "");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"pan" | "otp">("pan");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(panVerified);
  const [devOtp, setDevOtp] = useState("");

  if (!gstVerified || verified) return null;

  const sendOtp = async () => {
    if (pan.length !== 10) {
      setError("PAN must be 10 characters");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/seller/pan-otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pan, phone: phone || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      setStep("otp");
      setMaskedPhone(data.maskedPhone);
      setMessage(data.message);
      if (data.devOtp) setDevOtp(data.devOtp);
    } else {
      setError(data.error);
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/seller/pan-otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pan, otp }),
    });
    const data = await res.json();
    if (data.verified) {
      setVerified(true);
      setMessage(data.message);
      window.location.reload();
    } else {
      setError(data.error);
    }
    setLoading(false);
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <CreditCard size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm text-blue-900">PAN Card Verification</p>
          <p className="text-xs text-blue-700 mt-1">
            PAN must match your GSTIN. Expected PAN: <strong>{gstPanHint(gstNumber) || "—"}</strong>. OTP goes to GST-linked mobile.
          </p>

          {step === "pan" ? (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm font-mono uppercase bg-white"
                />
                <button
                  onClick={sendOtp}
                  disabled={loading || pan.length !== 10}
                  className="px-4 py-2 bg-[#5c59e8] text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1"
                >
                  <Smartphone size={14} />
                  {loading ? "..." : "Send OTP"}
                </button>
              </div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="GST-linked mobile (10 digits) — optional if account phone set"
                maxLength={10}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
              />
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-600">OTP sent to <strong>{maskedPhone}</strong></p>
              {devOtp && <p className="text-xs bg-blue-100 p-2 rounded">Dev OTP: <strong>{devOtp}</strong></p>}
              <div className="flex gap-2">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="4-digit OTP"
                  maxLength={4}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm tracking-widest"
                />
                <button onClick={verifyOtp} disabled={loading || otp.length !== 4} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  Verify PAN
                </button>
              </div>
              <button onClick={() => setStep("pan")} className="text-xs text-[#5c59e8] hover:underline">← Change PAN</button>
            </div>
          )}

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          {message && !error && <p className="text-xs text-green-700 mt-2">{message}</p>}
        </div>
      </div>
    </div>
  );
}
