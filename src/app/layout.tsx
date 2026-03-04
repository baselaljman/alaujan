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
  title: 'العوجان للسياحة والسفر | Al-Awajan Travel',
  description: 'احجز تذاكر الحافلات بين الرياض والأردن وسوريا.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'العوجان للسفر',
  },
  formatDetection: {
    telephone: true,
  },
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
