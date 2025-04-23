import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export', // Enables static HTML export
  trailingSlash: true, // Ensures proper routing in Capacitor
};

export default nextConfig;
