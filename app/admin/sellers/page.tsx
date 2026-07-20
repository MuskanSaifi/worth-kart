import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSellerList } from "@/components/admin/AdminSellerList";
import { AdminActivationPanel } from "@/components/admin/AdminActivationPanel";
import { syncPendingAutoApprovals } from "@/lib/seller";

export default async function AdminSellersPage() {
  await syncPendingAutoApprovals();

  const sellers = await prisma.sellerProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, phone: true, name: true } },
      _count: { select: { products: true } },
    },
  });

  return (
    <AdminShell
      title="Manage Sellers"
      description="Search sellers, review verification status, and inspect their products."
    >
      <AdminSellerList sellers={sellers} />
      <AdminActivationPanel />
    </AdminShell>
  );
}
