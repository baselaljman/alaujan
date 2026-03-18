import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'xn--ogbhrq.vip',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // الحل الرسمي لدمج مكتبات Capacitor مع Next.js 15
  transpilePackages: [
    '@capacitor/core',
    '@capacitor/android',
    '@capacitor/geolocation',
    '@capacitor-community/background-geolocation'
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@capacitor/core': 'commonjs @capacitor/core',
        '@capacitor/geolocation': 'commonjs @capacitor/geolocation',
        '@capacitor-community/background-geolocation': 'commonjs @capacitor-community/background-geolocation'
      });
    }
    return config;
  },
};

export default nextConfig;