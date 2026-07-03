import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/cover-letter",
        destination: "/application-materials",
        permanent: true,
      },
      {
        source: "/why-work-here",
        destination: "/application-materials",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
