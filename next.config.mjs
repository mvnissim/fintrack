/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdf-parse usa canvas como dependência opcional — ignoramos
      config.externals = [...(config.externals ?? []), 'canvas']
    }
    return config
  },
}

export default nextConfig
