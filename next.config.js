/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['pages', 'src', 'library'],
  },
  experimental: {
    swcPlugins: ['@effector/swc-plugin'],
  },
}

module.exports = nextConfig
