/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets automated checks build/run in a separate folder so they never corrupt a running `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
