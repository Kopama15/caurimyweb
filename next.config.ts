/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // ✅ Disable optimization for static export
  },
};

module.exports = nextConfig;
