import type { Metadata } from 'next';
import './globals.css';
import { QueryClientWrapper } from '@/providers/queryClient.provider';
import { ThemeProvider } from '@/providers/theme.provider';
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
    <html lang="en" className="h-full antialiased font-sans" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('ors-theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && supportDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <NextTopLoader
          color="#4a7cf6"
          showSpinner={false}
          shadow="0 0 10px rgba(74,124,246,0.3)"
        />
        <QueryClientWrapper>
          <ThemeProvider>
            <AppProvider>
              {children}
              <ToastContainer />
            </AppProvider>
          </ThemeProvider>
        </QueryClientWrapper>
      </body>
    </html>
  );
}
