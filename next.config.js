/** @type {import('next').NextConfig} */

// EXTREME CACHE BUST - 20260218131131
// Force Vercel to invalidate all caches
const nextConfig = {
  // Disable all caching
  generateEtags: false,
  poweredByHeader: false,
  
  // Use webpack instead of turbopack to avoid conflicts
  turbo: {},
  
  // Cache control headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Cache-Bust',
            value: '20260218131131',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig