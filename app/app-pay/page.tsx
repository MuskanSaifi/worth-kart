"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type CashfreeCheckout = {
  checkout: (opts: {
    paymentSessionId: string;
    redirectTarget?: string;
  }) => Promise<{ error?: { message?: string } }>;
};

declare global {
  interface Window {
    Cashfree?: (opts: { mode: string }) => CashfreeCheckout;
  }
}

function loadCashfreeSdk(): Promise<NonNullable<typeof window.Cashfree>> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve(window.Cashfree);
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) resolve(window.Cashfree);
      else reject(new Error("Cashfree SDK failed to load"));
    };
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.body.appendChild(script);
  });
}

export default function AppPayPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Opening payment gateway...");

  useEffect(() => {
    const paymentSessionId = searchParams.get("session_id");
    const mode = searchParams.get("mode") || "sandbox";
    if (!paymentSessionId) {
      setMessage("Payment session missing");
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const Cashfree = await loadCashfreeSdk();
        const cashfree = Cashfree({ mode });
        const result = await cashfree.checkout({
          paymentSessionId,
          redirectTarget: "_self",
        });
        if (mounted && result?.error?.message) {
          setMessage(result.error.message);
        }
      } catch (error) {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : "Could not open payment gateway");
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-3">Cashfree Payment</h1>
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
