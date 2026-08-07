"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Store } from "lucide-react";
import { OtpModal } from "@/components/otp/OtpModal";

function SellerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/seller";
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [registerUrl, setRegisterUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<{ type: "email" | "phone"; target: string } | null>(null);
  const [devOtp, setDevOtp] = useState("");

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRegisterUrl("");
    setLoading(true);
    const cleaned = phone.replace(/\D/g, "").slice(-10);
    const res = await fetch("/api/auth/login-otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: cleaned, accountType: "seller" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Seller login failed");
      if (data.registerUrl) setRegisterUrl(data.registerUrl);
      return;
    }
    setDevOtp(data.devOtp || "");
    setOtp({ type: data.type, target: data.target });
  };

  const completeSignIn = async () => {
    setLoading(true);
    const cleaned = phone.replace(/\D/g, "").slice(-10);
    const result = await signIn("credentials", {
      phone: cleaned,
      accountType: "seller",
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("OTP expired or login failed. Please try again.");
      setOtp(null);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border p-8">
        <div className="text-center mb-8">
          <Store size={36} className="mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-bold">Seller Login</h1>
          <p className="text-sm text-muted mt-1">Login with your registered mobile number</p>
        </div>

        <form onSubmit={sendOtp} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">
              <p>{error}</p>
              {registerUrl ? (
                <p className="mt-2">
                  <Link href={registerUrl} className="font-semibold text-primary underline underline-offset-2">
                    Register as Seller →
                  </Link>
                </p>
              ) : null}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Mobile Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              maxLength={10}
              inputMode="numeric"
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="10-digit mobile number"
            />
          </div>
          <button
            type="submit"
            disabled={loading || phone.length !== 10}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          New seller?{" "}
          <Link href="/seller/register" className="text-primary font-semibold hover:underline">
            Register as Seller
          </Link>
        </div>
        <div className="mt-3 text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Buyer login
          </Link>
        </div>
      </div>

      {otp && (
        <OtpModal
          type={otp.type}
          target={otp.target}
          devOtp={devOtp}
          onClose={() => setOtp(null)}
          onVerified={completeSignIn}
          onError={setError}
        />
      )}
    </div>
  );
}

export default function SellerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Loading...</div>}>
      <SellerLoginForm />
    </Suspense>
  );
}
