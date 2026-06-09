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
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/auth/:path*`,
      },
      {
        source: '/api/profiles/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/auth/profiles/:path*`,
      },
    ];
  },
}

export default nextConfig
