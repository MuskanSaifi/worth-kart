import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, MapPin, Package, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { publicProductFilter } from "@/lib/products";
import { productCardImagesInclude } from "@/lib/product-images";
import { ProductCard } from "@/components/products/ProductCard";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getSellerWithProducts(id: string) {
  return prisma.sellerProfile.findFirst({
    where: {
      id,
      status: "APPROVED",
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      products: {
        where: publicProductFilter,
        include: {
          images: productCardImagesInclude,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const seller = await prisma.sellerProfile.findFirst({
    where: { id, status: "APPROVED" },
    select: { businessName: true, city: true, state: true },
  });

  if (!seller) {
    return { title: "Seller Not Found | WorthKart" };
  }

  const location = [seller.city, seller.state].filter(Boolean).join(", ");
  return {
    title: `${seller.businessName} Store | WorthKart`,
    description: location
      ? `Shop products from ${seller.businessName} in ${location} on WorthKart.`
      : `Shop products from ${seller.businessName} on WorthKart.`,
    alternates: {
      canonical: `/sellers/${id}`,
    },
  };
}

export default async function SellerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const seller = await getSellerWithProducts(id);

  if (!seller) notFound();

  const location = [seller.city, seller.state].filter(Boolean).join(", ");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Seller Store</p>
              <h1 className="text-2xl md:text-3xl font-bold">{seller.businessName}</h1>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted">
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {location}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Package size={14} />
                {seller.products.length} products
              </span>
              {seller.rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className="text-yellow-500" fill="currentColor" />
                  {seller.rating.toFixed(1)} seller rating
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">About this seller</p>
            <p className="mt-1 text-muted">
              {seller.user?.name || seller.businessName} is selling on WorthKart
              {location ? ` from ${location}` : ""}.
            </p>
            {seller.totalSales > 0 && (
              <p className="mt-2 text-foreground font-medium">
                {seller.totalSales.toLocaleString("en-IN")} total sales
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">All Products</h2>
          <p className="text-sm text-muted">
            Browse all public products from {seller.businessName}
          </p>
        </div>
        <Link href="/products" className="text-sm font-medium text-primary hover:underline">
          View all marketplace products
        </Link>
      </div>

      {seller.products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-muted">
          No public products available for this seller yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {seller.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
