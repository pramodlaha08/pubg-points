import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
        pathname: "/dhe1ksxg2/image/upload/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dhe1ksxg2/image/upload/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/temp/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/temp/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: "/controller", destination: "/admin/live", permanent: true },
      {
        source: "/controller/:path*",
        destination: "/admin/live/:path*",
        permanent: true,
      },
      {
        source: "/teams/create",
        destination: "/admin/teams/new",
        permanent: true,
      },
      {
        source: "/teams/delete",
        destination: "/admin/teams",
        permanent: true,
      },
      {
        source: "/admin/teams/create",
        destination: "/admin/teams/new",
        permanent: true,
      },
      {
        source: "/admin/teams/delete",
        destination: "/admin/teams",
        permanent: true,
      },
      { source: "/rounds", destination: "/admin/rounds", permanent: true },
      { source: "/positions", destination: "/admin/positions", permanent: true },
      { source: "/settings", destination: "/admin/design", permanent: true },
    ];
  },
};

export default nextConfig;
