import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, Truck, Shield, RotateCcw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { isProductPubliclyVisible } from "@/lib/products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: true,
      category: true,
      seller: { select: { businessName: true, rating: true, status: true } },
      reviews: { include: { user: { select: { name: true } } }, take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  if (!product || !isProductPubliclyVisible(product)) notFound();

  const primaryImage = product.images.find((i) => i.isPrimary) || product.images[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-card rounded-lg border border-border p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center p-6">
              {primaryImage && (
                <Image
                  src={primaryImage.url}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="object-contain max-h-full"
                  unoptimized
                />
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {product.images.map((img) => (
                  <div key={img.id} className="w-16 h-16 bg-gray-50 rounded border border-border flex-shrink-0 p-1">
                    <Image src={img.url} alt="" width={60} height={60} className="object-contain w-full h-full" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.brand && (
              <Link href={`/products?search=${product.brand}`} className="text-sm text-muted hover:text-primary">
                {product.brand}
              </Link>
            )}
            <h1 className="text-xl md:text-2xl font-semibold mt-1 leading-snug">{product.name}</h1>

            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center gap-1 bg-success text-white text-sm font-medium px-2 py-0.5 rounded">
                {product.rating.toFixed(1)} <Star size={12} fill="white" />
              </span>
              <span className="text-sm text-primary font-medium">{product.reviewCount} Ratings</span>
            </div>

            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
              {product.mrp > product.price && (
                <>
                  <span className="text-lg text-muted line-through">{formatPrice(product.mrp)}</span>
                  <span className="text-success font-semibold">{product.discount}% off</span>
                </>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Truck size={16} className="text-success" />
                <span>{product.price > 499 ? "FREE Delivery" : "Delivery ₹40"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield size={16} className="text-primary" />
                <span>100% Original Product Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw size={16} className="text-orange-500" />
                <span>7 Days Easy Return</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
              <span className="text-muted">Sold by:</span>{" "}
              <span className="font-medium">{product.seller.businessName}</span>
              {product.seller.rating > 0 && (
                <span className="ml-2 text-xs bg-success text-white px-1.5 py-0.5 rounded">
                  {product.seller.rating.toFixed(1)} ★
                </span>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <AddToCartButton productId={product.id} />
            </div>

            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-danger text-sm mt-2">Only {product.stock} left in stock!</p>
            )}
            {product.stock === 0 && (
              <p className="text-danger text-sm mt-2 font-medium">Out of Stock</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 border-t border-border pt-6">
          <h2 className="font-semibold text-lg mb-3">Product Description</h2>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>

        {/* Reviews */}
        {product.reviews.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="font-semibold text-lg mb-4">Customer Reviews</h2>
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-success text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {review.rating} ★
                    </span>
                    <span className="text-sm font-medium">{review.user.name || "User"}</span>
                  </div>
                  {review.comment && <p className="text-sm text-muted mt-1">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
