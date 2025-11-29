/** @type {import('next').NextConfig} */
const nextConfig = {
  // This fixes the @react-pdf/renderer build error
  serverExternalPackages: ['@react-pdf/renderer'],
  
  // This ensures images work if we add them later
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