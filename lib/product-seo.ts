import type { Metadata } from "next";

type ProductForSeo = {
  name: string;
  slug: string;
  description: string;
  brand: string | null;
  price: number;
  mrp: number;
  stock: number;
  rating: number;
  reviewCount: number;
  images: { url: string; alt: string | null; isPrimary: boolean }[];
  category: { name: string; slug: string };
  seller: { businessName: string };
};

export function buildProductMetadata(product: ProductForSeo): Metadata {
  const description =
    product.description.replace(/\s+/g, " ").trim().slice(0, 155) +
    (product.description.length > 155 ? "…" : "");
  const image =
    product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url;
  const title = `${product.name}${product.brand ? ` — ${product.brand}` : ""} | Buy Online at WorthKart`;
  const url = `${getSiteUrl()}/products/${product.slug}`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.brand,
      product.category.name,
      "buy online",
      "WorthKart",
    ].filter(Boolean) as string[],
    openGraph: {
      title: product.name,
      description,
      url,
      siteName: "WorthKart",
      type: "website",
      locale: "en_IN",
      images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildProductJsonLd(
  product: ProductForSeo,
  breadcrumb: { name: string; slug: string }[]
) {
  const image =
    product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url;
  const url = `${getSiteUrl()}/products/${product.slug}`;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description.slice(0, 500),
    image: product.images.map((i) => i.url),
    sku: product.slug,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    category: product.category.name,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: product.seller.businessName,
      },
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl() },
      ...breadcrumb.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: crumb.name,
        item: `${getSiteUrl()}/products?category=${crumb.slug}`,
      })),
      {
        "@type": "ListItem",
        position: breadcrumb.length + 2,
        name: product.name,
        item: url,
      },
    ],
  };

  return [productLd, breadcrumbLd];
}

function getSiteUrl() {
  return process.env.NEXTAUTH_URL || "https://worthkart.com";
}
