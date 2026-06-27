import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { SellerSidebar } from "@/components/seller/SellerSidebar";

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
      <SellerSidebar businessName={businessName} noticeCount={noticeCount} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-5 md:p-6">{children}</main>
      </div>
    </div>
  );
}
