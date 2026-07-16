import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dreamplay/db", "@dreamplay/analytics", "@dreamplay/ab", "@dreamplay/email"],
};

export default nextConfig;
