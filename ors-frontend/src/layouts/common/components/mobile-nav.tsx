'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config';
import { useApp } from '@/hooks/use-app-store';

export function MobileNav() {
  const pathname = usePathname();
  const { currentUser, activeSession, pendingReservationCount } = useApp();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const mobileCls = (href: string) =>
    `flex-1 py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer select-none ${
      isActive(href) ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
    }`;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1 shadow-lg flex items-center justify-around"
    >
      <Link href={ROUTES.HOME} className={mobileCls(ROUTES.HOME)}>
        <span className="text-lg">🗺️</span>
        <span className="mt-0.5">Floor Plan</span>
        {isActive(ROUTES.HOME) && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />}
      </Link>

      <Link href={ROUTES.CHECKIN} className={mobileCls(ROUTES.CHECKIN)}>
        <div className="relative">
          <span className="text-lg">📱</span>
          {pendingReservationCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 text-[9px] font-extrabold bg-indigo-600 text-white rounded-full min-w-4 text-center">
              {pendingReservationCount}
            </span>
          )}
        </div>
        <span className="mt-0.5">QR Check-In</span>
        {isActive(ROUTES.CHECKIN) && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />}
      </Link>

      <Link href={ROUTES.SESSION} className={mobileCls(ROUTES.SESSION)}>
        <div className="relative">
          <span className="text-lg">⏱️</span>
          {activeSession && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-white" />
          )}
        </div>
        <span className="mt-0.5">My Session</span>
        {isActive(ROUTES.SESSION) && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />}
      </Link>

      {currentUser?.role === 'ADMINISTRATOR' && (
        <Link href={ROUTES.ADMIN} className={mobileCls(ROUTES.ADMIN)}>
          <span className="text-lg">⚙️</span>
          <span className="mt-0.5">Admin</span>
          {isActive(ROUTES.ADMIN) && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />}
        </Link>
      )}
    </nav>
  );
}

