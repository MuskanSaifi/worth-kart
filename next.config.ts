import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN IPs to access Next.js dev resources (needed for app/Cashfree SDK on phone)
  allowedDevOrigins: [
    "localhost:8081",
    "127.0.0.1:8081",
    "192.168.1.80",
    "192.168.1.150",
    "192.168.1.148",
    "192.168.1.146",
    "192.168.1.*",
  ],
  // Expo web (browser) calls /api from another origin — needs CORS
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "**" },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
