import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { BACKDEND_BASE_URL, FE_BASE_URL } from "./constants/api";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/google/callback",
        destination: "/api/auth/google/callback", // Don't proxy this, let the app route handle it
      },
      {
        source: "/api/:path*",
        destination: `${BACKDEND_BASE_URL}/:path*`,
      },
    ];
  },
  allowedDevOrigins: [
    `${FE_BASE_URL!.replace(/^https?:\/\//, "")}`,
    "localhost:4000",
  ],
  output: "standalone",
};

export default withNextIntl(nextConfig);
