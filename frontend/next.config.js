/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output keeps the production Docker image small (only the
  // traced dependency subset is copied) — see frontend/Dockerfile.
  output: 'standalone',
};

module.exports = nextConfig;
