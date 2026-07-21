"use client";

import Link from "next/link";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import {
  User,
  ShoppingCart,
  Heart,
  ChevronDown,
  Package,
  MapPin,
  LogOut,
  Store,
  Bell,
  MoreHorizontal,
} from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { isInternalBuyerEmail } from "@/lib/user-email";
import { useEffect, useRef, useState } from "react";

export function HeaderClient({ session }: { session: Session | null }) {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const hideInternalEmail = isInternalBuyerEmail(session?.user.email);
  const displayName =
    session?.user.name?.trim() ||
    session?.user.phone ||
    (!hideInternalEmail ? session?.user.email?.split("@")[0] : null);
  const welcomeLabel = session?.user.name?.trim()
    ? `Welcome ${session.user.name.trim()}`
    : displayName || "My Account";

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
      {session ? (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setMoreOpen(false);
            }}
            className="flex items-center gap-2 text-white hover:text-accent transition-colors"
          >
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-white/40"
              />
            ) : (
              <User size={20} />
            )}
            <span className="hidden lg:block text-sm font-medium max-w-[140px] truncate">
              {welcomeLabel}
            </span>
            <ChevronDown size={14} className={`hidden lg:block transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-border py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Your Account</p>
                <p className="text-xs text-muted truncate mt-0.5">
                  {session.user.phone || (!hideInternalEmail ? session.user.email : "")}
                </p>
              </div>

              <Link
                href="/account"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50"
                onClick={() => setMenuOpen(false)}
              >
                <User size={16} className="text-muted" /> My Profile
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50"
                onClick={() => setMenuOpen(false)}
              >
                <Package size={16} className="text-muted" /> Orders
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50"
                onClick={() => setMenuOpen(false)}
              >
                <Heart size={16} className="text-muted" /> Wishlist
              </Link>
              <Link
                href="/account#addresses"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50"
                onClick={() => setMenuOpen(false)}
              >
                <MapPin size={16} className="text-muted" /> Saved Addresses
              </Link>

              {session.user.role === "SELLER" && (
                <Link
                  href="/seller"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Store size={16} className="text-muted" /> Seller Dashboard
                </Link>
              )}
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Store size={16} className="text-muted" /> Admin Panel
                </Link>
              )}

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-red-50 border-t border-border mt-1"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-2 text-white hover:text-accent transition-colors"
        >
          <User size={20} />
          <span className="hidden lg:block text-sm font-medium">Login</span>
        </Link>
      )}

      {/* Become a Seller — prominent, Flipkart-style */}
      {(!session || session.user.role === "BUYER") && (
        <Link
          href="/seller/register"
          className="hidden md:inline-flex items-center gap-1.5 text-white text-sm font-medium hover:text-accent transition-colors px-2 py-1 rounded"
        >
          <Store size={16} />
          Become a Seller
        </Link>
      )}

      {/* More menu */}
      <div className="relative hidden sm:block" ref={moreRef}>
        <button
          type="button"
          onClick={() => {
            setMoreOpen((v) => !v);
            setMenuOpen(false);
          }}
          className="flex items-center gap-1 text-white hover:text-accent transition-colors text-sm"
        >
          More
          <ChevronDown size={14} className={moreOpen ? "rotate-180" : ""} />
        </button>
        {moreOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-border py-2 z-50 animate-fade-in">
            {(!session || session.user.role === "BUYER") && (
              <Link
                href="/seller/register"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50 md:hidden"
                onClick={() => setMoreOpen(false)}
              >
                <Store size={16} className="text-muted" /> Become a Seller
              </Link>
            )}
            <Link
              href="/seller/login"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50"
              onClick={() => setMoreOpen(false)}
            >
              <Store size={16} className="text-muted" /> Seller Login
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50"
              onClick={() => setMoreOpen(false)}
            >
              <Bell size={16} className="text-muted" /> Notification Settings
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50"
              onClick={() => setMoreOpen(false)}
            >
              <MoreHorizontal size={16} className="text-muted" /> 24x7 Customer Care
            </Link>
          </div>
        )}
      </div>

      <Link
        href="/cart"
        className="flex items-center gap-1 text-white hover:text-accent transition-colors relative"
      >
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
