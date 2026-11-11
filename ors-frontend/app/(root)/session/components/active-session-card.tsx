'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OccupancySession } from '@/types';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Monitor,
  LogOut,
  Info,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface ActiveSessionCardProps {
  session: OccupancySession | null;
  onCheckOut: (sessionId: number) => void;
  isLoading?: boolean;
}

export function ActiveSessionCard({
  session,
  onCheckOut,
  isLoading = false,
}: ActiveSessionCardProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  // Clean seat code for display (e.g. SEAT-A1 -> A1)
  const formatSeatCode = (rawCode?: string) => {
    if (!rawCode) return 'A1';
    let code = rawCode.replace(/^SEAT-/, '');
    if (code.startsWith('GT')) {
      const parts = code.replace('GT', '').split('-');
      if (parts.length === 2) return `G${parts[0]}-D${parts[1]}`;
    }
    return code;
  };

  const displaySeatCode = formatSeatCode(session?.seatCode || 'A1');
  const podLabel = session?.podLabel || 'Station A';
  const totalDurationMinutes = session?.durationMinutes || 120;
  const totalSeconds = totalDurationMinutes * 60;

  useEffect(() => {
    if (!session) return;

    const calculateRemaining = () => {
      const expiry = new Date(session.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);

  const secondsElapsed = Math.max(0, totalSeconds - secondsLeft);
  const minutesElapsed = Math.min(totalDurationMinutes, Math.floor(secondsElapsed / 60));
  const percentElapsed = Math.min(100, Math.max(0, (secondsElapsed / totalSeconds) * 100));

  const totalAllocatedText = useMemo(() => {
    const hrs = Math.floor(totalDurationMinutes / 60);
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
  }, [totalDurationMinutes]);

  const checkInFormatted = useMemo(() => {
    if (!session?.checkedInAt) {
      return { time: '10:30 PM', date: 'Today · Nov 2, 2026' };
    }
    const d = new Date(session.checkedInAt);
    return {
      time: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      date: `Today · ${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
  }, [session?.checkedInAt]);

  const expiresFormatted = useMemo(() => {
    if (!session?.expiresAt) {
      return { time: '12:30 AM', date: 'Tomorrow · Nov 3, 2026' };
    }
    const d = new Date(session.expiresAt);
    const isTomorrow = d.getDate() !== new Date().getDate();
    return {
      time: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      date: `${isTomorrow ? 'Tomorrow' : 'Today'} · ${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
  }, [session?.expiresAt]);

  if (!session) {
    return (
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card shadow-2xs p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <Monitor className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">No Active Workstation Session</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You do not currently occupy a workstation. Reserve a desk on the floor plan or check in if you already have a reservation.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
          <Button
            onClick={() => router.push(ROUTES.HOME)}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs font-semibold"
          >
            2D Floor Plan
          </Button>
          <Button
            onClick={() => router.push(ROUTES.CHECKIN)}
            size="sm"
            className="w-full sm:w-auto text-xs font-bold"
          >
            My Reservations &amp; QR
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card shadow-2xs overflow-hidden">
        {/* Card Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Seat {displaySeatCode} · Session active
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            className="w-full sm:w-auto gap-1.5 text-xs font-semibold rounded-xl hover:text-destructive hover:border-destructive/40 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End session</span>
          </Button>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Left Column: Countdown & Progress */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground">
              Time remaining
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-baseline gap-1.5">
              <span>{hours}</span>
              <span className="text-base font-semibold text-muted-foreground">hr</span>
              <span className="ml-1.5">{minutes}</span>
              <span className="text-base font-semibold text-muted-foreground">min</span>
            </div>

            {/* Progress bar matching mockup */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${percentElapsed}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{minutesElapsed} min elapsed</span>
                <span>{totalAllocatedText} allocated</span>
              </div>
            </div>
          </div>

          {/* Right Column: Location & Times */}
          <div className="space-y-5 md:border-l md:border-slate-100 dark:md:border-slate-800 md:pl-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Monitor className="w-4 h-4 text-primary shrink-0" />
              <span>{podLabel} · SE Lab</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground font-medium">Checked in</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{checkInFormatted.time}</div>
                <div className="text-[11px] text-muted-foreground">{checkInFormatted.date}</div>
              </div>
              <div>
                <div className="text-muted-foreground font-medium">Session expires</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{expiresFormatted.time}</div>
                <div className="text-[11px] text-muted-foreground">{expiresFormatted.date}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Note */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>Finished early? End your session to make the desk available for someone else.</span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              End Workstation Session?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Are you sure you want to end your session at Seat {displaySeatCode}? Your workstation will be immediately released and marked available on the floor plan for other students.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isLoading}
              onClick={() => {
                setIsConfirmOpen(false);
                if (session) {
                  onCheckOut(session.id);
                }
              }}
              className="text-xs font-semibold gap-1.5"
            >
              {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>End session</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
