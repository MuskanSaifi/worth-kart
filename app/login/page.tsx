"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { OtpModal } from "@/components/otp/OtpModal";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      email,
      password,
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
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Invalid email or password");
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
              Sign in with your email, password, and OTP verification
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                "Continue with OTP"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            New to WorthKart?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </div>

          <div className="mt-4 text-center text-sm">
            <Link href="/seller/register" className="text-primary hover:underline">
              Want to sell? Register as Seller →
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
