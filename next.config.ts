import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "esbuild"],
  experimental: {
    serverActions: {
      allowedOrigins: ["studio.nintropy.com"]
    }
  }
};

export default nextConfig;
