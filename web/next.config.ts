import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/artworks": ["./data/**/*.json"],
  },
};

export default nextConfig;
