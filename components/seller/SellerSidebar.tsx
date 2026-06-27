"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  RotateCcw,
  Tag,
  Barcode,
  AlertCircle,
  Boxes,
  Upload,
  Star,
  Wallet,
  Warehouse,
  Wrench,
  Bell,
  Headphones,
  ChevronDown,
  LogOut,
  Store,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/seller", icon: Home },
  { label: "Orders", href: "/seller/orders", icon: Package },
  { label: "Returns", href: "/seller/returns", icon: RotateCcw },
  { label: "Pricing", href: "/seller/pricing", icon: Tag },
  { label: "Barcoded Packaging", href: "/seller/packaging", icon: Barcode },
  { label: "Claims", href: "/seller/claims", icon: AlertCircle },
  { label: "Inventory", href: "/seller/inventory", icon: Boxes },
  { label: "Catalog Uploads", href: "/seller/catalog", icon: Upload },
  { label: "Quality", href: "/seller/quality", icon: Star },
  { label: "Payments", href: "/seller/payments", icon: Wallet },
  { label: "Warehouse", href: "/seller/warehouse", icon: Warehouse },
  { label: "Services", href: "/seller/services", icon: Wrench },
];

interface SellerSidebarProps {
  businessName: string;
  noticeCount?: number;
}

export function SellerSidebar({ businessName, noticeCount = 0 }: SellerSidebarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/seller") return pathname === "/seller" || pathname === "/seller/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-[220px] bg-[#1a1a2e] text-white flex flex-col h-full flex-shrink-0">
      {/* Profile */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 w-full text-left hover:bg-white/5 rounded-lg p-2 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#ff4747] flex items-center justify-center text-sm font-bold">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{businessName}</p>
            <p className="text-[10px] text-gray-400">Supplier Hub</p>
          </div>
          <ChevronDown size={14} className={cn("transition-transform", profileOpen && "rotate-180")} />
        </button>
        {profileOpen && (
          <div className="mt-2 bg-[#252540] rounded-lg py-1 text-sm">
            <Link href="/seller/warehouse" className="block px-3 py-2 hover:bg-white/5">Account Settings</Link>
            <Link href="/" className="block px-3 py-2 hover:bg-white/5 flex items-center gap-2">
              <Store size={14} /> View Store
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-3 py-2 hover:bg-white/5 text-red-400 flex items-center gap-2"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="px-3 py-3 space-y-1 border-b border-white/10">
        <Link
          href="/seller/notices"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-2"><Bell size={16} /> Notices</span>
          {noticeCount > 0 && (
            <span className="bg-[#ff4747] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {noticeCount}
            </span>
          )}
        </Link>
        <Link href="/seller/support" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors">
          <Headphones size={16} /> Support
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 px-3 mb-2">Manage Business</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors relative",
              isActive(item.href)
                ? "bg-white/10 text-white font-medium"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
            )}
          >
            {isActive(item.href) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#ff4747] rounded-r" />
            )}
            <item.icon size={17} />
            <span className="leading-tight">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
