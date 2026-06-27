"use client";

import { useState, useEffect } from "react";
import { SellerPageHeader, SellerCard, StatBadge } from "@/components/seller/SellerPageHeader";
import { formatPrice } from "@/lib/utils";
import { Wallet, Download } from "lucide-react";

export default function SellerPaymentsPage() {
  const [data, setData] = useState<{
    payments: { totalEarnings: number; pendingPayout: number; items: Array<{ id: string; price: number; quantity: number; product: { name: string }; order: { orderNumber: string; paymentStatus: string } }> };
  } | null>(null);

  useEffect(() => {
    fetch("/api/seller/extras").then((r) => r.json()).then(setData);
  }, []);

  const payments = data?.payments;

  return (
    <div>
      <SellerPageHeader title="Payments" description="Track earnings, payouts and payment history" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatBadge label="Total Earnings" value={formatPrice(payments?.totalEarnings || 0)} />
        <StatBadge label="Pending Payout" value={formatPrice(payments?.pendingPayout || 0)} />
        <StatBadge label="Commission Rate" value="10%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SellerCard>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg"><Wallet size={24} className="text-green-600" /></div>
            <div>
              <p className="font-semibold">Next Payout</p>
              <p className="text-sm text-gray-500">Every Wednesday · Bank transfer</p>
              <p className="text-lg font-bold text-green-600 mt-1">{formatPrice(payments?.pendingPayout || 0)}</p>
            </div>
          </div>
        </SellerCard>
        <SellerCard>
          <p className="font-semibold mb-2">Bank Details</p>
          <p className="text-sm text-gray-500">Update your bank account in Warehouse settings for payouts</p>
          <a href="/seller/warehouse" className="text-sm text-[#5c59e8] font-semibold mt-2 inline-block hover:underline">
            Update Bank Details →
          </a>
        </SellerCard>
      </div>

      <SellerCard title="Payment History">
        <div className="space-y-2">
          {(payments?.items || []).map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-xs text-gray-400">{item.order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(item.price * item.quantity * 0.9)}</p>
                <span className="text-xs text-green-600">{item.order.paymentStatus}</span>
              </div>
            </div>
          ))}
          {(!payments?.items || payments.items.length === 0) && (
            <p className="text-center text-gray-400 py-8">No payment history yet</p>
          )}
        </div>
      </SellerCard>
    </div>
  );
}
