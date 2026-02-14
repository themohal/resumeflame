import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/upload": ["./test/data/**/*", "./node_modules/pdf-parse/**/*"],
  },
};

export default nextConfig;
