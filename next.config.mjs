/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  optimizeFonts: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
