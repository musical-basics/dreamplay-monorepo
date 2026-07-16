import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dreamplay/db", "@dreamplay/analytics", "@dreamplay/ab", "@dreamplay/email"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dreamplaypianos.com",
      },
      {
        protocol: "https",
        hostname: "pub-ae162277c7104eb2b558af08104deafc.r2.dev",
      },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90, 95, 100],
  },
  async redirects() {
    return [
      {
        source: "/shipping",
        destination: "/information-and-policies/shipping",
        permanent: true,
      },
      {
        source: "/special-offer",
        destination: "/intro-offer",
        permanent: true,
      },
      {
        source: "/buy",
        destination: "/shop",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/buy-product",
        destination: "/checkout-pages/buy-product",
      },
      {
        source: "/buy-product2",
        destination: "/checkout-pages/buy-product2",
      },
      {
        source: "/buy-product3",
        destination: "/checkout-pages/buy-product3",
      },
    ];
  },
};

export default nextConfig;
