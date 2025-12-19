/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'medimatch-files.s3.ap-northeast-2.amazonaws.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
