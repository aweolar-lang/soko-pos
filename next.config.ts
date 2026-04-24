import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/acceptable-use',
        destination: '/policies/acceptable-use.pdf',
      },
      {
        source: '/shipping',
        destination: '/policies/shipping.pdf',
      },
      {
        source: '/returns',
        destination: '/policies/returns.pdf',
      },
    ]
  },
};

export default nextConfig;
