"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function AppPayReturnContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "";

  useEffect(() => {
    if (!orderId) return;
    const deepLink = `worthkart://checkout-return?order_id=${encodeURIComponent(orderId)}`;
    // Try to bounce back into Expo Go / app
    window.location.href = deepLink;
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-3">Payment complete</h1>
        <p className="text-sm text-muted mb-6">
          {orderId
            ? `Order ${orderId} — return to the WorthKart app to see status.`
            : "Return to the WorthKart app to see your payment status."}
        </p>
        {orderId ? (
          <a
            href={`worthkart://checkout-return?order_id=${encodeURIComponent(orderId)}`}
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold"
          >
            Open WorthKart App
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function AppPayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted">Returning to app...</p>
        </div>
      }
    >
      <AppPayReturnContent />
    </Suspense>
  );
}
