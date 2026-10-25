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
      {
        // The blog is its own app on blog.dreamplaypianos.com; /blog was in
        // the sitemap and 404'd here.
        source: "/blog",
        destination: "https://blog.dreamplaypianos.com/blog",
        permanent: false,
      },
      {
        // D19: /customize2 was swapped in as /customize (2026-10-12).
        // Temporary so the path stays free to reuse.
        source: "/customize2",
        destination: "/customize",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      // Legacy email tracking paths (emails sent by dreamplay-email-3 point at
      // /api/track/* on the tracking hosts; params c/s/u match the new routes).
      {
        source: "/api/track/open",
        destination: "/api/email/open",
      },
      // Bare /api/track on the EMAIL host is the legacy dp-email-2 event sink
      // (subscriber_id/type payloads) — route it to the email receiver instead
      // of the analytics ingest, which expects a different schema.
      {
        source: "/api/track",
        has: [{ type: "host", value: "email.dreamplaypianos.com" }],
        destination: "/api/email/track",
      },
      {
        source: "/api/track/click",
        destination: "/api/email/click",
      },
      // Legacy subscriber resolution used by old sites' tracker snippets.
      {
        source: "/api/resolve-subscriber",
        destination: "/api/email/resolve-subscriber",
      },
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
