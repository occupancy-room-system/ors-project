'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { useApp } from '@/hooks/use-app-store';
import { MapPin, QrCode, Clock, ShieldAlert } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { currentUser, activeSession, pendingReservationCount } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border px-2 py-1 shadow-lg flex items-center justify-around"
    >
      <Link
        href={ROUTES.HOME}
        className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-semibold transition-colors ${
          isActive(ROUTES.HOME) ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <MapPin className="w-5 h-5 mb-0.5" />
        <span>Floor Plan</span>
      </Link>

      <Link
        href={ROUTES.CHECKIN}
        className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-semibold transition-colors relative ${
          isActive(ROUTES.CHECKIN) ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <div className="relative">
          <QrCode className="w-5 h-5 mb-0.5" />
          {mounted && pendingReservationCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 text-[9px] font-extrabold bg-indigo-600 text-white rounded-full min-w-4 text-center">
              {pendingReservationCount}
            </span>
          )}
        </div>
        <span>Check-In</span>
      </Link>

      <Link
        href={ROUTES.SESSION}
        className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-semibold transition-colors relative ${
          isActive(ROUTES.SESSION) ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <div className="relative">
          <Clock className="w-5 h-5 mb-0.5" />
          {mounted && activeSession && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-background" />
          )}
        </div>
        <span>My Session</span>
      </Link>

      {mounted && currentUser?.role === 'ADMINISTRATOR' && (
        <Link
          href={ROUTES.ADMIN}
          className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-semibold transition-colors ${
            isActive(ROUTES.ADMIN) ? 'text-amber-600 font-bold' : 'text-muted-foreground hover:text-amber-600'
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-0.5 text-amber-500" />
          <span>Admin</span>
        </Link>
      )}
    </nav>
  );
}

