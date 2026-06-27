"use client";

import { useCart } from "@/components/providers/CartProvider";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

export function AddToCartButton({ productId }: { productId: string }) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await addToCart(productId);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      window.location.href = "/login";
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
    >
      <ShoppingCart size={18} />
      {loading ? "Adding..." : added ? "Added!" : "Add to Cart"}
    </button>
  );
}
