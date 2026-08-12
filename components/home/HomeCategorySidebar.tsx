"use client";

import Link from "next/link";
import {
  Tag,
  Smartphone,
  Laptop,
  Tv,
  Shirt,
  Sparkles,
  Home,
  ShoppingBasket,
  Baby,
  Dumbbell,
  Watch,
  Headphones,
  MoreHorizontal,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { name: "Top Offers", href: "/products?deal=true", icon: Tag },
  { name: "Mobiles & Tablets", href: "/products?category=mobiles", icon: Smartphone },
  { name: "Electronics", href: "/products?category=electronics", icon: Laptop },
  { name: "TVs & Appliances", href: "/products?category=tvs-appliances", icon: Tv },
  { name: "Fashion", href: "/products?category=fashion", icon: Shirt },
  { name: "Beauty & Personal Care", href: "/products?category=beauty", icon: Sparkles },
  { name: "Home & Furniture", href: "/products?category=home-furniture", icon: Home },
  { name: "Grocery", href: "/products?category=grocery", icon: ShoppingBasket },
  { name: "Baby & Kids", href: "/products?category=kids", icon: Baby },
  { name: "Sports & Fitness", href: "/products?category=sports", icon: Dumbbell },
  { name: "Smartwatches", href: "/products?category=electronics", icon: Watch },
  { name: "Audio", href: "/products?category=electronics", icon: Headphones },
  { name: "More Categories", href: "/products", icon: MoreHorizontal },
];

export function HomeCategorySidebar() {
  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 flex-col self-stretch bg-white rounded-xl border border-border overflow-hidden min-h-[420px]">
      <div className="flex items-center gap-2 px-4 py-3 bg-primary text-white font-semibold text-sm shrink-0">
        <LayoutGrid size={16} />
        Shop by Category
      </div>
      <nav className="py-1 flex-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-foreground hover:bg-purple-50 hover:text-primary transition-colors group"
          >
            <item.icon size={15} className="text-muted group-hover:text-primary shrink-0" />
            <span className="flex-1 truncate">{item.name}</span>
            <ChevronRight size={13} className="text-border group-hover:text-primary shrink-0" />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
