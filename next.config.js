/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '50mb' } },
  // Remotion bundler + renderer pull in native binaries (rspack, esbuild) that
  // webpack cannot parse. Keep them external so Node requires them at runtime.
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/cli',
    '@rspack/core',
    '@rspack/binding',
    'esbuild',
  ],
};
module.exports = nextConfig;
