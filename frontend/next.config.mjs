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
    const gatewayUrl = (
      process.env.GATEWAY_URL ||
      'http://api-gateway:8080'
    ).replace(/\/+$/, '')

    return [
      { 
        source: '/api/auth/:path*',
        destination: `${gatewayUrl}/auth/:path*`,
      },
      {
        source: '/health',
        destination: `${gatewayUrl}/health`,
      },
      {
        source: '/api/profiles/:path*',
        destination: `${gatewayUrl}/auth/profiles/:path*`,
      },
      {
        source: '/api/billing/:path*',
        destination: `${gatewayUrl}/billing/:path*`,
      },
      {
        source: '/api/history/:path*',
        destination: `${gatewayUrl}/history/:path*`,
      },
    ]
  },
}

export default nextConfig