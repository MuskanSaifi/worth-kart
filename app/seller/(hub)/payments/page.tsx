"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SellerPageHeader, SellerCard, StatBadge } from "@/components/seller/SellerPageHeader";
import { formatPrice } from "@/lib/utils";
import { Wallet } from "lucide-react";

type PaymentsPayload = {
  totalEarnings: number;
  pendingPayout: number;
  paidOut?: number;
  onHold?: number;
  commissionPercent?: number;
  payoutSchedule?: string;
  flowHint?: string;
  items: Array<{
    id: string;
    price: number;
    quantity: number;
    netAmount?: number;
    settlementStatus?: string;
    product: { name: string };
    order: { orderNumber: string; paymentStatus: string; status?: string };
  }>;
};

export default function SellerPaymentsPage() {
  const [data, setData] = useState<{ payments: PaymentsPayload } | null>(null);

  useEffect(() => {
    fetch("/api/seller/extras")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const payments = data?.payments;
  const commission = payments?.commissionPercent ?? 10;

  return (
    <div>
      <SellerPageHeader
        title="Payments"
        description="Customer pays WorthKart → after delivery your share is settled here"
      />

      <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900">
        <p className="font-semibold">How payouts work</p>
        <p className="mt-1 text-violet-800/90">
          {payments?.flowHint ||
            `Buyers pay WorthKart via Cashfree (or COD). After successful delivery, ${commission}% commission is deducted and the rest goes to Pending Payout. Bank transfer every Wednesday.`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBadge label="Pending Payout" value={formatPrice(payments?.pendingPayout || 0)} />
        <StatBadge label="Paid Out" value={formatPrice(payments?.paidOut || 0)} />
        <StatBadge label="Total Earnings" value={formatPrice(payments?.totalEarnings || 0)} />
        <StatBadge label="Commission" value={`${commission}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SellerCard>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Wallet size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold">Next Payout</p>
              <p className="text-sm text-gray-500">
                {payments?.payoutSchedule || "Every Wednesday · Bank transfer"}
              </p>
              <p className="text-lg font-bold text-green-600 mt-1">
                {formatPrice(payments?.pendingPayout || 0)}
              </p>
            </div>
          </div>
        </SellerCard>
        <SellerCard>
          <p className="font-semibold mb-2">Bank Details</p>
          <p className="text-sm text-gray-500">
            Verified bank account required to receive weekly payouts.
          </p>
          <Link
            href="/seller/warehouse"
            className="text-sm text-[#5c59e8] font-semibold mt-2 inline-block hover:underline"
          >
            Manage Bank Details →
          </Link>
        </SellerCard>
      </div>

      <SellerCard title="Settlement history">
        <div className="space-y-2">
          {(payments?.items || []).map((item) => {
            const amount =
              item.netAmount ?? item.price * item.quantity * (1 - commission / 100);
            const status = item.settlementStatus || item.order.paymentStatus;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
              >
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.order.orderNumber} · Qty {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(amount)}</p>
                  <span
                    className={`text-xs font-semibold ${
                      status === "PAID" ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    {status === "PAID" ? "Paid out" : "Pending payout"}
                  </span>
                </div>
              </div>
            );
          })}
          {(!payments?.items || payments.items.length === 0) && (
            <p className="text-center text-gray-400 py-8">
              No settlements yet — they appear after orders are delivered
            </p>
          )}
        </div>
      </SellerCard>
    </div>
  );
}
