'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config';
import { useApp } from '@/hooks/use-app-store';

export function NavLinks() {
  const pathname = usePathname();
  const { currentUser, activeSession, pendingReservationCount } = useApp();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const linkCls = (href: string) =>
    `whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
      isActive(href)
        ? 'text-blue-600 font-bold border-b-2 border-blue-600'
        : 'hover:text-slate-900'
    }`;

  return (
    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
      <Link href={ROUTES.HOME} className={linkCls(ROUTES.HOME)}>
        2D Floor Plan
      </Link>

      <Link href={ROUTES.CHECKIN} className={`${linkCls(ROUTES.CHECKIN)} flex items-center gap-1.5`}>
        <span>QR Check-In</span>
        {pendingReservationCount > 0 && (
          <span className="px-1.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded">
            {pendingReservationCount} Reserved
          </span>
        )}
      </Link>

      <Link href={ROUTES.SESSION} className={`${linkCls(ROUTES.SESSION)} flex items-center gap-1.5`}>
        <span>My Session</span>
        {activeSession && (
          <span className="px-1.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
            Active
          </span>
        )}
      </Link>

      {currentUser?.role === 'ADMINISTRATOR' && (
        <Link href={ROUTES.ADMIN} className={`${linkCls(ROUTES.ADMIN)} flex items-center gap-1.5`}>
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Admin Console</span>
        </Link>
      )}
    </nav>
  );
}

