"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { OtpModal } from "@/components/otp/OtpModal";

export function EmailVerification({
  initialEmail,
  verified,
}: {
  initialEmail: string;
  verified: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [isVerified, setIsVerified] = useState(verified);
  const [otpOpen, setOtpOpen] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendOtp = async () => {
    setMessage("");
    setLoading(true);
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: email, type: "email" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Could not send OTP");
      return;
    }
    setDevOtp(data.devOtp || "");
    setOtpOpen(true);
  };

  const saveVerifiedEmail = async () => {
    setOtpOpen(false);
    setLoading(true);
    const res = await fetch("/api/account/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Could not save email");
      return;
    }
    setEmail(data.email);
    setIsVerified(true);
    setMessage("Email verified successfully");
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-muted">Email:</span>
        {isVerified && (
          <span className="inline-flex items-center gap-1 text-xs text-green-700">
            <CheckCircle2 size={13} /> Verified
          </span>
        )}
      </div>
      {isVerified ? (
        <span className="font-medium">{email}</span>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage("");
            }}
            placeholder="Add your email address"
            className="min-w-0 flex-1 px-3 py-2 border border-border rounded-lg"
          />
          <button
            type="button"
            onClick={sendOtp}
            disabled={loading || !email}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Verify Email
          </button>
        </div>
      )}
      {message && (
        <p className={`text-xs mt-2 ${isVerified ? "text-green-700" : "text-danger"}`}>
          {message}
        </p>
      )}

      {otpOpen && (
        <OtpModal
          type="email"
          target={email}
          devOtp={devOtp}
          onClose={() => setOtpOpen(false)}
          onVerified={saveVerifiedEmail}
          onError={setMessage}
        />
      )}
    </div>
  );
}
