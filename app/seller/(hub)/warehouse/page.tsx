import { getSellerProfile } from "@/lib/seller";
import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { GstOtpVerifyPanel } from "@/components/seller/GstOtpVerifyPanel";
import { PanVerifyPanel } from "@/components/seller/PanVerifyPanel";
import { SellerProfileImageUpload } from "@/components/seller/SellerProfileImageUpload";
import { BankDetailsForm } from "@/components/seller/BankDetailsForm";
import { MapPin, Building2, CreditCard } from "lucide-react";

export default async function SellerWarehousePage() {
  const { seller } = await getSellerProfile();

  const statusColors: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700",
    BLOCKED: "bg-red-100 text-red-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-orange-100 text-orange-700",
    REJECTED: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <SellerPageHeader title="Warehouse" description="Manage pickup address and business details" />

      {seller.status === "BLOCKED" && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <strong>Account Blocked</strong> — Your products are hidden from buyers. Contact admin to reactivate.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SellerCard>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Building2 size={20} className="text-blue-600" /></div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Business Details</p>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-gray-400">Name:</span> {seller.businessName}</p>
                <p><span className="text-gray-400">Type:</span> {seller.businessType || "Not set"}</p>
                <p>
                  <span className="text-gray-400">GST:</span> {seller.gstNumber || "Not set"}
                  {seller.gstNumber && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${seller.gstVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {seller.gstVerified ? "Verified" : "Unverified"}
                    </span>
                  )}
                </p>
                {seller.gstLegalName && (
                  <p><span className="text-gray-400">GST Legal Name:</span> {seller.gstLegalName}</p>
                )}
                <p>
                  <span className="text-gray-400">PAN:</span> {seller.panNumber || "Not set"}
                  {seller.panNumber && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${seller.panVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {seller.panVerified ? "Verified" : "Unverified"}
                    </span>
                  )}
                </p>
                <p><span className="text-gray-400">Status:</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statusColors[seller.status] || "bg-gray-100 text-gray-700"}`}>
                    {seller.status}
                  </span>
                </p>
              </div>

              <GstOtpVerifyPanel
                gstNumber={seller.gstNumber}
                gstVerified={seller.gstVerified}
                gstFailedAttempts={seller.gstFailedAttempts}
                status={seller.status}
              />

              <PanVerifyPanel
                panNumber={seller.panNumber}
                panVerified={seller.panVerified}
                gstVerified={seller.gstVerified}
                gstNumber={seller.gstNumber}
                gstRegisteredMobile={seller.gstRegisteredMobile}
              />

              <SellerProfileImageUpload initialImage={seller.profileImage} />
            </div>
          </div>
        </SellerCard>

        <SellerCard>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><MapPin size={20} className="text-purple-600" /></div>
            <div>
              <p className="font-semibold text-gray-800">Pickup Address</p>
              <div className="mt-3 text-sm text-gray-600">
                {seller.pickupAddress ? (
                  <>
                    <p>{seller.pickupAddress}</p>
                    <p className="mt-1">{seller.city}, {seller.state} - {seller.pincode}</p>
                  </>
                ) : (
                  <p className="text-gray-400">No pickup address set</p>
                )}
              </div>
            </div>
          </div>
        </SellerCard>

        <SellerCard className="md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CreditCard size={20} className="text-green-600" /></div>
            <BankDetailsForm
              initialAccount={seller.bankAccount}
              initialIfsc={seller.bankIfsc}
              initialVerified={seller.bankVerified}
              initialHolderName={seller.bankAccountHolderName}
              initialBankName={seller.bankName}
              businessName={seller.gstLegalName || seller.businessName}
            />
          </div>
        </SellerCard>
      </div>
    </div>
  );
}
