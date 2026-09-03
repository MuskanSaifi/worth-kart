import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/seller/dashboard",
          "/seller/inventory",
          "/seller/orders",
          "/seller/packaging",
          "/seller/payments",
          "/seller/pricing",
          "/seller/quality",
          "/seller/returns",
          "/seller/warehouse",
          "/seller/claims",
          "/seller/notices",
          "/seller/services",
          "/seller/support",
          "/account",
          "/account/",
          "/cart",
          "/checkout",
          "/checkout/",
          "/orders",
          "/orders/",
          "/wishlist",
          "/api/",
          "/app-pay/",
        ],
      },
    ],
    sitemap: "https://worthkart.in/sitemap.xml",
    host: "https://worthkart.in",
  };
}
