/** @deprecated Use lib/two-factor.ts */
export {
  sendSmsOtp as sendOtpVia2Factor,
  verifyOtpVia2Factor,
  isTwoFactorConfigured as isSmsConfigured,
  maskPhone,
  OTP_DIGITS,
} from "@/lib/two-factor";
