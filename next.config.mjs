/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['tough-cookie', 'axios-cookiejar-support']
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts'],
      '.mjs': ['.mjs', '.ts'],
      '.cjs': ['.cjs', '.ts']
    };
    return config;
  }
};

export default nextConfig;
