import { auth } from "@/lib/auth";
import { HeaderClient } from "./HeaderClient";
import { CategoryMegaMenu } from "./CategoryMegaMenu";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Download, ChevronDown, HelpCircle, Package, Phone } from "lucide-react";
import type { Session } from "next-auth";

export async function Header() {
  let session: Session | null = null;
  try {
    session = await auth();
  } catch (error) {
    console.error(
      "[Header] auth() failed (check AUTH_SECRET + NEXTAUTH_URL=https://worthkart.in):",
      error instanceof Error ? error.message : error
    );
  }

  let topCategories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  try {
    topCategories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 8,
    });
  } catch (error) {
    console.error(
      "[Header] MongoDB connection failed. Whitelist your IP in Atlas → Network Access:",
      error instanceof Error ? error.message : error
    );
  }

  return (
    <header className="sticky top-0 z-50 shadow-sm bg-white">
      {/* Top utility + promo */}
      <div className="bg-primary-dark text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
          <button type="button" className="flex items-center gap-1 hover:text-accent transition-colors shrink-0">
            <MapPin size={12} />
            <span>Deliver to 110001</span>
            <ChevronDown size={12} />
          </button>
          <p className="hidden md:block text-center text-purple-100 truncate flex-1 px-2">
            Big Savings! Flat 10% instant discount on select bank cards ·{" "}
            <Link href="/products?deal=true" className="underline font-semibold text-white hover:text-accent">
              View Offers
            </Link>
          </p>
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <Link href="#" className="hover:text-accent transition-colors flex items-center gap-1">
              <Download size={12} /> Download App
            </Link>
            <Link href="/help" className="hover:text-accent transition-colors flex items-center gap-1">
              <HelpCircle size={12} /> Help
            </Link>
            <Link href="/orders" className="hover:text-accent transition-colors flex items-center gap-1">
              <Package size={12} /> Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* Main white header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2.5 md:py-3 flex items-center gap-3 md:gap-4">
          <Link href="/" className="flex-shrink-0" aria-label="WorthKart Home">
            <Image
              src="/logo.png"
              alt="WorthKart"
              width={220}
              height={80}
              priority
              className="h-12 sm:h-14 md:h-16 w-auto object-contain"
            />
          </Link>

          <HeaderSearchBar variant="light" />

          <div className="hidden lg:flex items-center gap-2 text-foreground shrink-0 mr-1">
            <Phone size={16} className="text-primary" />
            <div className="leading-tight">
              <p className="text-[11px] text-muted">Support</p>
              <a href="tel:9315804600" className="text-xs font-semibold hover:text-primary">
                9315804600
              </a>
            </div>
          </div>

          <HeaderClient session={session} variant="light" />
        </div>
      </div>

      {/* Category nav */}
      <div className="bg-white border-b border-border hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 py-2">
            <div className="shrink-0">
              <CategoryMegaMenu />
            </div>

            <div className="relative flex-1 min-w-0">
              <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide pr-3">
                {topCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className="px-2.5 py-1.5 text-[13px] text-foreground hover:text-primary hover:bg-purple-50 rounded-md transition-colors whitespace-nowrap"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
              />
            </div>

            <Link
              href="/products?deal=true"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-[#e11d48] bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full whitespace-nowrap transition-colors"
            >
              <span className="text-[11px] leading-none">%</span>
              Offer Zone
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
