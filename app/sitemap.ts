import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { publicProductFilter } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://worthkart.in";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/seller/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const [categories, products, pages, sellers] = await Promise.all([
      prisma.category.findMany({
        select: { slug: true, createdAt: true },
      }),
      prisma.product.findMany({
        where: publicProductFilter,
        select: { slug: true, updatedAt: true },
        take: 1000,
      }),
      prisma.sitePage.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.sellerProfile.findMany({
        where: { status: "APPROVED" },
        select: { id: true, updatedAt: true },
      }),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/products?category=${encodeURIComponent(cat.slug)}`,
      lastModified: cat.createdAt || new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
      url: `${baseUrl}/products/${prod.slug}`,
      lastModified: prod.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const pageRoutes: MetadataRoute.Sitemap = pages.map((page) => ({
      url: `${baseUrl}/pages/${page.slug}`,
      lastModified: page.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const sellerRoutes: MetadataRoute.Sitemap = sellers.map((seller) => ({
      url: `${baseUrl}/sellers/${seller.id}`,
      lastModified: seller.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...categoryRoutes,
      ...productRoutes,
      ...pageRoutes,
      ...sellerRoutes,
    ];
  } catch (error) {
    console.error("[sitemap] Failed to generate full dynamic sitemap:", error);
    return staticRoutes;
  }
}
