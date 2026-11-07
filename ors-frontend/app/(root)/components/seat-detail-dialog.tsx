'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Seat, User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Monitor,
  Clock,
  Info,
  ChevronDown,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Check,
  QrCode,
  Wrench,
} from 'lucide-react';
import { getLabSessionEndTime, isLabOpenAt } from '@/utils/lab-hours';

interface SeatDetailDialogProps {
  seat: Seat | null;
  onClose: () => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onConfirmReservation: (params: { seatId: number; startTime: string; durationHours: number }) => Promise<void>;
  onToggleMaintenance?: (seat: Seat) => void;
  onNavigateToCheckIn?: () => void;
}

export function SeatDetailDialog({
  seat,
  onClose,
  currentUser,
  onOpenLogin,
  onConfirmReservation,
  onToggleMaintenance,
  onNavigateToCheckIn,
}: SeatDetailDialogProps) {
  const [durationHours, setDurationHours] = useState<number>(2);
  const [arrivalOffsetMinutes, setArrivalOffsetMinutes] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!seat) return null;

  // Clean seat display name (e.g. SEAT-A1 -> A1, SEAT-GT1-1 -> G1-D1)
  const formatSeatCode = (rawCode: string) => {
    let code = rawCode.replace('SEAT-', '');
    if (code.startsWith('GT')) {
      const parts = code.replace('GT', '').split('-');
      if (parts.length === 2) {
        return `G${parts[0]}-D${parts[1]}`;
      }
    }
    return code;
  };

  const displayCode = formatSeatCode(seat.seatCode);
  const isAvailable = seat.status === 'AVAILABLE';
  const isReservedByCurrentUser =
    currentUser && seat.currentReservation && seat.currentReservation.userId === currentUser.id;

  // Arrival offset options up to 1 hour ahead
  const arrivalOptions = [
    { label: 'Now', offset: 0 },
    { label: 'In 15 minutes', offset: 15 },
    { label: 'In 30 minutes', offset: 30 },
    { label: 'In 45 minutes', offset: 45 },
    { label: 'In 1 hour', offset: 60 },
  ];

  // Dynamic time calculations
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const arrivalTime = useMemo(() => {
    return new Date(currentTime.getTime() + arrivalOffsetMinutes * 60000);
  }, [currentTime, arrivalOffsetMinutes]);

  const endTime = useMemo(() => {
    return getLabSessionEndTime(arrivalTime, durationHours);
  }, [arrivalTime, durationHours]);

  const formatClock = (d: Date) =>
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Bangkok' });

  const arrivalOption = arrivalOptions.find((o) => o.offset === arrivalOffsetMinutes) || arrivalOptions[0];
  const labIsOpen = isLabOpenAt(currentTime);

  const handleReservationSubmit = async () => {
    setErrorMsg(null);
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    setSubmitting(true);
    try {
      // Always evaluate fresh arrival time at the exact moment of reservation
      const now = new Date();
      if (!isLabOpenAt(now)) {
        throw new Error('SE Lab reservations are available from 9:00 AM to 5:00 PM.');
      }
      const freshArrivalTime = new Date(now.getTime() + arrivalOffsetMinutes * 60000);
      if (!isLabOpenAt(freshArrivalTime)) {
        throw new Error('Reservation arrival must be before the 5:00 PM closing time.');
      }
      await onConfirmReservation({
        seatId: seat.id,
        startTime: freshArrivalTime.toISOString(),
        durationHours,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Reservation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!seat} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[460px] p-6 bg-white dark:bg-card border-border rounded-2xl shadow-xl gap-0 overflow-hidden"
      >
        {/* 1. Dialog Header: Title & Close Button */}
        <div className="flex items-center justify-between pb-4">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Reserve a desk
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Desk Info Card */}
        <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Monitor className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base text-foreground">
                Seat {displayCode} · {seat.podLabel}
              </div>
              <div className="text-xs text-muted-foreground">
                {seat.tableType === 'GROUP' ? 'Group desk' : 'Individual desk'}
              </div>
            </div>
          </div>

          <div>
            {isAvailable ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-3xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Available
              </span>
            ) : seat.status === 'OCCUPIED' ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Occupied
              </span>
            ) : seat.status === 'RESERVED' ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Reserved
              </span>
            ) : seat.status === 'EXPIRING_SOON' ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Ending soon
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Repair
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="my-2 p-3 text-xs rounded-xl border border-destructive/20 bg-destructive/10 text-destructive font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Occupied State notice */}
        {seat.status === 'OCCUPIED' && (
          <div className="my-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 space-y-1 text-xs">
            <div className="font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              Workstation is currently occupied
            </div>
            <p className="text-[11px] text-muted-foreground">
              This desk is currently in session. Please choose an available desk or check back soon.
            </p>
          </div>
        )}

        {/* Active Reservation notice for current user */}
        {isReservedByCurrentUser && (
          <div className="my-3 p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 space-y-2 text-xs">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              You hold an active reservation for Seat {displayCode}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Please proceed to Turing Hall 101 to scan the desk QR sticker and start your session.
            </p>
            {onNavigateToCheckIn && (
              <button
                type="button"
                onClick={onNavigateToCheckIn}
                className="w-full h-8 text-xs font-bold bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                Go to QR Check-In
              </button>
            )}
          </div>
        )}

        {/* Available: Booking Configuration Form */}
        {isAvailable && (
          <div className="space-y-4 pt-2">
            {/* 3. Arrival Section with Shadcn Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-foreground">Arrival</label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card flex items-center justify-between text-xs sm:text-sm font-semibold hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-3xs cursor-pointer outline-none">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-foreground">{arrivalOption.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <span>{formatClock(arrivalTime)}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-[390px] sm:w-[412px] p-1.5 z-50">
                  {arrivalOptions.map((opt) => {
                    const optTime = new Date(currentTime.getTime() + opt.offset * 60000);
                    const isOutsideHours = !isLabOpenAt(optTime);
                    const isSelected = arrivalOffsetMinutes === opt.offset;
                    return (
                      <DropdownMenuItem
                        key={opt.offset}
                        onClick={() => setArrivalOffsetMinutes(opt.offset)}
                        disabled={!labIsOpen || isOutsideHours}
                        className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs sm:text-sm cursor-pointer ${
                          isSelected ? 'bg-primary/10 text-primary font-bold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{opt.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{formatClock(optTime)}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary stroke-[3]" />}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 4. Duration Section */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-foreground">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((hours) => {
                  const isSelected = durationHours === hours;
                  return (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurationHours(hours)}
                      className={`h-11 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center shadow-3xs ${
                        isSelected
                          ? 'border-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 font-bold'
                          : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-card text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {hours} {hours === 1 ? 'hour' : 'hours'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. "Your reservation" Summary Box */}
            <div className="rounded-xl bg-slate-50/90 dark:bg-slate-900/40 p-3.5 border border-slate-100 dark:border-slate-800 space-y-0.5">
              <div className="text-xs text-muted-foreground font-medium">Your reservation</div>
              <div className="text-sm font-bold text-foreground">
                Today · {formatClock(arrivalTime)}–{formatClock(endTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                Seat {displayCode} · {seat.tableType === 'GROUP' ? 'Group desk' : 'Individual desk'}
              </div>
            </div>

            {/* 6. Information Notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                You can reserve up to 1 hour before arrival. SE Lab hours are 9:00 AM–5:00 PM;
                sessions end at closing time even if the selected duration is longer.
              </span>
            </div>
            {!labIsOpen && (
              <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Reservations are unavailable while the lab is closed.
              </div>
            )}
          </div>
        )}

        {/* 7. Modal Footer / Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
          {currentUser?.role === 'ADMINISTRATOR' && onToggleMaintenance && (
            <button
              type="button"
              onClick={() => {
                onToggleMaintenance(seat);
                onClose();
              }}
              className="mr-auto px-3 py-2 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              {seat.status === 'MAINTENANCE' ? 'Set Available' : 'Set Repair'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-3xs"
          >
            Cancel
          </button>

          {isAvailable && (
            <button
              type="button"
              disabled={submitting || !labIsOpen}
              onClick={handleReservationSubmit}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {currentUser ? `Reserve seat ${displayCode}` : 'Sign in to Reserve'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
