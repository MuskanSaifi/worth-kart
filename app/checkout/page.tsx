"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { formatPrice } from "@/lib/utils";
import { Loader2, CheckCircle } from "lucide-react";

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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, refresh } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [newAddress, setNewAddress] = useState({
    name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "",
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

  const saveAddress = async () => {
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
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) return;
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: selectedAddress, paymentMethod }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setOrderNumber(data.order.orderNumber);
      setOrderPlaced(true);
      await refresh();
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle size={64} className="mx-auto text-success mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
        <p className="text-muted mb-1">Order Number: <strong>{orderNumber}</strong></p>
        <p className="text-sm text-muted mb-6">Thank you for shopping with WorthKart</p>
        <button onClick={() => router.push("/orders")} className="bg-primary text-white px-6 py-3 rounded-lg font-semibold">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Delivery Address</h2>
              <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-sm text-primary font-semibold">
                + Add New
              </button>
            </div>

            {showAddressForm && (
              <div className="border border-border rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Name" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} className="px-3 py-2 border border-border rounded text-sm" />
                  <input placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="px-3 py-2 border border-border rounded text-sm" />
                </div>
                <input placeholder="Address Line 1" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} className="w-full px-3 py-2 border border-border rounded text-sm" />
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="px-3 py-2 border border-border rounded text-sm" />
                  <input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="px-3 py-2 border border-border rounded text-sm" />
                  <input placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} className="px-3 py-2 border border-border rounded text-sm" />
                </div>
                <button onClick={saveAddress} className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold">Save Address</button>
              </div>
            )}

            <div className="space-y-2">
              {addresses.map((addr) => (
                <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAddress === addr.id ? "border-primary bg-purple-50" : "border-border hover:bg-gray-50"}`}>
                  <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                  <div>
                    <p className="font-medium text-sm">{addr.name} · {addr.phone}</p>
                    <p className="text-sm text-muted">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  </div>
                </label>
              ))}
              {addresses.length === 0 && !showAddressForm && (
                <p className="text-sm text-muted">No saved addresses. Add one to continue.</p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h2 className="font-semibold mb-4">Payment Method</h2>
            <div className="space-y-2">
              {[
                { id: "COD", label: "Cash on Delivery" },
                { id: "UPI", label: "UPI" },
                { id: "CARD", label: "Credit / Debit Card" },
                { id: "WALLET", label: "WorthKart Wallet" },
              ].map((method) => (
                <label key={method.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === method.id ? "border-primary bg-purple-50" : "border-border"}`}>
                  <input type="radio" name="payment" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} />
                  <span className="text-sm font-medium">{method.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 h-fit">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Items ({items.length})</span><span>{formatPrice(total)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
          </div>
          <button
            onClick={placeOrder}
            disabled={loading || !selectedAddress}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold mt-4 hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
