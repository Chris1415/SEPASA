import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  images: {
    remotePatterns: [
      {
        hostname: "*.sitecorecloud.io",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
