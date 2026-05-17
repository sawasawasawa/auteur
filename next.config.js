/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '50mb' } },
  // Long-running render routes
  api: undefined,
};
module.exports = nextConfig;
