"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  Users,
  FileText,
  Store,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/sellers", label: "Manage Sellers", icon: Users },
  { href: "/admin/categories", label: "Manage Categories", icon: FolderTree },
  { href: "/admin/blogs", label: "Manage Blogs", icon: FileText },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="bg-white border border-border rounded-2xl p-4 h-fit lg:sticky lg:top-24 shadow-sm">
            <div className="flex items-center gap-3 px-2 pb-4 border-b border-border mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white flex items-center justify-center">
                <Store size={18} />
              </div>
              <div>
                <p className="font-bold text-sm">WorthKart Admin</p>
                <p className="text-[11px] text-muted">Control center</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-foreground hover:bg-gray-50"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 rounded-xl bg-gradient-to-r from-primary/10 to-violet-100 border border-primary/10 p-3">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <Sparkles size={14} />
                Admin tools
              </div>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Manage orders, sellers, categories, and blogs from one place.
              </p>
            </div>
          </aside>

          <section className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-border bg-white/90 backdrop-blur p-5 shadow-sm">
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && <p className="text-sm text-muted mt-1">{description}</p>}
            </div>
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
