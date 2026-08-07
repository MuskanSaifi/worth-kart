"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCart } from "@/components/providers/CartProvider";
import { formatPrice } from "@/lib/utils";
import { Loader2, CheckCircle, MapPin } from "lucide-react";
import type { ReverseGeocodeResult } from "@/lib/geocode";

const MapLocationPicker = dynamic(
  () =>
    import("@/components/address/MapLocationPicker").then((m) => m.MapLocationPicker),
  { ssr: false }
);

interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

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
    if (window.Cashfree) {
      resolve(window.Cashfree);
      return;
    }

    const existing = document.querySelector('script[data-cashfree-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Cashfree) resolve(window.Cashfree);
        else reject(new Error("Cashfree SDK failed to load"));
      });
      existing.addEventListener("error", () => reject(new Error("Failed to load Cashfree SDK")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.cashfreeSdk = "true";
    script.onload = () => {
      if (window.Cashfree) resolve(window.Cashfree);
      else reject(new Error("Cashfree SDK failed to load"));
    };
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, refresh } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((d) => {
        setAddresses(d.addresses || []);
        const def = d.addresses?.find((a: Address) => a.isDefault);
        if (def) setSelectedAddress(def.id);
      });
  }, []);

  const shipping = total > 499 ? 0 : 40;
  const grandTotal = total + shipping;

  const openAddAddress = () => setShowMapPicker(true);

  const onMapConfirm = (result: ReverseGeocodeResult) => {
    // Flipkart-style: Area/Sector/Locality from map; house/flat left for user
    const area =
      result.line1 ||
      result.line2 ||
      [result.title, result.subtitle].filter(Boolean).join(", ") ||
      result.displayName ||
      "";
    setNewAddress((prev) => ({
      ...prev,
      line1: "",
      line2: area,
      city: result.city || prev.city,
      state: result.state || prev.state,
      pincode: result.pincode || prev.pincode,
    }));
    setShowAddressForm(true);
  };

  const saveAddress = async () => {
    if (
      !newAddress.name ||
      !newAddress.phone ||
      !newAddress.line1 ||
      !newAddress.line2 ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.pincode
    ) {
      setError("Please fill name, phone, house and area / sector");
      return;
    }
    setError("");
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 }),
    });
    const data = await res.json();
    if (res.ok) {
      setAddresses([...addresses, data.address]);
      setSelectedAddress(data.address.id);
      setShowAddressForm(false);
      setNewAddress({
        name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
      });
    } else {
      setError(data.error || "Failed to save address");
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId: selectedAddress, paymentMethod }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Checkout failed");
        return;
      }

      if (data.paymentSessionId) {
        const Cashfree = await loadCashfreeSdk();
        const cashfree = Cashfree({ mode: data.cashfreeMode || "sandbox" });
        const result = await cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: "_self",
        });
        if (result?.error?.message) {
          setError(result.error.message);
        }
        return;
      }

      setOrderNumber(data.order.orderNumber);
      setOrderPlaced(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle size={64} className="mx-auto text-success mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
        <p className="text-muted mb-1">
          Order Number: <strong>{orderNumber}</strong>
        </p>
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

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Checkout</h1>

      <MapLocationPicker
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={onMapConfirm}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Delivery Address</h2>
              <button
                type="button"
                onClick={openAddAddress}
                className="text-sm text-primary font-semibold flex items-center gap-1"
              >
                <MapPin size={14} /> + Add New
              </button>
            </div>

            {showAddressForm && (
              <div className="border border-border rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1">
                    <MapPin size={12} /> Location from map
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Change on map
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Name *"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="px-3 py-2 border border-border rounded text-sm"
                  />
                  <input
                    placeholder="Phone *"
                    value={newAddress.phone}
                    onChange={(e) =>
                      setNewAddress({
                        ...newAddress,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    className="px-3 py-2 border border-border rounded text-sm"
                  />
                </div>
                <input
                  placeholder="House / Flat / Floor / Landmark *"
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                />
                <input
                  placeholder="Area / Sector / Locality *"
                  value={newAddress.line2}
                  onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    placeholder="City *"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="px-3 py-2 border border-border rounded text-sm"
                  />
                  <input
                    placeholder="State *"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="px-3 py-2 border border-border rounded text-sm"
                  />
                  <input
                    placeholder="Pincode *"
                    value={newAddress.pincode}
                    onChange={(e) =>
                      setNewAddress({
                        ...newAddress,
                        pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                      })
                    }
                    className="px-3 py-2 border border-border rounded text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveAddress}
                    className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 rounded text-sm border border-border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAddress === addr.id
                      ? "border-primary bg-purple-50"
                      : "border-border hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {addr.name} · {addr.phone}
                    </p>
                    <p className="text-sm text-muted">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} -{" "}
                      {addr.pincode}
                    </p>
                  </div>
                </label>
              ))}
              {addresses.length === 0 && !showAddressForm && (
                <button
                  type="button"
                  onClick={openAddAddress}
                  className="w-full text-sm text-primary font-semibold border border-dashed border-primary/40 rounded-lg py-6 hover:bg-purple-50"
                >
                  <MapPin size={18} className="inline mr-1" />
                  Pick delivery location on map
                </button>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <h2 className="font-semibold mb-4">Payment Method</h2>
            <div className="space-y-2">
              {[
                {
                  id: "ONLINE",
                  label: "Pay Online",
                  hint: "Secure pay to WorthKart · UPI / Card / NetBanking (Cashfree)",
                },
                {
                  id: "COD",
                  label: "Cash on Delivery",
                  hint: "Pay cash to courier when order arrives",
                },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                    paymentMethod === method.id
                      ? "border-primary bg-purple-50"
                      : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium block">{method.label}</span>
                    <span className="text-xs text-muted">{method.hint}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 h-fit">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Items ({items.length})</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <button
            onClick={placeOrder}
            disabled={loading || !selectedAddress}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold mt-4 hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : paymentMethod === "ONLINE" ? (
              "Pay Now"
            ) : (
              "Place Order"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
