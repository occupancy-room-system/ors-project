'use client';

import React, { useState } from 'react';
import { useApp } from '@/hooks/use-app-store';
import { RefreshCw } from 'lucide-react';

export function LabStatsBanner() {
  const { roomData, loadData } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const seats = roomData.seats || [];
  const total = seats.length || 54;
  const available = seats.filter((s) => s.status === 'AVAILABLE').length;
  const inUse = seats.filter((s) => s.status === 'OCCUPIED' || s.status === 'EXPIRING_SOON').length;
  const endingSoon = seats.filter((s) => s.status === 'EXPIRING_SOON').length;
  const reserved = seats.filter((s) => s.status === 'RESERVED').length;
  const repair = seats.filter((s) => s.status === 'MAINTENANCE').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="bg-card rounded-xl border border-border/70 px-4 sm:px-6 py-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Numbers & Breakdown */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
        <div className="flex items-baseline gap-1.5 font-sans">
          <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{available}</span>
          <span className="text-muted-foreground font-medium">of {total} desks available</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
          {/* In Use */}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-slate-300" />
            <span className="text-foreground font-semibold">{inUse} in use</span>
            {endingSoon > 0 && <span className="text-amber-600 dark:text-amber-400">({endingSoon} ending soon)</span>}
          </div>

          {/* Reserved */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-indigo-600" />
            <span className="text-foreground font-semibold">{reserved} reserved</span>
          </div>

          {/* Under Repair */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-amber-500" />
            <span className="text-foreground font-semibold">{repair} under repair</span>
          </div>
        </div>
      </div>

      {/* Right: Live indicator + Last update + Refresh button */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground self-end md:self-auto shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Live</span>
        </div>
        <span className="text-muted-foreground/80">Updated just now</span>
        <button
          type="button"
          onClick={handleRefresh}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          title="Refresh real-time occupancy"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>
    </div>
  );
}
