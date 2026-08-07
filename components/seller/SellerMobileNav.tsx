"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Boxes, Upload, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/seller", label: "Home", icon: Home, exact: true },
  { href: "/seller/orders", label: "Orders", icon: Package },
  { href: "/seller/inventory", label: "Stock", icon: Boxes },
  { href: "/seller/catalog", label: "Catalog", icon: Upload },
  { href: "/seller/payments", label: "Pay", icon: Wallet },
];

export function SellerMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[220] bg-white border-t border-gray-200 safe-bottom">
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === "/seller" || pathname === "/seller/dashboard"
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold",
                active ? "text-primary" : "text-gray-500"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
