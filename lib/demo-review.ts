import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** App Review / Play Review demo phones. OTP is always 1234. */
export const DEMO_BUYER_PHONES = ["9999999999", "9876543210"];
export const DEMO_SELLER_PHONE = "9876543211";
export const DEMO_REVIEW_PHONE_NUMBERS = [...DEMO_BUYER_PHONES, DEMO_SELLER_PHONE];
export const DEMO_REVIEW_OTP = "1234";

const DEMO_SELLER_EMAIL = "seller@worthkart.com";

export function normalizeDemoPhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export function isDemoReviewOtp(phone: string, code: string) {
  const normalized = normalizeDemoPhone(phone);
  const cleaned = String(code || "").replace(/\D/g, "");
  return DEMO_REVIEW_PHONE_NUMBERS.includes(normalized) && cleaned === DEMO_REVIEW_OTP;
}

/**
 * Guarantees the App Review seller exists and is APPROVED.
 * Called on seller OTP login for the demo phone so reviewers can always enter Seller Hub.
 */
export async function ensureDemoReviewSeller() {
  const phone = DEMO_SELLER_PHONE;
  const byPhone = await prisma.user.findUnique({
    where: { phone },
    include: { sellerProfile: true },
  });

  if (byPhone?.role === "ADMIN") {
    return byPhone;
  }

  let user = byPhone;

  if (!user) {
    const byEmail = await prisma.user.findUnique({
      where: { email: DEMO_SELLER_EMAIL },
      include: { sellerProfile: true },
    });
    if (byEmail && byEmail.role !== "ADMIN") {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          phone,
          phoneVerified: true,
          role: "SELLER",
          name: byEmail.name || "Priya Electronics",
        },
        include: { sellerProfile: true },
      });
    }
  }

  if (!user) {
    const hashed = await bcrypt.hash("Seller@123", 12);
    try {
      user = await prisma.user.create({
        data: {
          name: "Priya Electronics",
          email: DEMO_SELLER_EMAIL,
          phone,
          password: hashed,
          role: "SELLER",
          emailVerified: true,
          phoneVerified: true,
          cart: { create: {} },
        },
        include: { sellerProfile: true },
      });
    } catch {
      user = await prisma.user.create({
        data: {
          name: "Priya Electronics",
          email: `seller-${phone}@users.worthkart.in`,
          phone,
          password: hashed,
          role: "SELLER",
          emailVerified: true,
          phoneVerified: true,
          cart: { create: {} },
        },
        include: { sellerProfile: true },
      });
    }
  } else if (user.role !== "SELLER") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "SELLER", phoneVerified: true },
      include: { sellerProfile: true },
    });
  }

  if (!user) {
    throw new Error("Could not create App Review seller account");
  }

  if (!user.sellerProfile) {
    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        businessName: "Priya Electronics Store",
        businessType: "private_limited",
        gstNumber: "07AABCU9603R1ZM",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        pickupAddress: "Plot 15, Okhla Industrial Area, Phase 2",
        status: "APPROVED",
        rating: 4.5,
        totalSales: 0,
      },
    });
  } else if (user.sellerProfile.status !== "APPROVED") {
    await prisma.sellerProfile.update({
      where: { id: user.sellerProfile.id },
      data: { status: "APPROVED" },
    });
  }

  return user;
}
