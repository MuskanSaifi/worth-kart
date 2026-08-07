import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { requireAppSeller } from "@/lib/app-auth";

/**
 * Resolve seller from NextAuth cookie (website) OR Bearer app token (mobile).
 * Pass `req` from route handlers so the app can call the same /api/seller/* APIs.
 */
export async function getSellerProfile(req?: Request) {
  let userId: string;
  let session: { user: { id: string; role: string } };

  const authHeader = req?.headers.get("authorization") || "";
  const hasBearer = authHeader.startsWith("Bearer ");

  if (req && hasBearer) {
    const user = await requireAppSeller(req);
    userId = user.id;
    session = { user: { id: user.id, role: user.role } };
  } else {
    const nextSession = await requireRole("SELLER", "ADMIN");
    userId = nextSession.user.id;
    session = nextSession as { user: { id: string; role: string } };
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
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
  bankVerified?: boolean;
  pickupAddress: string | null;
}) {
  return [
    { id: "businessType", label: "Add Business Type", done: !!seller.businessType, href: "/seller/warehouse" },
    { id: "gst", label: "Verify GST Details", done: !!seller.gstNumber && !!seller.gstVerified, href: "/seller/warehouse" },
    { id: "pan", label: "Verify PAN Card", done: !!seller.panNumber && !!seller.panVerified, href: "/seller/warehouse" },
    { id: "bank", label: "Verify Bank Account", done: !!seller.bankAccount && !!seller.bankVerified, href: "/seller/warehouse" },
    { id: "pickup", label: "Add Pickup Address", done: !!seller.pickupAddress, href: "/seller/warehouse" },
  ];
}

export function getSetupProgress(steps: { done: boolean }[]) {
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}

/** Auto-approve seller when GST + PAN are both verified. Returns true if approved. */
export async function tryAutoApproveSeller(sellerId: string): Promise<boolean> {
  const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
  if (!seller || seller.status !== "PENDING") return false;
  if (!seller.gstVerified || !seller.panVerified) return false;

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { status: "APPROVED" },
  });
  return true;
}

/** Approve all pending sellers who already have GST + PAN verified. */
export async function syncPendingAutoApprovals(): Promise<number> {
  const result = await prisma.sellerProfile.updateMany({
    where: { status: "PENDING", gstVerified: true, panVerified: true },
    data: { status: "APPROVED" },
  });
  return result.count;
}
