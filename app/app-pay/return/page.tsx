"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function AppPayReturnContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "";
  const appReturn = searchParams.get("app_return") || "";

  useEffect(() => {
    if (!orderId) return;

    const target = (() => {
      if (appReturn) {
        try {
          const url = new URL(appReturn);
          url.searchParams.set("order_id", orderId);
          return url.toString();
        } catch {
          /* ignore */
        }
      }
      return `worthkart://checkout-return?order_id=${encodeURIComponent(orderId)}`;
    })();

    const bounce = () => {
      try {
        window.location.replace(target);
      } catch {
        window.location.href = target;
      }
    };

    bounce();
    const t1 = window.setTimeout(bounce, 400);
    const t2 = window.setTimeout(bounce, 1200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [orderId, appReturn]);

  const fallbackHref = (() => {
    if (appReturn) {
      try {
        const url = new URL(appReturn);
        url.searchParams.set("order_id", orderId);
        return url.toString();
      } catch {
        /* ignore */
      }
    }
    return `worthkart://checkout-return?order_id=${encodeURIComponent(orderId)}`;
  })();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-3">Payment complete</h1>
        <p className="text-sm text-muted mb-6">
          {orderId
            ? `Order ${orderId} — returning to WorthKart…`
            : "Return to the WorthKart app to see your payment status."}
        </p>
        {orderId ? (
          <a
            href={fallbackHref}
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to WorthKart
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
