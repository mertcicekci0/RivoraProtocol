/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@tensorflow/tfjs'],
  },
  images: {
    domains: ['images.pexels.com'],
  },
  webpack: (config, { isServer }) => {
    // Optimize TensorFlow.js for production
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Bundle analyzer optimization
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          tensorflow: {
            test: /[\\/]node_modules[\\/](@tensorflow)[\\/]/,
            name: 'tensorflow',
            chunks: 'all',
            priority: 20,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };
    
    return config;
  },
  // Performance optimizations
  compress: true,
  swcMinify: true,
  poweredByHeader: false,
}

module.exports = nextConfig