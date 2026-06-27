"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/providers/CartProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
