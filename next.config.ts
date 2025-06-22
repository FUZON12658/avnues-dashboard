import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // compiler: {
  //   removeConsole: {
  //     exclude: ["error"], // keep console.error, remove others like log, warn, etc.
  //   },
  // },
};

export default nextConfig;
