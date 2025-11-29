/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    // This is the correct key for Next.js 14
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
};

export default nextConfig;

