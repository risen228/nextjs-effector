const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['pages', 'src', 'library'],
  },
  webpack: (config) => {
    /*
     * Prevent using effector .mjs extension in "web" version of bundle
     * Otherwise, we can face different bugs when using effector
     */

    config.resolve.alias.effector = path.resolve(
      './node_modules/effector/effector.cjs.js'
    )

    config.resolve.alias['effector-react/scope'] = path.resolve(
      './node_modules/effector-react/scope.js'
    )

    return config
  },
}

module.exports = nextConfig
