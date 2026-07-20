"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug?: string;
    price: number;
    mrp: number;
    discount?: number;
    brand?: string | null;
    images: { url: string }[];
    seller?: { businessName: string } | null;
  };
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  refresh: () => Promise<void>;
  addToCart: (productId: string, qty?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  count: 0,
  total: 0,
  refresh: async () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setItems([]);
      return;
    }
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.cart?.items || []);
      }
    } catch {
      setItems([]);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = async (productId: string, qty = 1) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: qty }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems(data.cart?.items || []);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Failed to add to cart");
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity }),
    });
    await refresh();
  };

  const removeItem = async (itemId: string) => {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    await refresh();
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, total, refresh, addToCart, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
