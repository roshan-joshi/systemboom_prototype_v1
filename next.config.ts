import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prototype runs entirely on local mock data — no remote image hosts, no APIs.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
