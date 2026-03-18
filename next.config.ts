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
  transpilePackages: [
    '@capacitor/core',
    '@capacitor/android',
    '@capacitor/geolocation',
    '@capacitor-community/background-geolocation'
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    // تجنب تضمين مكتبات Capacitor في جانب الخادم أثناء عملية البناء
    if (isServer) {
      config.externals.push(
        '@capacitor-community/background-geolocation',
        '@capacitor/geolocation',
        '@capacitor/core',
        '@capacitor/android'
      );
    }
    return config;
  },
};

export default nextConfig;
