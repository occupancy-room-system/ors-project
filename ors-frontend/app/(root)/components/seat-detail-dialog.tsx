'use client';

import React, { useState } from 'react';
import { Seat, User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Monitor,
  Clock,
  Calendar,
  AlertCircle,
  Wrench,
  QrCode,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

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

  const maxAdvanceMinutes = 60; // Policy: strictly maximum 1 hour ahead
  const isAvailable = seat.status === 'AVAILABLE';
  const isReservedByCurrentUser =
    currentUser && seat.currentReservation && seat.currentReservation.userId === currentUser.id;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleReservationSubmit = async () => {
    setErrorMsg(null);
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    const calculatedTime = new Date(Date.now() + arrivalOffsetMinutes * 60000);
    const diff = Math.round((calculatedTime.getTime() - Date.now()) / 60000);

    if (diff > maxAdvanceMinutes) {
      setErrorMsg(
        `Policy Restriction: Reservations can only be made for arrival within 1 hour.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmReservation({
        seatId: seat.id,
        startTime: calculatedTime.toISOString(),
        durationHours,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Reservation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!seat} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 bg-card border-border">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold tracking-tight">
                  Workstation {seat.seatCode}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {seat.podLabel} · {seat.tableType === 'GROUP' ? 'Collaborative Pod' : 'Individual Desk'}
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-xs font-bold ${
                seat.status === 'AVAILABLE'
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : seat.status === 'OCCUPIED'
                  ? 'border-rose-300 text-rose-700 bg-rose-50'
                  : seat.status === 'RESERVED'
                  ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                  : 'text-muted-foreground'
              }`}
            >
              {seat.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Status Info */}
          {seat.status === 'OCCUPIED' && seat.currentSession && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                Workstation is Currently Occupied
              </div>
              <p className="text-[11px] text-muted-foreground">
                In use since {new Date(seat.currentSession.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                Expected checkout: {new Date(seat.currentSession.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
              </p>
            </div>
          )}

          {isReservedByCurrentUser && (
            <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                You hold an active reservation for this workstation!
              </div>
              <p className="text-[11px] text-muted-foreground">
                Proceed to Turing Hall 101 and scan the desk QR sticker or use the QR Check-in page to activate.
              </p>
              {onNavigateToCheckIn && (
                <Button size="sm" onClick={onNavigateToCheckIn} className="w-full text-xs font-bold gap-1.5 h-8">
                  <QrCode className="w-3.5 h-3.5" />
                  Go to QR Check-In
                </Button>
              )}
            </div>
          )}

          {/* Reservation Booking Form (Only if Available) */}
          {isAvailable && (
            <div className="space-y-4 pt-1">
              {/* Duration selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Reservation Duration
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((hours) => (
                    <Button
                      key={hours}
                      type="button"
                      variant={durationHours === hours ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDurationHours(hours)}
                      className="h-8 text-xs font-bold"
                    >
                      {hours} hr{hours > 1 ? 's' : ''}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Arrival time offset */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Planned Arrival Time
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Now', offset: 0 },
                    { label: '+15 mins', offset: 15 },
                    { label: '+30 mins', offset: 30 },
                    { label: '+45 mins', offset: 45 },
                    { label: '+60 mins', offset: 60 },
                  ].map((item) => (
                    <Button
                      key={item.offset}
                      type="button"
                      variant={arrivalOffsetMinutes === item.offset ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setArrivalOffsetMinutes(item.offset)}
                      className="h-8 text-xs font-medium"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Arrival:{' '}
                  <strong className="text-foreground">
                    {arrivalOffsetMinutes === 0 ? 'Immediately upon arrival' : `+${arrivalOffsetMinutes} minutes from now`}
                  </strong>{' '}
                  (maximum 1 hour in advance policy).
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border/60">
          {currentUser?.role === 'ADMINISTRATOR' && onToggleMaintenance && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onToggleMaintenance(seat);
                onClose();
              }}
              className="text-xs font-semibold gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
            >
              <Wrench className="w-3.5 h-3.5" />
              {seat.status === 'MAINTENANCE' ? 'Set Available' : 'Set Maintenance'}
            </Button>
          )}

          {isAvailable && (
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={handleReservationSubmit}
              className="w-full sm:w-auto text-xs font-bold gap-1.5"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {currentUser ? 'Confirm Workstation Reservation' : 'Sign in to Reserve'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
