import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailVerification } from "@/components/account/EmailVerification";
import { BuyerProfileForm } from "@/components/account/BuyerProfileForm";
import { SavedAddressesManager } from "@/components/account/SavedAddressesManager";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      _count: { select: { orders: true, wishlist: true } },
      sellerProfile: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">My Account</h1>

      <div className="bg-card rounded-lg border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">My Profile</h2>
          <span className="text-xs uppercase tracking-wide text-muted bg-gray-50 border border-border px-2 py-1 rounded">
            {user.role.toLowerCase()}
          </span>
        </div>

        {user.role === "BUYER" ? (
          <div className="space-y-6">
            <BuyerProfileForm
              user={{
                name: user.name,
                phone: user.phone,
                image: user.image,
              }}
            />
            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold mb-3">Email (optional)</h3>
              <p className="text-xs text-muted mb-3">
                Verify email later for order receipts. Login still works with mobile OTP.
              </p>
              <EmailVerification
                initialEmail={user.emailVerified ? user.email : ""}
                verified={user.emailVerified}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted">Name:</span>{" "}
              <span className="font-medium">{user.name || "—"}</span>
            </div>
            <div>
              <span className="text-muted">Email:</span>{" "}
              <span className="font-medium">{user.email}</span>
            </div>
            <div>
              <span className="text-muted">Phone:</span>{" "}
              <span className="font-medium">{user.phone || "—"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Link
          href="/orders"
          className="bg-card rounded-lg border border-border p-4 text-center hover:border-primary transition-colors"
        >
          <p className="text-2xl font-bold text-primary">{user._count.orders}</p>
          <p className="text-sm text-muted">Orders</p>
        </Link>
        <Link
          href="/wishlist"
          className="bg-card rounded-lg border border-border p-4 text-center hover:border-primary transition-colors"
        >
          <p className="text-2xl font-bold text-primary">{user._count.wishlist}</p>
          <p className="text-sm text-muted">Wishlist Items</p>
        </Link>
      </div>

      <SavedAddressesManager
        initialAddresses={user.addresses}
        defaultName={user.name}
        defaultPhone={user.phone}
      />
    </div>
  );
}
