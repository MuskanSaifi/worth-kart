"use client";

import Link from "next/link";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { User, ShoppingCart, Heart, ChevronDown } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { useState } from "react";

export function HeaderClient({ session }: { session: Session | null }) {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 ml-auto">
      {session ? (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 text-white hover:text-accent transition-colors"
          >
            <User size={20} />
            <span className="hidden lg:block text-sm font-medium max-w-[100px] truncate">
              {session.user.name || session.user.email?.split("@")[0]}
            </span>
            <ChevronDown size={14} className="hidden lg:block" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-border py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
                <p className="text-xs text-muted truncate">{session.user.email}</p>
              </div>
              <Link href="/account" className="block px-4 py-2 text-sm hover:bg-purple-50" onClick={() => setMenuOpen(false)}>
                My Account
              </Link>
              <Link href="/orders" className="block px-4 py-2 text-sm hover:bg-purple-50" onClick={() => setMenuOpen(false)}>
                My Orders
              </Link>
              <Link href="/wishlist" className="block px-4 py-2 text-sm hover:bg-purple-50" onClick={() => setMenuOpen(false)}>
                Wishlist
              </Link>
              {session.user.role === "SELLER" && (
                <Link href="/seller" className="block px-4 py-2 text-sm hover:bg-purple-50" onClick={() => setMenuOpen(false)}>
                  Seller Dashboard
                </Link>
              )}
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-purple-50" onClick={() => setMenuOpen(false)}>
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login" className="flex items-center gap-2 text-white hover:text-accent transition-colors">
          <User size={20} />
          <span className="hidden lg:block text-sm font-medium">Login / Sign up</span>
        </Link>
      )}

      <Link href="/wishlist" className="text-white hover:text-accent transition-colors hidden sm:block">
        <Heart size={20} />
      </Link>

      <Link href="/cart" className="flex items-center gap-1 text-white hover:text-accent transition-colors relative">
        <ShoppingCart size={22} />
        <span className="hidden lg:block text-sm font-medium">Cart</span>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </div>
  );
}
