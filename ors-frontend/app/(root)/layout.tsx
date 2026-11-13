'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import { AuthModal } from '@/components/auth/auth-modal';
import { UserDetailModal } from '@/components/auth/user-detail-modal';
import { useApp } from '@/hooks/use-app-store';
import { ROUTES } from '@/config/routes';

export default function RootGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isHydrated } = useApp();
  const isAdminRoute = pathname?.startsWith('/admin');

  // Client-side auth guard: redirect to login if not authenticated after hydration
  useEffect(() => {
    if (isHydrated && !currentUser && !isAdminRoute) {
      router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, currentUser, isAdminRoute, pathname, router]);

  // Show nothing while hydrating or redirecting
  if (!isHydrated || (!currentUser && !isAdminRoute)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAdminRoute) {
    return (
      <div className="min-h-screen md:h-screen md:overflow-hidden w-full bg-white dark:bg-[#0f141c] font-sans">
        <main className="w-full h-full">
          {children}
        </main>
        <AuthModal />
        <UserDetailModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f141c]">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>
      <Footer />
      <MobileNav />
      <AuthModal />
      <UserDetailModal />
    </div>
  );
}
