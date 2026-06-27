import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { AdminActivationPanel } from "@/components/admin/AdminActivationPanel";

export default async function AdminPage() {
  await requireRole("ADMIN");

  const [users, sellers, products, orders] = await Promise.all([
    prisma.user.count(),
    prisma.sellerProfile.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);

  const pendingSellers = await prisma.sellerProfile.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { email: true, phone: true } } },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Users", value: users },
          { label: "Sellers", value: sellers },
          { label: "Products", value: products },
          { label: "Orders", value: orders },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {pendingSellers.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="font-semibold mb-4">Pending Seller Approvals</h2>
          <div className="space-y-3">
            {pendingSellers.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium">{s.businessName}</p>
                  <p className="text-xs text-muted">{s.user.email} · {s.city}, {s.state}</p>
                </div>
                <form action={`/api/admin/sellers/${s.id}/approve`} method="POST">
                  <button type="submit" className="bg-success text-white px-3 py-1.5 rounded text-sm font-semibold">
                    Approve
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminActivationPanel />

      <p className="text-sm text-muted">
        <Link href="/admin/categories" className="text-primary font-semibold hover:underline">
          Manage Categories →
        </Link>{" "}
        Add unlimited categories for sellers. Sellers can also request new categories.
      </p>
    </div>
  );
}
