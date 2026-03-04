
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // تفعيل التصدير الثابت لتحويل التطبيق إلى ملفات يفهمها الجوال
  output: 'export',
  // تعطيل تحسين الصور لأن الجوال يحتاج لملفات محلية
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
};

export default nextConfig;
