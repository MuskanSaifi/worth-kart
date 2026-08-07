"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Smartphone } from "lucide-react";
import { OtpModal } from "@/components/otp/OtpModal";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpModal, setOtpModal] = useState<{
    type: "email" | "phone";
    target: string;
  } | null>(null);
  const [devOtp, setDevOtp] = useState("");

  const completeSignIn = async () => {
    setLoading(true);
    const result = await signIn("credentials", {
      phone,
      accountType: "buyer",
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError("OTP expired or login failed. Please try again.");
      setOtpModal(null);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login-otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, accountType: "buyer" }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not send OTP");
      return;
    }

    setDevOtp(data.devOtp || "");
    setOtpModal({ type: data.type, target: data.target });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-sm text-muted mt-1">
              Login securely using your mobile number and OTP
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Smartphone
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  required
                  pattern="[6-9][0-9]{9}"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Sending OTP...
                </>
              ) : (
                "Get OTP"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            New to WorthKart?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            Same mobile works for shopping. Sellers can also open Seller Hub separately.
          </p>
          <div className="mt-2 text-center text-sm">
            <Link href="/seller/login" className="text-primary font-semibold hover:underline">
              Seller Login →
            </Link>
          </div>
        </div>
      </div>

      {otpModal && (
        <OtpModal
          type={otpModal.type}
          target={otpModal.target}
          devOtp={devOtp}
          onClose={() => setOtpModal(null)}
          onVerified={completeSignIn}
          onError={setError}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
