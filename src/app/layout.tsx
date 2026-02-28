import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: 'Al-Awajan Travel | العوجان للسياحة والسفر',
  description: 'Book bus tickets between Riyadh, Jordan, and Syria.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background">
        <main className="flex-1 pb-20 md:pb-0 max-w-md mx-auto w-full md:max-w-4xl px-4 py-6">
          {children}
        </main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
