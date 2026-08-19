import { fileURLToPath } from 'node:url';

const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const basePath = configuredBasePath === '/' ? '' : configuredBasePath.replace(/\/$/, '');
const hooksSourceDirectory = fileURLToPath(new URL('../../packages/hooks/src', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  ...(process.env.NODE_ENV === 'development' ? {} : { output: 'export' }),
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: { unoptimized: true },
  poweredByHeader: false,
  transpilePackages: ['better-hook'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack(config, { dev }) {
    if (dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'better-hook': hooksSourceDirectory,
      };
      config.resolve.extensionAlias = {
        ...config.resolve.extensionAlias,
        '.js': ['.ts', '.tsx', '.js'],
      };
    }

    return config;
  },
};

export default nextConfig;
