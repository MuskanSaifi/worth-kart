import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export class AccountDeleteError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Permanently closes a buyer or seller account.
 * Personal data is erased immediately. Statutory order/invoice records stay
 * attached to an anonymized user (Indian tax / consumer-law retention).
 */
export async function deleteUserAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { sellerProfile: true, cart: true },
  });

  if (!user) {
    throw new AccountDeleteError("Account not found", 404);
  }
  if (user.role === "ADMIN") {
    throw new AccountDeleteError("Admin accounts cannot be deleted from the app", 403);
  }
  if (user.email.startsWith("deleted-") && user.email.endsWith("@deleted.worthkart.in")) {
    throw new AccountDeleteError("This account is already deleted", 410);
  }

  const phone = user.phone;
  const hashed = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);

  await prisma.otp.deleteMany({ where: { userId: user.id } });
  if (phone) {
    await prisma.otp.deleteMany({ where: { target: phone, type: "phone" } });
  }
  await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
  await prisma.wishlistItem.deleteMany({ where: { userId: user.id } });

  if (user.cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: user.cart.id } });
    await prisma.cart.delete({ where: { id: user.cart.id } });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    include: { _count: { select: { orders: true } } },
  });
  for (const address of addresses) {
    if (address._count.orders > 0) {
      await prisma.address.update({
        where: { id: address.id },
        data: { name: "Deleted User", phone: "0000000000" },
      });
    } else {
      await prisma.address.delete({ where: { id: address.id } });
    }
  }

  if (user.sellerProfile) {
    await prisma.product.updateMany({
      where: { sellerId: user.sellerProfile.id },
      data: { isActive: false },
    });
    await prisma.sellerProfile.update({
      where: { id: user.sellerProfile.id },
      data: {
        businessName: "Deleted Seller",
        gstNumber: null,
        gstLegalName: null,
        gstRegisteredMobile: null,
        panNumber: null,
        bankAccount: null,
        bankIfsc: null,
        bankAccountHolderName: null,
        bankName: null,
        pickupAddress: null,
        profileImage: null,
        profileImagePublicId: null,
        status: "SUSPENDED",
      },
    });
  }

  if (user.imagePublicId && isCloudinaryConfigured()) {
    await deleteFromCloudinary(user.imagePublicId).catch(() => null);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: "Deleted User",
      email: `deleted-${user.id}@deleted.worthkart.in`,
      phone: `del_${user.id.slice(-12)}`,
      password: hashed,
      emailVerified: false,
      phoneVerified: false,
      image: null,
      imagePublicId: null,
    },
  });

  return { success: true as const };
}
