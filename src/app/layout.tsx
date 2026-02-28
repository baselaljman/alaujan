import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: 'العوجان للسياحة والسفر | Al-Awajan Travel',
  description: 'احجز تذاكر الحافلات بين الرياض والأردن وسوريا.',
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
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background" style={{ fontFamily: "'Noto Sans Arabic', 'Inter', sans-serif" }}>
        <main className="flex-1 pb-20 md:pb-0 max-w-md mx-auto w-full md:max-w-4xl px-4 py-6">
          {children}
        </main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
