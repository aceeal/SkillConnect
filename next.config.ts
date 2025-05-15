// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental.appDir as it's no longer needed
  // App Router is now the default in Next.js 13.4+
  
  // Add configurations for images and file uploads
  images: {
    domains: ['localhost'],
  },
  
  // Enable React strict mode for best practices
  reactStrictMode: true,
  
  // Ensure the uploads directory is accessible
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: /node_modules/,
    };
    return config;
  },
}

module.exports = nextConfig