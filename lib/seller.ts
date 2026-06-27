import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function getSellerProfile() {
  const session = await requireRole("SELLER", "ADMIN");
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
  if (!seller) throw new Error("Seller profile not found");
  return { session, seller };
}

export function getAccountSetupSteps(seller: {
  businessType: string | null;
  gstNumber: string | null;
  gstVerified?: boolean;
  panNumber: string | null;
  panVerified?: boolean;
  bankAccount: string | null;
  bankIfsc: string | null;
  pickupAddress: string | null;
}) {
  return [
    { id: "businessType", label: "Add Business Type", done: !!seller.businessType, href: "/seller/warehouse" },
    { id: "gst", label: "Verify GST Details", done: !!seller.gstNumber && !!seller.gstVerified, href: "/seller/warehouse" },
    { id: "pan", label: "Verify PAN Card", done: !!seller.panNumber && !!seller.panVerified, href: "/seller/warehouse" },
    { id: "bank", label: "Add Bank Account", done: !!seller.bankAccount && !!seller.bankIfsc, href: "/seller/payments" },
    { id: "pickup", label: "Add Pickup Address", done: !!seller.pickupAddress, href: "/seller/warehouse" },
  ];
}

export function getSetupProgress(steps: { done: boolean }[]) {
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}
