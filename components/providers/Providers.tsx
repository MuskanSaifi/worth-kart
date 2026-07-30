"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/providers/CartProvider";
import { AppToaster } from "@/components/providers/AppToaster";
import { ConfirmProvider } from "@/components/providers/ConfirmProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConfirmProvider>
        <CartProvider>
          {children}
          <AppToaster />
        </CartProvider>
      </ConfirmProvider>
    </SessionProvider>
  );
}
