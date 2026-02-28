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
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increase limit for image uploads
    },
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
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
      'lucide-react',
    ],
  },
  // Enable fetch logging for debugging polling in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
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
      // Dev-only patterns — excluded from production builds
      ...(process.env.NODE_ENV !== 'production'
        ? [
            {
              protocol: 'http' as const,
              hostname: '192.168.1.9',
              port: '3000',
              pathname: '/**',
            },
            {
              protocol: 'http' as const,
              hostname: 'localhost',
              port: '3000',
              pathname: '/**',
            },
            {
              protocol: 'http' as const,
              hostname: '0.0.0.0',
              port: '3000',
              pathname: '/**',
            },
            {
              protocol: 'http' as const,
              hostname: 'localhost',
              port: '9002',
              pathname: '/**',
            },
          ]
        : []),
    ],
    // SECURITY: dangerouslyAllowSVG allows SVG images through the Next.js Image Optimizer.
    // This is required because our /api/images/* proxy serves user-uploaded images that may
    // include SVG content from external AI services (e.g. Fal.ai placeholder/preview images).
    // The contentDispositionType: 'attachment' mitigates XSS risk by forcing downloads
    // instead of inline rendering when SVGs are accessed directly.
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