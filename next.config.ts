import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/:path*',
          destination: 'https://cyberlabs.framer.ai/:path*',
        },
      ],
    };
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
