"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Smartphone } from "lucide-react";
import { OtpModal } from "@/components/otp/OtpModal";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: phone, type: "phone" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not send OTP");
      return;
    }
    setDevOtp(data.devOtp || "");
    setOtpOpen(true);
  };

  const completeRegistration = async () => {
    setOtpOpen(false);
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (res.status === 409) {
      setLoading(false);
      setError("This mobile number is already registered. Please login.");
      return;
    }
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Registration failed");
      return;
    }

    const result = await signIn("credentials", {
      phone,
      accountType: "buyer",
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      router.push("/login");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-sm text-muted mt-1">
              Register instantly using your mobile number
            </p>
          </div>

          <form onSubmit={sendOtp} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Mobile Number</label>
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
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Please wait...</> : "Get OTP"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>

      {otpOpen && (
        <OtpModal
          type="phone"
          target={phone}
          devOtp={devOtp}
          onClose={() => setOtpOpen(false)}
          onVerified={completeRegistration}
          onError={setError}
        />
      )}
    </div>
  );
}
