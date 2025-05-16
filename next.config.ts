// /next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'encrypted-tbn0.gstatic.com',
      'static.vecteezy.com',
      'wallpapers.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'static.vecteezy.com',
      },
      {
        protocol: 'https',
        hostname: 'wallpapers.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Allow any HTTPS domain for profile pictures
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
  reactStrictMode: true,
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: /node_modules/,
    };
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Additional build skips
  experimental: {
    typedRoutes: false,
  },
}

module.exports = nextConfig