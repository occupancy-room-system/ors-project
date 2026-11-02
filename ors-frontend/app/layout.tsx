import type { Metadata } from 'next';
import './globals.css';
import { QueryClientWrapper } from '@/providers/queryClient.provider';
import { ToastContainer } from '@/components/toast/toast-container';
import NextTopLoader from 'nextjs-toploader';
import { AppProvider } from '@/hooks/use-app-store';

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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <NextTopLoader
          color="#2563eb"
          showSpinner={false}
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
        />
        <QueryClientWrapper>
          <AppProvider>
            {children}
            <ToastContainer />
          </AppProvider>
        </QueryClientWrapper>
      </body>
    </html>
  );
}
