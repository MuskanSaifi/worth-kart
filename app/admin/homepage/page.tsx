import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBannersManager } from "@/components/admin/AdminBannersManager";

export default async function AdminHomepagePage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <AdminShell
      title="Homepage Content"
      description="Manage the three homepage offer zones: top hero carousel, mid promo cards, and bottom strip."
    >
      <AdminBannersManager initialBanners={banners} />
    </AdminShell>
  );
}
