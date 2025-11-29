/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    // This is often needed to fix the ESM import error for react-pdf
    esmExternals: 'loose',
    // If you are using it in Server Components, you might also need this:
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    // This prevents webpack from trying to bundle 'canvas', which is a node-only dep
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;

