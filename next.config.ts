// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable Statically Typed Routes
  typedRoutes: true,

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Keep webpack config for non-Turbopack builds
  webpack(config: any) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule: any) =>
      rule.test?.test?.('.svg'),
    )

    config.module.rules.push(
      // Re-apply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ['@svgr/webpack'],
      }
    )

    // Modify the original rule to exclude `.svg` files
    // so that it will be handled by our new rule
    fileLoaderRule.exclude = /\.svg$/i

    return config
  },
  output: 'standalone',
  experimental: {
    reactCompiler: true,
    serverActions: {
      bodySizeLimit: '50mb', // Increase limit for image uploads
    },
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
  },
  // Enable fetch logging for debugging polling in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Build caching configuration for faster subsequent builds
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB - optimize build cache
  cacheHandler: process.env.NODE_ENV === 'production'
    ? undefined // Use default in production
    : undefined, // Default for development
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.refashion.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'v3.fal.media',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.9',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '0.0.0.0',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9002',
        pathname: '/**',
      },
    ],
    // Allow the Image Optimizer to process images from our own API routes
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/images/:path*',
      },
    ];
  },
};

export default nextConfig;