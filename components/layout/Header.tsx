import { auth } from "@/lib/auth";
import { HeaderClient } from "./HeaderClient";
import { CategoryMegaMenu } from "./CategoryMegaMenu";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MapPin, Download, Store, ChevronDown, HelpCircle, Package } from "lucide-react";

export async function Header() {
  const session = await auth();

  const topCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 10,
  });

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top utility bar */}
      <div className="bg-primary-dark text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 hover:text-accent transition-colors">
              <MapPin size={12} />
              <span>Deliver to 110001</span>
              <ChevronDown size={12} />
            </button>
          </div>
          <div className="hidden md:flex items-center gap-5">
            <Link href="#" className="hover:text-accent transition-colors flex items-center gap-1">
              <Download size={12} /> Download App
            </Link>
            <Link href="/seller/register" className="hover:text-accent transition-colors flex items-center gap-1">
              <Store size={12} /> Become a Seller
            </Link>
            <button className="hover:text-accent transition-colors flex items-center gap-1">
              More <ChevronDown size={12} />
            </button>
            <Link href="#" className="hover:text-accent transition-colors flex items-center gap-1">
              <HelpCircle size={12} /> Help
            </Link>
            <Link href="/orders" className="hover:text-accent transition-colors flex items-center gap-1">
              <Package size={12} /> Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-white tracking-tight">
                Worth<span className="text-accent">Kart</span>
              </span>
            </div>
          </Link>

          <HeaderSearchBar />

          <HeaderClient session={session} />
        </div>
      </div>

      {/* Category nav */}
      <div className="bg-white border-b border-border hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            <CategoryMegaMenu />
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="px-3 py-1.5 text-sm text-foreground hover:text-primary hover:bg-purple-50 rounded transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/products?deal=true" className="px-3 py-1.5 text-sm font-semibold text-[#ff4747] hover:bg-red-50 rounded whitespace-nowrap">
              Offer Zone
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
