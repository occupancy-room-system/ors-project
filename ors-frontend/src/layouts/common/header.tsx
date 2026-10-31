'use client';

import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/config';
import { NavLinks } from './components/nav-links';
import { UserProfile } from './components/user-profile';
import { MobileNav } from './components/mobile-nav';

export default function Header() {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm shadow-xs">
              SE
            </div>
            <Link href={ROUTES.HOME} className="text-left group focus:outline-none">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                <span className="hidden xs:inline">SE </span>Lab Occupancy
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <NavLinks />

          {/* Profile & Auth */}
          <UserProfile />
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <MobileNav />
    </>
  );
}

