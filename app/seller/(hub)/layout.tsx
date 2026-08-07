import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { SellerMobileNav } from "@/components/seller/SellerMobileNav";

export default async function SellerHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let businessName = "Seller";
  let noticeCount = 0;

  try {
    const { seller } = await getSellerProfile();
    businessName = seller.businessName;
    noticeCount = await prisma.sellerNotice.count({
      where: {
        OR: [{ sellerId: seller.id }, { sellerId: null }],
        isRead: false,
      },
    });
  } catch {
    // middleware handles redirect
  }

  return (
    <div className="fixed inset-0 z-[200] flex bg-[#f5f5f5]">
      <div className="hidden lg:flex h-full">
        <SellerSidebar businessName={businessName} noticeCount={noticeCount} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden bg-[#1a1a2e] text-white px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">Seller Hub</p>
            <p className="font-semibold truncate max-w-[220px]">{businessName}</p>
          </div>
          {noticeCount > 0 ? (
            <span className="bg-[#ff4747] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {noticeCount} notices
            </span>
          ) : null}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">{children}</main>
        <SellerMobileNav />
      </div>
    </div>
  );
}
