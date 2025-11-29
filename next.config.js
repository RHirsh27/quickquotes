/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle ESM packages like @react-pdf/renderer
  transpilePackages: ['@react-pdf/renderer'],
  
  // Webpack config for PDF rendering
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        canvas: false,
      };
    }
    
    // Handle ESM modules
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    
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