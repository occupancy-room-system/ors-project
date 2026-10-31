import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/hooks/use-app-store';
import { CommonLayout } from '@/layouts';

export const metadata: Metadata = {
  title: 'Occupancy Room System (ORS) · Software Engineering Lab',
  description:
    'Real-time laboratory seat occupancy, interactive 2D floor plan, QR check-in and session management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AppProvider>
          <CommonLayout>{children}</CommonLayout>
        </AppProvider>
      </body>
    </html>
  );
}
