"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { OtpModal } from "@/components/otp/OtpModal";

type Step = 1 | 2;

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [step1, setStep1] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    emailVerified: false,
    phoneVerified: false,
  });

  const [step2, setStep2] = useState({
    businessName: "",
    businessType: "",
    gstNumber: "",
    gstVerified: false,
    gstLegalName: "",
    panNumber: "",
    bankAccount: "",
    bankIfsc: "",
    pickupAddress: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [otpModal, setOtpModal] = useState<{ type: "email" | "phone"; target: string } | null>(null);
  const [devOtp, setDevOtp] = useState("");
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstMessage, setGstMessage] = useState("");
  const [loginUrl, setLoginUrl] = useState("");

  const sendOtp = async (type: "email" | "phone") => {
    const target = type === "email" ? step1.email : step1.phone;
    if (!target) {
      setError(`Enter ${type} first`);
      setLoginUrl("");
      return;
    }
    setError("");
    setLoginUrl("");
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, type, purpose: "seller_register" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not send OTP");
      if (data.code === "ALREADY_REGISTERED" && data.loginUrl) {
        setLoginUrl(data.loginUrl);
      }
      return;
    }
    if (data.devOtp) setDevOtp(data.devOtp);
    setOtpModal({ type, target });
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginUrl("");
    setLoading(true);

    const res = await fetch("/api/seller/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: 1, ...step1 }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      if (/already registered/i.test(data.error || "")) {
        setLoginUrl("/seller/login");
      }
      return;
    }
    setUserId(data.userId);
    setStep(2);
  };

  const verifyGst = async () => {
    if (!step2.gstNumber || step2.gstNumber.length !== 15) {
      setError("Enter a valid 15-character GSTIN");
      return;
    }
    setError("");
    setGstMessage("");
    setGstVerifying(true);
    const res = await fetch("/api/seller/verify-gst", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gstin: step2.gstNumber,
        panNumber: step2.panNumber || undefined,
      }),
    });
    const data = await res.json();
    setGstVerifying(false);
    if (!res.ok || !data.verified) {
      setError(data.error || "GST verification failed");
      setStep2((s) => ({ ...s, gstVerified: false, gstLegalName: "" }));
      return;
    }
    setStep2((s) => ({
      ...s,
      gstVerified: true,
      gstLegalName: data.legalName || "",
      panNumber: s.panNumber || data.pan || s.panNumber,
    }));
    setGstMessage(data.message || "GST verified successfully");
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/seller/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: 2, userId, ...step2 }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push("/seller/login?registered=true");
  };

  return (
    <div className="min-h-[80vh] bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {[
            { num: 1, label: "EMAIL & PASSWORD" },
            { num: 2, label: "BUSINESS DETAILS" },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.num ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > s.num ? <Check size={16} /> : s.num}
              </div>
              <span className={`text-xs mt-2 font-medium ${step === s.num ? "text-primary" : "text-muted"}`}>
                {s.label}
              </span>
              {step === s.num && <div className="w-16 h-0.5 bg-accent mt-1" />}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border p-6 md:p-8">
          {error && (
            <div className="bg-red-50 text-danger text-sm p-3 rounded-lg mb-4">
              <p>{error}</p>
              {loginUrl ? (
                <p className="mt-2">
                  <Link href={loginUrl} className="font-semibold text-primary underline underline-offset-2">
                    Login as seller →
                  </Link>
                </p>
              ) : null}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-5">
              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Enter Mobile Number <span className="text-danger">*</span>
                </label>
                <div className="flex border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                  <input
                    type="tel"
                    value={step1.phone}
                    onChange={(e) => setStep1({ ...step1, phone: e.target.value, phoneVerified: false })}
                    className="flex-1 px-4 py-3 outline-none"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                  <button
                    type="button"
                    onClick={() => sendOtp("phone")}
                    className="px-4 text-primary font-semibold text-sm hover:bg-purple-50 transition-colors border-l border-border"
                  >
                    {step1.phoneVerified ? "✓ Verified" : "Send OTP"}
                  </button>
                </div>
                {!step1.phoneVerified && step1.phone && (
                  <p className="text-danger text-xs mt-1">Please verify your mobile number through OTP before you register</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email ID <span className="text-danger">*</span>
                </label>
                <div className="flex border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                  <input
                    type="email"
                    value={step1.email}
                    onChange={(e) => setStep1({ ...step1, email: e.target.value, emailVerified: false })}
                    className="flex-1 px-4 py-3 outline-none"
                    placeholder="Enter email address"
                  />
                  <button
                    type="button"
                    onClick={() => sendOtp("email")}
                    className="px-4 text-primary font-semibold text-sm hover:bg-purple-50 transition-colors border-l border-border"
                  >
                    {step1.emailVerified ? "✓ Verified" : "Send OTP"}
                  </button>
                </div>
                {!step1.emailVerified && step1.email && (
                  <p className="text-danger text-xs mt-1">Please verify your email through OTP before you register</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Create Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={step1.password}
                    onChange={(e) => setStep1({ ...step1, password: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={step1.confirmPassword}
                  onChange={(e) => setStep1({ ...step1, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <p className="text-xs text-muted">
                By continuing, I agree to WorthKart&apos;s{" "}
                <Link href="#" className="text-primary">Terms of Use</Link> &{" "}
                <Link href="#" className="text-primary">Privacy Policy</Link>
              </p>

              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Register & Continue <ArrowRight size={18} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-4">
              <h2 className="text-lg font-semibold mb-2">Business Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Name *</label>
                  <input
                    value={step2.businessName}
                    onChange={(e) => setStep2({ ...step2, businessName: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Business Type *</label>
                  <select
                    value={step2.businessType}
                    onChange={(e) => setStep2({ ...step2, businessType: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select type</option>
                    <option value="individual">Individual</option>
                    <option value="partnership">Partnership</option>
                    <option value="private_limited">Private Limited</option>
                    <option value="llp">LLP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GST Number</label>
                  <div className="flex border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                    <input
                      value={step2.gstNumber}
                      onChange={(e) =>
                        setStep2({
                          ...step2,
                          gstNumber: e.target.value.toUpperCase(),
                          gstVerified: false,
                          gstLegalName: "",
                        })
                      }
                      maxLength={15}
                      className="flex-1 px-4 py-2.5 outline-none uppercase"
                      placeholder="22AAAAA0000A1Z5"
                    />
                    <button
                      type="button"
                      onClick={verifyGst}
                      disabled={gstVerifying || step2.gstNumber.length !== 15}
                      className="px-4 text-primary font-semibold text-sm hover:bg-purple-50 transition-colors border-l border-border disabled:opacity-50"
                    >
                      {gstVerifying ? "..." : step2.gstVerified ? "✓ Verified" : "Verify GST"}
                    </button>
                  </div>
                  {step2.gstNumber && !step2.gstVerified && (
                    <p className="text-danger text-xs mt-1">Please verify your GSTIN before registering</p>
                  )}
                  {gstMessage && step2.gstVerified && (
                    <p className="text-green-600 text-xs mt-1">{gstMessage}</p>
                  )}
                  {step2.gstLegalName && (
                    <p className="text-xs text-muted mt-1">Registered name: {step2.gstLegalName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PAN Number</label>
                  <input
                    value={step2.panNumber}
                    onChange={(e) => setStep2({ ...step2, panNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pickup Address *</label>
                <textarea
                  value={step2.pickupAddress}
                  onChange={(e) => setStep2({ ...step2, pickupAddress: e.target.value })}
                  required
                  rows={2}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input value={step2.city} onChange={(e) => setStep2({ ...step2, city: e.target.value })} required className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <input value={step2.state} onChange={(e) => setStep2({ ...step2, state: e.target.value })} required className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pincode *</label>
                  <input value={step2.pincode} onChange={(e) => setStep2({ ...step2, pincode: e.target.value })} required maxLength={6} className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Account</label>
                  <input value={step2.bankAccount} onChange={(e) => setStep2({ ...step2, bankAccount: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IFSC Code</label>
                  <input value={step2.bankIfsc} onChange={(e) => setStep2({ ...step2, bankIfsc: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-gray-50">
                  Back
                </button>
                <button type="submit" disabled={loading} className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark flex items-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>Complete Registration <ArrowRight size={18} /></>}
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          Already registered?{" "}
          <Link href="/seller/login" className="text-primary font-semibold hover:underline">
            Seller Login
          </Link>
        </p>
      </div>

      {otpModal && (
        <OtpModal
          type={otpModal.type}
          target={otpModal.target}
          devOtp={devOtp}
          onClose={() => setOtpModal(null)}
          onVerified={() => {
            if (otpModal.type === "email") {
              setStep1((s) => ({ ...s, emailVerified: true }));
            } else {
              setStep1((s) => ({ ...s, phoneVerified: true }));
            }
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
