"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

function CheckoutReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useCart();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<"loading" | "PAID" | "PENDING" | "FAILED">("loading");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (!orderId) {
      setStatus("FAILED");
      return;
    }

    let cancelled = false;

    const verify = async (attempt = 0): Promise<void> => {
      const res = await fetch(
        `/api/payments/cashfree/verify?order_id=${encodeURIComponent(orderId)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (cancelled) return;

      if (res.status === 401) {
        setStatus("FAILED");
        return;
      }

      if (!res.ok) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1500));
          return verify(attempt + 1);
        }
        setStatus("FAILED");
        return;
      }

      setOrderNumber(data.orderNumber || orderId);
      if (data.status === "PAID") {
        setStatus("PAID");
        await refresh();
      } else if (data.status === "EXPIRED" || data.status === "TERMINATED" || data.status === "FAILED") {
        setStatus("FAILED");
      } else if (attempt < 5) {
        setStatus("PENDING");
        await new Promise((r) => setTimeout(r, 2000));
        return verify(attempt + 1);
      } else {
        setStatus("PENDING");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [orderId, refresh]);

  if (status === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 size={48} className="mx-auto animate-spin text-primary mb-4" />
        <p className="text-muted">Verifying your payment...</p>
      </div>
    );
  }

  if (status === "PAID") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle size={64} className="mx-auto text-success mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted mb-1">Order Number: <strong>{orderNumber}</strong></p>
        <p className="text-sm text-muted mb-6">Thank you for shopping with WorthKart</p>
        <button
          onClick={() => router.push("/orders")}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold"
        >
          View Orders
        </button>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 size={48} className="mx-auto text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Pending</h1>
        <p className="text-sm text-muted mb-6">
          We are waiting for payment confirmation. Refresh this page in a moment or check My Orders.
        </p>
        <button
          onClick={() => router.push("/orders")}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold"
        >
          View Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <XCircle size={64} className="mx-auto text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
      <p className="text-sm text-muted mb-6">
        Your payment could not be completed. You can try again from checkout.
      </p>
      <button
        onClick={() => router.push("/checkout")}
        className="bg-primary text-white px-6 py-3 rounded-lg font-semibold"
      >
        Back to Checkout
      </button>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Loader2 size={48} className="mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted">Loading...</p>
        </div>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  );
}
