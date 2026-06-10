/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://api-gateway:8080';
    return [
      {
        source: '/api/auth/:path*',
        destination: `${apiUrl}/auth/:path*`,
      },
      {
        source: '/health',
        destination: `${apiUrl}/health`,
      },
      {
        source: '/api/profiles/:path*',
        destination: `${apiUrl}/auth/profiles/:path*`,
      },
      {
        source: '/api/billing/:path*',
        destination: `${apiUrl}/billing/:path*`,
      },
      {
        source: '/api/history/:path*',
        destination: `${apiUrl}/history/:path*`,
      },
    ];
  },
}

export default nextConfig
