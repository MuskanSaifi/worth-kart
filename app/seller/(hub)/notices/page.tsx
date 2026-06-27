import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { Bell } from "lucide-react";

export default async function SellerNoticesPage() {
  const { seller } = await getSellerProfile();

  const notices = await prisma.sellerNotice.findMany({
    where: { OR: [{ sellerId: seller.id }, { sellerId: null }] },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <SellerPageHeader title="Notices" description="Important updates and notifications" />
      {notices.length === 0 ? (
        <SellerCard>
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notices</p>
          </div>
        </SellerCard>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <SellerCard key={n.id}>
              <div className="flex gap-3">
                {!n.isRead && <span className="w-2 h-2 bg-[#ff4747] rounded-full mt-2 flex-shrink-0" />}
                <div>
                  <p className="font-semibold text-gray-800">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </SellerCard>
          ))}
        </div>
      )}
    </div>
  );
}
