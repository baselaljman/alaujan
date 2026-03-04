import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const viewport: Viewport = {
  themeColor: '#003d2d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://alaujantravel.com'),
  title: {
    default: 'العوجان للسياحة والسفر | Al-Awajan Travel',
    template: '%s | العوجان للسفر'
  },
  description: 'الموقع الرسمي لشركة العوجان للسياحة والسفر. حجز رحلات دولية بين السعودية والأردن وسوريا، وتتبع مباشر للطرود والحافلات بأحدث التقنيات.',
  keywords: ['العوجان للسفر', 'حجز حافلات سوريا', 'رحلات الأردن', 'تتبع طرود العوجان', 'سفريات الرياض'],
  authors: [{ name: 'Al-Awajan Travel' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'العوجان للسفر',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://alaujantravel.com',
    siteName: 'العوجان للسياحة والسفر',
    title: 'العوجان للسياحة والسفر - رحلتك تبدأ هنا',
    description: 'خدمات النقل الدولي والطرود بين الرياض وعمان ودمشق بأعلى معايير الراحة والأمان.',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="canonical" href="https://alaujantravel.com" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background" style={{ fontFamily: "'Noto Sans Arabic', 'Inter', sans-serif" }}>
        <FirebaseClientProvider>
          <main className="flex-1 pb-24 md:pb-0 max-w-md mx-auto w-full md:max-w-4xl px-4 py-6 mt-[env(safe-area-inset-top)]">
            {children}
          </main>
          <BottomNav />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
