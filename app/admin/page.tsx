import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import Link from "next/link";
import { Users, Package, ShoppingBag, FileText } from "lucide-react";
import { syncPendingAutoApprovals } from "@/lib/seller";

export default async function AdminDashboardPage() {
  await syncPendingAutoApprovals();

  const [users, sellers, products, orders, blogs] = await Promise.all([
    prisma.user.count(),
    prisma.sellerProfile.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.blog.count(),
  ]);

  const stats = [
    { label: "Users", value: users, href: "#", icon: Users, color: "from-blue-500 to-cyan-500" },
    { label: "Sellers", value: sellers, href: "/admin/sellers", icon: Users, color: "from-violet-500 to-purple-500" },
    { label: "Products", value: products, href: "#", icon: Package, color: "from-emerald-500 to-green-500" },
    { label: "Orders", value: orders, href: "/admin/orders", icon: ShoppingBag, color: "from-orange-500 to-amber-500" },
    { label: "Blogs", value: blogs, href: "/admin/blogs", icon: FileText, color: "from-pink-500 to-rose-500" },
  ];

  return (
    <AdminShell
      title="Dashboard"
      description="Overview of your marketplace activity and quick admin actions."
    >
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group rounded-2xl border border-border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Homepage Offers", desc: "Edit hero, mid promos and footer banners", href: "/admin/homepage" },
          { title: "Footer Pages", desc: "Privacy, Terms, FAQ and other footer content", href: "/admin/pages" },
          { title: "Manage Orders", desc: "Update statuses, track EDD and payment state", href: "/admin/orders" },
          { title: "Manage Sellers", desc: "Approve sellers, view verification and products", href: "/admin/sellers" },
          { title: "Manage Categories", desc: "Create unlimited category tree for products", href: "/admin/categories" },
          { title: "Manage Blogs", desc: "Create SEO blogs with hero image and rich content", href: "/admin/blogs" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold">{card.title}</h3>
            <p className="text-sm text-muted mt-2">{card.desc}</p>
            <span className="inline-block mt-4 text-sm font-semibold text-primary">Open →</span>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
