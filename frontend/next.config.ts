import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "salt.tkbcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn-img.thethao247.vn",
        pathname: "/**",
      },
      // Allow any remote image URL (use with caution).
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["26.96.49.135"],
};

export default nextConfig;
