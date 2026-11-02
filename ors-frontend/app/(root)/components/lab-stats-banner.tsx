'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { useApp } from '@/hooks/use-app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QrCode, Clock, Bookmark, Sparkles, Monitor } from 'lucide-react';

export function LabStatsBanner() {
  const router = useRouter();
  const { roomData, activeSession, userReservations, pendingReservationCount } = useApp();

  const occupiedCount = roomData.totalSeats - roomData.availableSeats;
  const occupancyRate = roomData.totalSeats > 0 ? Math.round((occupiedCount / roomData.totalSeats) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Occupancy Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge
              variant="outline"
              className="gap-1.5 px-2.5 py-1 text-xs font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Laboratory Occupancy
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              Software Engineering Innovation Lab 101
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
              {roomData.availableSeats}
            </span>
            <span className="text-xl sm:text-2xl font-light text-muted-foreground">/ {roomData.totalSeats}</span>
            <span className="text-sm sm:text-base font-bold text-muted-foreground ml-1">Desks Available</span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 max-w-md">
            <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
              <span>{occupancyRate}% Currently Occupied</span>
              <span>{roomData.availableSeats} free workstations</span>
            </div>
            <Progress value={occupancyRate} className="h-2" />
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            onClick={() => router.push(ROUTES.CHECKIN)}
            className="gap-2 h-10 px-4 text-xs font-bold shadow-xs"
          >
            <QrCode className="w-4 h-4" />
            Scan Desk QR
          </Button>

          {activeSession && (
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.SESSION)}
              className="gap-2 h-10 px-4 text-xs font-semibold border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              Active Desk ({activeSession.seatCode})
            </Button>
          )}

          {pendingReservationCount > 0 && !activeSession && (
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.CHECKIN)}
              className="gap-2 h-10 px-4 text-xs font-semibold border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100"
            >
              <Bookmark className="w-4 h-4 text-indigo-600" />
              Reserved ({userReservations[0]?.seatCode})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

