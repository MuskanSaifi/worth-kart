import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Star, Truck, Shield, RotateCcw, Tag, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductBreadcrumb } from "@/components/products/ProductBreadcrumb";
import { RelatedProductsSection } from "@/components/products/RelatedProductsSection";
import { SimilarProductsCarousel } from "@/components/products/SimilarProductsCarousel";
import { CustomerReviewsSection } from "@/components/products/CustomerReviewsSection";
import { TrackProductView } from "@/components/products/TrackProductView";
import { RecentlyViewedSection } from "@/components/products/RecentlyViewedSection";
import { isProductPubliclyVisible } from "@/lib/products";
import {
  getCategoryBreadcrumb,
  getRelatedProducts,
  getSimilarBrandProducts,
  getRatingBreakdown,
  parseProductDetailItems,
} from "@/lib/product-detail";
import { buildProductMetadata, buildProductJsonLd } from "@/lib/product-seo";

type PageProps = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { isPrimary: "desc" } },
      category: { select: { id: true, name: true, slug: true } },
      seller: { select: { businessName: true, rating: true, status: true } },
      reviews: {
        include: { user: { select: { name: true } } },
        take: 8,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !isProductPubliclyVisible(product)) {
    return { title: "Product Not Found | WorthKart" };
  }
  return buildProductMetadata(product);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || !isProductPubliclyVisible(product)) notFound();

  const [breadcrumb, relatedProducts, similarProducts, ratingBreakdown] = await Promise.all([
    getCategoryBreadcrumb(product.category.id),
    getRelatedProducts(product.id, product.category.id, 10),
    getSimilarBrandProducts(
      product.id,
      { brand: product.brand, categoryId: product.category.id },
      10
    ),
    getRatingBreakdown(product.id, product.rating, product.reviewCount),
  ]);

  const jsonLd = buildProductJsonLd(product, breadcrumb);
  const savings = product.mrp > product.price ? product.mrp - product.price : 0;
  const similarTitle = product.brand
    ? `Similar brands & products`
    : `Similar products in ${product.category.name}`;
  const similarHref = product.brand
    ? `/products?search=${encodeURIComponent(product.brand)}`
    : `/products?category=${product.category.slug}`;
  const detailItems = parseProductDetailItems(product.tags);

  // Avoid duplicate cards between similar carousel and related grid
  const relatedIds = new Set(similarProducts.map((p) => p.id));
  const relatedFiltered = relatedProducts.filter((p) => !relatedIds.has(p.id));

  return (
    <>
      <TrackProductView
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          mrp: product.mrp,
          discount: product.discount,
          rating: product.rating,
          reviewCount: product.reviewCount,
          brand: product.brand,
          images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
        }}
      />
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <article className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <ProductBreadcrumb crumbs={breadcrumb} productName={product.name} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-5">
            <ProductImageGallery images={product.images} productName={product.name} />
          </div>

          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-4 space-y-4">
              {product.brand && (
                <Link
                  href={`/products?search=${encodeURIComponent(product.brand)}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Tag size={14} />
                  {product.brand}
                </Link>
              )}

              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-snug text-foreground">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 bg-success text-white text-sm font-semibold px-2.5 py-1 rounded">
                  {product.rating.toFixed(1)} <Star size={13} fill="white" />
                </span>
                <a href="#customer-reviews" className="text-sm text-primary font-medium hover:underline">
                  {product.reviewCount.toLocaleString("en-IN")} Ratings &amp; Reviews
                </a>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="text-xs bg-gray-100 text-muted px-2 py-1 rounded hover:bg-gray-200"
                >
                  {product.category.name}
                </Link>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 md:p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-3xl md:text-4xl font-bold text-foreground">
                    {formatPrice(product.price)}
                  </span>
                  {product.mrp > product.price && (
                    <>
                      <span className="text-lg text-muted line-through">{formatPrice(product.mrp)}</span>
                      <span className="text-success font-bold text-lg">{product.discount}% off</span>
                    </>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-sm text-success font-medium mt-1">
                    You save {formatPrice(savings)}
                  </p>
                )}
                <p className="text-xs text-muted mt-2">Inclusive of all taxes</p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    icon: Truck,
                    text: product.price > 499 ? "FREE Delivery" : "Delivery ₹40",
                    color: "text-success",
                  },
                  { icon: Shield, text: "100% Original Guarantee", color: "text-primary" },
                  { icon: RotateCcw, text: "7 Days Easy Return", color: "text-orange-500" },
                ].map(({ icon: Icon, text, color }) => (
                  <li
                    key={text}
                    className="flex items-center gap-2 text-sm bg-card border border-border rounded-lg px-3 py-2.5"
                  >
                    <Icon size={16} className={color} />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="p-3 bg-gray-50 rounded-xl border border-border text-sm space-y-3">
                <Link
                  href={`/sellers/${product.sellerId}`}
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Package size={18} className="text-muted shrink-0" />
                  <div>
                    <span className="text-muted">Sold by </span>
                    <span className="font-semibold">{product.seller.businessName}</span>
                    {product.seller.rating > 0 && (
                      <span className="ml-2 text-xs bg-success text-white px-1.5 py-0.5 rounded font-medium">
                        {product.seller.rating.toFixed(1)} ★
                      </span>
                    )}
                  </div>
                </Link>

                <Link
                  href={`/sellers/${product.sellerId}`}
                  className="inline-flex items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  View Seller Profile
                </Link>
              </div>

              {product.stock === 0 ? (
                <p className="text-danger font-semibold">Currently out of stock</p>
              ) : product.stock <= 5 ? (
                <p className="text-orange-600 text-sm font-medium">Only {product.stock} left — order soon!</p>
              ) : (
                <p className="text-success text-sm font-medium">In stock</p>
              )}

              <div className="flex gap-3 pt-2">
                <AddToCartButton productId={product.id} />
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 bg-card rounded-xl border border-border p-5 md:p-6" aria-labelledby="description-heading">
          <h2 id="description-heading" className="font-bold text-lg mb-4">
            Product Description
          </h2>
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
          {detailItems.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border">
              <h3 className="font-semibold text-base mb-3">Product Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {detailItems.map((item) => (
                  <div key={item.key} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 break-words">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <SimilarProductsCarousel
          title={similarTitle}
          products={similarProducts}
          viewAllHref={similarHref}
          sponsored
        />

        <div id="customer-reviews">
          <CustomerReviewsSection
            productName={product.name}
            breakdown={ratingBreakdown}
            reviews={product.reviews}
          />
        </div>

        <RelatedProductsSection products={relatedFiltered} />
        <RecentlyViewedSection excludeId={product.id} />
      </article>
    </>
  );
}
