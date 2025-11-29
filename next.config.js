/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle ESM packages like @react-pdf/renderer
  transpilePackages: ['@react-pdf/renderer'],
  
  // External packages for server components
  serverExternalPackages: ['@react-pdf/renderer'],
  
  // Webpack config for PDF rendering
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        canvas: false,
      };
    }
    
    return config;
  },
  
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

module.exports = nextConfig;