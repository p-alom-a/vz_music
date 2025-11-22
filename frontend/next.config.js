/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['media.pitchfork.com', 'pepouze5-vz-music.hf.space'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.pitchfork.com',
        pathname: '/photos/**',
      },
      {
        protocol: 'https',
        hostname: 'pepouze5-vz-music.hf.space',
        pathname: '/api/image/**',
      },
    ],
  },
}

module.exports = nextConfig
