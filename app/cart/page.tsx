"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { formatPrice } from "@/lib/utils";
import { CartProductRail } from "@/components/cart/CartProductRail";
import { getRecentlyViewedExcluding } from "@/lib/recently-viewed";
import type { ProductCardData } from "@/components/products/ProductCard";
import { notify } from "@/lib/notify";
import {
  Minus,
  Plus,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  Truck,
  Bookmark,
  Zap,
} from "lucide-react";

type RailProduct = ProductCardData;

function deliveryDateLabel() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function CartPage() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const [missed, setMissed] = useState<RailProduct[]>([]);
  const [recent, setRecent] = useState<RailProduct[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pincode, setPincode] = useState("");

  const cartProductIds = useMemo(() => items.map((i) => i.product.id), [items]);

  useEffect(() => {
    setRecent(getRecentlyViewedExcluding(cartProductIds));
  }, [cartProductIds]);

  useEffect(() => {
    fetch(`/api/products?deal=true&limit=12&sort=best`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.products || []) as RailProduct[];
        setMissed(list.filter((p) => !cartProductIds.includes(p.id)));
      })
      .catch(() => setMissed([]));
  }, [cartProductIds]);

  const mrpTotal = items.reduce(
    (sum, item) => sum + (item.product.mrp || item.product.price) * item.quantity,
    0
  );
  const discountTotal = Math.max(0, mrpTotal - total);
  const shipping = total > 499 ? 0 : items.length > 0 ? 40 : 0;
  const grandTotal = total + shipping;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const saveForLater = async (itemId: string, productId: string) => {
    setSavingId(itemId);
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      await removeItem(itemId);
      notify.success("Saved for later");
    } catch {
      notify.error("Could not save for later");
    }
    setSavingId(null);
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#f1f3f6] min-h-[70vh] pb-10">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white border border-border rounded-sm p-10 text-center">
            <ShoppingBag size={56} className="mx-auto text-gray-300 mb-3" />
            <h1 className="text-xl font-bold mb-1">Your cart is empty</h1>
            <p className="text-sm text-muted mb-5">
              Browse deals and add items to get started
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary text-white px-8 py-2.5 rounded-sm font-semibold hover:bg-primary-dark"
            >
              Shop now
            </Link>
          </div>

          <CartProductRail
            title="Recently Viewed"
            products={recent}
            emptyHint="Products you view will appear here"
          />
          <CartProductRail title="Top deals for you" products={missed} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f1f3f6] min-h-[70vh] pb-24 lg:pb-10">
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 md:gap-4 items-start">
          {/* Left column */}
          <div className="space-y-3">
            {/* Delivery bar */}
            <div className="bg-white border border-border rounded-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-primary" />
                <span className="font-medium">Deliver to</span>
                <span className="text-muted">
                  {pincode ? pincode : "Enter pincode for delivery estimate"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Pincode"
                  className="w-24 px-2 py-1.5 text-sm border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  className="text-sm font-semibold text-primary border border-primary/40 px-3 py-1.5 rounded-sm hover:bg-purple-50"
                >
                  Check
                </button>
              </div>
            </div>

            {/* Cart items */}
            <div className="bg-white border border-border rounded-sm">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h1 className="font-semibold text-base">
                  My Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
                </h1>
              </div>

              <div className="divide-y divide-border">
                {items.map((item) => {
                  const mrp = item.product.mrp || item.product.price;
                  const discount =
                    item.product.discount ||
                    (mrp > item.product.price
                      ? Math.round(((mrp - item.product.price) / mrp) * 100)
                      : 0);
                  const slug = item.product.slug || item.product.id;

                  return (
                    <div key={item.id} className="p-4">
                      <div className="flex gap-4">
                        <Link
                          href={`/products/${slug}`}
                          className="w-[90px] h-[90px] md:w-[110px] md:h-[110px] bg-gray-50 border border-border rounded-sm flex-shrink-0 flex items-center justify-center"
                        >
                          {item.product.images[0] ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              width={100}
                              height={100}
                              className="object-contain max-h-full p-1"
                              unoptimized
                            />
                          ) : null}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${slug}`}
                            className="text-sm font-medium text-foreground hover:text-primary line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          {item.product.seller?.businessName && (
                            <p className="text-xs text-muted mt-1">
                              Seller: {item.product.seller.businessName}
                            </p>
                          )}

                          <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                            <span className="text-lg font-bold">
                              {formatPrice(item.product.price)}
                            </span>
                            {mrp > item.product.price && (
                              <>
                                <span className="text-sm text-muted line-through">
                                  {formatPrice(mrp)}
                                </span>
                                <span className="text-sm font-medium text-success">
                                  {discount}% off
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-2 text-xs text-foreground">
                            <Zap size={12} className="text-amber-500 fill-amber-500" />
                            <span>
                              Delivery by <strong>{deliveryDateLabel()}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-border rounded-sm">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1.5 hover:bg-gray-50 text-primary"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-3 text-sm font-semibold min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 hover:bg-gray-50 text-primary"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0 mt-4 border-t border-border pt-3 text-sm font-medium">
                        <button
                          type="button"
                          disabled={savingId === item.id}
                          onClick={() => saveForLater(item.id, item.product.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1 text-muted hover:text-primary disabled:opacity-50"
                        >
                          <Bookmark size={14} />
                          {savingId === item.id ? "Saving..." : "Save for later"}
                        </button>
                        <span className="w-px h-4 bg-border" />
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="flex-1 py-1 text-muted hover:text-danger"
                        >
                          Remove
                        </button>
                        <span className="w-px h-4 bg-border" />
                        <Link
                          href="/checkout"
                          className="flex-1 text-center py-1 text-primary hover:underline"
                        >
                          Buy this now
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop place order strip */}
              <div className="hidden lg:flex sticky bottom-0 bg-white border-t border-border px-4 py-3 justify-end shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
                <Link
                  href="/checkout"
                  className="bg-[#fb641b] hover:bg-[#e55712] text-white font-semibold px-14 py-3 rounded-sm shadow-sm transition-colors"
                >
                  PLACE ORDER
                </Link>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-3 lg:sticky lg:top-24">
            <div className="bg-white border border-border rounded-sm">
              <h2 className="px-4 py-3 text-sm font-medium text-muted uppercase tracking-wide border-b border-border">
                Price Details
              </h2>
              <div className="px-4 py-3 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>
                    Price ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </span>
                  <span>{formatPrice(mrpTotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="text-success">− {formatPrice(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className={shipping === 0 ? "text-success" : ""}>
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-dashed border-border pt-3 flex justify-between font-bold text-base">
                  <span>Total Amount</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
              {discountTotal > 0 && (
                <div className="mx-4 mb-4 bg-green-50 text-success text-sm font-medium px-3 py-2 rounded-sm">
                  You will save {formatPrice(discountTotal)} on this order
                </div>
              )}
              {total < 499 && (
                <p className="px-4 pb-3 text-xs text-muted">
                  Add {formatPrice(499 - total)} more for FREE delivery
                </p>
              )}
            </div>

            <div className="bg-white border border-border rounded-sm px-4 py-3 flex items-start gap-3">
              <ShieldCheck size={28} className="text-muted flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted leading-relaxed">
                Safe and Secure Payments. Easy returns. 100% Authentic products.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-muted px-1">
              <Truck size={14} />
              Free delivery on orders above ₹499
            </div>
          </div>
        </div>

        {/* Recommendation rails */}
        <div className="mt-4 space-y-3">
          <CartProductRail title="Items you may have missed" products={missed} />
          <CartProductRail
            title="Recently Viewed"
            products={recent}
            emptyHint="Browse products — they will show up here"
          />
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border px-4 py-3 flex items-center justify-between gap-3 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div>
          <p className="text-lg font-bold">{formatPrice(grandTotal)}</p>
          {discountTotal > 0 && (
            <p className="text-[11px] text-success font-medium">
              Save {formatPrice(discountTotal)}
            </p>
          )}
        </div>
        <Link
          href="/checkout"
          className="bg-[#fb641b] text-white font-semibold px-8 py-3 rounded-sm"
        >
          PLACE ORDER
        </Link>
      </div>
    </div>
  );
}
