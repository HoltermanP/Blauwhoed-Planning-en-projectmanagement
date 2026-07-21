import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads van contractstukken/rapporten (PDF's) via server actions.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
