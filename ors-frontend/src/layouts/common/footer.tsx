'use client';

import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/config';
import { useApp } from '@/hooks/use-app-store';

export default function Footer() {
  const { currentUser, openAuthModal } = useApp();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6 mb-16 md:mb-0 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-700">Occupancy Room System</span> · University Software Engineering Project
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px] flex-wrap justify-center">
          {currentUser?.role === 'ADMINISTRATOR' ? (
            <Link
              href={ROUTES.ADMIN}
              className="text-slate-500 hover:text-slate-800 hover:underline transition-colors"
            >
              Admin Portal
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal('admin')}
              className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer transition-colors"
            >
              Staff & Admin Portal
            </button>
          )}
          <span aria-hidden="true">·</span>
          <span>MySQL 8.x (Port 3307)</span>
          <span aria-hidden="true">·</span>
          <span>Spring Boot 3.4</span>
          <span aria-hidden="true">·</span>
          <span>Next.js 16</span>
        </div>
      </div>
    </footer>
  );
}

