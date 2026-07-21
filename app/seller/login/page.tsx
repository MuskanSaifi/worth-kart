"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Store } from "lucide-react";
import { OtpModal } from "@/components/otp/OtpModal";

function SellerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/seller";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<{ type: "email" | "phone"; target: string } | null>(
    null
  );
  const [devOtp, setDevOtp] = useState("");

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login-otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, accountType: "seller" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Seller login failed");
      return;
    }
    setDevOtp(data.devOtp || "");
    setOtp({ type: data.type, target: data.target });
  };

  const completeSignIn = async () => {
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
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
          <p className="text-sm text-muted mt-1">Access your WorthKart seller account</p>
        </div>

        <form onSubmit={sendOtp} className="space-y-5">
          {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1.5">Seller Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="seller@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Sending OTP...</> : "Continue with OTP"}
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
