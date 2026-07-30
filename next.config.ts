import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN IPs to access Next.js dev resources (needed for app/Cashfree SDK on phone)
  allowedDevOrigins: ["192.168.1.150", "192.168.1.148", "192.168.1.146", "192.168.1.*"],
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
