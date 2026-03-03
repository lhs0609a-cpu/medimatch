/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'medimatch-files.s3.ap-northeast-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
    ],
  },
  async rewrites() {
    // NEXT_PUBLIC_API_URL contains /api/v1, strip it to get the backend base for rewrites
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const backendBase = apiUrl.replace(/\/api\/v1$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/emr/opening',
        destination: '/opening-project',
        permanent: true,
      },
      {
        source: '/emr/opening/:path*',
        destination: '/opening-project/:path*',
        permanent: true,
      },
      {
        source: '/opening',
        destination: '/opening-project',
        permanent: false,
      },
      {
        source: '/opening/phase/:id',
        destination: '/opening-project/phase/:id',
        permanent: false,
      },
      {
        source: '/opening/wizard',
        destination: '/opening-project/wizard',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
