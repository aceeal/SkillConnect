// /next.config.js - Enhanced with better image handling
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Add more common image domains
    domains: [
      'localhost',
      'encrypted-tbn0.gstatic.com',
      'static.vecteezy.com',
      'wallpapers.com',
      'res.cloudinary.com', // Cloudinary
      'images.unsplash.com', // Unsplash
      'via.placeholder.com', // Placeholder service
      'picsum.photos', // Lorem Picsum
      'i.imgur.com', // Imgur
      'lh3.googleusercontent.com', // Google Photos/Profile
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
      // Cloudinary specific pattern
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Common image hosting services
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Allow any HTTPS domain (keep as fallback)
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    // Add these options for better image handling
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  experimental: {
    typedRoutes: false,
  },
}

module.exports = nextConfig