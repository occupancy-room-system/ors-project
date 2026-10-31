'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config';
import { useApp } from '@/hooks/use-app-store';

export function LabBanner() {
  const router = useRouter();
  const { roomData, activeSession, userReservations, pendingReservationCount } = useApp();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Open for Students
            </span>
            <span className="text-xs text-slate-500 font-medium">SE Innovation Lab 101</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              <span className="text-emerald-600 font-mono">{roomData.availableSeats}</span>
              <span className="text-slate-400 font-normal mx-1.5">/</span>
              <span className="text-slate-700 font-mono">{roomData.totalSeats}</span>
              <span className="ml-2 text-base sm:text-lg font-bold text-slate-700">Desks Available</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap any green workstation on the floor plan to reserve, or scan a desk QR sticker to check in.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
        <button
          onClick={() => router.push(ROUTES.CHECKIN)}
          className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
        >
          <span>📷</span>
          <span>Scan Desk QR</span>
        </button>

        {activeSession && (
          <button
            onClick={() => router.push(ROUTES.SESSION)}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>⏱️</span>
            <span>My Desk ({activeSession.seatCode})</span>
          </button>
        )}

        {pendingReservationCount > 0 && !activeSession && (
          <button
            onClick={() => router.push(ROUTES.CHECKIN)}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🔖</span>
            <span>My Reservation ({userReservations[0]?.seatCode})</span>
          </button>
        )}
      </div>
    </div>
  );
}

