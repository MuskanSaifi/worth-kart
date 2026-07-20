"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { OtpModal } from "@/components/otp/OtpModal";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpModal, setOtpModal] = useState<{ type: "email" | "phone"; target: string } | null>(null);
  const [devOtp, setDevOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (type: "email" | "phone") => {
    const target = type === "email" ? form.email : form.phone;
    if (!target) {
      setError(`Enter ${type} first`);
      return;
    }
    setError("");
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, type }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setDevOtp(data.devOtp || "");
    setOtpModal({ type, target });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified || !phoneVerified) {
      setError("Please verify email and mobile OTP before registering");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    router.push("/login?registered=true");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-sm text-muted mt-1">
              Verify email &amp; mobile with real OTP (TWO_FACTOR_OTP_TEMPLATE)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="flex border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setEmailVerified(false);
                  }}
                  required
                  className="flex-1 px-4 py-2.5 outline-none"
                  placeholder="you@email.com"
                />
                <button
                  type="button"
                  onClick={() => sendOtp("email")}
                  className={`px-4 text-sm font-semibold border-l border-border ${
                    emailVerified ? "text-green-600 bg-green-50" : "text-primary hover:bg-purple-50"
                  }`}
                >
                  {emailVerified ? <><Check size={14} className="inline" /> Verified</> : "Send OTP"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Mobile Number</label>
              <div className="flex border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) });
                    setPhoneVerified(false);
                  }}
                  required
                  maxLength={10}
                  className="flex-1 px-4 py-2.5 outline-none"
                  placeholder="10-digit mobile"
                />
                <button
                  type="button"
                  onClick={() => sendOtp("phone")}
                  className={`px-4 text-sm font-semibold border-l border-border ${
                    phoneVerified ? "text-green-600 bg-green-50" : "text-primary hover:bg-purple-50"
                  }`}
                >
                  {phoneVerified ? <><Check size={14} className="inline" /> Verified</> : "Send OTP"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                  placeholder="Min 8 chars, upper, lower, number"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !emailVerified || !phoneVerified}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>

      {otpModal && (
        <OtpModal
          type={otpModal.type}
          target={otpModal.target}
          devOtp={devOtp}
          onClose={() => setOtpModal(null)}
          onVerified={() => {
            if (otpModal.type === "email") setEmailVerified(true);
            else setPhoneVerified(true);
            setOtpModal(null);
            setDevOtp("");
            setError("");
          }}
          onError={setError}
        />
      )}
    </div>
  );
}
