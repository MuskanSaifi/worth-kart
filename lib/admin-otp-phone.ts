/**
 * Phone that receives the admin-login OTP.
 * ADMIN_OTP_PHONE lets the owner use one mobile for admin OTP even when
 * that number is also a seller account (User.phone is unique per user).
 */
export function getAdminOtpPhone(userPhone?: string | null): string | null {
  const fromEnv = (process.env.ADMIN_OTP_PHONE || "").replace(/\D/g, "").slice(-10);
  if (/^[6-9]\d{9}$/.test(fromEnv)) return fromEnv;
  const fromUser = (userPhone || "").replace(/\D/g, "").slice(-10);
  if (/^[6-9]\d{9}$/.test(fromUser)) return fromUser;
  return null;
}
