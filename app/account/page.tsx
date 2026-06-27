import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: true,
      _count: { select: { orders: true, wishlist: true } },
      sellerProfile: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">My Account</h1>

      <div className="bg-card rounded-lg border border-border p-5 mb-4">
        <h2 className="font-semibold mb-3">Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted">Name:</span> <span className="font-medium">{user.name || "—"}</span></div>
          <div><span className="text-muted">Email:</span> <span className="font-medium">{user.email}</span></div>
          <div><span className="text-muted">Phone:</span> <span className="font-medium">{user.phone || "—"}</span></div>
          <div><span className="text-muted">Role:</span> <span className="font-medium capitalize">{user.role.toLowerCase()}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{user._count.orders}</p>
          <p className="text-sm text-muted">Orders</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{user._count.wishlist}</p>
          <p className="text-sm text-muted">Wishlist Items</p>
        </div>
      </div>

      {user.addresses.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="font-semibold mb-3">Saved Addresses</h2>
          <div className="space-y-3">
            {user.addresses.map((addr) => (
              <div key={addr.id} className="text-sm p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{addr.name} · {addr.phone}</p>
                <p className="text-muted">{addr.line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
