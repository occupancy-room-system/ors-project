'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OccupancySession } from '@/types';
import { ROUTES } from '@/config/routes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Clock,
  AlertTriangle,
  Monitor,
  LogOut,
  MapPin,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
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

  if (!session) {
    return (
      <Card className="border-border max-w-xl mx-auto shadow-xs">
        <CardContent className="pt-10 pb-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Monitor className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Active Workstation Session</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              You do not currently occupy a workstation. Reserve a desk on the 2D floor plan or scan a desk QR code at Turing Hall 101.
            </p>
          </div>
          <div className="flex justify-center gap-2.5 pt-2">
            <Button
              onClick={() => router.push(ROUTES.HOME)}
              variant="outline"
              size="sm"
              className="text-xs font-semibold"
            >
              2D Floor Plan
            </Button>
            <Button
              onClick={() => router.push(ROUTES.CHECKIN)}
              size="sm"
              className="text-xs font-bold gap-1.5"
            >
              Scan Desk QR
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const isExpiringSoon = secondsLeft <= 10 * 60; // 10 minutes warning

  const totalSeconds = session.durationMinutes ? session.durationMinutes * 60 : 7200;
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const percentElapsed = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* 10-Minute Warning Alert */}
      {isExpiringSoon && secondsLeft > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 flex items-start gap-3 shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs">Workstation Session Expiring Soon</h4>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              Your session concludes in under 10 minutes. Please save and push your work, tidy your desk, and check out to release the workstation.
            </p>
          </div>
        </div>
      )}

      {/* Main Active Card */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                {session.podLabel}
              </Badge>
              <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">
                Workstation {session.seatCode}
              </CardTitle>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {session.roomName}
              </div>
            </div>

            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1.5 font-bold text-xs py-1 px-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Session
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Live Countdown Display */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-2">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Time Remaining
            </div>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-foreground">
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="pt-2">
              <Progress value={percentElapsed} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium pt-1.5">
                <span>Checked In: {new Date(session.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>Expires: {new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="destructive"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isLoading}
              className="flex-1 h-10 text-xs font-bold gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              End Session & Check Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Check out of Workstation {session.seatCode}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Checking out will conclude your session and make this workstation immediately available for other students.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setIsConfirmOpen(false);
                onCheckOut(session.id);
              }}
              className="text-xs font-bold"
            >
              Yes, Check Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

