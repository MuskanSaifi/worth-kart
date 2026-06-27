import { prisma } from "@/lib/prisma";
import { MAX_GST_FAILED_ATTEMPTS } from "@/lib/seller-gst-constants";

export { MAX_GST_FAILED_ATTEMPTS, SUPPORT_EMAIL } from "@/lib/seller-gst-constants";

export async function blockSellerForGstFailure(sellerId: string) {
  await prisma.$transaction([
    prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        status: "BLOCKED",
        gstBlockedAt: new Date(),
        gstBlockReason: `GST verification failed ${MAX_GST_FAILED_ATTEMPTS} times`,
      },
    }),
    prisma.product.updateMany({
      where: { sellerId },
      data: { isActive: false },
    }),
  ]);
}

export async function unblockSeller(sellerId: string) {
  await prisma.$transaction([
    prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        status: "APPROVED",
        gstFailedAttempts: 0,
        gstBlockedAt: null,
        gstBlockReason: null,
      },
    }),
    prisma.product.updateMany({
      where: { sellerId, qcStatus: "QC_PASS" },
      data: { isActive: true },
    }),
  ]);
}
