/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '/bingo-goal-creator',
  assetPrefix: '/bingo-goal-creator/'
}

module.exports = nextConfig 